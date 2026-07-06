## ADDED Requirements

### Requirement: observe_web_page tool
系統 MUST 提供 `observe_web_page` 工具，用以擷取網頁中所有可見、可互動的元素（例如按鈕、連結、輸入框、下拉選單），將這些元素標記唯一數字 ID，並回傳格式化後的純文字清單。

#### Scenario: 成功提取可互動元素
- **WHEN** 呼叫 `observe_web_page` 工具
- **THEN** 系統 SHALL 過濾掉隱藏或 `disabled` 的元素，並在剩餘的互動元素上注入 `data-e2e-agent-id` 屬性，回傳包含 `[ID] <tagName> textContent` 格式的元素清單字串。

### Requirement: Visual ID Tag Overlay
系統在 `observe_web_page` 執行過程中，MUST 於網頁畫面上對應元素位置渲染黃底黑字的數字貼紙，以便多模態模型能夠在截圖上直觀看到標籤，並在截圖結束後自動清理該貼紙。

#### Scenario: 渲染與清除視覺貼紙
- **WHEN** 系統執行 observe 流程並擷取畫面
- **THEN** 網頁會短暫呈現 ID 浮動貼紙，完成截圖後，這些貼紙與相關 CSS SHALL 被完全移除，不留下 any 殘餘樣式影響原始網頁排版。

### Requirement: Click action tool
系統 MUST 提供基於 ID 的 `click` 工具，支援點擊指定 ID 的元素，並可選宣告非同步等待策略。當無提供 `waitStrategy` 時，點擊後直接回傳結果。

#### Scenario: 使用 ID 進行點擊並等待特定文字出現
- **WHEN** 呼叫 `click` 工具，傳入 `id: 15`，`waitStrategy: "waitForText"` 及 `expectedText: "儲存成功"`
- **THEN** 系統點擊該元素，並在 5 秒內等待網頁畫面上出現 `"儲存成功"` 文本，若超時則拋出對應錯誤提示。

#### Scenario: 使用 ID 進行點擊不附加等待
- **WHEN** 呼叫 `click` 工具，傳入 `id: 8` 且未提供 `waitStrategy`
- **THEN** 系統點擊該元素後立即回傳成功訊息。

### Requirement: Input action tool
系統 MUST 提供基於 ID 的 `input` 工具，支援在指定 ID 的輸入框元素中填入文字。

#### Scenario: 使用 ID 進行文字輸入
- **WHEN** 呼叫 `input` 工具，傳入 `id: 12` 與 `text: "test_username"`
- **THEN** 系統 SHALL 在 `[data-e2e-agent-id="12"]` 元素中填入該文字。

### Requirement: Key action tool
系統 MUST 提供基於 ID 或全域的 `key` 工具，支援模擬鍵盤按鍵事件，並可選附加非同步等待策略。

#### Scenario: 對特定元素按 Enter 鍵並等待換頁
- **WHEN** 呼叫 `key` 工具，傳入 `id: 12`，`key: "Enter"` 及 `waitStrategy: "waitForNavigation"`
- **THEN** 系統 focus 到 `[data-e2e-agent-id="12"]`，發送 `"Enter"` 按鍵，並等待網頁載入狀態進入 `networkidle`。

#### Scenario: 按下特定鍵並等待文字出現
- **WHEN** 呼叫 `key` 工具，傳入 `id: 5`，`key: "Enter"`，`waitStrategy: "waitForText"` 及 `expectedText: "查詢中..."`
- **THEN** 系統 focus 到 `[data-e2e-agent-id="5"]` 元素並發送 `"Enter"` 按鍵，並在 5 秒內等待網頁畫面上出現 `"查詢中..."` 文本。

#### Scenario: 按下鍵盤鍵不附加等待
- **WHEN** 呼叫 `key` 工具，傳入 `key: "Escape"` 且未提供 `waitStrategy`
- **THEN** 系統向目前頁面發送 `"Escape"` 按鍵並立即回傳成功。

### Requirement: Hover action tool
系統 MUST 提供基於 ID 的 `hover` 工具，支援將滑鼠懸停至指定 ID 的元素上。

#### Scenario: 使用 ID 進行懸停操作
- **WHEN** 呼叫 `hover` 工具，傳入 `id: 8`
- **THEN** 系統 SHALL 將滑鼠游標移動至 `[data-e2e-agent-id="8"]` 元素上方。
