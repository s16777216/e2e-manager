## ADDED Requirements

### Requirement: Multi-level System Prompt Database Persistence
The system SHALL support storing `systemPrompt` (type text, nullable) inside the `Project`, `TestGroup`, and `Testcase` entities.

#### Scenario: Database schema and API transmission for system prompts
- **WHEN** querying or patching details for projects, groups, or testcases via the backend API
- **THEN** the JSON response SHALL include the `systemPrompt` property corresponding to the saved database state

---

### Requirement: Frontend Interface for Configuring System Prompts
The system SHALL provide textarea input fields in the Project Settings, Group Edit Sheet, and Testcase Edit Block to allow users to specify and modify the `systemPrompt`.

#### Scenario: User saves project-level prompt
- **WHEN** the user inputs a custom UI guide in the Project Settings Page and clicks save
- **THEN** the frontend sends a PATCH request with the updated `systemPrompt` to the API and displays a success toast message
