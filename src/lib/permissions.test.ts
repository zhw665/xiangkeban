import { describe, expect, it } from "vitest";
import { canUseMessageChannel } from "@/lib/permissions";

describe("message permissions", () => {
  it("keeps student and parent conversations separated", () => {
    expect(canUseMessageChannel("student", "student_teacher")).toBe(true);
    expect(canUseMessageChannel("student", "class")).toBe(true);
    expect(canUseMessageChannel("student", "parent_teacher")).toBe(false);
    expect(canUseMessageChannel("parent", "parent_teacher")).toBe(true);
    expect(canUseMessageChannel("parent", "class")).toBe(false);
  });
  it("lets teachers use managed channels", () => expect(canUseMessageChannel("teacher", "class")).toBe(true));
});
