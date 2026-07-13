## ADDED Requirements

### Requirement: MCP tool browser_navigate navigates to URL
The system SHALL provide `browser_navigate` tool that navigates a browser session to a URL and returns observed elements with screenshot.

#### Scenario: Navigate creates new session if not provided
- **WHEN** client calls `browser_navigate` with `{url: "https://example.com"}` (no sessionId)
- **THEN** BrowserPool acquires new session
- **THEN** page navigates to URL, waits for networkidle
- **THEN** tool returns `{sessionId, elementList, screenshotBase64}`

#### Scenario: Navigate reuses existing session
- **WHEN** client calls `browser_navigate` with `{url, sessionId: "sess_abc"}`
- **THEN** existing session reused
- **THEN** page navigates, returns updated elements and screenshot

#### Scenario: Navigate to invalid URL returns error
- **WHEN** client calls `browser_navigate` with invalid URL
- **THEN** tool returns error with navigation failure details

### Requirement: MCP tool browser_observe returns current page elements
The system SHALL provide `browser_observe` tool that injects element IDs, captures labeled screenshot, and returns element list.

#### Scenario: Observe returns numbered elements and screenshot
- **WHEN** client calls `browser_observe` with `{sessionId}`
- **THEN** page evaluates interactive elements, assigns `data-e2e-agent-id`
- **THEN** floating labels rendered, screenshot captured
- **THEN** labels cleaned up
- **THEN** tool returns `{elementList: "[1] <button>Login</button>\n[2] <input type=\"email\">...", screenshotBase64}`

### Requirement: MCP tool browser_click clicks element by ID
The system SHALL provide `browser_click` tool that clicks an element identified by its observed ID.

#### Scenario: Click element with navigation wait
- **WHEN** client calls `browser_click` with `{sessionId, id: 5, waitStrategy: "waitForNavigation"}`
- **THEN** page clicks element `[data-e2e-agent-id="5"]`
- **THEN** waits for networkidle (10s timeout)
- **THEN** returns "Clicked element 5, navigation complete"

#### Scenario: Click element with text wait
- **WHEN** client calls `browser_click` with `{sessionId, id: 5, waitStrategy: "waitForText", expectedText: "Welcome"}`
- **THEN** clicks element, waits for text "Welcome" to appear (5s timeout)

#### Scenario: Click element without wait
- **WHEN** client calls `browser_click` with `{sessionId, id: 5}`
- **THEN** clicks element immediately
- **THEN** returns "Clicked element 5"

#### Scenario: Click non-existent ID returns error
- **WHEN** client calls `browser_click` with ID not found
- **THEN** tool returns error "Element not found or not visible"

### Requirement: MCP tool browser_type types text into input
The system SHALL provide `browser_type` tool that fills an input element.

#### Scenario: Type text into input
- **WHEN** client calls `browser_type` with `{sessionId, id: 3, text: "user@example.com"}`
- **THEN** page fills element `[data-e2e-agent-id="3"]` with text
- **THEN** returns "Typed 'user@example.com' into element 3"

### Requirement: MCP tool browser_key presses keyboard key
The system SHALL provide `browser_key` tool for keyboard events with optional focus and wait strategies.

#### Scenario: Press Enter with navigation wait
- **WHEN** client calls `browser_key` with `{sessionId, key: "Enter", waitStrategy: "waitForNavigation"}`
- **THEN** presses Enter, waits for networkidle

#### Scenario: Press key on focused element
- **WHEN** client calls `browser_key` with `{sessionId, id: 2, key: "Tab"}`
- **THEN** focuses element 2, presses Tab

### Requirement: MCP tool browser_hover hovers element
The system SHALL provide `browser_hover` tool to trigger hover interactions.

#### Scenario: Hover element
- **WHEN** client calls `browser_hover` with `{sessionId, id: 7}`
- **THEN** page hovers element `[data-e2e-agent-id="7"]`

### Requirement: MCP tool browser_wait waits for seconds
The system SHALL provide `browser_wait` tool for explicit waits.

#### Scenario: Wait specified seconds
- **WHEN** client calls `browser_wait` with `{sessionId, seconds: 3}`
- **THEN** page waits 3000ms
- **THEN** returns "Waited 3 seconds"

### Requirement: MCP tool browser_screenshot captures current viewport
The system SHALL provide `browser_screenshot` tool returning base64 PNG.

#### Scenario: Capture screenshot
- **WHEN** client calls `browser_screenshot` with `{sessionId}`
- **THEN** returns `{screenshotBase64: "..."}`

### Requirement: MCP tool browser_eval executes JavaScript in page context
The system SHALL provide `browser_eval` tool for arbitrary JS execution with sandbox restrictions.

#### Scenario: Evaluate simple expression
- **WHEN** client calls `browser_eval` with `{sessionId, script: "document.title"}`
- **THEN** returns `{result: "Page Title"}`

#### Scenario: Evaluate script with DOM access
- **WHEN** client calls `browser_eval` with `{sessionId, script: "Array.from(document.querySelectorAll('a')).map(a => a.href)"}`
- **THEN** returns array of hrefs

#### Scenario: Dangerous operations blocked
- **WHEN** client calls `browser_eval` with script accessing `localStorage.clear()` or `fetch` to external domains
- **THEN** tool returns error "Operation not permitted in sandbox"

### Requirement: BrowserPool manages concurrent sessions with limits
The system SHALL provide a BrowserPool that limits concurrent browser sessions and cleans up idle sessions.

#### Scenario: Pool limits concurrent sessions
- **WHEN** 6th concurrent `browser_navigate` called (max 5)
- **THEN** tool returns error "Browser pool exhausted, max 5 sessions"

#### Scenario: Idle session cleanup
- **WHEN** session unused for 5 minutes
- **THEN** pool closes browser, context, page
- **THEN** session removed from pool

#### Scenario: Explicit session release
- **WHEN** client calls `browser_close` with `{sessionId}`
- **THEN** session closed immediately, returned to pool

#### Scenario: Session reuse by ID
- **WHEN** client provides `sessionId` from previous call
- **THEN** same browser context/page reused
- **THEN** cookies, localStorage, authentication preserved

### Requirement: MCP resource e2e://browser/sessions lists active sessions
The system SHALL expose active browser sessions as resource.

#### Scenario: List sessions
- **WHEN** client reads `e2e://browser/sessions`
- **THEN** returns array of `{sessionId, createdAt, lastUsedAt, url, inUse}`

### Requirement: Session state persists across tool calls
The system SHALL maintain browser session state (cookies, localStorage, page position) across multiple tool invocations within the same session.

#### Scenario: Login persists across navigation
- **WHEN** client navigates to login page, types credentials, clicks submit
- **WHEN** client navigates to dashboard page in same session
- **THEN** authenticated state preserved (cookies sent automatically)