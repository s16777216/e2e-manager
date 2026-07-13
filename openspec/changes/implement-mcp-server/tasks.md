## 1. Database & Entity Setup

- [ ] 1.1 Create ApiKey entity (backend/src/entities/ApiKey.ts)
- [ ] 1.2 Add ApiKey to TypeORM data source (backend/src/db.ts)
- [ ] 1.3 Generate and run migration for api_key table
- [ ] 1.4 Verify entity registration and migration success

## 2. Authentication Infrastructure

- [ ] 2.1 Create auth middleware (backend/src/middleware/auth.ts)
- [ ] 2.2 Implement checkPermission utility
- [ ] 2.3 Add API key CLI commands (generate-key, list-keys, revoke-key)
- [ ] 2.4 Write unit tests for auth middleware and permission checks

## 3. Browser Pool

- [ ] 3.1 Create BrowserPool class (backend/src/mcp/browserPool.ts)
- [ ] 3.2 Implement acquire/release/close session methods
- [ ] 3.3 Add idle timeout cleanup (5 min default, configurable)
- [ ] 3.4 Add max sessions limit (default 5, configurable via env)
- [ ] 3.5 Write unit tests for pool concurrency and cleanup

## 4. MCP Server Core

- [ ] 4.1 Create MCP server factory (backend/src/mcp/server.ts)
- [ ] 4.2 Register tools for project management (list, create, get, update, delete)
- [ ] 4.3 Register tools for group management (list, create, update, delete)
- [ ] 4.4 Register tools for test case management (list, create, update, delete)
- [ ] 4.5 Register tools for execution (run_test_case, run_group, get_run_status, get_run_result, cancel_run)
- [ ] 4.6 Register resources (e2e://projects, e2e://runs, e2e://browser/sessions)
- [ ] 4.7 Implement permission checks per tool category
- [ ] 4.8 Write integration tests for tool registration

## 5. Browser Interactive Tools

- [ ] 5.1 Implement browser_navigate tool
- [ ] 5.2 Implement browser_observe tool (element IDs + screenshot)
- [ ] 5.3 Implement browser_click tool (with wait strategies)
- [ ] 5.4 Implement browser_type tool
- [ ] 5.5 Implement browser_key tool
- [ ] 5.6 Implement browser_hover tool
- [ ] 5.7 Implement browser_wait tool
- [ ] 5.8 Implement browser_screenshot tool
- [ ] 5.9 Implement browser_get_dom tool
- [ ] 5.10 Implement browser_eval tool (with sandbox restrictions)
- [ ] 5.11 Implement browser_close tool
- [ ] 5.12 Wire BrowserPool into browser tools
- [ ] 5.13 Write integration tests for browser tool chain

## 6. HTTP Transport (SSE)

- [ ] 6.1 Create MCP Hono routes (backend/src/routes/mcp.ts)
- [ ] 6.2 Implement GET /mcp/sse with SSEServerTransport
- [ ] 6.3 Implement POST /mcp/messages endpoint
- [ ] 6.4 Add auth middleware to MCP routes
- [ ] 6.5 Implement heartbeat (15s interval)
- [ ] 6.6 Handle connection cleanup on abort

## 7. Stdio Transport (CLI)

- [ ] 7.1 Create stdio entry point (backend/src/mcp/stdio.ts)
- [ ] 7.2 Add npm script: "mcp:stdio": "tsx src/mcp/stdio.ts"
- [ ] 7.3 Test with Claude Desktop / Cursor MCP config

## 8. Main Server Integration

- [ ] 8.1 Mount MCP routes in backend/src/server.ts
- [ ] 8.2 Add @modelcontextprotocol/sdk and uuid to package.json
- [ ] 8.3 Add BrowserPool cleanup on server shutdown
- [ ] 8.4 Update backend Dockerfile if needed

## 9. Configuration & Environment

- [ ] 9.1 Add MCP_MAX_BROWSERS env var (default 5)
- [ ] 9.2 Add MCP_BROWSER_IDLE_TIMEOUT env var (default 300000)
- [ ] 9.3 Add MCP_SESSION_MAX_AGE env var (optional)
- [ ] 9.4 Document all MCP-related env vars in backend/.env.example

## 10. Testing & Validation

- [ ] 10.1 Create test API key with read,write,browser permissions
- [ ] 10.2 Test MCP initialize handshake
- [ ] 10.3 Test list_projects / create_project / get_project flow
- [ ] 10.4 Test group tree creation and listing
- [ ] 10.5 Test test case creation with natural language steps
- [ ] 10.6 Test run_test_case triggers queue and returns taskId
- [ ] 10.7 Test run_group with nested groups
- [ ] 10.8 Test get_run_status polling
- [ ] 10.9 Test get_run_result returns screenshots and logs
- [ ] 10.10 Test browser_navigate -> observe -> click -> type flow
- [ ] 10.11 Test concurrent browser sessions (5 max)
- [ ] 10.12 Test session reuse with sessionId
- [ ] 10.13 Test idle session cleanup
- [ ] 10.14 Test permission enforcement (read-only key cannot write)
- [ ] 10.15 Test stdio transport with local MCP client

## 11. Documentation

- [ ] 11.1 Add MCP setup guide to README.md
- [ ] 11.2 Document MCP tool reference (all tools with params)
- [ ] 11.3 Document resource URIs and usage
- [ ] 11.4 Provide example Claude Desktop config
- [ ] 11.5 Provide example Cursor MCP config
- [ ] 11.6 Document API key management CLI