import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-session";
import { addNews, addPhoto, addStory } from "@/lib/data-store";
import { isGroupTokenVkError, VkApiError } from "@/lib/vk-api";
import {
  fetchVkNewsPreview,
  fetchVkPhotosPreview,
  fetchVkVideosPreview,
  isAllowedVkMediaUrl,
} from "@/lib/vk-import";
import { isVkImported, markVkImported } from "@/lib/vk-import-store";

const TYPES = new Set(["news", "photos", "videos"]);

const GROUP_TOKEN_HINT =
  "Ключ сообщества (из «Управление → Работа с API») не подходит для импорта. " +
  "Нужен сервисный ключ приложения VK: vk.com/apps → ваше приложение → Настройки → «Сервисный ключ доступа». " +
  "Укажите его в .env как VK_SERVICE_KEY=… и перезапустите сервер.";

function vkErrorResponse(err) {
  if (err?.message === "VK_TOKEN_MISSING") {
    return NextResponse.json(
      {
        error:
          "Не настроен VK_SERVICE_KEY (сервисный ключ приложения VK). Добавьте в .env и перезапустите npm run dev",
      },
      { status: 503 }
    );
  }
  if (err?.message === "VK_GROUP_TOKEN_NOT_ALLOWED") {
    return NextResponse.json({ error: GROUP_TOKEN_HINT }, { status: 400 });
  }
  if (err?.message === "VK_GROUP_NOT_FOUND") {
    return NextResponse.json({ error: "Группа VK не найдена" }, { status: 502 });
  }
  if (err instanceof VkApiError) {
    if (isGroupTokenVkError(err.vkError ?? err)) {
      return NextResponse.json({ error: GROUP_TOKEN_HINT }, { status: 400 });
    }
    return NextResponse.json(
      { error: err.message || "Ошибка VK API", code: err.code },
      { status: 502 }
    );
  }
  throw err;
}

export async function GET(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "news";
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const count = Math.min(50, Math.max(1, Number(searchParams.get("count")) || 20));

  if (!TYPES.has(type)) {
    return NextResponse.json({ error: "Неверный тип: news, photos или videos" }, { status: 400 });
  }

  try {
    let result;
    if (type === "news") {
      result = await fetchVkNewsPreview(offset, count);
    } else if (type === "photos") {
      result = await fetchVkPhotosPreview(offset, count);
    } else {
      result = await fetchVkVideosPreview(offset, count);
    }

    return NextResponse.json({
      type,
      community: "vk.com/inside_dance72",
      ...result,
    });
  } catch (err) {
    return vkErrorResponse(err);
  }
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const type = body.type;
  const items = Array.isArray(body.items) ? body.items : [];
  const albumId = String(body.albumId ?? "").trim();

  if (!TYPES.has(type)) {
    return NextResponse.json({ error: "Укажите type: news, photos или videos" }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "Выберите элементы для импорта" }, { status: 400 });
  }

  if (type === "photos" && !albumId) {
    return NextResponse.json({ error: "Выберите альбом для фотографий" }, { status: 400 });
  }

  const imported = [];
  const skipped = [];
  const errors = [];

  for (const raw of items) {
    const vkId = String(raw.vkId ?? "").trim();
    if (!vkId) {
      errors.push({ vkId: null, error: "Нет vkId" });
      continue;
    }

    try {
      if (await isVkImported(vkId)) {
        skipped.push(vkId);
        continue;
      }

      if (type === "news") {
        const title = String(raw.title ?? "").trim();
        const excerpt = String(raw.excerpt ?? "").trim();
        const bodyText = String(raw.body ?? "").trim();
        if (!title || !excerpt || !bodyText) {
          errors.push({ vkId, error: "Неполные данные новости" });
          continue;
        }
        await addNews({
          title,
          excerpt,
          body: bodyText,
          vkId,
          createdAt: raw.date ? String(raw.date) : undefined,
        });
        try {
          revalidatePath("/news");
        } catch {
          /* ignore */
        }
      } else if (type === "photos") {
        const src = String(raw.src ?? "").trim();
        const caption = String(raw.caption ?? "").trim();
        if (!src || !caption) {
          errors.push({ vkId, error: "Неполные данные фото" });
          continue;
        }
        if (!isAllowedVkMediaUrl(src)) {
          errors.push({ vkId, error: "Недопустимый URL изображения" });
          continue;
        }
        await addPhoto({
          src,
          caption,
          albumId,
          vkId,
          createdAt: raw.date ? String(raw.date) : undefined,
        });
        try {
          revalidatePath("/gallery");
        } catch {
          /* ignore */
        }
      } else {
        const title = String(raw.title ?? "").trim() || "Сторис";
        const videoUrl = String(raw.videoUrl ?? "").trim();
        if (!videoUrl) {
          errors.push({ vkId, error: "Нет ссылки на видео" });
          continue;
        }
        if (!isAllowedVkMediaUrl(videoUrl)) {
          errors.push({ vkId, error: "Недопустимый URL видео VK" });
          continue;
        }
        await addStory({
          title,
          videoUrl,
          vkId,
          createdAt: raw.date ? String(raw.date) : undefined,
        });
        try {
          revalidatePath("/");
        } catch {
          /* ignore */
        }
      }

      await markVkImported([vkId]);
      imported.push(vkId);
    } catch (e) {
      if (e?.message === "INVALID_ALBUM") {
        errors.push({ vkId, error: "Альбом не найден" });
      } else {
        errors.push({ vkId, error: e?.message || "Ошибка" });
      }
    }
  }

  return NextResponse.json({
    imported: imported.length,
    skipped: skipped.length,
    errors,
  });
}
