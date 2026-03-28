import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Lead magnet — emails from Welcome / marketing (unique email). */
export const leadMagnetSubscribers = mysqlTable("lead_magnet_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  source: varchar("source", { length: 100 }).notNull().default("home_guide_2026"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
