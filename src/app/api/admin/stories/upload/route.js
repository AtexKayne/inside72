import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
];

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAdminRequest())) {
          throw new Error("Unauthorized");
        }

        const safePath = String(pathname ?? "").trim();
        if (!safePath.startsWith("stories/") || safePath.includes("..")) {
          throw new Error("Некорректный путь файла");
        }

        return {
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        /* метаданные сохраняются через POST /api/admin/stories */
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка загрузки";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
