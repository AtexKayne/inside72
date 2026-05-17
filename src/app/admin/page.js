"use client";

import { useEffect, useRef, useState } from "react";
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
  const [albumTitle, setAlbumTitle] = useState("");
  const [src, setSrc] = useState("");
  const [caption, setCaption] = useState("");
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
  const [vkAlbums, setVkAlbums] = useState([]);
  const [vkAlbumsLoading, setVkAlbumsLoading] = useState(false);
  const [vkActiveVkAlbumId, setVkActiveVkAlbumId] = useState(null);
  const [vkPhotoItems, setVkPhotoItems] = useState([]);
  const [vkPhotoSelected, setVkPhotoSelected] = useState(() => new Set());
  const [vkPhotoOffset, setVkPhotoOffset] = useState(0);
  const [vkPhotoHasMore, setVkPhotoHasMore] = useState(false);
  const [vkPhotoLoading, setVkPhotoLoading] = useState(false);
  const [vkPhotoImporting, setVkPhotoImporting] = useState(false);

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
  }

  function startEditNews(item) {
    setActiveTab("news");
    setEditingNewsId(item.id);
    setTitle(item.title);
    setExcerpt(item.excerpt);
    setBody(item.body);
    setMsg(null);
  }

  function resetVkPreview() {
    setVkItems([]);
    setVkSelected(new Set());
    setVkOffset(0);
    setVkHasMore(false);
  }

  function resetVkAlbumImport() {
    setVkAlbums([]);
    setVkActiveVkAlbumId(null);
    setVkPhotoItems([]);
    setVkPhotoSelected(new Set());
    setVkPhotoOffset(0);
    setVkPhotoHasMore(false);
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
      resetVkAlbumImport();
    }
    setActiveTab(id);
  }

  async function saveNews(e) {
    e.preventDefault();
    setMsg(null);
    const payload = { title, excerpt, body };
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

  async function removePhoto(id, photoCaption) {
    if (!window.confirm(`Удалить фото «${photoCaption}»?`)) return;
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

  async function addPhoto(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src, caption, albumId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Ошибка");
      return;
    }
    setSrc("");
    setCaption("");
    setMsg("Фото добавлено");
    await load();
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

  async function loadVkAlbums() {
    setMsg(null);
    setVkAlbumsLoading(true);
    try {
      const res = await fetch("/api/admin/vk?type=albums");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Ошибка загрузки альбомов VK");
        return;
      }
      const list = data.items ?? [];
      setVkAlbums(list);
      setVkPhotoItems([]);
      setVkPhotoSelected(new Set());
      setVkPhotoOffset(0);
      setVkPhotoHasMore(false);
      if (list.length === 0) {
        setVkActiveVkAlbumId(null);
        setMsg("В VK нет доступных альбомов");
        return;
      }
      const firstId = list[0].vkAlbumId;
      setVkActiveVkAlbumId(firstId);
      await loadVkAlbumPhotos(false, firstId);
    } finally {
      setVkAlbumsLoading(false);
    }
  }

  async function loadVkAlbumPhotos(append = false, vkAlbumId = vkActiveVkAlbumId) {
    if (!vkAlbumId) return;
    setMsg(null);
    setVkPhotoLoading(true);
    try {
      const offset = append ? vkPhotoOffset : 0;
      const res = await fetch(
        `/api/admin/vk?type=album-photos&vkAlbumId=${encodeURIComponent(vkAlbumId)}&offset=${offset}&count=50`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Ошибка загрузки фото из VK");
        return;
      }
      const next = data.items ?? [];
      setVkPhotoItems(append ? (prev) => [...prev, ...next] : next);
      setVkPhotoOffset(data.nextOffset ?? offset + next.length);
      setVkPhotoHasMore(Boolean(data.hasMore));
      if (!append) setVkPhotoSelected(new Set());
    } finally {
      setVkPhotoLoading(false);
    }
  }

  async function selectVkAlbum(vkAlbumId) {
    if (vkAlbumId === vkActiveVkAlbumId) return;
    setVkActiveVkAlbumId(vkAlbumId);
    setVkPhotoItems([]);
    setVkPhotoSelected(new Set());
    setVkPhotoOffset(0);
    setVkPhotoHasMore(false);
    await loadVkAlbumPhotos(false, vkAlbumId);
  }

  function toggleVkPhotoItem(vkId, disabled) {
    if (disabled) return;
    setVkPhotoSelected((prev) => {
      const next = new Set(prev);
      if (next.has(vkId)) next.delete(vkId);
      else next.add(vkId);
      return next;
    });
  }

  function selectAllVkPhotos() {
    const ids = vkPhotoItems.filter((x) => !x.imported).map((x) => x.vkId);
    setVkPhotoSelected(new Set(ids));
  }

  async function importVkAlbumPhotos() {
    const selected = vkPhotoItems.filter((x) => vkPhotoSelected.has(x.vkId));
    if (selected.length === 0) {
      setMsg("Отметьте фото для импорта");
      return;
    }
    if (!albumId) {
      setMsg("Выберите альбом на сайте, куда добавить фото");
      return;
    }
    setMsg(null);
    setVkPhotoImporting(true);
    try {
      const res = await fetch("/api/admin/vk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "photos",
          albumId,
          items: selected.map((x) => ({
            vkId: x.vkId,
            src: x.src,
            caption: x.caption,
            date: x.date,
          })),
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
      setVkPhotoSelected(new Set());
      await load();
      if (vkActiveVkAlbumId) {
        await loadVkAlbumPhotos(false, vkActiveVkAlbumId);
      }
    } finally {
      setVkPhotoImporting(false);
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <h1 className={styles.title} style={{ margin: 0 }}>
          Админка
        </h1>
        <div>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => logout()}>
            Выйти
          </button>
        </div>
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
          <h3>Импорт из VK</h3>
          <p className={styles.vkImportHint}>
            Альбомы сообщества{" "}
            <a href="https://vk.com/albums-222803928" target="_blank" rel="noopener noreferrer">
              vk.com/albums-222803928
            </a>
            . Нужен пользовательский токен <code>VK_USER_TOKEN</code> в .env (права{" "}
            <code>photos</code>).
          </p>
          <div className={styles.field}>
            <label htmlFor="vk-import-album">Альбом на сайте для импорта</label>
            <select
              id="vk-import-album"
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
          <div className={styles.vkActions}>
            <button
              type="button"
              className={styles.btn}
              disabled={vkAlbumsLoading || vkPhotoLoading}
              onClick={() => loadVkAlbums()}
            >
              {vkAlbumsLoading ? "Загрузка альбомов…" : "Загрузить альбомы VK"}
            </button>
            {vkPhotoItems.length > 0 ? (
              <>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={selectAllVkPhotos}
                >
                  Выбрать все новые
                </button>
                <button
                  type="button"
                  className={styles.btn}
                  disabled={vkPhotoImporting || vkPhotoSelected.size === 0}
                  onClick={() => importVkAlbumPhotos()}
                >
                  {vkPhotoImporting ? "Импорт…" : `Импортировать (${vkPhotoSelected.size})`}
                </button>
              </>
            ) : null}
          </div>
          {vkAlbums.length > 0 ? (
            <div className={styles.vkTabs} role="tablist" aria-label="Альбомы VK">
              {vkAlbums.map((alb) => (
                <button
                  key={alb.vkAlbumId}
                  type="button"
                  role="tab"
                  aria-selected={vkActiveVkAlbumId === alb.vkAlbumId}
                  className={vkActiveVkAlbumId === alb.vkAlbumId ? styles.vkTabActive : styles.vkTab}
                  onClick={() => selectVkAlbum(alb.vkAlbumId)}
                >
                  {alb.title}
                  <span className={styles.muted}> ({alb.size})</span>
                </button>
              ))}
            </div>
          ) : null}
          {vkPhotoItems.length > 0 ? (
            <ul className={styles.vkList}>
              {vkPhotoItems.map((item) => {
                const checked = vkPhotoSelected.has(item.vkId);
                const disabled = item.imported;
                return (
                  <li key={item.vkId} className={disabled ? styles.vkItemImported : undefined}>
                    <label className={styles.vkItemLabel}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleVkPhotoItem(item.vkId, disabled)}
                      />
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.previewUrl} alt="" className={styles.vkThumb} />
                      ) : (
                        <span className={styles.vkThumbPlaceholder} aria-hidden />
                      )}
                      <span className={styles.vkItemText}>
                        <strong>
                          {item.caption || item.vkId}
                          {disabled ? " (уже на сайте)" : ""}
                        </strong>
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
          {vkPhotoHasMore ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              style={{ marginTop: "1rem" }}
              disabled={vkPhotoLoading}
              onClick={() => loadVkAlbumPhotos(true)}
            >
              Загрузить ещё фото
            </button>
          ) : null}
        </div>

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
        <ul className={styles.list} style={{ marginTop: "1.5rem" }}>
          {albums.map((alb) => {
            const count = photos.filter((p) => p.albumId === alb.id).length;
            return (
              <li key={alb.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    {alb.title}
                    <div className={styles.muted}>
                      {count} фото · {new Date(alb.createdAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  {albums.length > 1 ? (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger}`}
                      onClick={() => removeAlbum(alb.id, alb.title)}
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
          Вставьте прямую ссылку на изображение (https). Файлы можно загрузить на облако и вставить URL.
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
            <label htmlFor="p-src">URL картинки</label>
            <input
              id="p-src"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              required
              placeholder="https://…"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="p-cap">Подпись</label>
            <input id="p-cap" value={caption} onChange={(e) => setCaption(e.target.value)} required />
          </div>
          <button className={styles.btn} type="submit">
            Добавить фото
          </button>
        </form>
        </div>

        <div className={styles.subsection}>
          <h3>Все фотографии</h3>
          <ul className={styles.list}>
            {photos.map((x) => {
              const alb = albums.find((a) => a.id === x.albumId);
              return (
                <li key={x.id}>
                  <div className={styles.listRow}>
                    <div>
                      {x.caption}
                      <div className={styles.muted}>{alb?.title ?? "—"}</div>
                      <div className={styles.muted}>{x.src}</div>
                    </div>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                      onClick={() => removePhoto(x.id, x.caption)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
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
