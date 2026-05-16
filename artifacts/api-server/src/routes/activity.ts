import { Router } from "express";
import { db, activityTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { GetActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const { limit } = GetActivityQueryParams.parse(req.query);
  const items = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(limit ?? 20);

  res.json(items);
});

export default router;
