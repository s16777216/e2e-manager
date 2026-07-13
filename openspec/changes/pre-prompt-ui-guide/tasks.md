## 1. 資料庫實體與後端 API

- [ ] 1.1 更新 TypeORM 實體類：在 `backend/src/entities/Project.ts` 新增 `systemPrompt?: string`，在 `TestGroup.ts` 與 `Testcase.ts` 新增 `systemPrompt?: string` 及 `disableParentPrompt?: boolean`
- [ ] 1.2 更新專案路由 `backend/src/routes/project.ts`：在 POST 和 PATCH 路由中，將 `systemPrompt` 納入 JSON 解析與儲存
- [ ] 1.3 更新群組路由 `backend/src/routes/group.ts`：在 POST 和 PATCH 路由中，將 `systemPrompt` 與 `disableParentPrompt` 納入 JSON 解析與儲存
- [ ] 1.4 更新測試案例路由 `backend/src/routes/testcase.ts`：在 POST 和 PATCH 路由中，將 `systemPrompt` 與 `disableParentPrompt` 納入 JSON 解析與儲存

## 2. 執行引擎與提示詞注入

- [ ] 2.1 修改 `backend/src/queue.ts` 的 `executeJob`：遞迴載入 Group Chain 時，收集 Project, Group Chain, Testcase 的 `systemPrompt` 與 `disableParentPrompt` 狀態
- [ ] 2.2 在 `executeJob` 中實作截斷與疊加邏輯：遇 `disableParentPrompt: true` 則清空前面已收集的上層提示詞，最後用雙換行 `\n\n` 串接
- [ ] 2.3 在 `executeJob` 中，對合併後的提示詞呼叫 `interpolateString` 進行變數/JS沙箱插值
- [ ] 2.4 更新 `backend/src/graph.ts` 中調用 `buildExecutorSystemPrompt` 的參數傳遞，將插值後的提示詞傳入
- [ ] 2.5 更新 `backend/src/graph/prompt.ts` 的 `buildExecutorSystemPrompt` 函式簽名與實作，將傳入的 `systemPrompt` 置入生成的 AI 提示詞中的 `# Page & UI Guide` 區塊

## 3. 前端 UI 設定欄位與即時預覽

- [ ] 3.1 更新前端型別 `frontend/src/types/api.ts`：在 `Project` 新增 `systemPrompt`，在 `TestGroup` 與 `Testcase` 型別中新增 `systemPrompt` 及 `disableParentPrompt` 欄位
- [ ] 3.2 更新 API 請求與 Zod Schema：更新對應 schema 支援 `systemPrompt: z.string().optional()` 與 `disableParentPrompt: z.boolean().optional()`
- [ ] 3.3 更新 `ProjectFormGeneralBlock.tsx`：加入專案層級前置提示詞輸入 (Textarea)，並顯示字元計數器
- [ ] 3.4 更新 `GroupEditSheet.tsx` 與 `NewGroupSheet.tsx`：加入群組 `systemPrompt` 輸入欄位、`disableParentPrompt` 開關與字元計數器
- [ ] 3.5 更新 `TestCaseEditBlock.tsx` 與 `TestCaseCreateDialog.tsx`：加入案例 `systemPrompt` 輸入欄位、`disableParentPrompt` 開關、字元計數器，以及「查看最終組合提示詞 (View Combined Prompt)」可摺疊 Preview 區塊（實時計算組合文字與總字元數）

## 4. 功能驗證

- [ ] 4.1 手動測試：在專案設定的「前置提示詞」輸入 `"All buttons must be green"`，在 Testcase 中使用 `{{1+1}}` 等變數驗證插值，執行測試並從後端日誌確認 LLM Agent System Prompt 包含此引導
- [ ] 4.2 手動測試繼承開關：在案例中開啟 `disableParentPrompt: true`，執行測試，確認後端日誌中顯示僅含該案例 Prompt 而忽略上層 Project/Group Prompt
- [ ] 4.3 前端 Preview 測試：驗證在 `TestCaseEditBlock` 點擊「查看最終組合提示詞」可正確反應開啟/關閉 `disableParentPrompt` 時的繼承組合文字與總字數
- [ ] 4.4 向下相容測試：清空所有層級的提示詞，確認測試案例仍能順利執行且 AI 提示詞沒有空 segment

