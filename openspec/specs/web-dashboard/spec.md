# web-dashboard Specification

## Purpose
前端 Web SPA（React/Vite）的所有 UI 元件（Shadcn Sidebar 側邊欄、展開/收合樹狀資料表格、SSE 即時 Console、麵包屑動態導航、路由載入資料共享）、前端功能模組架構（Feature-Owned Modules）、Lucide 圖示代理以及時間軸元件。

## Requirements

### Requirement: Project and Group Tree View Sidebar
系統 MUST 使用 Shadcn Sidebar 導航元件，在側邊欄提供首頁、專案列表、執行紀錄（History）三個主要入口導航。專案詳細頁面中 MUST 提供群組與測試案例樹狀結構表格（Tree Table）導航，以列與欄的形式展示資訊。系統 MUST 支援多層級群組（嵌套子群組）的完整渲染與深度尋找，在載入與更新時不得丟失任何嵌套子群組。點選特定群組時，系統 SHALL 僅展開或收合該節點。專案詳細頁面 MUST 以單欄滿版表格（Tree Table）的形式填滿主要工作區。專案詳細頁面中 SHALL 移除原本位於底部的歷史批次執行表格，將執行紀錄的功能統一收歸於全域執行紀錄頁面中。

系統的右側主要工作區頂端（由全域 `RootLayout` Header 提供）MUST 提供統一的動態麵包屑（Breadcrumb）導航，其高度與左側系統 LOGO Header 固定且水平切齊。麵包屑依據當前的路由層級與參數，動態拼接並展示「專案列表 / 專案名稱 / 測試案例名稱 / 執行紀錄」之導航層級，並支援點擊返回。專案詳細頁、測試案例詳情頁與即時 Console 本身作為獨立頁面填滿下方主工作區，不再重複渲染各自的麵包屑，以避免路由跳轉時 Header 版面抖動。系統 MUST 整合 Shadcn 的 `SidebarTrigger` 元件於主工作區頂端 Header 的左側，以提供無遮擋的側邊欄收合控制，且點擊時主工作區與側邊欄 SHALL 伴隨平滑的過渡動畫自動伸縮且不重疊。

#### Scenario: Render group tree for selected project
- **WHEN** 使用者切換至特定專案，前端轉導或渲染 `/project/:projectId` 並於主畫面載入滿版群組與測試案例樹狀表格，且在展開特定群組時動態向 API 發送 `/api/groups/:groupId/testcases` 加載測試案例
- **THEN** 前端將測試案例動態渲染於表格行中，各屬性橫向完美對齊，且頂端全域麵包屑路徑能即時動態更新且無閃爍，右上方之操作按鈕皆能正常運作彈出對應的 Dialog 表單

#### Scenario: Render sidebar navigation with global history entry
- **WHEN** 載入應用程式時
- **THEN** 側邊欄 MUST 以 Shadcn Sidebar 元件正確渲染首頁、專案列表及執行紀錄入口，且點擊執行紀錄入口時能正確 navigate 導航至 `/tasks`

#### Scenario: Sidebar collapse with trigger animation
- **WHEN** 使用者點擊主工作區頂端 Header 的 `SidebarTrigger` 時
- **THEN** 側邊欄將流暢地收合或展開，主要工作區（`<main>`）會同步自動寬度自適應伸縮，且兩者絕不重疊

#### Scenario: Real-time rendering of newly created subgroup
- **WHEN** 使用者在專案詳細頁中建立新的根群組或子群組，建立成功並自動關閉對話框
- **THEN** 畫面 SHALL 即時更新並展示新群組，若新建立的是子群組，系統 MUST 自動將其父群組設為展開狀態，使新群組立即可見

### Requirement: Testcase Run Details and Real-time SSE Log Stream
系統 MUST 在觸發測試執行後，以實時日誌流（Log Stream）與步驟截圖展示執行過程。前端 MUST 將畫面轉導至 `/project/:projectId/tasks/:taskId` 路由（TaskDetailView），由 TaskDetailView 中的 Run 項目點擊後進入 `/project/:projectId/run/:runId`（SSEConsoleView）。在日誌渲染與歷史紀錄呈現中，系統 MUST 依據後端所傳輸之結構化步驟執行實體（TestRunStep）來渲染步驟 Section/Accordion。該步驟卡片中 MUST 包含該步驟所關聯的詳細工具操作軌跡與時間，且步驟實體所關聯的網頁截圖 MUST 作為該步驟的最終狀態顯示於該 Section 下方。系統 MUST 在每個執行步驟中紀錄並即時顯示該步驟累計消耗的 LLM Token 數量，並在 Accordion Header 上渲染對應的 Token 消耗 Badge 與步驟成敗狀態（包括 pending、running、passed、failed 等）。任務結束後，系統 MUST 渲染最終視覺斷言 PASS/FAIL 的判定報告，且該判定報告中 MUST 一並展示視覺斷言判定所花費的 Token 以及整次 Run 消耗的總 Token 數。系統頂部全域麵包屑中的測試案例名稱連結 MUST 支援點擊並正確導回所屬測試案例詳情頁 `/project/:projectId/testCase/:testCaseId`。所有通知與錯誤回遈 MUST 採用 Sonner (Toaster) 進行 Toast 訊息提示。TaskDetailView 中的批次任務狀態與 TestRun 狀態 MUST 採用統一的狀態組件（StatusBadge）進行一致化視覺渲染（包括 pending、running、passed、failed、error）。

#### Scenario: Navigate to TaskDetailView after triggering any execution
- **WHEN** 使用者點擊「執行測試」（無論是單一案例、群組批次或專案批次），API 回傳 taskId
- **THEN** 前端 MUST navigate 至 `/project/:projectId/tasks/:taskId`，顯示 TaskDetailView 批次監控面板，並以統一狀態徽章（StatusBadge）顯示批次任務的目前狀態

#### Scenario: Stream live steps log with token usage metrics
- **WHEN** 使用者在 TaskDetailView 中點擊特定 Run 進入 `/project/:projectId/run/:runId` 並建立 SSE 連線訂閱時
- **THEN** 前端即時接收後端以巢狀結構傳送之步驟及其關聯的日誌更新事件，直接渲染步驟列表及其 Token 消耗，且不需在前端執行日誌的分群計算

#### Scenario: Display final assert report with total run token usage
- **WHEN** 測試案例執行完畢，視覺斷言（Asserter）返回判定結果與理由時
- **THEN** 前端在上方即時渲染視覺斷言報告，除了展示結果與原因外，也必須展示視覺斷言花費的 Token 與整次測試執行所花費的總 Token 數量

#### Scenario: Save and display logs for failed steps
- **WHEN** 測試案例執行在特定步驟因錯誤中斷或重試超限而失敗時
- **THEN** 後端系統 MUST 將該步驟之狀態設為 failed，並將該步驟未完成的暫存日誌與失敗截圖存入資料庫並透過 SSE 發送，且前端時間軸中 MUST 能依據該步驟 status 屬性直接呈現並展開該失敗步驟的 Accordion 卡片以呈現具體錯誤軌跡與失敗畫面

### Requirement: DataTable Generic Component
系統 SHALL 提供 `components/custom/DataTable.tsx` 泛型組件，接受 `columns: ColumnDef<TData>[]`、`data: TData[]`、可選的 `onRowClick` 回調、可選的 `globalFilter` 字串與 `onGlobalFilterChange` 回調。DataTable 組件 SHALL 使用 `components/ui/table.tsx` 的 `Table`、`TableHeader`、`TableBody`、`TableRow`、`TableHead`、`TableCell` 組件渲染，不覆蓋 any shadcn 預設 class，且其背景、邊框、文字顏色皆使用 shadcn 的 CSS variable。排序功能 MUST 由 TanStack Table 的 `getSortedRowModel()` 提供，搜尋過濾功能 MUST 由 TanStack Table 的 `getFilteredRowModel()` 配合 globalFilter 提供。

#### Scenario: Row click 導航
- **WHEN** 使用者點擊 DataTable 中的任一資料列
- **THEN** 系統呼叫 `onRowClick(row.original)` 並由父層 View 執行 navigate 動作

#### Scenario: 欄位排序與全域過濾
- **WHEN** 使用者點擊啟用排序的欄位 header，或傳入非空的 `globalFilter` 關鍵字時
- **THEN** Table 依所選欄位排序，或僅展示包含關鍵字的大小寫不敏感資料列，無資料時顯示「找不到符合條件的紀錄。」提示

### Requirement: Tree Table Hierarchical Rendering
通用 `DataTable` SHALL 支援選配的樹狀階層分層（Tree Grid）運算與展開/收合狀態管理能力。此機制 SHALL 與現有一維平鋪表格完全向下相容，且在 View 端能無障礙讀取 `depth` 與展開 API。

#### Scenario: Recursive subrows resolution
- **WHEN** 通用 `DataTable` 接收到包含 `children` 或 `subRows` 的樹狀資料，並傳入對應之 `getSubRows` 解析器時
- **THEN** 元件內部的 TanStack Table SHALL 正確建立階層鏈，且將 Row 的 `depth`（深度，0-indexed）與 `getCanExpand()`（是否有子列）屬性暴露給 Column 的 `cell` 渲染器。

#### Scenario: Smooth expand and collapse
- **WHEN** 使用者點擊 View 端 Column 中綁定 `row.toggleExpanded()` 的展開/摺疊按鈕時
- **THEN** Table 內部狀態 `expanded` SHALL 即時更新，且元件自動展開或收合對應子行。

#### Scenario: Filter retains parent hierarchy
- **WHEN** 使用者在搜尋框輸入關鍵字，且某葉子節點（如測試案例）符合條件時
- **THEN** 過濾結果 SHALL 同時顯示該葉子節點及其所有父節點階層（`filterFromLeafRows: true`），以維持樹狀脈絡可讀性。

### Requirement: Route-declared breadcrumbs and loader data sharing
系統 SHALL 透過路由定義中的 `handle.crumb` 函數與 `useMatches()` 自動產生全局麵包屑。每個路由的 `handle` 物件 SHALL 使用 `satisfies RouteHandle` 確保靜態型別正確。系統在巢狀路由架構下，SHALL 支援子路由 View 直接讀取並共享父級路由 loader 的預取資料，以避免向後端重複 Fetch 相同的專案資訊。

#### Scenario: Dynamic segment nesting and rendering
- **WHEN** 用戶導航至 `/project/:projectId/testCase/:testCaseId` 且 loader 成功取得資料
- **THEN** Topbar SHALL 自動顯示由 `matches.flatMap` 拼接後的 `[專案管理] > [專案名稱] > [案例名稱]`，且點擊「專案名稱」能跳轉至對應專案主頁

#### Scenario: Breadcrumb with icon
- **WHEN** 路由 `handle.crumb` 回傳含有 `icon`（如 LucideIcon）屬性的 `Crumb` 物件
- **THEN** Topbar SHALL 在麵包屑 label 左側顯示對應圖示，無 icon 時僅顯示文字

### Requirement: Frontend Feature-Owned Modules
前端 SHALL 依據功能所屬領域，將專屬 UI 程式碼組織在 `frontend/src/features/<feature>` 下（如 `projects`、`tasks` 等）。重複使用的基礎 UI primitive（如按鈕、輸入框）應放在共享的 `shared` 或 `components/ui` 目錄下。每個功能模組僅能透過 `index.ts` 暴露必要的公共 API 與頁面。

#### Scenario: Project feature files are colocated
- **WHEN** 開發者維護專案相關的列表、建立、編輯或詳情頁面時
- **THEN** 相關檔案皆可於 `frontend/src/features/projects` 目錄下被找到，且對應路由僅引用此 entry point

### Requirement: Lucide-react Icon Animation Proxy
系統在編譯期與運行期，SHALL 藉由精確路徑重定向（Alias Proxy）代理所有指向 `"lucide-react"` 的靜態模組引用。當被引用的圖示在專案中存在對應的客製動畫版時，系統 SHALL 優先提供動畫版圖示；否則，系統 SHALL 自動且安全地降級提供原始標準版圖示。

#### Scenario: Redirection and fallback without code modification
- **WHEN** 頁面程式碼中包含 `import { Settings, Play } from "lucide-react"`
- **THEN** 在編譯輸出與運行渲染時，`Settings` SHALL 被自動替換為含有 `motion/react` 動效的客製化動畫元件，而 `Play` SHALL 自動降級為原始的 Lucide 靜態圖示，且型別系統能正確提供自動提示。

### Requirement: Frontend Timeline Component
前端時間軸（Timeline）元件 MUST 支援緊湊模式以防在窄版容器中破版，且 DOT 部分應支援傳入自訂的 React 節點，最底部的 Item 應支援移除連接線。

#### Scenario: Rendering compact timeline
- **WHEN** 設定 `compact` 屬性為 true 且 `TimelineItem` 的 `isLast` 屬性為 true 時
- **THEN** 元件隱藏左側日期欄位、並將縱線與 Dot 靠左對齊，且不渲染該 Dot 下方的 vertical 連接線。
