## 1. LangGraph & Routing Refactoring

- [ ] 1.1 Remove `asserterNode` from `backend/src/graph.ts`
- [ ] 1.2 Refactor `routeNextStep` in `backend/src/graph/router.ts` to return `"executor" | "reporter"`, and update conditional edge mappings in `backend/src/graph.ts`
- [ ] 1.3 Update `reporterNode` in `backend/src/graph.ts` to perform browser closing, TestRun success state updates, and SSE broadcasting for successfully completed runs

## 2. Backend Services & Entities Cleanup

- [ ] 2.1 Remove `asserterProvider`, `asserterModel`, and `openaiAsserterModel` properties from `AiConfig` interface and `DEFAULT_AI_CONFIG` in `backend/src/services/settingsService.ts`
- [ ] 2.2 Remove `asserterProvider`, `asserterModel`, and `openaiAsserterModel` from TypeORM entity JSONB type annotation in `backend/src/entities/SystemSetting.ts`
- [ ] 2.3 Remove `asserterPromptTokens`, `asserterCompletionTokens`, and `asserterTotalTokens` from `TestRun` entity in `backend/src/entities/TestRun.ts`
- [ ] 2.4 Clean up asserter token fields mapper in `backend/src/routes/run.ts`

## 3. Frontend UI & Type Definitions Cleanup

- [ ] 3.1 Remove asserter provider and model inputs, schema validation rules, and default state hooks in `frontend/src/views/SettingsView.tsx`
- [ ] 3.2 Remove displays of asserter token usage in `frontend/src/views/SSEConsoleView.tsx`
- [ ] 3.3 Remove `asserterPromptTokens`, `asserterCompletionTokens`, and `asserterTotalTokens` properties from `TestRun` interface in `frontend/src/types/api.ts`

## 4. Verification

- [ ] 4.1 Run tests (`npm test` in backend) to verify LangGraph execution is working correctly without `asserterNode`
- [ ] 4.2 Build and run the app to verify settings save and runs execute successfully
