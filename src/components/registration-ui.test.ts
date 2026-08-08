import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "vitest";

function componentSource(name: string) {
  return readFileSync(path.join(process.cwd(), "src", "components", name), "utf8");
}

test("registration form collects secure role-specific invite codes", () => {
  const source = componentSource("register-form.tsx");

  expect(source).toContain('name="schoolInviteCode"');
  expect(source).toContain('name="guardianCode"');
  expect(source).not.toContain('name="studentUsername"');
});

test("student directory exposes the guardian code command", () => {
  const directory = componentSource("student-directory-view.tsx");
  const command = componentSource("guardian-code-button.tsx");

  expect(directory).toContain("GuardianCodeButton");
  expect(command).toContain('fetch("/api/guardian-codes"');
});
