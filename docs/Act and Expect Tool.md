# Act And Expect Tool

要將 Playwright 處理快閃元件（Toast）的「異步預期（先設定監聽，再執行動作）」原則轉化為 LangGraph Agent 可以使用的 Tool，核心思維是：**對 LLM 隱藏非同步程式碼的複雜度，只暴露出「意圖（Intent）」的選項。**

也就是說，我們不讓 Agent 自己寫 `Promise.all` 或 `waitFor`，我們只讓 Agent 在呼叫工具時多傳一個參數：「我這次點擊預期會跳出什麼」。

以下為你展示如何在 LangGraph TS 中實作這個完美的 `act_and_expect` Tool：

### 1. 設計 Tool Schema (定義 Agent 的輸入參數)

我們需要擴充 Zod Schema，讓 Agent 在決定要「點擊」某個元素時，可以一併宣告它的「等待策略」。

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { page } from "./browser"; // 你的 Playwright page 實例

// 定義 Tool 的輸入 Schema
const ActionSchema = z.object({
  actionType: z.enum(["click", "fill", "hover"]).describe("要執行的動作類型"),
  targetElementId: z
    .string()
    .describe("目標元素的 ID (由 observe_web_page 取得)"),
  fillText: z.string().optional().describe("如果是 fill 動作，要輸入的文字"),

  // 核心擴充：等待策略
  waitStrategy: z
    .enum(["none", "waitForNavigation", "waitForToast"])
    .describe(
      "執行動作後的等待策略。如果預期有成功/失敗通知，請務必選擇 waitForToast",
    ),

  // 如果選擇 waitForToast，Agent 必須提供預期的關鍵字
  expectedToastText: z
    .string()
    .optional()
    .describe("預期在通知中出現的文字，例如 '更新成功'"),
});
```

### 2. 實作 Tool 內部邏輯 (封裝 Race Condition 防護)

在這裡，我們將 Playwright 的「黃金法則：先宣告 Promise，再執行動作」封裝進去。

```typescript
export const executeWebActionTool = tool(
  async (input) => {
    const {
      actionType,
      targetElementId,
      fillText,
      waitStrategy,
      expectedToastText,
    } = input;
    const locator = page.locator(`[data-agent-id="${targetElementId}"]`);

    try {
      // ==========================================
      // 步驟一：預先設定「異步監聽」(Setup Promises)
      // ==========================================
      let waitPromise: Promise<any> | null = null;

      if (waitStrategy === "waitForToast" && expectedToastText) {
        // 設定監聽，但此時絕不加上 await！
        // 尋找畫面上包含該文字的元素，並等待它變為可見 (visible)
        waitPromise = page
          .getByText(expectedToastText, { exact: false })
          .waitFor({ state: "visible", timeout: 5000 });
      }

      // ==========================================
      // 步驟二：執行真實動作 (Execute Action)
      // ==========================================
      if (actionType === "click") {
        await locator.click();
      } else if (actionType === "fill" && fillText) {
        await locator.fill(fillText);
      } else if (actionType === "hover") {
        await locator.hover();
      }

      // ==========================================
      // 步驟三：等待預期結果 (Await Outcomes)
      // ==========================================
      if (waitPromise) {
        // 等待步驟一設定的 Promise 實現
        await waitPromise;
        return `✅ 動作執行成功，並且成功捕捉到預期的通知：「${expectedToastText}」。可以進行下一步。`;
      }

      if (waitStrategy === "waitForNavigation") {
        // 如果是換頁，等待網路請求靜止
        await page.waitForLoadState("networkidle", { timeout: 10000 });
        return `✅ 動作執行成功，並已等待換頁完成。`;
      }

      return `✅ 動作執行成功 (無特殊等待策略)。`;
    } catch (error: any) {
      // ==========================================
      // 錯誤處理與恢復 (Error Recovery)
      // ==========================================
      if (error.name === "TimeoutError") {
        return `❌ 動作已執行，但在等待預期結果時發生超時。您預期的 "${expectedToastText}" 沒有出現。請考慮呼叫觀察工具確認當前畫面狀態。`;
      }
      return `❌ 執行失敗: ${error.message}`;
    }
  },
  {
    name: "execute_web_action",
    description:
      "在網頁上執行具體的點擊或輸入動作。對於表單送出或會觸發通知的按鈕，必須正確設定 waitStrategy 才能確保系統穩定。",
    schema: ActionSchema,
  },
);
```

### 3. 如何讓 Agent 知道要這麼用？(System Prompt)

就算 Tool 寫得再好，如果 Agent（LLM）不知道什麼時候該傳 `waitForToast`，一切也是枉然。你需要在 LangGraph 的 System Prompt 或是該節點的指令中，加上明確的「行為準則」。

**System Prompt 範例：**

> 「你是一個專業的網頁自動化操作員。當你決定呼叫 `execute_web_action` 點擊『送出』、『儲存』、『更新』或『登入』等按鈕時，你**必須**意識到這類操作通常會伴隨系統通知 (Toast)。
> 為了避免錯過這些短暫的通知，你**必須**將 `waitStrategy` 設為 `waitForToast`，並在 `expectedToastText` 填入你預期會看到的文字（例如『成功』、『錯誤』）。如果沒有這樣做，你的任務會因為網頁尚未反應而失敗。」

---

### 這個架構的終極優勢

1. **LLM 永遠不報錯：** Agent 只需要產出 JSON `{"actionType": "click", "targetElementId": "15", "waitStrategy": "waitForToast", "expectedToastText": "更新成功"}`。它不需要知道什麼是 `Promise` 或 `waitFor`。
2. **完美攔截快閃元件：** 因為底層的 TypeScript 是嚴格按照「先宣告監聽 -> 再點擊」執行的，時間差被壓縮到 0，Toast 絕對跑不掉。
3. **優雅的錯誤反饋迴圈 (Feedback Loop)：** 注意 `catch` 區塊的回傳值，如果是 Timeout，我們不直接拋出 Error 讓程式當掉，而是回傳一段字串給 Agent：_「動作已執行，但預期的通知沒出現，請觀察畫面」_。
   這時 LangGraph 的 Agent 就會發揮它的推理能力，它可能會心想：「啊，是不是我剛剛填的密碼格式不對？」然後它就會主動去呼叫你寫的 `observe_web_page` Tool，重新看一次畫面上是不是跳出了紅色的錯誤訊息。
