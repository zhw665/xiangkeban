import "server-only";

const productionKeys = [
  "AUTH_SECRET",
  "SCHOOL_INVITE_CODE",
  "OSS_REGION",
  "OSS_BUCKET",
  "OSS_ACCESS_KEY_ID",
  "OSS_ACCESS_KEY_SECRET",
] as const;

type RuntimeMode = "development" | "production" | "test";

function readOptional(key: string) {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export function getRuntimeConfig(
  mode: RuntimeMode = (process.env.NODE_ENV as RuntimeMode | undefined) ?? "development",
) {
  if (mode === "production") {
    const missing = productionKeys.filter((key) => !readOptional(key));
    if (missing.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missing.join(", ")}`,
      );
    }
  }

  return {
    authSecret: readOptional("AUTH_SECRET"),
    schoolInviteCode: readOptional("SCHOOL_INVITE_CODE"),
    databaseUrl: readOptional("NETLIFY_DB_URL"),
    ossRegion: readOptional("OSS_REGION"),
    ossBucket: readOptional("OSS_BUCKET"),
    ossAccessKeyId: readOptional("OSS_ACCESS_KEY_ID"),
    ossAccessKeySecret: readOptional("OSS_ACCESS_KEY_SECRET"),
    dashScopeApiKey: readOptional("DASHSCOPE_API_KEY"),
    dashScopeBaseUrl:
      readOptional("DASHSCOPE_BASE_URL") ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
    dashScopeTextModel: readOptional("DASHSCOPE_TEXT_MODEL") ?? "qwen3-max",
  };
}
