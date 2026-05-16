import { Router } from "express";
import { db, tasksTable, projectsTable, membersTable, activityTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import {
  ListTasksQueryParams,
  CreateTaskBody,
  UpdateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  DeleteTaskParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListTasksQueryParams.parse(req.query);
  const conditions: SQL[] = [];
  if (query.projectId !== undefined) conditions.push(eq(tasksTable.projectId, query.projectId));
  if (query.assigneeId !== undefined) conditions.push(eq(tasksTable.assigneeId, query.assigneeId));
  if (query.status !== undefined) conditions.push(eq(tasksTable.status, query.status));
  if (query.priority !== undefined) conditions.push(eq(tasksTable.priority, query.priority));

  const rows = await db
    .select({
      task: tasksTable,
      project: projectsTable,
      assignee: membersTable,
    })
    .from(tasksTable)
    .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .leftJoin(membersTable, eq(tasksTable.assigneeId, membersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(tasksTable.createdAt);

  const tasks = rows.map(({ task, project, assignee }) => ({
    ...task,
    project: project ?? null,
    assignee: assignee ?? null,
  }));

  res.json(tasks);
});

router.post("/", async (req, res) => {
  const body = CreateTaskBody.parse(req.body);
  const insertData = {
    ...body,
    dueDate: body.dueDate instanceof Date ? body.dueDate.toISOString().split("T")[0] : body.dueDate,
  };
  const [task] = await db.insert(tasksTable).values(insertData).returning();

  let member = null;
  if (task.assigneeId) {
    [member] = await db.select().from(membersTable).where(eq(membersTable.id, task.assigneeId));
  }

  await db.insert(activityTable).values({
    type: "task_created",
    taskId: task.id,
    taskTitle: task.title,
    memberId: member?.id ?? null,
    memberName: member?.name ?? null,
    details: null,
  });

  let project = null;
  if (task.projectId) {
    [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, task.projectId));
  }

  res.status(201).json({ ...task, project: project ?? null, assignee: member ?? null });
});

router.get("/:id", async (req, res) => {
  const { id } = GetTaskParams.parse({ id: Number(req.params.id) });
  const rows = await db
    .select({ task: tasksTable, project: projectsTable, assignee: membersTable })
    .from(tasksTable)
    .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .leftJoin(membersTable, eq(tasksTable.assigneeId, membersTable.id))
    .where(eq(tasksTable.id, id));

  if (!rows.length) { res.status(404).json({ error: "Task not found" }); return; }
  const { task, project, assignee } = rows[0];
  res.json({ ...task, project: project ?? null, assignee: assignee ?? null });
});

router.patch("/:id", async (req, res) => {
  const { id } = UpdateTaskParams.parse({ id: Number(req.params.id) });
  const body = UpdateTaskBody.parse(req.body);

  const existingRows = await db
    .select({ task: tasksTable })
    .from(tasksTable)
    .where(eq(tasksTable.id, id));
  if (!existingRows.length) { res.status(404).json({ error: "Task not found" }); return; }

  const existing = existingRows[0].task;
  const updateData = {
    ...body,
    dueDate: body.dueDate instanceof Date ? body.dueDate.toISOString().split("T")[0] : body.dueDate,
    updatedAt: new Date(),
  };
  const [updated] = await db
    .update(tasksTable)
    .set(updateData)
    .where(eq(tasksTable.id, id))
    .returning();

  let activityType = "task_updated";
  if (body.status === "done" && existing.status !== "done") activityType = "task_completed";
  else if (body.assigneeId !== undefined && body.assigneeId !== existing.assigneeId) activityType = "task_assigned";

  let member = null;
  if (updated.assigneeId) {
    [member] = await db.select().from(membersTable).where(eq(membersTable.id, updated.assigneeId));
  }

  await db.insert(activityTable).values({
    type: activityType,
    taskId: updated.id,
    taskTitle: updated.title,
    memberId: member?.id ?? null,
    memberName: member?.name ?? null,
    details: body.status ? `Status changed to ${body.status}` : null,
  });

  let project = null;
  if (updated.projectId) {
    [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, updated.projectId));
  }

  res.json({ ...updated, project: project ?? null, assignee: member ?? null });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteTaskParams.parse({ id: Number(req.params.id) });
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.status(204).end();
});

export default router;
