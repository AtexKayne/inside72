import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-session";
import { addAlbum, deleteAlbum, getAlbums } from "@/lib/data-store";

function revalidateGallery() {
  try {
    revalidatePath("/gallery");
  } catch {
    /* ignore */
  }
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getAlbums();
  return NextResponse.json({ items });
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Укажите название альбома" }, { status: 400 });
  }

  try {
    const item = await addAlbum({ title });
    revalidateGallery();
    return NextResponse.json({ item });
  } catch (e) {
    if (e?.message === "EMPTY_TITLE") {
      return NextResponse.json({ error: "Укажите название альбома" }, { status: 400 });
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
    return NextResponse.json({ error: "Укажите id альбома" }, { status: 400 });
  }

  const albums = await getAlbums();
  if (albums.length <= 1) {
    return NextResponse.json(
      { error: "Нельзя удалить последний альбом — должен остаться хотя бы один" },
      { status: 400 }
    );
  }

  const removed = await deleteAlbum(id);
  if (!removed) {
    return NextResponse.json({ error: "Альбом не найден" }, { status: 404 });
  }

  revalidateGallery();
  return NextResponse.json({ ok: true });
}
