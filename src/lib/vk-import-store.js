import { isPostgresStorage } from "@/lib/storage/config";
import * as jsonStore from "@/lib/storage/json-store";
import * as postgresStore from "@/lib/storage/postgres-store";

const store = () => (isPostgresStorage() ? postgresStore : jsonStore);

export async function getVkImportedIds() {
  return store().getVkImportedIds();
}

export async function isVkImported(vkId) {
  return store().isVkImported(vkId);
}

export async function markVkImported(vkIds) {
  return store().markVkImported(vkIds);
}
