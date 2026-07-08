import * as fs from "fs";
import * as path from "path";
import { LogEntry } from "./state.js";

export class TestReporter {
  /**
   * 根據測試狀態生成 Markdown 格式的測試報告並存檔，返回報告路徑。
   */
  public static generateReport(state: any): string {
    const reportsDir = state.reports_dir;
    const reportPath = path.join(reportsDir, "report.md");
    
    // 狀態圖標記
    let resultEmoji = "✅ PASS";
    if (state.final_result === "FAIL") {
      resultEmoji = "❌ FAIL";
    } else if (state.final_result === "ERROR") {
      resultEmoji = "⚠️ ERROR";
    }
    
    const now = new Date();
    // 格式化時間 YYYY-MM-DD HH:mm:ss
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    // 組合 Markdown 內容
    const md: string[] = [];
    md.push(`# AI E2E 驗收測試報告`);
    md.push(``);
    md.push(`## 一、 測試摘要`);
    md.push(``);
    md.push(`| 項目 | 說明 |`);
    md.push(`| --- | --- |`);
    md.push(`| **測試 ID** | \`${state.test_id}\` |`);
    md.push(`| **測試名稱** | ${state.test_name} |`);
    md.push(`| **測試時間** | ${timestamp} |`);
    md.push(`| **最終結果** | **${resultEmoji}** |`);
    md.push(``);
    md.push(`### 📢 判定理由`);
    md.push(`> ${state.final_reason}`);
    md.push(``);

    // 新增：AI 失敗總結
    if (["FAIL", "ERROR"].includes(state.final_result) && state.failureSummary) {
      md.push(`### 🤖 AI 失敗分析與建議`);
      md.push(``);
      md.push(`${state.failureSummary}`);
      md.push(``);
    }
    
    // 檢查是否有最終失敗畫面截圖
    const failScreenshotPath = path.join(reportsDir, "screenshot_fail.png");
    if (["FAIL", "ERROR"].includes(state.final_result) && fs.existsSync(failScreenshotPath)) {
      md.push(`### 🚨 最終失敗畫面截圖`);
      md.push(``);
      md.push(`![最終失敗畫面](screenshot_fail.png)`);
      md.push(``);
    }

    md.push(`---`);
    md.push(``);
    md.push(`## 二、 預期與步驟細節`);
    md.push(``);
    md.push(`- **預期結果：** ${state.expected}`);
    md.push(`- **測試步驟清單：**`);
    state.steps.forEach((step: string, i: number) => {
      md.push(`  ${i + 1}. ${step}`);
    });
    md.push(``);
    md.push(`---`);
    md.push(``);
    md.push(`## 三、 逐步執行歷程與截圖`);
    md.push(``);
    
    // 步驟歷程
    const stepsCount = state.steps.length;
    for (let idx = 0; idx < stepsCount; idx++) {
      const stepDesc = state.steps[idx];
      md.push(`### 📍 步驟 ${idx + 1}：${stepDesc}`);
      md.push(``);
      
      // 對應此步驟的 log
      const stepLogs = (state.logs || []).filter((log: LogEntry) => log.step_idx === idx);
      
      if (stepLogs.length > 0) {
        md.push(`#### ⚙️ AI 決策歷程：`);
        md.push(``);
        stepLogs.forEach((log: LogEntry) => {
          const action = log.action || "";
          const result = log.result || "";
          const aiResp = log.ai_response || "";
          
          if (action === "none") {
            md.push(`- **AI 推理與說明**：${aiResp}`);
          } else {
            md.push(`- 🔧 **呼叫工具**：\`${action}\``);
            md.push(`  - **執行結果**：${result}`);
          }
        });
        md.push(``);
      } else {
        md.push(`*此步驟未執行任何動作（可能在前一步驟即已完成或發生跳轉）*`);
        md.push(``);
      }
      
      // 截圖顯示
      if (idx < state.screenshots_paths.length) {
        const imgRelativePath = state.screenshots_paths[idx];
        md.push(`#### 📸 步驟完成畫面：`);
        md.push(``);
        md.push(`![步驟 ${idx + 1} 畫面](${imgRelativePath})`);
        md.push(``);
      } else {
        md.push(`*(此步驟無截圖紀錄)*`);
        md.push(``);
      }
      
      md.push(`---`);
      md.push(``);
    }
    
    // 確保輸出目錄存在
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(reportPath, md.join("\n"), { encoding: "utf-8" });
    
    return reportPath;
  }
}
