# MCP Server Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Hono Server (Port 3001)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │ REST API     │    │ MCP SSE      │    │ WebSocket    │    │ Static   │  │
│  │ /api/*       │    │ /mcp/sse     │    │ /api/*/stream│    │ Files    │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────────┘  │
│         │                   │                   │                           │
│         └───────────────────┼───────────────────┘                           │
│                             ▼                                               │
│              ┌──────────────────────────────┐                              │
│              │      Shared Services         │                              │
│              │  • AppDataSource (TypeORM)   │                              │
│              │  • TaskQueue                 │                              │
│              │  • BrowserPool               │                              │
│              │  • SettingsService           │                              │
│              └──────────────────────────────┘                              │
│                             │                                               │
│         ┌───────────────────┼───────────────────┐                          │
│         ▼                   ▼                   ▼                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│  │ PostgreSQL  │    │   Queue     │    │ Playwright  │                    │
│  │ (Data)      │    │ (Tasks)     │    │ (Browsers)  │                    │
│  └─────────────┘    └─────────────┘    └─────────────┘                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. API Key Entity (`backend/src/entities/ApiKey.ts`)

```typescript
@Entity()
export class ApiKey {
  @PrimaryColumn("varchar", { length: 64 })
  keyHash: string;           // SHA256(token)

  @Column("varchar", { length: 100 })
  name: string;              // Human-readable name

  @Column("jsonb", { nullable: true })
  permissions: string[];     // ["read", "write", "browser", "admin"]

  @Column("boolean", { default: true })
  isActive: boolean;

  @Column("timestamptz", { nullable: true })
  lastUsedAt: Date;

  @Column("timestamptz", { nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
```

**Key Generation CLI** (to be added as npm script):
```bash
npm run mcp:generate-key -- --name "Claude Desktop" --permissions read,write,browser
# Output: mcp_sk_abc123... (only shown once)
```

### 2. Authentication Middleware (`backend/src/middleware/auth.ts`)

```typescript
export async function mcpAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing Bearer token" }, 401);
  }

  const token = authHeader.slice(7);
  const keyHash = createHash("sha256").update(token).digest("hex");

  const apiKey = await AppDataSource.getRepository(ApiKey).findOne({
    where: { keyHash, isActive: true },
  });

  if (!apiKey) return c.json({ error: "Invalid API key" }, 401);
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return c.json({ error: "API key expired" }, 401);
  }

  // Update last used
  apiKey.lastUsedAt = new Date();
  await AppDataSource.getRepository(ApiKey).save(apiKey);

  c.set("apiKey", apiKey);  // permissions available in handlers
  await next();
}
```

### 3. Browser Pool (`backend/src/mcp/browserPool.ts`)

```typescript
interface BrowserSession {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
  apiKeyId: string;  // Track ownership
}

export class BrowserPool {
  private sessions: Map<string, BrowserSession> = new Map();
  private readonly maxSessions = 5;
  private readonly idleTimeout = 5 * 60 * 1000; // 5 min

  async acquire(apiKeyId: string, sessionId?: string): Promise<BrowserSession> {
    // 1. Reuse requested session if owned by same apiKey
    if (sessionId) {
      const existing = this.sessions.get(sessionId);
      if (existing && existing.apiKeyId === apiKeyId && !existing.inUse) {
        existing.inUse = true;
        existing.lastUsedAt = Date.now();
        return existing;
      }
    }

    // 2. Find available session for this apiKey
    for (const [id, session] of this.sessions) {
      if (session.apiKeyId === apiKeyId && !session.inUse) {
        session.inUse = true;
        session.lastUsedAt = Date.now();
        return session;
      }
    }

    // 3. Create new if under limit
    if (this.sessions.size >= this.maxSessions) {
      this.cleanupIdle();
      if (this.sessions.size >= this.maxSessions) {
        throw new Error("Browser pool exhausted");
      }
    }

    const browser = await chromium.launch({ headless: true, channel: "chrome" });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const newSession: BrowserSession = {
      id: crypto.randomUUID(),
      browser, context, page,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      inUse: true,
      apiKeyId,
    };

    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  release(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.inUse = false;
      session.lastUsedAt = Date.now();
    }
  }

  async close(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.page.close().catch(() => {});
      await session.context.close().catch(() => {});
      await session.browser.close().catch(() => {});
      this.sessions.delete(sessionId);
    }
  }

  private cleanupIdle() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (!session.inUse && now - session.lastUsedAt > this.idleTimeout) {
        this.close(id);
      }
    }
  }
}
```

### 4. MCP Server (`backend/src/mcp/server.ts`)

**Tool Categories:**

| Category | Tools | Description |
|----------|-------|-------------|
| **Projects** | `list_projects`, `create_project`, `get_project`, `update_project`, `delete_project` | Project CRUD |
| **Groups** | `list_groups`, `create_group`, `update_group`, `delete_group` | Group tree management |
| **Test Cases** | `list_test_cases`, `create_test_case`, `update_test_case`, `delete_test_case` | Test case CRUD with natural language steps |
| **Execution** | `run_test_case`, `run_group`, `get_run_status`, `get_run_result`, `cancel_run` | Trigger & monitor runs |
| **Browser** | `browser_navigate`, `browser_click`, `browser_type`, `browser_hover`, `browser_key`, `browser_wait`, `browser_observe`, `browser_screenshot`, `browser_eval`, `browser_get_dom`, `browser_close` | Full interactive control |

**Resource Templates:**
- `e2e://projects` - All projects
- `e2e://projects/{id}` - Project detail
- `e2e://projects/{projectId}/groups` - Group tree
- `e2e://groups/{groupId}/test-cases` - Test cases in group
- `e2e://runs/{runId}` - Run status + steps + logs
- `e2e://runs/{runId}/steps/{stepId}/screenshot` - Step screenshot
- `e2e://runs/{runId}/network-log` - Network requests
- `e2e://runs/{runId}/console-log` - Browser console
- `e2e://browser/sessions/{sessionId}` - Active browser session state

**Browser Tool Parameters (Zod Schemas):**

```typescript
// Navigation
browser_navigate: { url: string; sessionId?: string }

// Interaction (requires observe first to get element IDs)
browser_click: { id: number; sessionId?: string; waitStrategy?: "waitForNavigation" | "waitForText"; expectedText?: string }
browser_type: { id: number; text: string; sessionId?: string }
browser_hover: { id: number; sessionId?: string }
browser_key: { key: string; id?: number; sessionId?: string; waitStrategy?: "waitForNavigation" | "waitForText"; expectedText?: string }
browser_wait: { seconds: number; sessionId?: string }

// Observation
browser_observe: { sessionId?: string }  // Returns element list + screenshot
browser_screenshot: { sessionId?: string; fullPage?: boolean }
browser_get_dom: { sessionId?: string }  // Simplified DOM with selectors
browser_eval: { script: string; sessionId?: string }  // Sandboxed JS execution

// Session management
browser_close: { sessionId: string }
```

**Permission Mapping:**
| Tool/Resource | Required Permission |
|---------------|---------------------|
| `list_*`, `get_*`, resources | `read` |
| `create_*`, `update_*`, `delete_*`, `run_*` | `write` |
| `browser_*` | `browser` |
| Key management (future) | `admin` |

### 5. Hono Route Mounting (`backend/src/routes/mcp.ts`)

```typescript
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer } from "../mcp/server.js";
import { mcpAuthMiddleware } from "../middleware/auth.js";

export const mcpRouter = new Hono();

mcpRouter.use("*", mcpAuthMiddleware);

// SSE Connection Endpoint
mcpRouter.get("/sse", async (c) => {
  const server = createMcpServer(c.get("apiKey").permissions);
  const transport = new SSEServerTransport("/mcp/messages", c.res);
  await server.connect(transport);

  return streamSSE(c, async (stream) => {
    stream.onAbort(() => server.close());
    while (true) {
      await new Promise(r => setTimeout(r, 15000));
      try { await stream.write(": heartbeat\n\n"); } catch { break; }
    }
  });
});

// Message Endpoint (Client -> Server)
mcpRouter.post("/messages", async (c) => {
  // Handled by SSEServerTransport internally
  return c.text("OK");
});
```

### 6. Database Migration

```sql
-- New table for API Keys
CREATE TABLE api_key (
  key_hash VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '["read"]',
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_key_active ON api_key(is_active) WHERE is_active = TRUE;
```

## Data Flow Examples

### Example 1: AI Creates Test Case via MCP

```
User (Claude)                    MCP Server                      Backend
    │                              │                                │
    ├─ create_test_case {          │                                │
    │   groupId: "grp_123",        │                                │
    │   name: "Login Flow",        │                                │
    │   steps: [                   │                                │
    │     "Navigate to /login",    │                                │
    │     {action: "Type email",   │                                │
    │      expected: "Email field  │                                │
    │       accepts input"},       │                                │
    │     "Click submit"           │                                │
    │   ]                          │                                │
    │ }                           │                                │
    │─────────────────────────────▶│                                │
    │                              ├─ Validate permissions (write)  │
    │                              ├─ AppDataSource.save(Testcase)  │
    │                              │                                │
    │◀─────────────────────────────┤  Return created Testcase       │
    │                              │                                │
```

### Example 2: AI Runs Test & Observes Browser

```
User (Claude)                    MCP Server                      BrowserPool
    │                              │                                │
    ├─ run_test_case {testcaseId} │                                │
    │────────────────────────────▶│                                │
    │                              ├─ Create Task + TestRun         │
    │                              ├─ pg_notify queue               │
    │                              │                                │
    │◀────────────────────────────┤ {taskId, runId}                │
    │                              │                                │
    │ (poll get_run_status)       │                                │
    │                              │         Worker picks up job    │
    │                              │         ┌──────────────────┐   │
    │                              │         │ BrowserManager   │   │
    │                              │         │ initBrowser()    │   │
    │                              │         │ page.goto()      │   │
    │                              │         │ observeWebPage() │   │
    │                              │         │ click/type...    │   │
    │                              │         └──────────────────┘   │
    │                              │                                │
    │                              │         (screenshots, logs     │
    │                              │          streamed via SSE)     │
    │                              │                                │
    │ get_run_result {runId} ─────▶│                                │
    │◀────────────────────────────┤ Full result with screenshots   │
```

### Example 3: AI Interactive Browser Session

```
User (Claude)                    MCP Server                      BrowserPool
    │                              │                                │
    ├─ browser_navigate {         │                                │
    │   url: "https://example.com"│                                │
    │ }                           │                                │
    │────────────────────────────▶│                                │
    │                              ├─ acquire(sessionId?)         │
    │                              │    └─ new BrowserSession      │
    │                              ├─ page.goto(url)              │
    │                              ├─ page.waitForLoadState()     │
    │                              │                                │
    │◀────────────────────────────┤ {sessionId, elementList,      │
    │                              │  screenshot}                  │
    │                              │                                │
    ├─ browser_click {            │                                │
    │   sessionId: "sess_abc",    │                                │
    │   id: 5                     │                                │
    │ }                           │                                │
    │────────────────────────────▶│                                │
    │                              ├─ session = get(sessionId)    │
    │                              ├─ page.click('[data-e2e...]') │
    │                              │                                │
    │◀────────────────────────────┤ "Clicked element 5"           │
    │                              │                                │
    ├─ browser_observe {          │                                │
    │   sessionId: "sess_abc"     │                                │
    │ }                           │                                │
    │────────────────────────────▶│                                │
    │                              ├─ observeWebPage()            │
    │                              │                                │
    │◀────────────────────────────┤ New element list + screenshot │
```

## Error Handling Strategy

| Error Type | MCP Response |
|------------|--------------|
| Auth failure | `-32600` Invalid Request + "Unauthorized" |
| Permission denied | `-32600` Invalid Request + "Insufficient permissions" |
| Resource not found | `-32602` Invalid Params + "Not found" |
| Browser pool exhausted | `-32603` Internal Error + "Browser pool exhausted" |
| Browser crash | `-32603` Internal Error + "Session terminated" |
| Tool timeout (30s) | `-32603` Internal Error + "Tool timeout" |

## Testing Strategy

1. **Unit Tests**: Tool schemas, permission checks, browser pool logic
2. **Integration Tests**: Full MCP handshake, tool execution via SSE
3. **E2E Tests**: 
   - Create project → group → test case → run → verify result
   - Interactive browser session: navigate → observe → click → screenshot
4. **Load Test**: 5 concurrent browser sessions

## Deployment Notes

- No new infrastructure required (runs in existing Hono container)
- Browser pool limits concurrent sessions to 5 (configurable via `MCP_MAX_BROWSERS`)
- Idle sessions auto-cleanup after 5 minutes
- API Keys managed via CLI: `npm run mcp:key:create|list|revoke`