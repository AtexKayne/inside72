import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-session";
import {
  addStory,
  deleteStory,
  getStories,
  reorderStories,
  updateStory,
} from "@/lib/data-store";
import { parseStorySlidesInput } from "@/lib/story-slides";
import { isAllowedStoryVideoUrl } from "@/lib/story-video-url";

function validateSlides(slides) {
  const normalized = parseStorySlidesInput(slides);
  if (!normalized) {
    return { error: "Добавьте хотя бы одно видео в сторис" };
  }

  for (const slide of normalized) {
    if (!isAllowedStoryVideoUrl(slide.videoUrl)) {
      return { error: "Некорректный URL видео в одном из слайдов" };
    }
  }

  return { slides: normalized };
}

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
  const hasSlides = Array.isArray(body.slides);
  const videoUrl = String(body.videoUrl ?? "").trim();

  let slides;
  if (hasSlides) {
    const validated = validateSlides(body.slides);
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    slides = validated.slides;
  } else if (!videoUrl) {
    return NextResponse.json({ error: "Добавьте хотя бы одно видео" }, { status: 400 });
  } else if (!isAllowedStoryVideoUrl(videoUrl)) {
    return NextResponse.json({ error: "Некорректный URL видео" }, { status: 400 });
  }

  try {
    const id = `s-${Date.now()}`;
    const item = await addStory({
      id,
      title: title || "Сторис",
      videoUrl,
      slides,
    });

    try {
      revalidatePath("/");
    } catch {
      /* ignore if not applicable */
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error("[stories POST]", err);
    const message =
      err instanceof Error ? err.message : "Не удалось сохранить сторис";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (Array.isArray(body.ids)) {
    try {
      const items = await reorderStories(body.ids);
      try {
        revalidatePath("/");
      } catch {
        /* ignore */
      }
      return NextResponse.json({ items });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "EMPTY_ORDER") {
        return NextResponse.json({ error: "Укажите порядок сторис" }, { status: 400 });
      }
      if (code === "ORDER_MISMATCH" || code === "STORY_NOT_FOUND") {
        return NextResponse.json({ error: "Некорректный список сторис" }, { status: 400 });
      }
      console.error("[stories PATCH reorder]", err);
      return NextResponse.json({ error: "Не удалось сохранить порядок" }, { status: 500 });
    }
  }

  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Укажите id сторис" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const hasSlides = Array.isArray(body.slides);
  const hasVideoUrl = body.videoUrl != null;
  const videoUrl = hasVideoUrl ? String(body.videoUrl).trim() : undefined;

  let slides;
  if (hasSlides) {
    const validated = validateSlides(body.slides);
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    slides = validated.slides;
  } else if (hasVideoUrl) {
    if (!videoUrl) {
      return NextResponse.json({ error: "Укажите URL видео" }, { status: 400 });
    }
    if (!isAllowedStoryVideoUrl(videoUrl)) {
      return NextResponse.json({ error: "Некорректный URL видео" }, { status: 400 });
    }
  }

  try {
    const item = await updateStory(id, { title, videoUrl, slides });
    if (!item) {
      return NextResponse.json({ error: "Сторис не найден" }, { status: 404 });
    }
    try {
      revalidatePath("/");
    } catch {
      /* ignore */
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[stories PATCH update]", err);
    const message = err instanceof Error ? err.message : "Не удалось обновить сторис";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
