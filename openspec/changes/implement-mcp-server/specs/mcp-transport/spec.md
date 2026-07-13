## ADDED Requirements

### Requirement: MCP Server exposes HTTP+SSE transport endpoint
The system SHALL provide an MCP server accessible via HTTP with Server-Sent Events (SSE) transport at `/mcp/sse` for server-to-client streaming and `/mcp/messages` for client-to-server messages.

#### Scenario: Client connects to SSE endpoint
- **WHEN** MCP client sends GET request to `/mcp/sse` with valid Authorization header
- **THEN** server responds with SSE stream and keeps connection open
- **THEN** server sends initialization message with server capabilities

#### Scenario: Client sends message via POST endpoint
- **WHEN** MCP client sends POST request to `/mcp/messages` with JSON-RPC message
- **THEN** server processes message and responds via SSE stream

#### Scenario: Heartbeat keeps connection alive
- **WHEN** 15 seconds pass without messages
- **THEN** server sends SSE comment `: heartbeat` to prevent proxy timeout

### Requirement: MCP Server validates API Key authentication
The system SHALL require valid API Key for all MCP endpoints, validated via `Authorization: Bearer <key>` header.

#### Scenario: Valid API Key grants access
- **WHEN** request includes valid, active API Key
- **THEN** request proceeds to MCP handler
- **THEN** API Key's `lastUsedAt` is updated

#### Scenario: Invalid API Key returns 401
- **WHEN** request includes invalid, revoked, or expired API Key
- **THEN** server returns 401 with error "Invalid or revoked API Key"

#### Scenario: Missing Authorization returns 401
- **WHEN** request lacks Authorization header
- **THEN** server returns 401 with error "Missing Authorization Bearer Token"

### Requirement: MCP Server enforces permission scopes
The system SHALL check API Key permissions before executing tools. Permissions: `read`, `write`, `browser`, `admin`.

#### Scenario: Read-only key cannot call write tools
- **WHEN** API Key has only `read` permission
- **WHEN** client calls `create_project` or `run_test_case`
- **THEN** server returns error "Insufficient permissions: requires write scope"

#### Scenario: Browser scope required for interactive tools
- **WHEN** API Key lacks `browser` permission
- **WHEN** client calls `browser_navigate`, `browser_click`, `browser_type`
- **THEN** server returns error "Insufficient permissions: requires browser scope"

#### Scenario: Admin scope bypasses all checks
- **WHEN** API Key has `admin` permission
- **THEN** all tool calls are permitted regardless of other scopes

### Requirement: MCP Server registers standard capabilities
The system SHALL declare the following MCP capabilities during initialization: `tools`, `resources`, `prompts`.

#### Scenario: Initialize response includes capabilities
- **WHEN** client sends `initialize` request
- **THEN** response includes `capabilities: { tools: {}, resources: {}, prompts: {} }`

### Requirement: MCP Server supports stdio transport for local development
The system SHALL provide a CLI entry point (`npm run mcp:stdio`) that runs the MCP server over stdio for local AI clients (Claude Desktop, Cursor).

#### Scenario: Stdio server starts and handles messages
- **WHEN** running `npm run mcp:stdio`
- **THEN** process reads JSON-RPC from stdin, writes responses to stdout
- **THEN** no HTTP server is started