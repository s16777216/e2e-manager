import { Repository, DataSource } from 'typeorm';
import { Project } from '../entities/Project.js';
import { TestGroup } from '../entities/TestGroup.js';
import { Testcase } from '../entities/Testcase.js';
import { TestcaseStep } from '../entities/TestcaseStep.js';

export interface ExportProjectPayload {
  $schemaVersion: "1.0";
  exportedAt: string;
  project: {
    name: string;
    description?: string;
    systemPrompt?: string;
    initCookies?: any;
    initLocalStorage?: any;
    variables?: any;
    groups: ExportGroupPayload[];
  };
}

export interface ExportGroupPayload {
  name: string;
  systemPrompt?: string;
  disableParentPrompt?: boolean;
  initCookies?: any;
  initLocalStorage?: any;
  variables?: any;
  children?: ExportGroupPayload[];
  testcases?: ExportTestcasePayload[];
}

export interface ExportTestcasePayload {
  name: string;
  expected: string;
  systemPrompt?: string;
  disableParentPrompt?: boolean;
  initCookies?: any;
  initLocalStorage?: any;
  variables?: any;
  steps: {
    stepIndex: number;
    action: string;
    target: string;
    value?: string;
  }[];
}

export interface ImportConfirmPayload {
  projectName: string;
  description?: string;
  systemPrompt?: string;
  initCookies?: any;
  initLocalStorage?: any;
  variables?: any;
  selectedTree: ExportGroupPayload[];
}

export interface PreviewImportResult {
  valid: boolean;
  errors?: string[];
  suggestedName: string;
  project?: ExportProjectPayload["project"];
  stats: {
    groupCount: number;
    testcaseCount: number;
    stepCount: number;
  };
  previewTree: ExportGroupPayload[]; // with tempId added
}

export class ExportImportService {
  constructor(
    private dataSource: DataSource,
    private projectRepo: Repository<Project>,
    private groupRepo: Repository<TestGroup>,
    private testcaseRepo: Repository<Testcase>,
    private stepRepo: Repository<TestcaseStep>,
  ) {}

  async exportProjectData(projectId: string): Promise<ExportProjectPayload> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: {
        groups: {
          testcases: {
            steps: true,
          },
        },
      },
    });

    if (!project) throw new Error('Project not found');

    // Load all groups with their full tree structure
    const allGroups = await this.groupRepo.find({
      where: { project: { id: projectId } },
      relations: {
        testcases: {
          steps: true,
        },
      },
    });

    // Build a map for quick lookup
    const groupMap = new Map<string, TestGroup>();
    for (const g of allGroups) {
      groupMap.set(g.id, g);
    }

    // Build children map
    const childrenMap = new Map<string, TestGroup[]>();
    for (const g of allGroups) {
      if (g.parent) {
        const parentId = typeof g.parent === 'string' ? g.parent : g.parent.id;
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(g);
      }
    }

    // Build testcases map by group
    const testcasesByGroup = new Map<string, Testcase[]>();
    for (const g of allGroups) {
      if (g.testcases && g.testcases.length > 0) {
        testcasesByGroup.set(g.id, g.testcases);
      }
    }

    const buildExportGroup = (group: TestGroup): ExportGroupPayload => {
      const groupTestcases = testcasesByGroup.get(group.id) || [];
      const groupChildren = childrenMap.get(group.id) || [];

      return {
        name: group.name,
        systemPrompt: group.systemPrompt || undefined,
        disableParentPrompt: group.disableParentPrompt || undefined,
        initCookies: group.initCookies || undefined,
        initLocalStorage: group.initLocalStorage || undefined,
        variables: group.variables || undefined,
        children: groupChildren.map(buildExportGroup),
        testcases: groupTestcases.map(tc => this.buildExportTestcase(tc)),
      };
    };

    const rootGroups = allGroups
      .filter(g => !g.parent)
      .map(buildExportGroup);

    return {
      $schemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        description: project.description || undefined,
        systemPrompt: project.systemPrompt || undefined,
        initCookies: project.initCookies || undefined,
        initLocalStorage: project.initLocalStorage || undefined,
        variables: project.variables || undefined,
        groups: rootGroups,
      },
    };
  }

  private buildExportTestcase(tc: Testcase): ExportTestcasePayload {
    return {
      name: tc.name,
      expected: tc.expected,
      systemPrompt: tc.systemPrompt || undefined,
      disableParentPrompt: tc.disableParentPrompt || undefined,
      initCookies: tc.initCookies || undefined,
      initLocalStorage: tc.initLocalStorage || undefined,
      variables: tc.variables || undefined,
      steps: tc.steps.map((step, index) => ({
        stepIndex: index,
        action: step.action,
        target: step.action, // Using action as target since step doesn't have separate target field
        value: step.expected || undefined,
      })),
    };
  }

  async previewImportData(jsonPayload: any): Promise<PreviewImportResult> {
    const errors: string[] = [];

    // Validate schema version
    if (!jsonPayload.$schemaVersion || jsonPayload.$schemaVersion !== "1.0") {
      errors.push('Invalid or missing $schemaVersion. Expected "1.0"');
    }

    // Validate required structure
    if (!jsonPayload.project) {
      errors.push('Missing "project" object in payload');
    } else {
      if (!jsonPayload.project.name) {
        errors.push('Missing project.name');
      }
      if (!jsonPayload.project.groups || !Array.isArray(jsonPayload.project.groups)) {
        errors.push('Missing or invalid project.groups array');
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        suggestedName: '',
        stats: { groupCount: 0, testcaseCount: 0, stepCount: 0 },
        previewTree: [],
      };
    }

    // Check for duplicate project name
    const existingProject = await this.projectRepo.findOne({
      where: { name: jsonPayload.project.name }
    });

    const suggestedName = existingProject 
      ? `${jsonPayload.project.name} (Imported)`
      : jsonPayload.project.name;

    // Calculate stats and assign tempIds
    let groupCount = 0;
    let testcaseCount = 0;
    let stepCount = 0;
    let tempIdCounter = 0;

    const assignTempIds = (groups: ExportGroupPayload[]): ExportGroupPayload[] => {
      return groups.map(group => {
        groupCount++;
        const tempId = `temp_${++tempIdCounter}`;
        const processedGroup: ExportGroupPayload = { ...group, tempId } as any;
        
        if (group.children && group.children.length > 0) {
          processedGroup.children = assignTempIds(group.children);
        }
        
        if (group.testcases && group.testcases.length > 0) {
          processedGroup.testcases = group.testcases.map(tc => {
            testcaseCount++;
            const tcTempId = `temp_${++tempIdCounter}`;
            stepCount += tc.steps?.length || 0;
            return { ...tc, tempId: tcTempId };
          });
        }
        
        return processedGroup;
      });
    };

    const previewTree = assignTempIds(jsonPayload.project.groups || []);

    return {
      valid: true,
      suggestedName,
      project: jsonPayload.project,
      stats: { groupCount, testcaseCount, stepCount },
      previewTree,
    };
  }

  async executeImportProject(data: ImportConfirmPayload): Promise<string> {
    return await this.dataSource.transaction(async (manager) => {
      // Create Project
      const project = manager.create(Project, {
        name: data.projectName,
        description: data.description,
        systemPrompt: data.systemPrompt,
        initCookies: data.initCookies,
        initLocalStorage: data.initLocalStorage,
        variables: data.variables,
      });
      await manager.save(project);

      // Recursively import groups, testcases, steps
      const importGroups = async (
        groups: ExportGroupPayload[],
        parentGroup: TestGroup | null
      ): Promise<void> => {
        for (const g of groups) {
          // Create TestGroup
          const group = manager.create(TestGroup, {
            name: g.name,
            project,
            parent: parentGroup,
            systemPrompt: g.systemPrompt,
            disableParentPrompt: g.disableParentPrompt,
            initCookies: g.initCookies,
            initLocalStorage: g.initLocalStorage,
            variables: g.variables,
          });
          await manager.save(group);

          // Create Testcases
          for (const tcData of g.testcases || []) {
            const tc = manager.create(Testcase, {
              name: tcData.name,
              expected: tcData.expected,
              group,
              systemPrompt: tcData.systemPrompt,
              disableParentPrompt: tcData.disableParentPrompt,
              initCookies: tcData.initCookies,
              initLocalStorage: tcData.initLocalStorage,
              variables: tcData.variables,
            });
            await manager.save(tc);

            // Create Steps
            for (const stepData of tcData.steps || []) {
              const step = manager.create(TestcaseStep, {
                stepIdx: stepData.stepIndex,
                action: stepData.action,
                expected: stepData.value, // value field maps to expected
                hasExpected: !!stepData.value,
                testcase: tc,
              });
              await manager.save(step);
            }
          }

          // Recursively import children
          if (g.children && g.children.length > 0) {
            await importGroups(g.children, group);
          }
        }
      };

      await importGroups(data.selectedTree, null);
      return project.id;
    });
  }
}