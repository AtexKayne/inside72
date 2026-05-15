import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-session";
import { addPhoto, deletePhoto, getPhotos } from "@/lib/data-store";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getPhotos();
  return NextResponse.json({ items });
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const src = String(body.src ?? "").trim();
  const caption = String(body.caption ?? "").trim();
  const albumId = String(body.albumId ?? "").trim();

  if (!src || !caption) {
    return NextResponse.json({ error: "Укажите ссылку на изображение и подпись" }, { status: 400 });
  }

  if (!albumId) {
    return NextResponse.json({ error: "Выберите альбом" }, { status: 400 });
  }

  if (!/^https?:\/\//i.test(src)) {
    return NextResponse.json({ error: "Ссылка должна начинаться с http:// или https://" }, { status: 400 });
  }

  try {
    const item = await addPhoto({ src, caption, albumId });
    try {
      revalidatePath("/gallery");
    } catch {
      /* ignore */
    }
    return NextResponse.json({ item });
  } catch (e) {
    if (e?.message === "INVALID_ALBUM") {
      return NextResponse.json({ error: "Выбранный альбом не найден" }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Укажите id фотографии" }, { status: 400 });
  }

  const removed = await deletePhoto(id);
  if (!removed) {
    return NextResponse.json({ error: "Фотография не найдена" }, { status: 404 });
  }

  try {
    revalidatePath("/gallery");
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
