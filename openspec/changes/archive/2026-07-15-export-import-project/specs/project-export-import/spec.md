## ADDED Requirements

### Requirement: Export Project Specification and Structure
The system SHALL provide an API and UI trigger in the Project Edit page to export a full project specification into a downloadable JSON file.

#### Scenario: Successful project export from Project Edit page
- **WHEN** a user clicks "匯出 JSON" button under the "專案備份與匯出" block in the Project Edit page (`ProjectEditView`)
- **THEN** the system generates a JSON file with `$schemaVersion: "1.0"` containing all metadata of the Project (name, description, systemPrompt, initCookies, initLocalStorage, variables), its nested TestGroups hierarchy, Testcases, and TestcaseSteps
- **AND** the system strips out all database internal IDs (UUIDs), created/updated timestamps, and execution history (TestRuns, TestLogs)
- **AND** the HTTP response header sets `Content-Disposition` to prompt file download named `project-<name>-export.json`

#### Scenario: Export non-existent project
- **WHEN** a user triggers export for a non-existent project ID
- **THEN** the system returns a HTTP 404 error with message `"Project not found"`

---

### Requirement: Import Project File Preview and Validation Endpoint
The system SHALL provide a backend endpoint `POST /api/projects/import/preview` that validates an uploaded JSON export file, verifies schema structure, checks for name collisions, and returns a tree preview response.

#### Scenario: Upload valid export JSON file for preview
- **WHEN** an uploaded JSON file passes `$schemaVersion` check and structure validation for Project, TestGroup, Testcase, and TestcaseStep
- **THEN** the server returns a JSON response containing:
  - `valid`: true
  - `projectName`: the original project name
  - `suggestedName`: an auto-generated non-conflicting name (e.g. if "My Project" exists in DB, returns "My Project (Imported)")
  - `description`: project description
  - `systemPrompt`, `initCookies`, `initLocalStorage`, `variables`
  - `stats`: total count of groups, total count of testcases, total count of steps
  - `tree`: full hierarchical tree of groups and testcases, where each node has a temporary client identifier, name, type ("group" | "testcase"), and children array

#### Scenario: Upload invalid or corrupted JSON file
- **WHEN** an uploaded file is not valid JSON or missing required fields (`$schemaVersion`, `projectName`, or invalid tree format)
- **THEN** the server returns HTTP 400 with `valid`: false and explicit error details explaining why validation failed

---

### Requirement: Confirm Project Import with Selective Filtering
The system SHALL provide an endpoint `POST /api/projects/import` that accepts the selected/filtered tree structure and creates a new Project and all selected child entities within a single database transaction.

#### Scenario: Successfully importing project with full or partial selection
- **WHEN** the client submits a request to `POST /api/projects/import` with `projectName` and `selectedTree` (containing selected Groups and Testcases)
- **THEN** the server opens a database transaction
- **THEN** the server creates a new `Project` record with the provided `projectName` and project settings
- **THEN** the server recursively creates all selected `TestGroup` records (preserving parent-child hierarchy), `Testcase` records, and `TestcaseStep` records with brand new UUIDs
- **THEN** the server commits the transaction and returns HTTP 201 with the newly created project ID `{ id: string, name: string }`

#### Scenario: Import transaction failure rollback
- **WHEN** any database insertion error occurs during project import creation
- **THEN** the server rolls back the database transaction completely, ensuring no partial entities are saved
- **THEN** the server returns HTTP 500 with error details

---

### Requirement: Frontend Project List Import Button and Navigation
The system SHALL display an "Import Project" (匯入專案) button on the Project List view that navigates users to the standalone import page at `/projects/import`.

#### Scenario: User clicks import project button
- **WHEN** user clicks "匯入專案" button on the project list page
- **THEN** the browser navigates to the route `/projects/import`

---

### Requirement: Standalone Import Project View (/projects/import)
The system SHALL render a standalone import page at `/projects/import` featuring a file upload dropzone, project metadata settings, a full-height tree checklist with search filtering and batch selection (Select All / Unselect All), and a confirmation trigger that redirects to the newly created project page upon completion.

#### Scenario: Selecting a file on the import page
- **WHEN** the user uploads or selects a `.json` file on the `/projects/import` page
- **THEN** the page sends the file to `POST /api/projects/import/preview`
- **AND** upon successful response, renders the project settings fields and the tree checklist with summary count badges

#### Scenario: Filtering and unchecking testcases on the import page
- **WHEN** the user is customizing options on `/projects/import`
- **THEN** the user can edit the target project name input field and project description
- **THEN** the user can filter items by keyword search or click "全選" / "全部取消"
- **AND** unchecking a parent TestGroup automatically unchecks all its child TestGroups and Testcases
- **AND** checking a child Testcase automatically checks its parent TestGroups

#### Scenario: User confirms import on the standalone import page
- **WHEN** the user clicks "開始匯入專案" (Confirm Import) button on `/projects/import`
- **THEN** the page submits `POST /api/projects/import` with the sanitized project details and selected tree structure
- **AND** upon success, displays a toast notification and navigates the browser to the newly created project view `/projects/:newProjectId`
