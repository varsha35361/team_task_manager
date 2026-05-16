import { Router } from "express";
import { db, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateProjectBody, UpdateProjectBody, GetProjectParams, UpdateProjectParams, DeleteProjectParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
  res.json(projects);
});

router.post("/", async (req, res) => {
  const body = CreateProjectBody.parse(req.body);
  const [project] = await db.insert(projectsTable).values(body).returning();
  res.status(201).json(project);
});

router.get("/:id", async (req, res) => {
  const { id } = GetProjectParams.parse({ id: Number(req.params.id) });
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(project);
});

router.patch("/:id", async (req, res) => {
  const { id } = UpdateProjectParams.parse({ id: Number(req.params.id) });
  const body = UpdateProjectBody.parse(req.body);
  const [project] = await db.update(projectsTable).set(body).where(eq(projectsTable.id, id)).returning();
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(project);
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteProjectParams.parse({ id: Number(req.params.id) });
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.status(204).end();
});

export default router;
