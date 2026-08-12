"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sortPhotosItems } from "@/lib/gallery-order";
import { getHallPhotosAlbum } from "@/lib/hall-photos";
import {
  createPhotoUrlRow,
  dedupePhotoUrls,
  finalizePhotoUrlRows,
  parsePastedPhotoUrls,
} from "@/lib/photo-url-rows";
import styles from "./admin.module.scss";

const HALL_ALBUM_TITLE = "Зал";

export default function AdminHomePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [albumId, setAlbumId] = useState("");
  const [albumTitle, setAlbumTitle] = useState(HALL_ALBUM_TITLE);
  const [photoUrlRows, setPhotoUrlRows] = useState(() => [createPhotoUrlRow("")]);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [dragPhotoId, setDragPhotoId] = useState(null);
  const [photoDropTarget, setPhotoDropTarget] = useState(null);
  const [photoOrderSaving, setPhotoOrderSaving] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const hallPhotos = useMemo(
    () => (albumId ? sortPhotosItems(photos.filter((p) => p.albumId === albumId)) : []),
    [photos, albumId]
  );

  async function ensureHallAlbum(albums) {
    const { album } = getHallPhotosAlbum(albums, []);
    if (album) return album;

    const res = await fetch("/api/admin/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: HALL_ALBUM_TITLE }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "Не удалось создать альбом");
    }
    return data.item;
  }

  async function load() {
    setLoading(true);
    try {
      const [photosRes, albumsRes] = await Promise.all([
        fetch("/api/admin/photos").then((r) => r.json()),
        fetch("/api/admin/albums").then((r) => r.json()),
      ]);

      let albums = albumsRes.items ?? [];
      const album = await ensureHallAlbum(albums);
      if (!albums.some((a) => a.id === album.id)) {
        albums = [album, ...albums];
      }

      setAlbumId(album.id);
      setAlbumTitle(album.title || HALL_ALBUM_TITLE);
      if (photosRes.items) setPhotos(photosRes.items);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function clearSiteCache() {
    setMsg(null);
    setCacheClearing(true);
    try {
      const res = await fetch("/api/admin/revalidate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Не удалось сбросить кэш");
        return;
      }
      const pages = data.revalidated?.pages?.length ?? 0;
      setMsg(`Кэш сайта сброшен (${pages} страниц)`);
    } finally {
      setCacheClearing(false);
    }
  }

  async function removePhoto(id) {
    if (!window.confirm("Удалить это фото?")) return;
    setMsg(null);
    const res = await fetch("/api/admin/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Ошибка");
      return;
    }
    setMsg("Фото удалено");
    await load();
  }

  async function savePhotoOrder(targetAlbumId, orderedIds, previousPhotos) {
    setPhotoOrderSaving(true);
    try {
      const res = await fetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: targetAlbumId, ids: orderedIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhotos(previousPhotos);
        setMsg(typeof data.error === "string" ? data.error : "Не удалось сохранить порядок фото");
        return;
      }
      if (data.items) setPhotos(data.items);
    } catch {
      setPhotos(previousPhotos);
      setMsg("Не удалось сохранить порядок фото");
    } finally {
      setPhotoOrderSaving(false);
    }
  }

  function reorderPhotosByDrag(fromId, toId, position = "before") {
    if (!albumId || !fromId || fromId === toId || photoOrderSaving) return;
    const inAlbum = hallPhotos;
    const previousPhotos = photos;
    const next = [...inAlbum];
    const fromIndex = next.findIndex((p) => p.id === fromId);
    let insertIndex = next.findIndex((p) => p.id === toId);
    if (fromIndex < 0 || insertIndex < 0) return;

    if (position === "after") insertIndex += 1;
    const [moved] = next.splice(fromIndex, 1);
    if (fromIndex < insertIndex) insertIndex -= 1;
    next.splice(insertIndex, 0, moved);

    const other = photos.filter((p) => p.albumId !== albumId);
    setPhotos([...other, ...next]);
    setPhotoDropTarget(null);
    void savePhotoOrder(
      albumId,
      next.map((p) => p.id),
      previousPhotos
    );
  }

  function handlePhotoDragOver(e, targetId) {
    e.preventDefault();
    if (!dragPhotoId || dragPhotoId === targetId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setPhotoDropTarget({ id: targetId, position });
  }

  function handlePhotoUrlChange(rowId, value) {
    setPhotoUrlRows((rows) => {
      const next = rows.map((r) => (r.id === rowId ? { ...r, value } : r));
      return finalizePhotoUrlRows(next);
    });
  }

  function handlePhotoUrlPaste(e, rowId) {
    const lines = parsePastedPhotoUrls(e.clipboardData.getData("text"));
    if (lines.length === 0) return;

    e.preventDefault();
    let focusId = null;

    setPhotoUrlRows((rows) => {
      const idx = rows.findIndex((r) => r.id === rowId);
      if (idx < 0) return finalizePhotoUrlRows(rows);

      const next = [...rows];
      next[idx] = { ...next[idx], value: lines[0] };
      for (let i = 1; i < lines.length; i++) {
        next.splice(idx + i, 0, createPhotoUrlRow(lines[i]));
      }

      const result = finalizePhotoUrlRows(next);
      focusId = result[result.length - 1]?.id ?? null;
      return result;
    });

    if (focusId) {
      queueMicrotask(() => document.getElementById(focusId)?.focus());
    }
  }

  async function addPhoto(e) {
    e.preventDefault();
    if (photoSaving || !albumId) return;
    setMsg(null);
    const urls = dedupePhotoUrls(photoUrlRows.map((r) => r.value));
    if (urls.length === 0) {
      setMsg("Вставьте ссылку на изображение (https://…)");
      return;
    }

    setPhotoSaving(true);
    try {
      const res = await fetch("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, albumId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Ошибка");
        return;
      }
      const added = data.added ?? 1;
      const errCount = data.errors?.length ?? 0;
      setPhotoUrlRows([createPhotoUrlRow("")]);
      setMsg(
        added === 1
          ? "Фото добавлено"
          : `Добавлено фото: ${added}` + (errCount ? `, пропущено: ${errCount}` : "")
      );
      await load();
    } finally {
      setPhotoSaving(false);
    }
  }

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <p className={styles.kicker}>INSIDE · Панель управления</p>
          <h1 className={styles.title}>Фотографии зала</h1>
          <nav className={styles.siteNav} aria-label="Переходы на сайт">
            <Link href="/">На главную</Link>
            <Link href="/#photos" target="_blank" rel="noopener noreferrer">
              Фото на сайте ↗
            </Link>
          </nav>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => clearSiteCache()}
            disabled={cacheClearing}
            title="Обновить кэшированные страницы сайта после изменений"
          >
            {cacheClearing ? "Сброс кэша…" : "Сбросить кэш"}
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => logout()}>
            Выйти
          </button>
        </div>
      </header>

      {msg ? (
        <p className={`${styles.toast} ${styles.toastSuccess}`} role="status">
          {msg}
        </p>
      ) : null}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Загрузка фото</h2>
        <p className={styles.cardDesc}>
          Фотографии альбома «{albumTitle}» показываются в блоке на главной. Вставьте ссылки на
          изображения (https://…).
        </p>

        {loading ? (
          <p className={styles.emptyHint}>Загрузка…</p>
        ) : (
          <>
            <div className={styles.subsection} style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <h3 className={styles.subsectionTitle}>Добавить фото</h3>
              <p className={styles.hint}>
                Вставьте ссылку в поле — появится следующее. Повторяющиеся ссылки убираются
                автоматически.
              </p>
              <form onSubmit={addPhoto}>
                <div className={styles.field}>
                  <span id="p-src-label" className={styles.fieldLabel}>
                    Ссылки на картинки
                  </span>
                  <div className={styles.photoUrlStack} role="group" aria-labelledby="p-src-label">
                    {photoUrlRows.map((row, index) => (
                      <input
                        key={row.id}
                        id={row.id}
                        type="url"
                        value={row.value}
                        onChange={(e) => handlePhotoUrlChange(row.id, e.target.value)}
                        onPaste={(e) => handlePhotoUrlPaste(e, row.id)}
                        placeholder={index === 0 ? "https://…" : "Вставьте следующую ссылку"}
                        inputMode="url"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>
                <button className={styles.btn} type="submit" disabled={photoSaving || !albumId}>
                  {photoSaving ? "Добавление…" : "Добавить фото"}
                </button>
              </form>
            </div>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>
                Фотографии зала
                {hallPhotos.length > 0 ? ` · ${hallPhotos.length}` : ""}
              </h3>
              {hallPhotos.length > 1 ? (
                <p className={styles.hint}>
                  Схватите за ручку <span className={styles.storyDragHint}>⠿</span> и перетащите —
                  так меняется порядок на сайте.
                  {photoOrderSaving ? " Сохранение порядка…" : ""}
                </p>
              ) : null}
              <ul className={`${styles.list} ${hallPhotos.length > 1 ? styles.storySortList : ""}`}>
                {hallPhotos.map((x, index) => {
                  const dropBefore =
                    photoDropTarget?.id === x.id && photoDropTarget.position === "before";
                  const dropAfter =
                    photoDropTarget?.id === x.id && photoDropTarget.position === "after";
                  return (
                    <li
                      key={x.id}
                      className={[
                        hallPhotos.length > 1 ? styles.storySortItem : "",
                        dragPhotoId === x.id ? styles.storySortItemDragging : "",
                        dropBefore ? styles.storySortItemDropBefore : "",
                        dropAfter ? styles.storySortItemDropAfter : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onDragOver={
                        hallPhotos.length > 1 ? (e) => handlePhotoDragOver(e, x.id) : undefined
                      }
                      onDragLeave={
                        hallPhotos.length > 1
                          ? (e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setPhotoDropTarget((prev) => (prev?.id === x.id ? null : prev));
                              }
                            }
                          : undefined
                      }
                      onDrop={
                        hallPhotos.length > 1
                          ? (e) => {
                              e.preventDefault();
                              if (dragPhotoId) {
                                reorderPhotosByDrag(
                                  dragPhotoId,
                                  x.id,
                                  photoDropTarget?.id === x.id
                                    ? photoDropTarget.position
                                    : "before"
                                );
                              }
                              setDragPhotoId(null);
                              setPhotoDropTarget(null);
                            }
                          : undefined
                      }
                    >
                      <div className={styles.listRow}>
                        {hallPhotos.length > 1 ? (
                          <button
                            type="button"
                            className={styles.storyDragHandle}
                            style={{ minHeight: 56 }}
                            draggable={!photoOrderSaving}
                            disabled={photoOrderSaving}
                            aria-label={`Перетащить фото, позиция ${index + 1}`}
                            onDragStart={(e) => {
                              setDragPhotoId(x.id);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", x.id);
                              const row = e.currentTarget.closest("li");
                              if (row) e.dataTransfer.setDragImage(row, 48, 28);
                            }}
                            onDragEnd={() => {
                              setDragPhotoId(null);
                              setPhotoDropTarget(null);
                            }}
                          >
                            <span className={styles.storySortIndex}>{index + 1}</span>
                            <span className={styles.storyDragGrip} aria-hidden>
                              ⠿
                            </span>
                          </button>
                        ) : null}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={x.src} alt="" className={styles.thumb} />
                        <div className={styles.listBody}>
                          <div className={styles.listMeta}>{x.src}</div>
                        </div>
                        <div className={styles.listActions}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            onClick={() => removePhoto(x.id)}
                            disabled={photoOrderSaving}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {hallPhotos.length === 0 ? (
                <p className={styles.emptyHint}>Пока нет фотографий зала.</p>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
