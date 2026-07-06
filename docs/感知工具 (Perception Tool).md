1. 感知工具 (Perception Tool)：observe_web_page

這個工具負責將 HTML，轉化成乾淨文本。業界目前最標準的做法是提取 Accessibility Tree (無障礙樹) 或注入自訂的 ID。

實作概念：

1. 透過 Playwright 執行一段簡單的 JavaScript。

2. 找出畫面上所有可見、可互動的元素（a, button, input 等）。

3. 在畫面上的這些元素旁標上唯一的數字 ID（例如 [15]）。

4. 工具回傳一個乾淨的列表給 LangGraph。

```plaintext
[當前網址]: https://example.com/login

[畫面元素]:
[12] <input> 帳號輸入框
[13] <input> 密碼輸入框
[14] <button> 忘記密碼
[15] <button> 登入送出
[16] <div> 錯誤提示：密碼錯誤 (紅色字體)
```

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { page } from "./browser"; // 替換成你的 Playwright page 實例

export const observeWebPageTool = tool(
  async () => {
    // 透過 page.evaluate 在瀏覽器端執行 JavaScript
    const interactiveElements = await page.evaluate(() => {
      // 1. 定義哪些元素對 Agent 來說是「可互動的」
      const selectors = [
        "button",
        "a",
        "input",
        "select",
        "textarea",
        '[role="button"]',
        '[role="link"]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");

      const elements = document.querySelectorAll(selectors);
      const results = [];
      let currentId = 1;

      elements.forEach((el) => {
        // 2. 核心防呆：過濾掉隱藏或不可見的元素 (節省 Token 並防止幻覺)
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const style = window.getComputedStyle(el);
        if (
          style.visibility === "hidden" ||
          style.display === "none" ||
          (el as any).disabled
        )
          return;

        // 3. 注入我們自訂的標籤！
        el.setAttribute("data-agent-id", currentId.toString());

        // 4. 萃取元素的語意資訊，準備餵給 LLM
        const tagName = el.tagName.toLowerCase();
        // 嘗試抓取各種可能的文字來源 (按優先順序)
        let textContent =
          (el as HTMLElement).innerText ||
          (el as HTMLInputElement).value ||
          (el as HTMLInputElement).placeholder ||
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          "";

        // 清理文字，移除多餘換行與空白
        textContent = textContent.replace(/\s+/g, " ").trim().substring(0, 50);

        // 如果是 input，抓取它的 type (如 password, email) 幫助 LLM 判斷
        const inputType = el.getAttribute("type")
          ? ` type="${el.getAttribute("type")}"`
          : "";

        // 只有當元素有實際意義 (有文字或特定 type) 時才回傳
        if (textContent || inputType || tagName === "select") {
          results.push(
            `[${currentId}] <${tagName}${inputType}> ${textContent}`,
          );
          currentId++;
        }
      });

      return results;
    });

    // 5. 將結果組裝成清晰的字串格式回傳給 Agent
    const currentUrl = page.url();
    const pageTitle = await page.title();

    if (interactiveElements.length === 0) {
      return `當前網址: ${currentUrl}\n頁面標題: ${pageTitle}\n狀態: 畫面上沒有找到任何可互動的元素。`;
    }

    return [
      `當前網址: ${currentUrl}`,
      `頁面標題: ${pageTitle}`,
      `可互動元素清單:`,
      ...interactiveElements,
    ].join("\n");
  },
  {
    name: "observe_web_page",
    description:
      "當你需要知道當前網頁有哪些按鈕、輸入框可以操作時，呼叫此工具。它會回傳帶有 ID 的元素清單。",
    schema: z.object({}), // 這個工具不需要輸入參數，直接執行即可
  },
);
```
