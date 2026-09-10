## 1. 資料庫實體與全域設定擴充 (Database Entities & Settings)

- [ ] 1.1 修改 `backend/src/entities/Testcase.ts`，新增 `@VersionColumn({ default: 1 }) version!: number`。
- [ ] 1.2 修改 `backend/src/entities/TestRun.ts`，新增 `@Column("integer", { default: 1 }) testcaseVersion!: number`。
- [ ] 1.3 修改 `backend/src/entities/SystemSetting.ts`，新增 `@Column("boolean", { default: true }) enableReplay!: boolean`。
- [ ] 1.4 修改 `backend/src/routes/settings.ts` 與 `backend/src/services/settingsService.ts`，支援讀寫 `enableReplay` 設定。
- [ ] 1.5 修改 `frontend/src/views/SettingsView.tsx`，新增「啟用歷史軌跡重放 (Replay Mode)」Switch 開關並與 API 對接。

## 2. 歷史軌跡查詢與字串解析輔助工具 (Trajectory Query & Parser)

- [ ] 2.1 於 `backend/src/queue.ts` 或 `routes/run.ts` 建立 `TestRun` 時，綁定當前 `testcase.version` 至 `run.testcaseVersion`。
- [ ] 2.2 在 `backend/src/graph.ts` 中，實作查詢輔助函式：根據 `testcaseId` + 當前 `testcaseVersion` + `stepIdx` 查詢最新一筆 `passed` 執行的歷史工具日誌（`TestLog`）。
- [ ] 2.3 實作強健的工具日誌解析函式 `parseToolAction(action: string)`，能解析 `${toolName}(${JSON.stringify(args)})` 格式為工具名稱與參數物件，若遇到非工具調用或解析異常則回傳 `null`。

## 3. 核心重放引擎與 DOM ID 自動維護 (Replay Engine & DOM ID Maintenance)

- [ ] 3.1 修改 `backend/src/graph.ts` 中的 `executorNode`：在啟動 LLM 呼叫前檢查 `enableReplay` 與版本命中，若命中且存在有效歷史軌跡則進入重放模式。
- [ ] 3.2 在重放模式下依序執行解析出的工具：
  - 若執行的工具需要 `id` 參數，或剛執行完 `navigate_to` / 導航等待，自動確保調用 `await this.browserManager.observeWebPage()` 刷新頁面之 DOM ID 標籤。
  - 將重放執行期間的元素等待超時動態縮短至 2000ms，以加速失敗判定。
  - 執行 `selected_tool.invoke(args)`。
- [ ] 3.3 實作重放失敗判定邏輯：若工具回傳字串包含「`失敗`」或開頭為「`錯誤`」，或拋出例外，立即中斷重放並標記失敗。

## 4. 自我修復交棒與日誌管理 (Self-healing Handover)

- [ ] 4.1 在重放拋錯或判定失敗時實作交棒處理：
  - 清除當前步驟在重放期間寫入的臨時暫存日誌。
  - 保留瀏覽器當前操作現場。
  - 重設 `state.step_retry_count = 0`，給予 LLM 完整的重試容錯空間。
  - 重新呼叫 `observeWebPage()` 擷取最新畫面與元素清單，無縫交棒至一般的 LLM Executor 推導。
- [ ] 4.2 若重放順利執行完包含 `done_acting` 的所有工具，生成 0 Token 消耗日誌，推進至 `stepTrackerNode`。

## 5. 驗證與整合測試 (Verification & Testing)

- [ ] 5.1 執行全專案打包編譯，確保 TypeScript 與前後端 build 無任何型別錯誤。
- [ ] 5.2 建立測試案例並首度執行成功，確認資料庫中 `TestRun.testcaseVersion` 與 `Testcase.version` 一致且步驟為 `passed`。
- [ ] 5.3 再次執行同一個測試案例，確認觸發重放模式：後端無 LLM API 呼叫與 Token 消耗，且執行時間縮短為數秒級完成。
- [ ] 5.4 編輯該測試案例步驟（觸發 `version` 自增），確認再次執行時自動略過舊重放，回歸 LLM 推理並產生新版本的 Passed 紀錄。
- [ ] 5.5 透過前端設定面板將「啟用歷史軌跡重放」關閉，確認測試強制全量使用 LLM 推理。
- [ ] 5.6 人為修改測試目標網頁結構（例如更改按鈕文字或移除輸入框），驗證重放於 2000ms 快速超時後，成功交棒給 LLM 自我修復完成測試。
