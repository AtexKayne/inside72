import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-session";
import { addStory, deleteStory, getStories } from "@/lib/data-store";

const MAX_BYTES = 52 * 1024 * 1024; // ~50 MiB
const ALLOWED = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

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

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });
  }

  const file = formData.get("video");
  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Выберите видеофайл" }, { status: 400 });
  }

  const mime = (file.type || "").toLowerCase();
  const ext = ALLOWED.get(mime);
  if (!ext) {
    return NextResponse.json(
      { error: "Допустимы только MP4, WebM или MOV (вертикальное видео)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл слишком большой (максимум ~50 МБ)" }, { status: 400 });
  }

  const id = `s-${Date.now()}`;
  const relDir = path.join("uploads", "stories");
  const absDir = path.join(process.cwd(), "public", relDir);
  await fs.mkdir(absDir, { recursive: true });

  const filename = `${id}.${ext}`;
  const absPath = path.join(absDir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absPath, buf);

  const videoUrl = `/${relDir.replace(/\\/g, "/")}/${filename}`;
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
