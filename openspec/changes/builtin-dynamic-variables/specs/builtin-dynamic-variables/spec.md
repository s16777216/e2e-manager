## ADDED Requirements

### Requirement: Interpolation engine supports JS expression evaluation
The system SHALL evaluate any text inside `{{}}` as a synchronous JavaScript expression if it does not strictly match a static variable name, or if it uses JS operators/calls. This evaluation MUST run in a restricted sandbox context using Node.js `vm`.

#### Scenario: Evaluate math expression
- **WHEN** a step template contains `{{1 + 1}}`
- **THEN** the system replaces it with `"2"`

#### Scenario: Access native JS globals
- **WHEN** a step template contains `{{Date.now()}}`
- **THEN** the system replaces it with a string of digits representing the current Unix timestamp in milliseconds

#### Scenario: Fallback to static variables
- **WHEN** a step template contains `{{username}}` and `username` is defined in the project variables
- **THEN** the system treats `username` as a variable in the sandbox scope and returns its value

#### Scenario: Reference static variable in JS expression
- **WHEN** a step template contains `{{"Hello " + username}}` and `username` is `"John"`
- **THEN** the system evaluates the JS string concatenation and replaces the placeholder with `"Hello John"`

---

### Requirement: Safe execution sandbox with globals whitelist
The system MUST run JS expressions within a sandbox that has only a whitelist of safe globals. Access to Node.js system APIs such as `process`, `require`, `fs`, and `Buffer` MUST be prohibited.

#### Scenario: Prohibit access to process object
- **WHEN** a step template contains `{{process.exit(1)}}`
- **THEN** the system throws an evaluation exception because `process` is not defined or is inaccessible

#### Scenario: Timeout for infinite loops
- **WHEN** a step template contains an infinite loop like `{{while(true){}}}`
- **THEN** the system interrupts execution after 100 milliseconds and throws a timeout exception

---

### Requirement: Named snapshot caching via $vars Proxy
The system SHALL inject a `$vars` Proxy object into the sandbox. Writing to `$vars.<key>` saves a string representation into the current `RunContext`'s snapshot registry, and reading from it retrieves the cached value, allowing the `??=` operator to implement run-level caching.

#### Scenario: Define named snapshot with nullish coalescing
- **WHEN** the first step uses `{{$vars.tempId ??= crypto.randomUUID()}}`
- **THEN** the system generates a new UUID, stores it under snapshot key `tempId`, and returns it

#### Scenario: Reuse named snapshot value
- **WHEN** a subsequent step in the same TestRun contains `{{$vars.tempId}}` or `{{$vars.tempId ??= crypto.randomUUID()}}`
- **THEN** the system returns the previously stored UUID instead of generating a new one

#### Scenario: Snapshot separation between runs
- **WHEN** Run A and Run B both execute step `{{$vars.tempId ??= crypto.randomUUID()}}`
- **THEN** they each generate and keep independent UUIDs within their respective `RunContext`

---

### Requirement: Execution abort on evaluation failure
The system SHALL catch any JS syntax error, runtime exception, or timeout thrown during interpolation, abort the current TestRun execution immediately, and mark the TestRun as failed with an appropriate error log.

#### Scenario: Abort step execution on SyntaxError
- **WHEN** a step contains `{{Date.now(}}` (syntax error)
- **THEN** the interpolation engine throws an error, the task runner catches it, aborts execution, and updates the TestRun status to `failed`
