# MCP Server Implementation Proposal

## What Changes

Implement a Model Context Protocol (MCP) server embedded in the existing Hono backend, enabling AI assistants (Claude Desktop, Cursor, etc.) to control the E2E test management system via standardized tools and resources.

**Core additions:**
- New `/mcp` endpoint with HTTP+SSE transport
- API Key authentication entity and middleware (separate from LLM API keys)
- MCP Tools for: Project/Group/TestCase CRUD, Test execution control, Browser interactive operations
- MCP Resources for: Test runs, Screenshots, Logs, Network traces
- Browser pool for concurrent AI-driven browser sessions

## Capabilities

### New Capabilities

- `mcp-server`: MCP protocol server infrastructure (transport, authentication, tool/resource registration)
- `mcp-test-management`: Test management tools via MCP (create/list projects, groups, test cases, run tests, query results)
- `mcp-browser-control`: Interactive browser automation tools via MCP (navigate, click, type, observe, screenshot, eval)
- `api-key-auth`: Dedicated API Key entity for MCP/REST authentication with permissions and expiry

### Modified Capabilities

- `testcase-management`: Extended with MCP tool exposure for create/list/update/delete test cases and groups
- `task-queue`: Extended with MCP tool exposure for triggering runs and querying status
- `infrastructure`: Extended with BrowserPool for concurrent session management

## Impact

### New Files
- `backend/src/entities/ApiKey.ts` - API Key entity with hashed storage
- `backend/src/middleware/auth.ts` - MCP authentication middleware
- `backend/src/mcp/server.ts` - MCP server with tools/resources registration
- `backend/src/mcp/browserPool.ts` - Browser session pool for concurrent AI sessions
- `backend/src/routes/mcp.ts` - Hono route mounting MCP SSE endpoint

### Modified Files
- `backend/src/server.ts` - Mount `/mcp` routes
- `backend/src/db.ts` - Register ApiKey entity
- `backend/package.json` - Add @modelcontextprotocol/sdk, uuid dependencies

### Database
- New `api_key` table for MCP authentication

### API Changes
- New endpoint: `GET /mcp/sse` (SSE connection)
- New endpoint: `POST /mcp/messages` (Client-to-server messages)

### Security
- API Keys stored as SHA256 hashes
- Permission scopes: `read`, `write`, `browser`, `admin`
- Rate limiting via existing infrastructure