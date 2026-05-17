"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sortPhotosItems } from "@/lib/gallery-order";
import {
  createPhotoUrlRow,
  dedupePhotoUrls,
  finalizePhotoUrlRows,
  parsePastedPhotoUrls,
} from "@/lib/photo-url-rows";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import styles from "./admin.module.scss";

export default function AdminHomePage() {
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [stories, setStories] = useState([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [photoUrlRows, setPhotoUrlRows] = useState(() => [createPhotoUrlRow("")]);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [albumId, setAlbumId] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyVideoUrl, setStoryVideoUrl] = useState("");
  const storyVideoInputRef = useRef(null);
  const [storySaving, setStorySaving] = useState(false);
  const [storyUploadProgress, setStoryUploadProgress] = useState(null);
  const [dragStoryId, setDragStoryId] = useState(null);
  const [storyDropTarget, setStoryDropTarget] = useState(null);
  const [storyOrderSaving, setStoryOrderSaving] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [activeTab, setActiveTab] = useState("news");
  const [msg, setMsg] = useState(null);
  const [vkItems, setVkItems] = useState([]);
  const [vkSelected, setVkSelected] = useState(() => new Set());
  const [vkOffset, setVkOffset] = useState(0);
  const [vkHasMore, setVkHasMore] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);
  const [vkImporting, setVkImporting] = useState(false);
  const [dragAlbumId, setDragAlbumId] = useState(null);
  const [albumDropTarget, setAlbumDropTarget] = useState(null);
  const [albumOrderSaving, setAlbumOrderSaving] = useState(false);
  const [dragPhotoId, setDragPhotoId] = useState(null);
  const [photoDropTarget, setPhotoDropTarget] = useState(null);
  const [photoOrderSaving, setPhotoOrderSaving] = useState(false);

  const photosInAlbum = useMemo(() => {
    if (!albumId) return [];
    return sortPhotosItems(photos.filter((p) => p.albumId === albumId));
  }, [photos, albumId]);

  async function load() {
    const [n, p, a, s] = await Promise.all([
      fetch("/api/admin/news").then((r) => r.json()),
      fetch("/api/admin/photos").then((r) => r.json()),
      fetch("/api/admin/albums").then((r) => r.json()),
      fetch("/api/admin/stories").then((r) => r.json()),
    ]);
    if (n.items) setNews(n.items);
    if (p.items) setPhotos(p.items);
    if (a.items) {
      setAlbums(a.items);
      setAlbumId((prev) => prev || a.items[0]?.id || "");
    }
    if (s.items) setStories(s.items);
  }

  useEffect(() => {
    void load();
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function resetNewsForm() {
    setEditingNewsId(null);
    setTitle("");
    setExcerpt("");
    setBody("");
    setNewsImageUrl("");
  }

  function startEditNews(item) {
    setActiveTab("news");
    setEditingNewsId(item.id);
    setTitle(item.title);
    setExcerpt(item.excerpt);
    setBody(item.body);
    setNewsImageUrl(item.images?.[0] ?? "");
    setMsg(null);
  }

  function resetVkPreview() {
    setVkItems([]);
    setVkSelected(new Set());
    setVkOffset(0);
    setVkHasMore(false);
  }

  function resetStoryForm() {
    setEditingStoryId(null);
    setStoryTitle("");
    setStoryVideoUrl("");
    if (storyVideoInputRef.current) storyVideoInputRef.current.value = "";
  }

  function startEditStory(item) {
    setEditingStoryId(item.id);
    setStoryTitle(item.title);
    setStoryVideoUrl(item.videoUrl);
    setMsg(null);
    if (storyVideoInputRef.current) storyVideoInputRef.current.value = "";
  }

  function switchTab(id) {
    if (activeTab === "news" && id !== "news" && editingNewsId) {
      resetNewsForm();
    }
    if (activeTab === "stories" && id !== "stories" && editingStoryId) {
      resetStoryForm();
    }
    if (id !== activeTab) {
      resetVkPreview();
    }
    setActiveTab(id);
  }

  async function saveNews(e) {
    e.preventDefault();
    setMsg(null);
    const payload = { title, excerpt, body, imageUrl: newsImageUrl };
    const res = await fetch("/api/admin/news", {
      method: editingNewsId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingNewsId ? { id: editingNewsId, ...payload } : payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Ошибка");
      return;
    }
    const wasEditing = Boolean(editingNewsId);
    resetNewsForm();
    setMsg(wasEditing ? "Новость обновлена" : "Новость добавлена");
    await load();
  }

  async function removeNews(id, newsTitle) {
    if (!window.confirm(`Удалить новость «${newsTitle}»?`)) return;
    setMsg(null);
    const res = await fetch("/api/admin/news", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Ошибка");
      return;
    }
    if (editingNewsId === id) resetNewsForm();
    setMsg("Новость удалена");
    await load();
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

  async function saveStoryOrder(orderedIds, previousStories) {
    setStoryOrderSaving(true);
    try {
      const res = await fetch("/api/admin/stories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: orderedIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStories(previousStories);
        setMsg(typeof data.error === "string" ? data.error : "Не удалось сохранить порядок");
        return;
      }
      if (data.items) setStories(data.items);
    } catch {
      setStories(previousStories);
      setMsg("Не удалось сохранить порядок");
    } finally {
      setStoryOrderSaving(false);
    }
  }

  function reorderStoriesByDrag(fromId, toId, position = "before") {
    if (!fromId || fromId === toId || storyOrderSaving) return;
    const previousStories = stories;
    const next = [...stories];
    const fromIndex = next.findIndex((s) => s.id === fromId);
    let insertIndex = next.findIndex((s) => s.id === toId);
    if (fromIndex < 0 || insertIndex < 0) return;

    if (position === "after") insertIndex += 1;
    const [moved] = next.splice(fromIndex, 1);
    if (fromIndex < insertIndex) insertIndex -= 1;
    next.splice(insertIndex, 0, moved);
    setStories(next);
    setStoryDropTarget(null);
    void saveStoryOrder(
      next.map((s) => s.id),
      previousStories
    );
  }

  function handleStoryDragOver(e, targetId) {
    e.preventDefault();
    if (!dragStoryId || dragStoryId === targetId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setStoryDropTarget({ id: targetId, position });
  }

  async function saveAlbumOrder(orderedIds, previousAlbums) {
    setAlbumOrderSaving(true);
    try {
      const res = await fetch("/api/admin/albums", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: orderedIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAlbums(previousAlbums);
        setMsg(typeof data.error === "string" ? data.error : "Не удалось сохранить порядок альбомов");
        return;
      }
      if (data.items) setAlbums(data.items);
    } catch {
      setAlbums(previousAlbums);
      setMsg("Не удалось сохранить порядок альбомов");
    } finally {
      setAlbumOrderSaving(false);
    }
  }

  function reorderAlbumsByDrag(fromId, toId, position = "before") {
    if (!fromId || fromId === toId || albumOrderSaving) return;
    const previousAlbums = albums;
    const next = [...albums];
    const fromIndex = next.findIndex((a) => a.id === fromId);
    let insertIndex = next.findIndex((a) => a.id === toId);
    if (fromIndex < 0 || insertIndex < 0) return;

    if (position === "after") insertIndex += 1;
    const [moved] = next.splice(fromIndex, 1);
    if (fromIndex < insertIndex) insertIndex -= 1;
    next.splice(insertIndex, 0, moved);
    setAlbums(next);
    setAlbumDropTarget(null);
    void saveAlbumOrder(
      next.map((a) => a.id),
      previousAlbums
    );
  }

  function handleAlbumDragOver(e, targetId) {
    e.preventDefault();
    if (!dragAlbumId || dragAlbumId === targetId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setAlbumDropTarget({ id: targetId, position });
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
    const inAlbum = photosInAlbum;
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

  async function removeStory(id, storyLabel) {
    if (!window.confirm(`Удалить сторис «${storyLabel}»?`)) return;
    if (editingStoryId === id) resetStoryForm();
    setMsg(null);
    const res = await fetch("/api/admin/stories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Ошибка");
      return;
    }
    setMsg("Сторис удалён");
    await load();
  }

  async function addAlbum(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: albumTitle }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Ошибка");
      return;
    }
    setAlbumTitle("");
    setMsg("Альбом добавлен");
    await load();
  }

  async function removeAlbum(id, title) {
    if (
      !window.confirm(
        `Удалить альбом «${title}»? Все фотографии в этом альбоме тоже будут удалены.`
      )
    ) {
      return;
    }
    setMsg(null);
    const res = await fetch("/api/admin/albums", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Ошибка");
      return;
    }
    setMsg("Альбом удалён");
    await load();
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
    if (photoSaving) return;
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

  async function loadVkPreview(append = false) {
    setMsg(null);
    setVkLoading(true);
    try {
      const offset = append ? vkOffset : 0;
      const res = await fetch(`/api/admin/vk?type=news&offset=${offset}&count=20`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Ошибка загрузки из VK");
        return;
      }
      const next = data.items ?? [];
      setVkItems(append ? (prev) => [...prev, ...next] : next);
      setVkOffset(data.nextOffset ?? offset + next.length);
      setVkHasMore(Boolean(data.hasMore));
      setVkSelected(new Set());
    } finally {
      setVkLoading(false);
    }
  }

  function toggleVkItem(vkId, disabled) {
    if (disabled) return;
    setVkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(vkId)) next.delete(vkId);
      else next.add(vkId);
      return next;
    });
  }

  function selectAllVk() {
    const ids = vkItems.filter((x) => !x.imported).map((x) => x.vkId);
    setVkSelected(new Set(ids));
  }

  async function importFromVk() {
    const selected = vkItems.filter((x) => vkSelected.has(x.vkId));
    if (selected.length === 0) {
      setMsg("Отметьте элементы для импорта");
      return;
    }
    setMsg(null);
    setVkImporting(true);
    try {
      const res = await fetch("/api/admin/vk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "news",
          items: selected,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Ошибка импорта");
        return;
      }
      const errCount = data.errors?.length ?? 0;
      setMsg(
        `Импортировано: ${data.imported ?? 0}, пропущено (уже были): ${data.skipped ?? 0}` +
          (errCount ? `, ошибок: ${errCount}` : "")
      );
      setVkSelected(new Set());
      await load();
      await loadVkPreview(false);
    } finally {
      setVkImporting(false);
    }
  }

  async function saveStory(e) {
    e.preventDefault();
    setMsg(null);
    const file = storyVideoInputRef.current?.files?.[0];
    const url = storyVideoUrl.trim();
    const isEditing = Boolean(editingStoryId);

    if (!isEditing && !file && !url) {
      setMsg("Выберите видеофайл или укажите прямую ссылку");
      return;
    }

    setStorySaving(true);
    setStoryUploadProgress(null);
    try {
      const currentStory = isEditing ? stories.find((s) => s.id === editingStoryId) : null;
      let videoUrl;
      if (file) {
        setStoryUploadProgress(0);
        const pathname = `stories/${Date.now()}-${file.name.replace(/[^\w.\-()а-яА-ЯёЁ ]+/gu, "_")}`;
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/admin/stories/upload",
          multipart: file.size > 4.5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setStoryUploadProgress(percentage),
        });
        videoUrl = blob.url;
      } else if (url && (!isEditing || url !== currentStory?.videoUrl)) {
        videoUrl = url;
      }

      const res = await fetch("/api/admin/stories", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? {
                id: editingStoryId,
                title: storyTitle,
                ...(videoUrl != null ? { videoUrl } : {}),
              }
            : { title: storyTitle, videoUrl }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Ошибка сохранения");
        return;
      }
      resetStoryForm();
      setMsg(isEditing ? "Сторис обновлён" : "Сторис добавлен");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Ошибка загрузки видео");
    } finally {
      setStorySaving(false);
      setStoryUploadProgress(null);
    }
  }

  return (
    <div className={styles.inner}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>Админка</h1>
          <nav className={styles.siteNav} aria-label="Переходы на сайт">
            <Link href="/">На главную</Link>
            {activeTab === "news" ? (
              <Link href="/news" target="_blank" rel="noopener noreferrer">
                Раздел «Новости»
              </Link>
            ) : null}
            {activeTab === "photos" ? (
              <Link href="/gallery" target="_blank" rel="noopener noreferrer">
                Раздел «Галерея»
              </Link>
            ) : null}
          </nav>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => logout()}>
          Выйти
        </button>
      </div>
      {msg ? <p className={styles.muted}>{msg}</p> : null}

      <div className={styles.mainTabs} role="tablist" aria-label="Разделы админки">
        {[
          ["news", "Новости"],
          ["photos", "Фото"],
          ["stories", "Сторис"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? styles.mainTabActive : styles.mainTab}
            onClick={() => switchTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "news" ? (
      <section className={styles.card}>
        <h2>Импорт из VK</h2>
        <p className={styles.vkImportHint}>
          Импорт постов как новостей из сообщества{" "}
          <a href="https://vk.com/inside_dance72" target="_blank" rel="noopener noreferrer">
            vk.com/inside_dance72
          </a>
        </p>
        <div className={styles.vkActions}>
          <button
            type="button"
            className={styles.btn}
            disabled={vkLoading}
            onClick={() => loadVkPreview(false)}
          >
            {vkLoading ? "Загрузка…" : "Показать из VK"}
          </button>
          {vkItems.length > 0 ? (
            <>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={selectAllVk}>
                Выбрать все новые
              </button>
              <button
                type="button"
                className={styles.btn}
                disabled={vkImporting || vkSelected.size === 0}
                onClick={importFromVk}
              >
                {vkImporting ? "Импорт…" : `Импортировать (${vkSelected.size})`}
              </button>
            </>
          ) : null}
        </div>
        {vkItems.length > 0 ? (
          <ul className={styles.vkList}>
            {vkItems.map((item) => {
              const checked = vkSelected.has(item.vkId);
              const disabled = item.imported;
              return (
                <li key={item.vkId} className={disabled ? styles.vkItemImported : undefined}>
                  <label className={styles.vkItemLabel}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleVkItem(item.vkId, disabled)}
                    />
                    {item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt="" className={styles.vkThumb} />
                    ) : (
                      <span className={styles.vkThumbPlaceholder} aria-hidden />
                    )}
                    <span className={styles.vkItemText}>
                      <strong>
                        {item.title || item.caption || item.vkId}
                        {disabled ? " (уже на сайте)" : ""}
                      </strong>
                      {item.excerpt ? <span className={styles.muted}>{item.excerpt}</span> : null}
                      {item.date ? (
                        <span className={styles.muted}>
                          {new Date(item.date).toLocaleString("ru-RU")}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : null}
        {vkHasMore ? (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ marginTop: "1rem" }}
            disabled={vkLoading}
            onClick={() => loadVkPreview(true)}
          >
            Загрузить ещё
          </button>
        ) : null}
      </section>
      ) : null}

      {activeTab === "news" ? (
      <section className={styles.card}>
        <h2>{editingNewsId ? "Редактирование новости" : "Новая новость"}</h2>
        <form onSubmit={saveNews}>
          <div className={styles.field}>
            <label htmlFor="n-title">Заголовок</label>
            <input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="n-excerpt">Кратко (для списка и SEO)</label>
            <input id="n-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="n-image">Ссылка на фотографию</label>
            <input
              id="n-image"
              type="url"
              inputMode="url"
              value={newsImageUrl}
              onChange={(e) => setNewsImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="n-body">Текст</label>
            <textarea id="n-body" value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button className={styles.btn} type="submit">
              {editingNewsId ? "Сохранить" : "Добавить новость"}
            </button>
            {editingNewsId ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ marginLeft: 0 }}
                onClick={resetNewsForm}
              >
                Отмена
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.subsection}>
          <h3>Последние новости</h3>
          <ul className={styles.list}>
            {news.map((x) => (
              <li key={x.id}>
                <div className={styles.listRow}>
                  <div>
                    {x.title}
                    <div className={styles.muted}>{new Date(x.createdAt).toLocaleString("ru-RU")}</div>
                  </div>
                  <div className={styles.listActions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                      style={{ marginLeft: 0 }}
                      onClick={() => startEditNews(x)}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                      onClick={() => removeNews(x.id, x.title)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      ) : null}

      {activeTab === "photos" ? (
      <section className={styles.card}>
        <h2>Фотографии</h2>

        <div className={styles.subsection}>
          <h3>Альбомы</h3>
          <form onSubmit={addAlbum}>
          <div className={styles.field}>
            <label htmlFor="alb-title">Название альбома</label>
            <input
              id="alb-title"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              required
              placeholder="Например: Отчётный концерт 2026"
            />
          </div>
          <button className={styles.btn} type="submit">
            Добавить альбом
          </button>
        </form>
        {albums.length > 1 ? (
          <p className={styles.muted} style={{ marginTop: "1.25rem", marginBottom: 0 }}>
            Схватите элемент за ручку <span className={styles.storyDragHint}>⠿</span> и перетащите.
            Порядок альбомов совпадает с вкладками на странице «Галерея».
            {albumOrderSaving ? " Сохранение порядка…" : ""}
          </p>
        ) : null}
        <ul
          className={`${styles.list} ${albums.length > 1 ? styles.storySortList : ""}`}
          style={{ marginTop: albums.length > 1 ? "0.75rem" : "1.5rem" }}
        >
          {albums.map((alb, index) => {
            const count = photos.filter((p) => p.albumId === alb.id).length;
            const dropBefore =
              albumDropTarget?.id === alb.id && albumDropTarget.position === "before";
            const dropAfter =
              albumDropTarget?.id === alb.id && albumDropTarget.position === "after";
            return (
              <li
                key={alb.id}
                className={[
                  albums.length > 1 ? styles.storySortItem : "",
                  dragAlbumId === alb.id ? styles.storySortItemDragging : "",
                  dropBefore ? styles.storySortItemDropBefore : "",
                  dropAfter ? styles.storySortItemDropAfter : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={albums.length > 1 ? (e) => handleAlbumDragOver(e, alb.id) : undefined}
                onDragLeave={
                  albums.length > 1
                    ? (e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setAlbumDropTarget((prev) => (prev?.id === alb.id ? null : prev));
                        }
                      }
                    : undefined
                }
                onDrop={
                  albums.length > 1
                    ? (e) => {
                        e.preventDefault();
                        if (dragAlbumId) {
                          reorderAlbumsByDrag(
                            dragAlbumId,
                            alb.id,
                            albumDropTarget?.id === alb.id ? albumDropTarget.position : "before"
                          );
                        }
                        setDragAlbumId(null);
                        setAlbumDropTarget(null);
                      }
                    : undefined
                }
              >
                <div className={styles.listRow}>
                  {albums.length > 1 ? (
                    <button
                      type="button"
                      className={styles.storyDragHandle}
                      style={{ minHeight: 56 }}
                      draggable={!albumOrderSaving}
                      disabled={albumOrderSaving}
                      aria-label={`Перетащить альбом «${alb.title}», позиция ${index + 1}`}
                      onDragStart={(e) => {
                        setDragAlbumId(alb.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", alb.id);
                        const row = e.currentTarget.closest("li");
                        if (row) e.dataTransfer.setDragImage(row, 48, 28);
                      }}
                      onDragEnd={() => {
                        setDragAlbumId(null);
                        setAlbumDropTarget(null);
                      }}
                    >
                      <span className={styles.storySortIndex}>{index + 1}</span>
                      <span className={styles.storyDragGrip} aria-hidden>
                        ⠿
                      </span>
                    </button>
                  ) : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {alb.title}
                    <div className={styles.muted}>
                      {count} фото · {new Date(alb.createdAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  {albums.length > 1 ? (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                      onClick={() => removeAlbum(alb.id, alb.title)}
                      disabled={albumOrderSaving}
                    >
                      Удалить
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        </div>

        <div className={styles.subsection}>
          <h3>Добавить фото</h3>
        <p className={styles.muted} style={{ marginTop: 0 }}>
          Вставьте ссылку (https://…) в поле — появится следующее. Повторяющиеся ссылки убираются автоматически.
        </p>
        <form onSubmit={addPhoto}>
          <div className={styles.field}>
            <label htmlFor="p-album">Альбом</label>
            <select
              id="p-album"
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
              required
            >
              {albums.map((alb) => (
                <option key={alb.id} value={alb.id}>
                  {alb.title}
                </option>
              ))}
            </select>
          </div>
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
          <button className={styles.btn} type="submit" disabled={photoSaving}>
            {photoSaving ? "Добавление…" : "Добавить фото"}
          </button>
        </form>
        </div>

        <div className={styles.subsection}>
          <h3>Фотографии в альбоме</h3>
          {photosInAlbum.length > 1 ? (
            <p className={styles.muted} style={{ marginTop: 0 }}>
              Схватите за ручку <span className={styles.storyDragHint}>⠿</span> и перетащите. Порядок
              совпадает с каруселью на сайте. Альбом выбирается в форме выше.
              {photoOrderSaving ? " Сохранение порядка…" : ""}
            </p>
          ) : null}
          <ul className={`${styles.list} ${photosInAlbum.length > 1 ? styles.storySortList : ""}`}>
            {photosInAlbum.map((x, index) => {
              const dropBefore =
                photoDropTarget?.id === x.id && photoDropTarget.position === "before";
              const dropAfter =
                photoDropTarget?.id === x.id && photoDropTarget.position === "after";
              return (
                <li
                  key={x.id}
                  className={[
                    photosInAlbum.length > 1 ? styles.storySortItem : "",
                    dragPhotoId === x.id ? styles.storySortItemDragging : "",
                    dropBefore ? styles.storySortItemDropBefore : "",
                    dropAfter ? styles.storySortItemDropAfter : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragOver={
                    photosInAlbum.length > 1 ? (e) => handlePhotoDragOver(e, x.id) : undefined
                  }
                  onDragLeave={
                    photosInAlbum.length > 1
                      ? (e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            setPhotoDropTarget((prev) => (prev?.id === x.id ? null : prev));
                          }
                        }
                      : undefined
                  }
                  onDrop={
                    photosInAlbum.length > 1
                      ? (e) => {
                          e.preventDefault();
                          if (dragPhotoId) {
                            reorderPhotosByDrag(
                              dragPhotoId,
                              x.id,
                              photoDropTarget?.id === x.id ? photoDropTarget.position : "before"
                            );
                          }
                          setDragPhotoId(null);
                          setPhotoDropTarget(null);
                        }
                      : undefined
                  }
                >
                  <div className={styles.listRow}>
                    {photosInAlbum.length > 1 ? (
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
                    <img
                      src={x.src}
                      alt=""
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 8,
                        flexShrink: 0,
                        background: "#262626",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.muted}>{x.src}</div>
                    </div>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                      onClick={() => removePhoto(x.id)}
                      disabled={photoOrderSaving}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {photosInAlbum.length === 0 ? (
            <p className={styles.muted}>В этом альбоме пока нет фотографий.</p>
          ) : null}        </div>
      </section>
      ) : null}

      {activeTab === "stories" ? (
      <section className={styles.card}>
        <h2>{editingStoryId ? "Редактирование сторис" : "Новый сторис"}</h2>
        <p className={styles.muted} style={{ marginTop: 0 }}>
          {editingStoryId
            ? "Измените подпись или замените видео (новый файл или URL). Если видео не трогать — останется текущее."
            : "Загрузите видео с компьютера (MP4, WebM, MOV — до 100 МБ) или вставьте прямую ссылку (https). Достаточно одного способа; при выборе файла ссылка игнорируется."}
        </p>
        <form onSubmit={saveStory}>
          <div className={styles.field}>
            <label htmlFor="st-file">Видеофайл{editingStoryId ? " (заменить)" : ""}</label>
            <input
              id="st-file"
              ref={storyVideoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              disabled={storySaving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="st-url">URL видео{editingStoryId ? " (заменить)" : ""}</label>
            <input
              id="st-url"
              type="url"
              value={storyVideoUrl}
              onChange={(e) => setStoryVideoUrl(e.target.value)}
              disabled={storySaving}
              placeholder="https://…"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="st-title">Подпись на главной</label>
            <input
              id="st-title"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="Например: Пробный урок"
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button className={styles.btn} type="submit" disabled={storySaving}>
              {storySaving
                ? storyUploadProgress != null
                  ? `Загрузка ${Math.round(storyUploadProgress)}%…`
                  : "Сохранение…"
                : editingStoryId
                  ? "Сохранить"
                  : "Добавить сторис"}
            </button>
            {editingStoryId ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ marginLeft: 0 }}
                onClick={resetStoryForm}
                disabled={storySaving}
              >
                Отмена
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.subsection}>
          <h3>Загруженные сторис</h3>
          {stories.length > 1 ? (
            <p className={styles.muted} style={{ marginTop: 0 }}>
              Схватите элемент за ручку <span className={styles.storyDragHint}>⠿</span> и перетащите.
              Порядок в списке совпадает с главной (слева направо).
              {storyOrderSaving ? " Сохранение порядка…" : ""}
            </p>
          ) : null}
          <ul className={`${styles.list} ${styles.storySortList}`}>
            {stories.map((x, index) => {
              const dropBefore =
                storyDropTarget?.id === x.id && storyDropTarget.position === "before";
              const dropAfter =
                storyDropTarget?.id === x.id && storyDropTarget.position === "after";
              return (
                <li
                  key={x.id}
                  className={[
                    styles.storySortItem,
                    dragStoryId === x.id ? styles.storySortItemDragging : "",
                    editingStoryId === x.id ? styles.storySortItemEditing : "",
                    dropBefore ? styles.storySortItemDropBefore : "",
                    dropAfter ? styles.storySortItemDropAfter : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragOver={(e) => handleStoryDragOver(e, x.id)}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setStoryDropTarget((prev) => (prev?.id === x.id ? null : prev));
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragStoryId) {
                      reorderStoriesByDrag(
                        dragStoryId,
                        x.id,
                        storyDropTarget?.id === x.id ? storyDropTarget.position : "before"
                      );
                    }
                    setDragStoryId(null);
                    setStoryDropTarget(null);
                  }}
                >
                  <div className={styles.listRow}>
                    <div className={styles.storySortMain}>
                      <button
                        type="button"
                        className={styles.storyDragHandle}
                        draggable={!storyOrderSaving && !editingStoryId}
                        disabled={storyOrderSaving}
                        aria-label={`Перетащить сторис «${x.title}», позиция ${index + 1}`}
                        onDragStart={(e) => {
                          setDragStoryId(x.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", x.id);
                          const row = e.currentTarget.closest("li");
                          if (row) e.dataTransfer.setDragImage(row, 48, 48);
                        }}
                        onDragEnd={() => {
                          setDragStoryId(null);
                          setStoryDropTarget(null);
                        }}
                      >
                        <span className={styles.storySortIndex}>{index + 1}</span>
                        <span className={styles.storyDragGrip} aria-hidden>
                          ⠿
                        </span>
                      </button>
                    <video
                      src={x.videoUrl}
                      muted
                      playsInline
                      preload="metadata"
                      referrerPolicy="no-referrer"
                      style={{
                        width: 56,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 8,
                        flexShrink: 0,
                        background: "#000",
                      }}
                    />
                    <div>
                      {x.title}
                      <div className={styles.muted}>{x.videoUrl}</div>
                      <div className={styles.muted}>{new Date(x.createdAt).toLocaleString("ru-RU")}</div>
                    </div>
                    </div>
                    <div className={styles.listActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                        style={{ marginLeft: 0 }}
                        onClick={() => startEditStory(x)}
                        disabled={storyOrderSaving || storySaving}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                        onClick={() => removeStory(x.id, x.title)}
                        disabled={storyOrderSaving || storySaving}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      ) : null}
    </div>
  );
}
