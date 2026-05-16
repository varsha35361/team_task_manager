import { Router, type IRouter } from "express";
import { db, commentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { DeleteCommentParams } from "@workspace/api-zod";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import membersRouter from "./members";
import tasksRouter from "./tasks";
import taskCommentsRouter from "./comments";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/projects", projectsRouter);
router.use("/members", membersRouter);
router.use("/tasks", tasksRouter);
router.use("/tasks", taskCommentsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/activity", activityRouter);

router.delete("/comments/:id", async (req, res) => {
  const { id } = DeleteCommentParams.parse({ id: Number(req.params.id) });
  await db.delete(commentsTable).where(eq(commentsTable.id, id));
  res.status(204).end();
});

export default router;
