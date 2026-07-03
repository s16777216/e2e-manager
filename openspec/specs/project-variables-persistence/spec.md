# project-variables-persistence Specification

## Purpose
TBD - created by archiving change fix-project-variables. Update Purpose after archive.
## Requirements
### Requirement: Display project environment variables on load
The system SHALL correctly parse and display all saved environment variables when a project's details or settings page is loaded.

#### Scenario: Display variables in editor
- **WHEN** user navigates to the project edit page
- **THEN** the system fetches variables from the database and lists them in the Environment Variables editor

### Requirement: Save block-level changes independently without data loss
The system SHALL save settings for individual configuration blocks (General, Storage, Variables) independently, and MUST NOT overwrite or clear variables or storage details when other blocks are modified and saved.

The system's interpolation engine MUST accept an optional `RunContext` parameter on both `interpolateString` and `interpolateObject`. When no `RunContext` is supplied (existing callers), the behaviour is identical to the current implementation — JS expressions without `$vars` snapshot caching still execute but generate fresh values on each call.

#### Scenario: Save general settings does not erase variables
- **WHEN** the user saves name or description changes in the General block
- **THEN** the system persists those details, and the environment variables in the database remain unchanged

#### Scenario: Existing interpolation callers without RunContext still work
- **WHEN** `interpolateString` is called without a `context` argument (legacy call site)
- **THEN** static variable substitution behaves exactly as before; any `{{Date.now()}}` patterns in the template are evaluated fresh each time (no snapshot caching, `$vars` writes are cached in a temporary run-level Map)

