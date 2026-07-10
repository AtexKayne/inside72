const GITHUB_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/AtexKayne/inside72@main/public/video";

/** @typedef {{ id: string; caption: string; localPath: string; fileName: string; envKey?: string }} HomeVideoConfig */

/** @type {HomeVideoConfig[]} */
const HOME_VIDEOS = [
  {
    id: "senior-group",
    caption: "Процесс занятия старшей группы",
    localPath: "/video/senior-group-lesson.mp4",
    fileName: "senior-group-lesson.mp4",
    envKey: "NEXT_PUBLIC_SENIOR_GROUP_VIDEO_URL",
  },
  {
    id: "trial-lesson",
    caption: "Как проходят пробные занятия",
    localPath: "/video/trial-lesson.mp4",
    fileName: "trial-lesson.mp4",
    envKey: "NEXT_PUBLIC_TRIAL_LESSON_VIDEO_URL",
  },
  {
    id: "why-hustle",
    caption: "Почему хастл?",
    localPath: "/video/why-hustle.mp4",
    fileName: "why-hustle.mp4",
    envKey: "NEXT_PUBLIC_WHY_HUSTLE_VIDEO_URL",
  },
];

/**
 * @param {HomeVideoConfig} config
 */
function resolveHomeVideoUrl({ localPath, fileName, envKey }) {
  if (envKey) {
    const fromEnv = process.env[envKey]?.trim();
    if (fromEnv) return fromEnv;
  }

  if (process.env.NODE_ENV === "development") {
    return localPath;
  }

  return `${GITHUB_CDN_BASE}/${fileName}`;
}

/** Видео на главной: в git, на VPS не деплоятся (см. deploy.yml). */
export function getHomePageVideos() {
  return HOME_VIDEOS.map((video) => ({
    id: video.id,
    caption: video.caption,
    src: resolveHomeVideoUrl(video),
  }));
}

/** @deprecated Используйте getHomePageVideos */
export function getSeniorGroupVideoUrl() {
  return resolveHomeVideoUrl(HOME_VIDEOS[0]);
}
