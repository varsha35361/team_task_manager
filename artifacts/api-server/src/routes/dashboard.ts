import { Router } from "express";
import { db, tasksTable, projectsTable, membersTable, activityTable } from "@workspace/db";
import { sql, lt } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const allTasks = await db.select().from(tasksTable);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const totalTasks = allTasks.length;
  const overdueCount = allTasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== "done"
  ).length;

  const byStatus = {
    todo: allTasks.filter((t) => t.status === "todo").length,
    in_progress: allTasks.filter((t) => t.status === "in_progress").length,
    review: allTasks.filter((t) => t.status === "review").length,
    done: allTasks.filter((t) => t.status === "done").length,
  };

  const byPriority = {
    low: allTasks.filter((t) => t.priority === "low").length,
    medium: allTasks.filter((t) => t.priority === "medium").length,
    high: allTasks.filter((t) => t.priority === "high").length,
    urgent: allTasks.filter((t) => t.priority === "urgent").length,
  };

  const [{ count: totalProjects }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectsTable);

  const [{ count: totalMembers }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(membersTable);

  res.json({ totalTasks, overdueCount, totalProjects, totalMembers, byStatus, byPriority });
});

export default router;
