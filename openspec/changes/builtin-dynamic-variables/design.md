## Context

E2E Manager 的插值引擎（`environmentService.ts`）目前使用單一正則表達式 `/\{\{([^}]+)\}\}/g` 掃描模板字串，並以靜態 `variables` 表做鍵值查找。系統已在 Project / Group / Testcase 三層建立了繼承式變數合併機制，但所有變數值都是在資料庫儲存時確定的靜態常數。

測試步驟如 `"建立帳號 {{username}}"` 目前只能靠事先設定的固定值執行，無法在每次 run 時動態產生唯一值。

## Goals / Non-Goals

**Goals:**
- 在不破壞現有靜態變數行為的前提下，擴展插值引擎支援在 `{{}}` 內執行簡單的 JS 表達式
- 利用 Node.js 的 `vm` 模組，在受限的沙箱環境下安全執行表達式
- 提供內建的 `Math`, `Date`, `JSON`, `crypto`（包含 `crypto.randomUUID()`）等全域物件
- 支援命名快照（Named Snapshot），利用 `$vars.xxx ??= value` 語法，確保同一 TestRun 內同一快照鍵只計算一次
- 當 JS 執行出錯或逾時時，拋出 Exception 藉以終止目前的步驟執行

**Non-Goals:**
- 不支援非同步表達式（所有 JS 表達式必須是同步的，不支援 `await` / `Promise`）
- 不允許存取敏感的 Node.js 內建模組（如 `process`, `require`, `fs`, `Buffer` 等）
- 不修改前端 VariablesEditor 的核心互動邏輯

## Decisions

### 決策 1：JS 表達式沙箱技術選型 — Node.js `vm`

**選擇**：使用 Node.js 內建的 `vm.runInContext()`。
為了確保安全性，我們會限制全域變數白名單。

```typescript
const sandbox = {
  Math,
  Date,
  JSON,
  String,
  Number,
  Boolean,
  Array,
  Object,
  parseInt,
  parseFloat,
  isNaN,
  crypto: {
    randomUUID: () => crypto.randomUUID()
  },
  // 注入靜態變數
  ...flatVariables,
  // 注入快照 Proxy
  $vars: createSnapshotProxy(context)
};
```

**替代方案考慮**：
- *自訂 DSL*：原本考慮使用 `$random_uuid()` 等自訂函數。缺點是學習成本高、維護繁重。
- *isolated-vm*：極度安全的隔離方案。缺點是需要編譯原生模組，在 Windows 部署上容易產生相容性問題。
- *vm2*：目前已停止維護。

**選擇理由**：因為是內部工具，使用 `vm` 加強白名單限制已經足夠防範「意外寫出惡意程式碼」，且對系統資源的消耗可接受。

---

### 決策 2：命名快照的 JS 實作方案 — `$vars` Proxy

我們利用 JavaScript 原生的 Nullish coalescing assignment (`??=`) 實作命名快照。
在沙箱中，我們注入一個名為 `$vars` 的 Proxy 物件，它會對應到 `RunContext` 中的 `snapshots` Map。使用 `$` 前綴是為了明確區分「動態變數快照系統」與「靜態環境變數」。

```typescript
function createSnapshotProxy(context?: RunContext) {
  const map = context?.snapshots || new Map<string, string>();
  return new Proxy({}, {
    get(target, prop: string) {
      return map.get(prop);
    },
    set(target, prop: string, value: any) {
      map.set(prop, String(value));
      return true;
    }
  });
}
```
**使用範例**：
- 第一個步驟中打 `{{$vars.userId ??= crypto.randomUUID()}}`。
  - 此時 `$vars.userId` 為 `undefined`。
  - 觸發賦值運算，呼叫 `crypto.randomUUID()` 產生 `"uuid-1"`，並透過 Proxy.set 存入 Map。
  - 回傳結果為 `"uuid-1"`。
- 後續步驟再次調用 `{{$vars.userId ??= crypto.randomUUID()}}`（或直接使用 `{{$vars.userId}}`）。
  - 此時 `$vars.userId` 已有值 `"uuid-1"`。
  - 直接回傳，不執行右側的 `randomUUID`。

---

### 決策 3：錯誤處理與步驟終止

當執行 `vm.runInContext()` 發生 Exception 時（例如 `ReferenceError`, `SyntaxError`，或是在限制的 100ms 內超時），`interpolateString` 將不再維持原樣，而是直接將該 Error 拋出。

`queue.ts` 的 `executeJob` 將會捕獲此 Error，把 TestRun 標記為 `failed` 並中斷剩餘步驟的執行，提供清楚的錯誤日誌（例如：`插值錯誤：[Date.now()] 執行失敗`）。

## Risks / Trade-offs

| 風險 | 緩解策略 |
|------|----------|
| 沙箱逃脫（存取 Node.js 執行序） | 在 sandbox 中明確將 `process`、`require`、`global` 設為 `undefined`，且不引入外部 prototype 污染。 |
| 無限迴圈導致 Server 卡死（例如 `{{while(true){}}}`） | 調用 `vm.runInContext` 時設置 `{ timeout: 100 }` (毫秒)，逾時即強制中斷並拋出 Error。 |
| 使用者忘記寫 `$vars.` 直接寫 `userId ??= ...` 造成全域污染 | 沙箱在 context 中會拋出錯誤（因為對不存在的 identifier 賦值在 strict mode 下會報 ReferenceError）。我們會開啟 strict mode 或者確保 sandbox 不可動態擴展全域變數。 |

## Migration Plan

此功能為純加法，不涉及資料庫 schema 變更：
1. 更新 `environmentService.ts`（向下相容，當沒有傳入 `context` 時，`$vars` proxy 掛載空 Map）
2. 更新 `queue.ts` 以建立 `RunContext` 並捕獲 exception 處理
3. 前端提示更新

## Open Questions

- 是否需要支援額外的 JS 函式庫，例如更強大的日期處理 `dayjs`？
  - **暫定**：不另外打包，使用者可以使用原生的 `new Date()`、`Date.now()`、`new Date().toLocaleDateString()` 等滿足基本需求。如果確實有繁重日期計算，後續可以再注入第三方輔助函式至 sandbox。
