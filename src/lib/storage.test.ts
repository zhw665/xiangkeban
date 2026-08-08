import { afterEach, describe, expect, it } from "vitest";
import { getStorageProvider, validateUpload } from "@/lib/storage";

const ossKeys = [
  "OSS_REGION",
  "OSS_BUCKET",
  "OSS_ACCESS_KEY_ID",
  "OSS_ACCESS_KEY_SECRET",
] as const;
const originalOssEnvironment = Object.fromEntries(
  ossKeys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of ossKeys) {
    if (originalOssEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = originalOssEnvironment[key];
  }
});

describe("getStorageProvider", () => {
  it("rejects missing OSS configuration in production", () => {
    for (const key of ossKeys) delete process.env[key];

    expect(() => getStorageProvider("production")).toThrow(
      "Storage is not configured",
    );
  });

  it("allows local storage only outside production", () => {
    for (const key of ossKeys) delete process.env[key];

    expect(() => getStorageProvider("development")).not.toThrow();
  });

  it("creates an OSS provider when all values are present", () => {
    for (const key of ossKeys) process.env[key] = `test-${key.toLowerCase()}`;

    expect(() => getStorageProvider("production")).not.toThrow();
  });
});

describe("validateUpload", () => {
  it("accepts supported classroom files", () => expect(validateUpload(new File(["lesson"], "lesson.txt", { type: "text/plain" }), "material")).toBeNull());
  it("rejects executable and empty files", () => {
    expect(validateUpload(new File(["x"], "run.exe", { type: "application/x-msdownload" }), "material")).toContain("暂不支持");
    expect(validateUpload(new File([], "empty.txt", { type: "text/plain" }), "material")).toContain("为空");
  });
  it("accepts classroom message photos and documents", () => {
    expect(validateUpload(new File(["image"], "homework.jpg", { type: "image/jpeg" }), "message")).toBeNull();
    expect(validateUpload(new File(["notes"], "notes.txt", { type: "text/plain" }), "message")).toBeNull();
    expect(validateUpload(new File(["video"], "clip.mp4", { type: "video/mp4" }), "message")).toContain("暂不支持");
  });
});
