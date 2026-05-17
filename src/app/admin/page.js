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
  const storyVideoInputRef = useRef(null);
  const [storySaving, setStorySaving] = useState(false);
  const [storyUploadProgress, setStoryUploadProgress] = useState(null);
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [activeTab, setActiveTab] = useState("news");
  const [msg, setMsg] = useState(null);
  const [vkItems, setVkItems] = useState([]);
  const [vkSelected, setVkSelected] = useState(() => new Set());
  const [vkOffset, setVkOffset] = useState(0);
  const [vkHasMore, setVkHasMore] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);
  const [vkImporting, setVkImporting] = useState(false);

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

  function switchTab(id) {
    if (activeTab === "news" && id !== "news" && editingNewsId) {
      resetNewsForm();
    }
    if (id !== activeTab) {
      resetVkPreview();
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

  async function removeStory(id, storyLabel) {
    if (!window.confirm(`Удалить сторис «${storyLabel}»?`)) return;
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

  async function addStory(e) {
    e.preventDefault();
    setMsg(null);
    const file = storyVideoInputRef.current?.files?.[0];
    if (!file) {
      setMsg("Выберите видеофайл");
      return;
    }
    setStorySaving(true);
    setStoryUploadProgress(0);
    try {
      const pathname = `stories/${Date.now()}-${file.name.replace(/[^\w.\-()а-яА-ЯёЁ ]+/gu, "_")}`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/stories/upload",
        multipart: file.size > 4.5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setStoryUploadProgress(percentage),
      });

      const res = await fetch("/api/admin/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: storyTitle, videoUrl: blob.url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Ошибка сохранения");
        return;
      }
      setStoryTitle("");
      if (storyVideoInputRef.current) storyVideoInputRef.current.value = "";
      setMsg("Сторис добавлен");
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
        <p className={styles.muted} style={{ marginTop: 0 }}>
          Загрузка постов из сообщества{" "}
          <a href="https://vk.com/inside_dance72" target="_blank" rel="noopener noreferrer">
            vk.com/inside_dance72
          </a>
          . Нужен{" "}
          <strong>сервисный ключ приложения VK</strong> в <code>VK_SERVICE_KEY</code> (не ключ
          сообщества). Создайте приложение на{" "}
          <a href="https://vk.com/apps?act=manage" target="_blank" rel="noopener noreferrer">
            vk.com/apps
          </a>
          , в настройках скопируйте «Сервисный ключ доступа».
        </p>
        <p className={styles.vkImportHint}>Импорт постов как новостей</p>
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
        <h2>Сторис</h2>
        <p className={styles.muted} style={{ marginTop: 0 }}>
          Загрузите видео с компьютера (MP4, WebM, MOV — до 100 МБ).
        </p>
        <form onSubmit={addStory}>
          <div className={styles.field}>
            <label htmlFor="st-file">Видеофайл</label>
            <input
              id="st-file"
              ref={storyVideoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              required
              disabled={storySaving}
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
          <button className={styles.btn} type="submit" disabled={storySaving}>
            {storySaving
              ? storyUploadProgress != null
                ? `Загрузка ${Math.round(storyUploadProgress)}%…`
                : "Сохранение…"
              : "Добавить сторис"}
          </button>
        </form>

        <div className={styles.subsection}>
          <h3>Загруженные сторис</h3>
          <ul className={styles.list}>
            {stories.map((x) => (
              <li key={x.id}>
                <div className={styles.listRow}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
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
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                    onClick={() => removeStory(x.id, x.title)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      ) : null}
    </div>
  );
}
