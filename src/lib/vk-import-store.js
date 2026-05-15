import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "data", "vk-imported.json");

async function readImported() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const data = JSON.parse(raw);
    return new Set(Array.isArray(data.ids) ? data.ids : []);
  } catch {
    return new Set();
  }
}

async function writeImported(ids) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify({ ids: [...ids] }, null, 2), "utf-8");
}

export async function getVkImportedIds() {
  return readImported();
}

export async function isVkImported(vkId) {
  const set = await readImported();
  return set.has(vkId);
}

export async function markVkImported(vkIds) {
  const set = await readImported();
  for (const id of vkIds) {
    if (id) set.add(id);
  }
  await writeImported(set);
}
