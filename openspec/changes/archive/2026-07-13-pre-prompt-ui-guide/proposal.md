## Why

目前系統的 AI Agent (Executor) 在操作網頁進行 E2E 測試時，由於缺乏網頁 UI 套件結構的說明（例如使用何種 UI 組件庫，如 Ant Design、shadcn 等），常因動態定位或彈出層 DOM 渲染位置特殊而定位失敗。引入「前置提示詞 (UI 導引)」可提供 AI Agent 對網頁結構的描述，以提升定位精確度與執行穩定性。

## What Changes

- 在專案 (Project)、群組 (TestGroup) 及測試案例 (Testcase) 層級，新增「前置提示詞 / UI 指引 (System Prompt / UI Guide)」的欄位支援
- 支援在群組與測試案例層級開關「停用全域繼承 (Disable Parent Prompt)」，靈活控制是否繼承上層提示詞
- E2E 執行引擎會在執行 TestRun 時，沿著 Project → Groups → Testcase 繼承鏈依條件合併提示詞，疊加為一個單一字串
- 支援對合併後的提示詞進行動態變數與 JS 沙箱插值（與變數插值管線整合）
- 將插值後的提示詞注入 `buildExecutorSystemPrompt`，向執行中的 AI Agent 提供專屬的網頁 UI 結構背景知識
- 提供前端對應的設定欄位 (Textarea與開關)，包含編輯器即時顯示與計算提示詞字元數
- 在 `TestCaseEditBlock` 中提供「查看最終組合提示詞 (View Combined Prompt)」 Preview 展開區塊，方便使用者預覽完整組合效果

## Capabilities

### New Capabilities

- `pre-prompt-ui-guide`: 執行引擎合併與插值多層級前置提示詞，支援繼承切換與即時組合預覽，並將之注入 LLM Agent 的系統提示詞中以指引 UI 定位

### Modified Capabilities

- `testcase-management`: 在專案、群組、測試案例的實體與 CRUD 流程中，新增 `systemPrompt` 與 `disableParentPrompt` 欄位的儲存與讀寫

## Impact

- **資料庫**：在 `project`、`test_group`、`testcase` 資料表中新增 `systemPrompt` 欄位 (text, nullable)，在 `test_group` 與 `testcase` 資料表中新增 `disableParentPrompt` 欄位 (boolean, default false)
- **後端 API**：更新 `projectRoutes`、`groupRoutes` 與 `testcaseRoutes` 的 DTO 以接受並更新 `systemPrompt` 與 `disableParentPrompt`
- **執行佇列**：`queue.ts` 在 `executeJob` 階段取得各階層的提示詞，依據 `disableParentPrompt` 評估是否向上繼承，將未被停用的層級以換行疊加，並套用 `interpolateString`
- **提示詞生成**：`graph/prompt.ts` 擴展 `buildExecutorSystemPrompt` 以納入 `systemPrompt`
- **前端 UI**：
  - 更新 `ProjectEditView`、`ProjectCreateView` 以新增專案層級前置提示詞輸入及字元數計算
  - 更新 `GroupEditSheet`、`NewGroupSheet` 以新增群組層級前置提示詞輸入、停用上層繼承開關與字元數計算
  - 更新 `TestCaseEditBlock`、`TestCaseCreateDialog` 以新增案例層級前置提示詞輸入、停用上層繼承開關、字元數計算，以及「查看最終組合提示詞 (View Combined Prompt)」Preview 展開區塊
