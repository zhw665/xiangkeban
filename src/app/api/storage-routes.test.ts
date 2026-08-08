import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "vitest";

const uploadRoutes = [
  "assignments/route.ts",
  "materials/route.ts",
  "messages/route.ts",
  "questions/route.ts",
  "videos/route.ts",
];

test("upload routes return 503 when production storage is unavailable", () => {
  for (const route of uploadRoutes) {
    const source = readFileSync(
      path.join(process.cwd(), "src", "app", "api", route),
      "utf8",
    );

    expect(source, route).toContain("isStorageConfigurationError");
    expect(source, route).toContain("503");
  }
});
