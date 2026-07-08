# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-08

## OVERVIEW
E2E Manager TypeScript 專案，用於管理端對端測試腳本與執行環境。

## STRUCTURE
```
./
├── openspec/    # 專案規格與變更歸檔
└── src/         # 核心原始碼
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| 規格變更 | openspec/ | 查看歷史變更與規格歸檔 |
| 核心邏輯 | src/ | 應用程式主要實作 |

## CONVENTIONS
- 使用 TypeScript 編寫
- 測試變更記錄於 openspec/changes

## ANTI-PATTERNS
- 請勿手動修改 archive 目錄中的過往變更記錄

## COMMANDS
```bash
npm run dev
npm test
```
