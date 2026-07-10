/**
 * @typedef {{ videoUrl: string; caption?: string }} StorySlide
 * @typedef {{ id: string; title: string; videoUrl?: string; slides?: StorySlide[] }} StoryItem
 */

/**
 * @param {unknown} slides
 * @returns {StorySlide[]}
 */
export function normalizeStorySlides(slides) {
  if (!Array.isArray(slides)) return [];

  return slides
    .map((slide) => {
      if (!slide || typeof slide !== "object") return null;
      const videoUrl = String(slide.videoUrl ?? "").trim();
      if (!videoUrl) return null;
      return {
        videoUrl,
      };
    })
    .filter(Boolean);
}

/**
 * @param {StoryItem | null | undefined} story
 * @returns {StorySlide[]}
 */
export function getStorySlides(story) {
  if (!story) return [];

  const slides = normalizeStorySlides(story.slides);
  if (slides.length > 0) return slides;

  const videoUrl = String(story.videoUrl ?? "").trim();
  if (!videoUrl) return [];

  return [{ videoUrl }];
}

/**
 * @param {StoryItem | null | undefined} story
 * @returns {string}
 */
export function getStoryPreviewVideoUrl(story) {
  return getStorySlides(story)[0]?.videoUrl ?? "";
}

/**
 * @param {unknown} slides
 * @returns {StorySlide[] | null}
 */
export function parseStorySlidesInput(slides) {
  if (slides == null) return null;
  const normalized = normalizeStorySlides(slides);
  if (normalized.length === 0) return null;
  return normalized;
}
