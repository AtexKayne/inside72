import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-session";
import { addNews, deleteNews, getNews, updateNews } from "@/lib/data-store";

function revalidateNews() {
  try {
    revalidatePath("/news");
  } catch {
    /* ignore */
  }
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getNews();
  return NextResponse.json({ items });
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const excerpt = String(body.excerpt ?? "").trim();
  const bodyText = String(body.body ?? "").trim();

  if (!title || !excerpt || !bodyText) {
    return NextResponse.json({ error: "Заполните заголовок, краткое описание и текст" }, { status: 400 });
  }

  const item = await addNews({ title, excerpt, body: bodyText });
  revalidateNews();
  return NextResponse.json({ item });
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const title = String(body.title ?? "").trim();
  const excerpt = String(body.excerpt ?? "").trim();
  const bodyText = String(body.body ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Укажите id новости" }, { status: 400 });
  }
  if (!title || !excerpt || !bodyText) {
    return NextResponse.json({ error: "Заполните заголовок, краткое описание и текст" }, { status: 400 });
  }

  const item = await updateNews(id, { title, excerpt, body: bodyText });
  if (!item) {
    return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
  }

  revalidateNews();
  try {
    revalidatePath(`/news/${id}`);
  } catch {
    /* ignore */
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
    return NextResponse.json({ error: "Укажите id новости" }, { status: 400 });
  }

  const removed = await deleteNews(id);
  if (!removed) {
    return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
  }

  revalidateNews();
  return NextResponse.json({ ok: true });
}
