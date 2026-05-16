import { Router } from "express";
import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateMemberBody, UpdateMemberBody, UpdateMemberParams, DeleteMemberParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const members = await db.select().from(membersTable).orderBy(membersTable.name);
  res.json(members);
});

router.post("/", async (req, res) => {
  const body = CreateMemberBody.parse(req.body);
  const [member] = await db.insert(membersTable).values(body).returning();
  res.status(201).json(member);
});

router.patch("/:id", async (req, res) => {
  const { id } = UpdateMemberParams.parse({ id: Number(req.params.id) });
  const body = UpdateMemberBody.parse(req.body);
  const [member] = await db.update(membersTable).set(body).where(eq(membersTable.id, id)).returning();
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(member);
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteMemberParams.parse({ id: Number(req.params.id) });
  await db.delete(membersTable).where(eq(membersTable.id, id));
  res.status(204).end();
});

export default router;
