import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks";
import { membersTable } from "./members";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  taskTitle: text("task_title").notNull(),
  memberId: integer("member_id").references(() => membersTable.id, { onDelete: "set null" }),
  memberName: text("member_name"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Activity = typeof activityTable.$inferSelect;
