import { describe, expect, it } from "vitest";
import { validateUpload } from "@/lib/storage";

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
