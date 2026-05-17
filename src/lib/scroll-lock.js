let locked = false;
let savedScrollBehavior = "";

/** @param {Event} e */
function blockScroll(e) {
  e.preventDefault();
}

/** @param {KeyboardEvent} e */
function blockScrollKeys(e) {
  const keys = [" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
  if (keys.includes(e.key)) e.preventDefault();
}

export function lockScroll() {
  if (locked) return;

  const html = document.documentElement;
  savedScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";

  document.addEventListener("wheel", blockScroll, { passive: false, capture: true });
  document.addEventListener("touchmove", blockScroll, { passive: false, capture: true });
  document.addEventListener("keydown", blockScrollKeys, { capture: true });
  locked = true;
}

export function unlockScroll() {
  if (!locked) return;

  document.removeEventListener("wheel", blockScroll, { capture: true });
  document.removeEventListener("touchmove", blockScroll, { capture: true });
  document.removeEventListener("keydown", blockScrollKeys, { capture: true });

  document.documentElement.style.scrollBehavior = savedScrollBehavior;
  savedScrollBehavior = "";
  locked = false;
}
