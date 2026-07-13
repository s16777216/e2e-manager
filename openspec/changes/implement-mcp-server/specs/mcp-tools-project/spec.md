## ADDED Requirements

### Requirement: MCP tool list_projects returns all projects
The system SHALL provide `list_projects` tool that returns all projects with test case counts.

#### Scenario: List projects returns array
- **WHEN** client calls `list_projects` with empty arguments
- **THEN** tool returns array of project objects with `id`, `name`, `description`, `testcaseCount`, `createdAt`, `updatedAt`

### Requirement: MCP tool create_project creates new project
The system SHALL provide `create_project` tool that creates a new project with optional initial settings.

#### Scenario: Create project with required name
- **WHEN** client calls `create_project` with `{name: "My Project"}`
- **THEN** project is created in database
- **THEN** tool returns created project object with generated `id`

#### Scenario: Create project with full options
- **WHEN** client calls `create_project` with `{name, description, initCookies, initLocalStorage, variables}`
- **THEN** all fields are persisted
- **THEN** returned project includes all provided fields

#### Scenario: Create project without name returns error
- **WHEN** client calls `create_project` without `name`
- **THEN** tool returns error "Project name is required"

### Requirement: MCP tool list_groups returns hierarchical groups
The system SHALL provide `list_groups` tool that returns all groups for a project in tree structure with test case counts.

#### Scenario: List groups returns tree
- **WHEN** client calls `list_groups` with `{projectId: "proj_123"}`
- **THEN** tool returns array of root groups, each with `children` array recursively
- **THEN** each group includes `id`, `name`, `parentId`, `testcaseCount`, `initCookies`, `initLocalStorage`, `variables`

### Requirement: MCP tool create_group creates new group
The system SHALL provide `create_group` tool that creates a group under a project, optionally nested under a parent group.

#### Scenario: Create root group
- **WHEN** client calls `create_group` with `{projectId: "proj_123", name: "New Group"}`
- **THEN** group is created with `parentId: null`
- **THEN** tool returns created group

#### Scenario: Create nested group
- **WHEN** client calls `create_group` with `{projectId, name, parentId: "grp_parent"}`
- **THEN** group is created with `parentId` set
- **THEN** cycle detection prevents circular references

#### Scenario: Create group in non-existent project returns error
- **WHEN** client calls `create_group` with invalid `projectId`
- **THEN** tool returns error "Project not found"

### Requirement: MCP tool list_test_cases returns test cases with steps
The system SHALL provide `list_test_cases` tool that returns all test cases in a group with their steps.

#### Scenario: List test cases returns ordered steps
- **WHEN** client calls `list_test_cases` with `{groupId: "grp_123"}`
- **THEN** tool returns array of test cases
- **THEN** each test case includes `steps` array ordered by `stepIdx`
- **THEN** each step includes `stepIdx`, `action`, `expected`, `hasExpected`

### Requirement: MCP tool create_test_case creates test case with natural language steps
The system SHALL provide `create_test_case` tool that accepts steps as strings or structured objects.

#### Scenario: Create test case with string steps
- **WHEN** client calls `create_test_case` with `steps: ["Navigate to /login", "Type email", "Click submit"]`
- **THEN** test case created with 3 steps, `stepIdx` 0,1,2
- **THEN** each step has `action` set, `expected` undefined, `hasExpected: false`

#### Scenario: Create test case with structured steps
- **WHEN** client calls `create_test_case` with `steps: [{action: "Navigate", expected: "Page loads", hasExpected: true}]`
- **THEN** step created with all fields populated

#### Scenario: Create test case with inherited settings
- **WHEN** client provides `initCookies`, `initLocalStorage`, `variables`
- **THEN** these are stored on test case and merge with group/project inheritance at runtime

### Requirement: MCP tool update_test_case modifies existing test case
The system SHALL provide `update_test_case` tool for modifying test case properties and steps.

#### Scenario: Update test case name and steps
- **WHEN** client calls `update_test_case` with `{testcaseId, name: "New Name", steps: [...]}`
- **THEN** test case name updated
- **THEN** old steps deleted, new steps created with correct `stepIdx`

#### Scenario: Update test case without steps preserves existing
- **WHEN** client calls `update_test_case` with `{testcaseId, name: "New Name"}` (no steps)
- **THEN** name updated, steps unchanged

### Requirement: MCP tool delete_test_case removes test case
The system SHALL provide `delete_test_case` tool that deletes a test case and its steps.

#### Scenario: Delete test case
- **WHEN** client calls `delete_test_case` with `{testcaseId: "tc_123"}`
- **THEN** test case and all steps removed from database
- **THEN** tool returns success message