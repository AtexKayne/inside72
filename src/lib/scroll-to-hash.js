/** Отступ под sticky-хедер при скролле к якорю */
const HASH_SCROLL_OFFSET = 96;

export function scrollToHash(hash, behavior = "smooth") {
  if (!hash || hash === "#") return false;

  const id = decodeURIComponent(hash.slice(1));
  const el = document.getElementById(id);
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - HASH_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}
