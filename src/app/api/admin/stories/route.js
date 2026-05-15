import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-session";
import { addStory, deleteStory, getStories } from "@/lib/data-store";
import { isAllowedStoryVideoUrl } from "@/lib/story-video-url";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getStories();
  return NextResponse.json({ items });
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const videoUrl = String(body.videoUrl ?? "").trim();

  if (!videoUrl) {
    return NextResponse.json({ error: "Укажите ссылку на видео" }, { status: 400 });
  }

  if (!isAllowedStoryVideoUrl(videoUrl)) {
    return NextResponse.json(
      { error: "Некорректная ссылка. Нужен полный URL (http/https) на видеофайл" },
      { status: 400 }
    );
  }

  const id = `s-${Date.now()}`;
  const item = await addStory({ id, title: title || "Сторис", videoUrl });

  try {
    revalidatePath("/");
  } catch {
    /* ignore if not applicable */
  }

  return NextResponse.json({ item });
}

export async function DELETE(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Укажите id сторис" }, { status: 400 });
  }

  const removed = await deleteStory(id);
  if (!removed) {
    return NextResponse.json({ error: "Сторис не найден" }, { status: 404 });
  }

  try {
    revalidatePath("/");
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
