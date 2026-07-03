## 1. 資料庫實體與後端 API

- [ ] 1.1 更新 TypeORM 實體類：在 `backend/src/entities/Project.ts`、`backend/src/entities/TestGroup.ts`、`backend/src/entities/Testcase.ts` 新增 `systemPrompt?: string` 欄位，類型為 `@Column("text", { nullable: true })`
- [ ] 1.2 更新專案路由 `backend/src/routes/project.ts`：在 POST 和 PATCH 路由中，將 `systemPrompt` 納入 JSON 解析與儲存
- [ ] 1.3 更新群組路由 `backend/src/routes/group.ts`：在 POST 和 PATCH 路由中，將 `systemPrompt` 納入 JSON 解析與儲存
- [ ] 1.4 更新測試案例路由 `backend/src/routes/testcase.ts`：在 POST 和 PATCH 路由中，將 `systemPrompt` 納入 JSON 解析與儲存

## 2. 執行引擎與提示詞注入

- [ ] 2.1 修改 `backend/src/queue.ts` 的 `executeJob`：遞迴載入 Group Chain 時，收集 Project, Group Chain, Testcase 的 `systemPrompt`
- [ ] 2.2 在 `executeJob` 中，將收集到的多層級 `systemPrompt` 用雙換行 `\n\n` 串接
- [ ] 2.3 在 `executeJob` 中，對合併後的提示詞呼叫 `interpolateString` 進行變數/JS沙箱插值
- [ ] 2.4 更新 `backend/src/graph.ts` 中調用 `buildExecutorSystemPrompt` 的參數傳遞，將插值後的提示詞傳入
- [ ] 2.5 更新 `backend/src/graph/prompt.ts` 的 `buildExecutorSystemPrompt` 函式簽名與實作，將傳入的 `systemPrompt` 置入生成的 AI 提示詞中的 `# Page & UI Guide` 區塊

## 3. 前端 UI 設定欄位

- [ ] 3.1 更新前端型別 `frontend/src/types/api.ts`：在 `Project`、`TestGroup`、`Testcase` 型別中新增 `systemPrompt?: string | null` 欄位
- [ ] 3.2 更新 API 請求與 Zod Schema `frontend/src/features/projects/schema.ts`：更新 `schema` 支援 `systemPrompt: z.string().optional()`，並在 `generalFormSchema` 中加入此欄位
- [ ] 3.3 更新 `frontend/src/features/projects/components/ProjectFormGeneralBlock.tsx`：在「專案描述」下方加入「前置提示詞 / UI 指引」輸入欄位 (Textarea)
- [ ] 3.4 更新 `frontend/src/features/projects/components/GroupEditSheet.tsx` 與 `NewGroupSheet.tsx`：加入群組的 `systemPrompt` 輸入欄位與對應狀態儲存
- [ ] 3.5 更新 `frontend/src/features/projects/components/TestCaseEditBlock.tsx` 與 `TestCaseCreateDialog.tsx`：加入測試案例的 `systemPrompt` 輸入欄位與對應狀態儲存

## 4. 功能驗證

- [ ] 4.1 手動測試：在專案設定的「前置提示詞」輸入 `"All buttons must be green"`，在 Testcase 中使用 `{{1+1}}` 等變數驗證插值，執行測試並從後端日誌確認 LLM Agent System Prompt 包含此引導
- [ ] 4.2 手動測試：分別在專案、群組、測試案例中設定前置提示詞，執行測試，確認後端日誌中顯示合併且換行疊加後的提示詞
- [ ] 4.3 向下相容測試：清空所有層級的提示詞，確認測試案例仍能順利執行且 AI 提示詞沒有空 segment
