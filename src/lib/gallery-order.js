/**
 * @param {{ sortOrder?: number; createdAt: string }} a
 * @param {{ sortOrder?: number; createdAt: string }} b
 */
export function compareGalleryOrder(a, b) {
  const ao = a.sortOrder;
  const bo = b.sortOrder;
  if (ao != null && bo != null && ao !== bo) return ao - bo;
  if (ao != null && bo == null) return -1;
  if (ao == null && bo != null) return 1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** @template T */
export function sortAlbumsItems(items) {
  return [...items].sort(compareGalleryOrder);
}

/** @template T */
export function sortPhotosItems(items) {
  return [...items].sort(compareGalleryOrder);
}
