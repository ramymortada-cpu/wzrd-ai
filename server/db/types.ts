import type { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "../../drizzle/schema";

/** Drizzle instance shape used across server helpers and _core (pagination, audit). */
export type AppDatabase = MySql2Database<typeof schema>;
