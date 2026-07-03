## Context

目前的 E2E 測試引擎以固定模板的 System Prompt 指引 AI Agent。這使得 AI Agent 無法獲得當前測試網頁特有的結構資訊（例如所使用的 UI 套件結構、動態載入的 class 特徵）。我們需要引入一個多層級的「前置提示詞/UI指引」配置系統，使得使用者能為專案、群組、測試案例分別附加提示詞，並讓執行引擎在測試期動態合併與注入。

## Goals / Non-Goals

**Goals:**
- 在 `Project`、`TestGroup`、`Testcase` 資料實體中加入 `systemPrompt` 欄位
- 在後端 API 中支援 `systemPrompt` 讀取與寫入
- 實作前置提示詞繼承合併機制 (Project → Group Chain → Testcase)
- 支援對合併後的提示詞進行動態插值 (JS 沙箱與變數)
- 更新 AI Agent 的 System Prompt 組裝函式以置入此提示詞
- 在前端設定頁面中提供豐富的 Markdown / 文字編輯器

**Non-Goals:**
- 不變更現有資料表之間的關聯
- 不支援非文字格式的提示詞附件
- 不為其他動作節點 (如 Asserter) 強制置入此提示詞 (暫定僅作用於 Executor 節點)

## Decisions

### 決策 1：繼承合併策略與順序

我們採用「由上至下 (專案 -> 群組鏈 -> 測試案例) 疊加」的策略，並使用雙換行分隔符：

```typescript
const promptParts: string[] = [];
if (project.systemPrompt) promptParts.push(project.systemPrompt);
for (const group of groupsChain) {
  if (group.systemPrompt) promptParts.push(group.systemPrompt);
}
if (testcase.systemPrompt) promptParts.push(testcase.systemPrompt);

const mergedSystemPrompt = promptParts.join("\n\n");
```

**理由**：最符合直覺。專案級設定為大原則（UI 庫風格），群組設定為特定板塊規則，案例設定為當前步驟最微觀引導，由上至下能讓 LLM 建立正確的上下文順序。

---

### 決策 2：提示詞插值時機

前置提示詞在**合併後、注入 LLM 前**進行插值。其插值方法與步驟 (steps) 的插值相同，共用同一個 `RunContext`：

```typescript
const interpolatedPrompt = interpolateString(mergedSystemPrompt, flatVariables, runContext);
```

**理由**：讓使用者能在前置提示詞中使用變數，例如 `{{$vars.user_email}}`。

---

### 決策 3：LLM System Prompt 注入點

我們會在 `buildExecutorSystemPrompt` 中加入一個明確的 `# Page & UI Guide` 標題段落：

```typescript
`# Page & UI Guide\n` +
`${params.systemPrompt}\n\n`
```

放在 `# Context` 之後，`# Instructions` 之前。這能讓 LLM 優先理解網頁 UI 的結構限制，再執行後續指令。

---

### 決策 4：資料庫更新與 Migration

- 新增欄位型別：`@Column("text", { nullable: true })`
- 由於開發環境通常已配置為自動同步實體變更，我們只需要在專案、群組、測試案例實體中加上該屬性，API 即可自然處理更新。

## Risks / Trade-offs

| 風險 | 緩解策略 |
|------|----------|
| 提示詞過長導致 LLM Token 爆量或注意力分散 | 在前端欄位提供友善的字數說明，並設定後端合併後的字數警告（或截斷，例如最多 2000 字） |
| 繼承鏈過深導致重複提示詞 | 提示詞設計應由使用者自行控制，後端單純做順序疊加即可 |
| 插值出錯（如 JS 表達式語法錯誤）導致執行中斷 | 與 JS 運算式變數相同的 Try-Catch 防禦，拋出清楚錯誤告知是前置提示詞插值失敗 |
