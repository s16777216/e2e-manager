## 1. 基礎與型別定義

- [x] 1.1 在 `backend/src/services/environmentService.ts` 定義並匯出 `RunContext` 介面：`{ snapshots: Map<string, string> }`
- [x] 1.2 在 `backend/src/services/environmentService.ts` 中導入 Node.js 的 `vm` 與 `crypto` 模組

## 2. JS 表達式沙箱與 Proxy 實作

- [x] 2.1 實作 `createSnapshotProxy(context?: RunContext): any` 函式：以 Proxy 對接 `context.snapshots` Map，支援 getter 讀取與 setter 寫入，以配合 `??=` 運算子
- [x] 2.2 實作 `evaluateExpression(expr: string, flatVariables: Record<string, string>, context?: RunContext): string` 函式
- [x] 2.3 在 `evaluateExpression` 中建立 sandbox 物件，包含白名單：`Math`, `Date`, `JSON`, `String`, `Number`, `Boolean`, `Array`, `Object`, `parseInt`, `parseFloat`, `isNaN`, `crypto`, 所有 `flatVariables` 常數，以及 `$vars` (Snapshot Proxy)
- [x] 2.4 呼叫 `vm.createContext(sandbox)` 並調用 `vm.runInContext(expr, context, { timeout: 100 })` 執行求值，將結果轉為字串回傳
- [x] 2.5 在 `evaluateExpression` 中加入 Try-Catch，若拋出錯誤，則直接向上 Throw

## 3. 插值引擎修改與分流

- [x] 3.1 更新 `interpolateString(template, variables, context?, onUndefined?)` 的函式簽名，加入 `context?: RunContext`
- [x] 3.2 修改 `interpolateString` 的正則替換，將匹配到的內容丟給 `evaluateExpression` 求值
- [x] 3.3 若 `evaluateExpression` 拋出錯誤，`interpolateString` 應直接向上拋出（不吃掉 Exception，以便中斷步驟）
- [x] 3.4 更新 `interpolateObject(obj, variables, context?, onUndefined?)` 傳遞 `context` 參數，以便遞迴呼叫 `interpolateString`

## 4. 執行佇列整合與 Exception 捕獲

- [x] 4.1 在 `backend/src/queue.ts` 的 `executeJob` 函式開頭建立 `RunContext`：`const runContext: RunContext = { snapshots: new Map() }`
- [x] 4.2 更新 `queue.ts` 中所有 `interpolateObject` 與 `interpolateString` 呼叫，將 `runContext` 傳入
- [x] 4.3 在 `queue.ts` 執行 Testcase Steps 插值的區塊，將插值呼叫以 Try-Catch 包裹。若捕獲錯誤（例如 JS 語法錯誤或超時），將 TestRun 標記為 `failed`，記錄錯誤日誌並中斷執行 (退出 `executeJob`)

## 5. 前端說明提示更新 (可選)

- [x] 5.1 在 `frontend/src/components/custom/VariablesEditor.tsx` 的 Dialog 說明文字中，新增「支援 JS 表達式，如 `{{crypto.randomUUID()}}`，及快照 `{{$vars.myId ??= crypto.randomUUID()}}`」的提示

## 6. 驗證

- [x] 6.1 手動測試：在 Testcase step 中輸入 `{{1 + 1}}` 並執行，確認輸出結果為 `2`
- [x] 6.2 手動測試：在 Testcase step 中輸入 `{{Date.now()}}` 並執行，確認輸出為毫秒時間戳
- [x] 6.3 手動測試：在 Testcase step 中使用 `{{$vars.tempId ??= crypto.randomUUID()}}` 並在下個 step 讀取 `{{$vars.tempId}}`，確認兩步驟取得相同 UUID
- [x] 6.4 手動測試：在步驟中輸入 `{{while(true){}}}`，確認步驟在 100ms 後逾時中斷，且 TestRun 狀態變為 `failed`
- [x] 6.5 手動測試：確認現有靜態變數 `{{username}}` 等在更新後仍正常運作（向下相容驗證）
