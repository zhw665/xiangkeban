import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "乡课伴",
    short_name: "乡课伴",
    description: "连接教师、学生和家长的乡村课堂 AI 助教",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#166534",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  };
}
