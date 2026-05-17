import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-session";
import { addPhoto, deletePhoto, getPhotos, reorderPhotos } from "@/lib/data-store";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getPhotos();
  return NextResponse.json({ items });
}

function parsePhotoUrls(body) {
  if (Array.isArray(body.urls)) {
    return body.urls.map((u) => String(u ?? "").trim()).filter(Boolean);
  }
  const raw = String(body.src ?? "").trim();
  if (!raw) return [];
  // Только перенос строки: в URL VK и др. в query бывают запятые (as=32x24,48x36,…)
  return raw
    .split(/\r?\n/)
    .map((u) => u.trim())
    .filter(Boolean);
}

function isValidPhotoUrl(src) {
  return /^https?:\/\//i.test(src);
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const albumId = String(body.albumId ?? "").trim();
  const urls = parsePhotoUrls(body);

  if (urls.length === 0) {
    return NextResponse.json({ error: "Укажите одну или несколько ссылок на изображения" }, { status: 400 });
  }

  if (!albumId) {
    return NextResponse.json({ error: "Выберите альбом" }, { status: 400 });
  }

  const items = [];
  const errors = [];

  for (const src of urls) {
    if (!isValidPhotoUrl(src)) {
      errors.push({ src, error: "Ссылка должна начинаться с http:// или https://" });
      continue;
    }
    try {
      items.push(await addPhoto({ src, caption: "", albumId }));
    } catch (e) {
      if (e?.message === "INVALID_ALBUM") {
        return NextResponse.json({ error: "Выбранный альбом не найден" }, { status: 400 });
      }
      errors.push({ src, error: e?.message || "Ошибка" });
    }
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Не удалось добавить ни одного фото", errors },
      { status: 400 }
    );
  }

  try {
    revalidatePath("/gallery");
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    item: items.length === 1 ? items[0] : undefined,
    items,
    added: items.length,
    errors,
  });
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const albumId = String(body.albumId ?? "").trim();

  if (!albumId) {
    return NextResponse.json({ error: "Укажите albumId" }, { status: 400 });
  }

  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: "Укажите ids — порядок фотографий" }, { status: 400 });
  }

  try {
    const items = await reorderPhotos(albumId, body.ids);
    try {
      revalidatePath("/gallery");
    } catch {
      /* ignore */
    }
    return NextResponse.json({ items });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "EMPTY_ALBUM") {
      return NextResponse.json({ error: "Укажите альбом" }, { status: 400 });
    }
    if (code === "EMPTY_ORDER") {
      return NextResponse.json({ error: "Укажите порядок фотографий" }, { status: 400 });
    }
    if (code === "ORDER_MISMATCH" || code === "PHOTO_NOT_FOUND") {
      return NextResponse.json({ error: "Некорректный список фотографий" }, { status: 400 });
    }
    console.error("[photos PATCH reorder]", err);
    return NextResponse.json({ error: "Не удалось сохранить порядок" }, { status: 500 });
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
