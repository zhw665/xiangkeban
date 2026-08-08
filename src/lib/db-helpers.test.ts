import { expect, test } from "vitest";

import { first, firstOrNull } from "@/lib/db-helpers";

test("first returns the first row", () => {
  expect(first([{ id: "1" }, { id: "2" }])).toEqual({ id: "1" });
});

test("firstOrNull returns null for an empty result", () => {
  expect(firstOrNull([])).toBeNull();
});
