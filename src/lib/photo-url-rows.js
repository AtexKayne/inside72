export function normalizePhotoUrl(url) {
  return String(url ?? "").trim();
}

export function isPhotoUrlLike(value) {
  return /^https?:\/\//i.test(normalizePhotoUrl(value));
}

/** @param {string[]} urls */
export function dedupePhotoUrls(urls) {
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    const n = normalizePhotoUrl(u);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/** @param {string} text */
export function parsePastedPhotoUrls(text) {
  return text
    .split(/\r?\n/)
    .map(normalizePhotoUrl)
    .filter(isPhotoUrlLike);
}

let rowSeq = 0;

/** @param {string} [value] */
export function createPhotoUrlRow(value = "") {
  rowSeq += 1;
  return { id: `photo-url-${rowSeq}`, value };
}

/** @param {{ id: string; value: string }[]} rows */
export function finalizePhotoUrlRows(rows) {
  const seen = new Set();
  const filled = [];
  for (const row of rows) {
    const v = normalizePhotoUrl(row.value);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    filled.push({ ...row, value: v });
  }
  return [...filled, createPhotoUrlRow("")];
}
