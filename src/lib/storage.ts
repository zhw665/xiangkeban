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
  private client = new OSS({
    region: process.env.OSS_REGION!,
    bucket: process.env.OSS_BUCKET!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  });

  async put(key: string, data: Buffer, mimeType: string) {
    await this.client.put(key, data, { headers: { "Content-Type": mimeType } });
  }

  async get(key: string) {
    const result = await this.client.get(key);
    return Buffer.isBuffer(result.content) ? result.content : Buffer.from(result.content);
  }
}

export function getStorageProvider(): StorageProvider {
  const configured = process.env.OSS_REGION && process.env.OSS_BUCKET && process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET;
  return configured ? new OssStorageProvider() : new LocalStorageProvider();
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
