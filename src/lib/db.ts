import "server-only";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/netlify-db";

import * as schema from "@/db/schema";
import { first } from "@/lib/db-helpers";
import { getRuntimeConfig } from "@/lib/runtime-config";

const netlifyDatabaseUrl = process.env.NETLIFY_DB_URL?.trim();
const { databaseUrl } = getRuntimeConfig();

export const db = netlifyDatabaseUrl
  ? drizzle({ schema })
  : databaseUrl
  ? drizzle({ connection: databaseUrl, schema })
  : drizzle({ schema });
export const dbReady = Promise.resolve();

export async function getUserByUsername(username: string) {
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username));

  return first(rows);
}
