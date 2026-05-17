const VK_API = "https://api.vk.com/method";
const VK_VERSION = "5.199";

function getCommunityToken() {
  return process.env.VK_COMMUNITY_TOKEN?.trim() || null;
}

function getNotifyUserIds() {
  const raw = process.env.VK_TRIAL_NOTIFY_USER_IDS?.trim();
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((id) => /^\d+$/.test(id));
}

async function vkCommunityCall(method, params = {}) {
  const token = getCommunityToken();
  if (!token) {
    throw new Error("VK_COMMUNITY_TOKEN_MISSING");
  }

  const url = new URL(`${VK_API}/${method}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("v", VK_VERSION);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const data = await res.json();
  if (data.error) {
    const err = new Error(data.error.error_msg || "VK API error");
    err.code = data.error.error_code;
    err.vkError = data.error;
    throw err;
  }
  return data.response;
}

/**
 * @param {string} message
 * @returns {Promise<{ ok: true, via: "vk" } | { ok: false, reason: string, error?: Error }>}
 */
export async function sendTrialVkNotify(message) {
  const token = getCommunityToken();
  const userIds = getNotifyUserIds();
  if (!token || userIds.length === 0) {
    return { ok: false, reason: "not_configured" };
  }

  const failures = [];
  for (const userId of userIds) {
    try {
      await vkCommunityCall("messages.send", {
        user_id: userId,
        random_id: Math.floor(Math.random() * 2_147_483_647),
        message,
      });
    } catch (error) {
      console.error("trial vk notify error", { userId, error });
      failures.push(error);
    }
  }

  if (failures.length === userIds.length) {
    const first = failures[0];
    return {
      ok: false,
      reason: "api_error",
      error: first instanceof Error ? first : new Error(String(first)),
    };
  }

  return { ok: true, via: "vk" };
}
