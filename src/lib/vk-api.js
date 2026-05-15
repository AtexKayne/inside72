const VK_API = "https://api.vk.com/method";
const VK_VERSION = "5.199";
const DEFAULT_SCREEN_NAME = "inside_dance72";

export class VkApiError extends Error {
  constructor(error) {
    super(error?.error_msg || "VK API error");
    this.code = error?.error_code;
    this.vkError = error;
  }
}

/** Ключ сообщества не умеет wall.get / photos.get / video.get — нужен сервисный или пользовательский ключ. */
export function isGroupTokenVkError(error) {
  const code = error?.error_code ?? error?.code;
  const msg = String(error?.error_msg ?? error?.message ?? "").toLowerCase();
  return code === 27 || msg.includes("group auth") || msg.includes("unavailable with group");
}

function getAccessToken() {
  const token = (
    process.env.VK_SERVICE_KEY ||
    process.env.VK_SERVICE_TOKEN ||
    process.env.VK_ACCESS_TOKEN
  )?.trim();
  if (!token) {
    throw new Error("VK_TOKEN_MISSING");
  }
  return token;
}

export async function vkCall(method, params = {}) {
  const url = new URL(`${VK_API}/${method}`);
  url.searchParams.set("access_token", getAccessToken());
  url.searchParams.set("v", VK_VERSION);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const data = await res.json();
  if (data.error) {
    if (isGroupTokenVkError(data.error)) {
      throw new Error("VK_GROUP_TOKEN_NOT_ALLOWED");
    }
    throw new VkApiError(data.error);
  }
  return data.response;
}

let cachedGroupId = null;

export async function getGroupOwnerId() {
  const envId = process.env.VK_GROUP_ID?.trim();
  if (envId) {
    const n = Number(envId);
    if (Number.isFinite(n) && n > 0) {
      return -n;
    }
  }

  if (cachedGroupId) {
    return -cachedGroupId;
  }

  const screenName = process.env.VK_GROUP_SCREEN_NAME?.trim() || DEFAULT_SCREEN_NAME;
  const groups = await vkCall("groups.getById", {
    group_id: screenName,
    fields: "screen_name",
  });
  const group = Array.isArray(groups) ? groups[0] : groups?.groups?.[0] ?? groups;
  const id = group?.id;
  if (!id) {
    throw new Error("VK_GROUP_NOT_FOUND");
  }
  cachedGroupId = id;
  return -id;
}

/** @param {{ type: string; url: string; width?: number }[]} sizes */
export function pickLargestPhotoUrl(sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) return null;
  const order = ["w", "z", "y", "x", "r", "q", "p", "o", "m", "s"];
  for (const t of order) {
    const found = sizes.find((s) => s.type === t && s.url);
    if (found) return found.url;
  }
  const sorted = [...sizes].filter((s) => s.url).sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url ?? null;
}

/** @param {Record<string, string> | undefined} files */
export function pickVideoMp4Url(files) {
  if (!files || typeof files !== "object") return null;
  const keys = ["mp4_1080", "mp4_720", "mp4_480", "mp4_360", "mp4_240", "mp4_144", "external"];
  for (const key of keys) {
    const url = files[key];
    if (url && /^https?:\/\//i.test(url)) {
      return url;
    }
  }
  return null;
}

/** @param {{ files?: Record<string, string>; player?: string; [key: string]: unknown }} video */
export function resolveVideoPlayUrl(video) {
  const fromFiles = pickVideoMp4Url(video.files);
  if (fromFiles) return fromFiles;
  const direct = video.direct_url ?? video.mp4;
  if (typeof direct === "string" && /^https?:\/\//i.test(direct)) {
    return direct;
  }
  return null;
}

/** @param {{ owner_id: number; id: number; access_key?: string }} video */
export function videoApiId(video) {
  const base = `${video.owner_id}_${video.id}`;
  return video.access_key ? `${base}_${video.access_key}` : base;
}

export function wallPostVkId(ownerId, postId) {
  return `wall-${ownerId}_${postId}`;
}

export function photoVkId(ownerId, photoId) {
  return `photo-${ownerId}_${photoId}`;
}

export function videoVkId(ownerId, videoId) {
  return `video-${ownerId}_${videoId}`;
}
