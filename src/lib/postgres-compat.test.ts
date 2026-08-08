import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return [];
    return [fullPath];
  });
}

test("database calls use PostgreSQL-compatible Drizzle APIs", () => {
  const sourceRoot = path.join(process.cwd(), "src");
  const sqlitePatterns = [/\.(?:get|all|run)\(\)/g, /node:sqlite/g];
  const offenders = sourceFiles(sourceRoot).flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return sqlitePatterns.flatMap((pattern) =>
      [...source.matchAll(pattern)].map(
        (match) => `${path.relative(process.cwd(), file)}: ${match[0]}`,
      ),
    );
  });

  expect(offenders).toEqual([]);
});
