import { Hono } from "hono";
import { AppDataSource } from "../db.js";
import { ExportImportService } from "../services/exportImportService.js";
import { Project } from "../entities/Project.js";
import { TestGroup } from "../entities/TestGroup.js";
import { Testcase } from "../entities/Testcase.js";
import { TestcaseStep } from "../entities/TestcaseStep.js";

export const exportImportRouter = new Hono();

const exportImportService = new ExportImportService(
    AppDataSource,
    AppDataSource.getRepository(Project),
    AppDataSource.getTreeRepository(TestGroup),
    AppDataSource.getRepository(Testcase),
    AppDataSource.getRepository(TestcaseStep)
);

exportImportRouter.get("/projects/:id/export", async (c) => {
    const id = c.req.param("id");
    try {
        const data = await exportImportService.exportProjectData(id);
        const safeFilename = encodeURIComponent(`project-${data.project.name}-export.json`);
        c.header(
          "Content-Disposition",
          `attachment; filename="project-export.json"; filename*=UTF-8''${safeFilename}`
        );
        return c.json(data);
    } catch (error) {
        if (error instanceof Error && error.message === 'Project not found') {
            return c.json({ error: "Project not found" }, 404);
        }
        console.error("Export error:", error);
        return c.json({ error: "Export failed" }, 500);
    }
});

exportImportRouter.post("/projects/import/preview", async (c) => {
    try {
        let body: any;
        const contentType = c.req.header("content-type") || "";
        if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
            const bodyData = await c.req.parseBody();
            const file = bodyData["file"];
            if (file && typeof file !== "string" && "text" in file && typeof file.text === "function") {
                const text = await (file as File).text();
                body = JSON.parse(text);
            } else if (typeof file === "string") {
                body = JSON.parse(file);
            } else {
                throw new Error("No file uploaded in form data");
            }
        } else {
            body = await c.req.json();
        }
        const result = await exportImportService.previewImportData(body);
        if (!result.valid) {
            return c.json(result, 400);
        }
        return c.json(result);
    } catch (error) {
        console.error("Preview import error:", error);
        return c.json({ 
            valid: false, 
            errors: ["Invalid JSON or request format"], 
            suggestedName: '', 
            stats: { groupCount: 0, testcaseCount: 0, stepCount: 0 }, 
            previewTree: [] 
        }, 400);
    }
});

exportImportRouter.post("/projects/import", async (c) => {
    try {
        const body = await c.req.json();
        const newProjectId = await exportImportService.executeImportProject(body);
        return c.json({ id: newProjectId, name: body.projectName }, 201);
    } catch (error) {
        console.error("Import error:", error);
        return c.json({ error: error instanceof Error ? error.message : "Import failed" }, 500);
    }
});