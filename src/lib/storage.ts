import "server-only";

import OSS from "ali-oss";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StorageProvider {
  put(key: string, data: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
}

class LocalStorageProvider implements StorageProvider {
  private root = path.join(process.cwd(), "data", "uploads");

  private resolve(key: string) {
    const target = path.resolve(this.root, key);
    const relative = path.relative(this.root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Invalid storage key");
    return target;
  }

  async put(key: string, data: Buffer) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
  }

  async get(key: string) {
    const target = this.resolve(key);
    return readFile(target);
  }
}

class OssStorageProvider implements StorageProvider {
  private client: OSS;

  constructor(config: {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
  }) {
    this.client = new OSS(config);
  }

  async put(key: string, data: Buffer, mimeType: string) {
    await this.client.put(key, data, { headers: { "Content-Type": mimeType } });
  }

  async get(key: string) {
    const result = await this.client.get(key);
    return Buffer.isBuffer(result.content) ? result.content : Buffer.from(result.content);
  }
}

export class StorageConfigurationError extends Error {
  constructor() {
    super("Storage is not configured");
    this.name = "StorageConfigurationError";
  }
}

export function isStorageConfigurationError(
  error: unknown,
): error is StorageConfigurationError {
  return error instanceof StorageConfigurationError;
}

export function getStorageProvider(
  mode: "development" | "production" | "test" =
    (process.env.NODE_ENV as "development" | "production" | "test" | undefined) ??
    "development",
): StorageProvider {
  const values = {
    region: process.env.OSS_REGION?.trim(),
    bucket: process.env.OSS_BUCKET?.trim(),
    accessKeyId: process.env.OSS_ACCESS_KEY_ID?.trim(),
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET?.trim(),
  };
  const configured = Object.values(values).every(Boolean);
  if (configured) {
    return new OssStorageProvider(values as {
      region: string;
      bucket: string;
      accessKeyId: string;
      accessKeySecret: string;
    });
  }
  if (mode === "production" || Object.values(values).some(Boolean)) {
    throw new StorageConfigurationError();
  }
  return new LocalStorageProvider();
}

export const uploadRules = {
  material: { max: 20 * 1024 * 1024, types: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain", "image/png", "image/jpeg", "image/webp"] },
  video: { max: 150 * 1024 * 1024, types: ["video/webm", "video/mp4", "audio/webm", "audio/mp4", "audio/mpeg"] },
  image: { max: 12 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp"] },
  message: { max: 20 * 1024 * 1024, types: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "image/png", "image/jpeg", "image/webp"] },
} as const;

export function validateUpload(file: File, kind: keyof typeof uploadRules) {
  const rule = uploadRules[kind];
  if (file.size <= 0) return "文件内容为空";
  if (file.size > rule.max) return `文件不能超过 ${Math.round(rule.max / 1024 / 1024)}MB`;
  if (!(rule.types as readonly string[]).includes(file.type)) return "暂不支持这种文件格式";
  return null;
}
