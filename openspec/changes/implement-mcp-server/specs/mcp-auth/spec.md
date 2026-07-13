## ADDED Requirements

### Requirement: API Key entity stores hashed tokens with permissions
The system SHALL provide an `ApiKey` entity for MCP authentication separate from LLM API keys.

#### Scenario: API Key created with permissions
- **WHEN** admin generates API key via CLI
- **THEN** `ApiKey` entity saved with `keyHash` (SHA256), `name`, `permissions`, `isActive: true`

#### Scenario: API Key permissions default to read
- **WHEN** key created without explicit permissions
- **THEN** defaults to `["read"]`

#### Scenario: API Key can have multiple permissions
- **WHEN** key created with `--permissions read,write,browser`
- **THEN** permissions stored as `["read", "write", "browser"]`

#### Scenario: API Key expiration optional
- **WHEN** key created with `--expires-in 30d`
- **THEN** `expiresAt` set to 30 days from creation
- **WHEN** key created without expiry
- **THEN** `expiresAt` is null (never expires)

#### Scenario: API Key lastUsedAt updated on successful auth
- **WHEN** request authenticated with key
- **THEN** `lastUsedAt` set to current timestamp

### Requirement: CLI command generates API keys
The system SHALL provide `npm run mcp:generate-key` CLI for creating API keys.

#### Scenario: Generate key with all options
```bash
npm run mcp:generate-key -- --name "Claude Desktop" --permissions read,write,browser --expires-in 90d
```
- **THEN** outputs: `mcp_sk_abc123xyz...` (only shown once)
- **THEN** key saved to database with hash

#### Scenario: Generate key with defaults
```bash
npm run mcp:generate-key -- --name "Test Key"
```
- **THEN** creates key with `permissions: ["read"]`, no expiry

#### Scenario: List existing keys
```bash
npm run mcp:list-keys
```
- **THEN** outputs table with `name`, `permissions`, `createdAt`, `lastUsedAt`, `expiresAt`, `isActive`

#### Scenario: Revoke key
```bash
npm run mcp:revoke-key -- --name "Old Key"
```
- **THEN** sets `isActive: false` for matching key

### Requirement: API Key authentication middleware
The system SHALL provide Hono middleware that validates Bearer tokens against ApiKey entity.

#### Scenario: Valid key allows request
- **WHEN** request has `Authorization: Bearer mcp_sk_valid...`
- **THEN** middleware finds matching active key
- **THEN** `c.set("apiKey", apiKey)` with permissions
- **THEN** request proceeds to handler

#### Scenario: Invalid key returns 401
- **WHEN** request has invalid/expired/revoked key
- **THEN** returns 401 `{error: "Invalid or revoked API Key"}`

#### Scenario: Missing auth returns 401
- **WHEN** request lacks Authorization header
- **THEN** returns 401 `{error: "Missing Authorization Bearer Token"}`

### Requirement: Permission checking utility
The system SHALL provide `checkPermission(apiKey, requiredScope)` function for tools to validate access.

#### Scenario: checkPermission returns true for matching scope
- **WHEN** apiKey.permissions = ["read", "write"]
- **WHEN** checkPermission(apiKey, "write") called
- **THEN** returns true

#### Scenario: checkPermission returns false for missing scope
- **WHEN** apiKey.permissions = ["read"]
- **WHEN** checkPermission(apiKey, "browser") called
- **THEN** returns false

#### Scenario: admin scope bypasses all checks
- **WHEN** apiKey.permissions = ["admin"]
- **WHEN** checkPermission(apiKey, "any-scope") called
- **THEN** returns true