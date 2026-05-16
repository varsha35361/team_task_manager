import { Router } from "express";
import { db, commentsTable, membersTable, tasksTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListTaskCommentsParams,
  CreateTaskCommentParams,
  CreateTaskCommentBody,
  DeleteCommentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/:id/comments", async (req, res) => {
  const { id } = ListTaskCommentsParams.parse({ id: Number(req.params.id) });
  const rows = await db
    .select({ comment: commentsTable, author: membersTable })
    .from(commentsTable)
    .leftJoin(membersTable, eq(commentsTable.authorId, membersTable.id))
    .where(eq(commentsTable.taskId, id))
    .orderBy(commentsTable.createdAt);

  res.json(rows.map(({ comment, author }) => ({ ...comment, author: author ?? null })));
});

router.post("/:id/comments", async (req, res) => {
  const { id } = CreateTaskCommentParams.parse({ id: Number(req.params.id) });
  const body = CreateTaskCommentBody.parse(req.body);

  const [comment] = await db.insert(commentsTable).values({ ...body, taskId: id }).returning();

  let author = null;
  if (comment.authorId) {
    [author] = await db.select().from(membersTable).where(eq(membersTable.id, comment.authorId));
  }

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (task) {
    await db.insert(activityTable).values({
      type: "comment_added",
      taskId: task.id,
      taskTitle: task.title,
      memberId: author?.id ?? null,
      memberName: author?.name ?? null,
      details: null,
    });
  }

  res.status(201).json({ ...comment, author: author ?? null });
});

export default router;
