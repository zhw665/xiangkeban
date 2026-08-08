import "server-only";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/netlify-db";

import * as schema from "@/db/schema";
import { first } from "@/lib/db-helpers";

export const db = drizzle({ schema });
export const dbReady = Promise.resolve();

export async function getUserByUsername(username: string) {
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username));

  return first(rows);
}
