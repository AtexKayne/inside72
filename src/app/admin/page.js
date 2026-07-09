"use client";

import { useEffect, useMemo, useState } from "react";
import { sortPhotosItems } from "@/lib/gallery-order";
import {
  createPhotoUrlRow,
  dedupePhotoUrls,
  finalizePhotoUrlRows,
  parsePastedPhotoUrls,
} from "@/lib/photo-url-rows";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./admin.module.scss";

const EMPTY_PRICING = {
  promotions: [],
  sections: [],
};

function createClientId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
  const [storySaving, setStorySaving] = useState(false);
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
  const [pricing, setPricing] = useState(EMPTY_PRICING);
  const [pricingSaving, setPricingSaving] = useState(false);

  const photosInAlbum = useMemo(() => {
    if (!albumId) return [];
    return sortPhotosItems(photos.filter((p) => p.albumId === albumId));
  }, [photos, albumId]);

  async function load() {
    const [n, p, a, s, pr] = await Promise.all([
      fetch("/api/admin/news").then((r) => r.json()),
      fetch("/api/admin/photos").then((r) => r.json()),
      fetch("/api/admin/albums").then((r) => r.json()),
      fetch("/api/admin/stories").then((r) => r.json()),
      fetch("/api/admin/pricing").then((r) => r.json()),
    ]);
    if (n.items) setNews(n.items);
    if (p.items) setPhotos(p.items);
    if (a.items) {
      setAlbums(a.items);
      setAlbumId((prev) => prev || a.items[0]?.id || "");
    }
    if (s.items) setStories(s.items);
    if (pr.pricing) setPricing(pr.pricing);
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
  }

  function startEditStory(item) {
    setEditingStoryId(item.id);
    setStoryTitle(item.title);
    setStoryVideoUrl(item.videoUrl);
    setMsg(null);
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
    const url = storyVideoUrl.trim();
    const isEditing = Boolean(editingStoryId);

    if (!isEditing && !url) {
      setMsg("Укажите прямую ссылку на видео (https://…)");
      return;
    }

    setStorySaving(true);
    try {
      const currentStory = isEditing ? stories.find((s) => s.id === editingStoryId) : null;
      let videoUrl;
      if (url && (!isEditing || url !== currentStory?.videoUrl)) {
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
      setMsg(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setStorySaving(false);
    }
  }

  function updatePromotion(promoId, field, value) {
    setPricing((prev) => ({
      ...prev,
      promotions: prev.promotions.map((promo) =>
        promo.id === promoId ? { ...promo, [field]: value } : promo
      ),
    }));
  }

  function addPromotion() {
    setPricing((prev) => ({
      ...prev,
      promotions: [
        ...prev.promotions,
        { id: createClientId("promo"), title: "Новая акция", details: "" },
      ],
    }));
  }

  function removePromotion(promoId) {
    setPricing((prev) => ({
      ...prev,
      promotions: prev.promotions.filter((promo) => promo.id !== promoId),
    }));
  }

  function updateSection(sectionId, field, value) {
    setPricing((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      ),
    }));
  }

  function addSection() {
    setPricing((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: createClientId("section"), title: "Новый раздел", items: [] },
      ],
    }));
  }

  function removeSection(sectionId) {
    setPricing((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  }

  function updateSectionItem(sectionId, itemId, field, value) {
    setPricing((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
        };
      }),
    }));
  }

  function addSectionItem(sectionId) {
    setPricing((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: [
            ...section.items,
            { id: createClientId("price"), title: "Новая позиция", price: "", note: "" },
          ],
        };
      }),
    }));
  }

  function removeSectionItem(sectionId, itemId) {
    setPricing((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        };
      }),
    }));
  }

  async function savePricing() {
    setMsg(null);
    setPricingSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricing }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Не удалось сохранить цены и акции");
        return;
      }
      if (data.pricing) setPricing(data.pricing);
      setMsg("Цены и акции обновлены");
    } finally {
      setPricingSaving(false);
    }
  }

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <p className={styles.kicker}>Inside · Панель управления</p>
          <h1 className={styles.title}>Контент сайта</h1>
          <nav className={styles.siteNav} aria-label="Переходы на сайт">
            <Link href="/">На главную</Link>
            {activeTab === "news" ? (
              <Link href="/news" target="_blank" rel="noopener noreferrer">
                Раздел «Новости» ↗
              </Link>
            ) : null}
            {activeTab === "photos" ? (
              <Link href="/gallery" target="_blank" rel="noopener noreferrer">
                Раздел «Галерея» ↗
              </Link>
            ) : null}
            {activeTab === "pricing" ? (
              <Link href="/prices" target="_blank" rel="noopener noreferrer">
                Раздел «Цены и акции» ↗
              </Link>
            ) : null}
          </nav>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => logout()}>
            Выйти
          </button>
        </div>
      </header>
      {msg ? (
        <p
          className={`${styles.toast} ${/ошибк|не удалось/i.test(msg) ? styles.toastError : styles.toastSuccess}`}
          role="status"
        >
          {msg}
        </p>
      ) : null}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.mainTabs} role="tablist" aria-label="Разделы админки">
            {[
              ["news", "Новости", news.length],
              ["photos", "Фото", photos.length],
              ["stories", "Сторис", stories.length],
              ["pricing", "Цены", pricing.promotions.length + pricing.sections.length],
            ].map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                className={activeTab === id ? styles.mainTabActive : styles.mainTab}
                onClick={() => switchTab(id)}
              >
                {label}
                <span className={styles.tabCount} aria-label={`${count} записей`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.content}>
      {activeTab === "news" ? (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Импорт из VK</h2>
        <p className={styles.cardDesc}>
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
            className={`${styles.btn} ${styles.btnGhost} ${styles.loadMoreBtn}`}
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
        <h2 className={styles.cardTitle}>{editingNewsId ? "Редактирование новости" : "Новая новость"}</h2>
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
          <div className={styles.formActions}>
            <button className={styles.btn} type="submit">
              {editingNewsId ? "Сохранить" : "Добавить новость"}
            </button>
            {editingNewsId ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={resetNewsForm}
              >
                Отмена
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Последние новости</h3>
          <ul className={`${styles.list} ${styles.listPlain}`}>
            {news.map((x) => (
              <li key={x.id}>
                <div className={styles.listRow}>
                  <div className={styles.listBody}>
                    <div className={styles.listTitle}>{x.title}</div>
                    <div className={styles.listMeta}>{new Date(x.createdAt).toLocaleString("ru-RU")}</div>
                  </div>
                  <div className={styles.listActions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
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
        <h2 className={styles.cardTitle}>Фотографии</h2>

        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Альбомы</h3>
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
          <p className={styles.hint}>
            Схватите элемент за ручку <span className={styles.storyDragHint}>⠿</span> и перетащите.
            Порядок альбомов совпадает с вкладками на странице «Галерея».
            {albumOrderSaving ? " Сохранение порядка…" : ""}
          </p>
        ) : null}
        <ul
          className={`${styles.list} ${albums.length > 1 ? styles.storySortList : ""}`}
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
                  <div className={styles.listBody}>
                    <div className={styles.listTitle}>{alb.title}</div>
                    <div className={styles.listMeta}>
                      {count} фото · {new Date(alb.createdAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  {albums.length > 1 ? (
                    <div className={styles.listActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                        onClick={() => removeAlbum(alb.id, alb.title)}
                        disabled={albumOrderSaving}
                      >
                        Удалить
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        </div>

        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Добавить фото</h3>
        <p className={styles.hint}>
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
          <h3 className={styles.subsectionTitle}>Фотографии в альбоме</h3>
          {photosInAlbum.length > 1 ? (
            <p className={styles.hint}>
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
          {photosInAlbum.length === 0 ? (
            <p className={styles.emptyHint}>В этом альбоме пока нет фотографий.</p>
          ) : null}
        </div>
      </section>
      ) : null}

      {activeTab === "pricing" ? (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Цены и акции</h2>
        <p className={styles.cardDesc}>
          Здесь можно редактировать акции и прайс на главной странице, а также добавлять новые позиции.
        </p>

        <div className={styles.subsection} style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
          <h3 className={styles.subsectionTitle}>Акции</h3>
          <div className={styles.formActions}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={addPromotion}>
              Добавить акцию
            </button>
          </div>
          <ul className={`${styles.list} ${styles.storySortList}`} style={{ marginTop: "0.85rem" }}>
            {pricing.promotions.map((promo) => (
              <li key={promo.id} className={styles.storySortItem}>
                <div className={styles.field}>
                  <label>Название акции</label>
                  <input
                    value={promo.title}
                    onChange={(e) => updatePromotion(promo.id, "title", e.target.value)}
                    placeholder="Например: Первое посещение"
                  />
                </div>
                <div className={styles.field}>
                  <label>Условие / выгода</label>
                  <input
                    value={promo.details}
                    onChange={(e) => updatePromotion(promo.id, "details", e.target.value)}
                    placeholder="Например: Бесплатно"
                  />
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                    onClick={() => removePromotion(promo.id)}
                  >
                    Удалить акцию
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {pricing.promotions.length === 0 ? (
            <p className={styles.emptyHint}>Список акций пуст. Добавьте первую акцию.</p>
          ) : null}
        </div>

        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Прайс-лист</h3>
          <div className={styles.formActions}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={addSection}>
              Добавить раздел
            </button>
          </div>
          <div className={styles.list} style={{ marginTop: "0.85rem" }}>
            {pricing.sections.map((section) => (
              <article key={section.id} className={styles.storySortItem}>
                <div className={styles.field}>
                  <label>Название раздела</label>
                  <input
                    value={section.title}
                    onChange={(e) => updateSection(section.id, "title", e.target.value)}
                    placeholder="Например: Абонементы"
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                    onClick={() => addSectionItem(section.id)}
                  >
                    Добавить позицию
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                    onClick={() => removeSection(section.id)}
                  >
                    Удалить раздел
                  </button>
                </div>

                <ul className={`${styles.list} ${styles.storySortList}`} style={{ marginTop: "0.75rem" }}>
                  {section.items.map((item) => (
                    <li key={item.id} className={styles.storySortItem}>
                      <div className={styles.field}>
                        <label>Название позиции</label>
                        <input
                          value={item.title}
                          onChange={(e) => updateSectionItem(section.id, item.id, "title", e.target.value)}
                          placeholder="Например: 8 занятий"
                        />
                      </div>
                      <div className={styles.field}>
                        <label>Цена / значение</label>
                        <input
                          value={item.price}
                          onChange={(e) => updateSectionItem(section.id, item.id, "price", e.target.value)}
                          placeholder="Например: 3600"
                        />
                      </div>
                      <div className={styles.field}>
                        <label>Комментарий (необязательно)</label>
                        <input
                          value={item.note ?? ""}
                          onChange={(e) => updateSectionItem(section.id, item.id, "note", e.target.value)}
                          placeholder="Например: с человека"
                        />
                      </div>
                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                          onClick={() => removeSectionItem(section.id, item.id)}
                        >
                          Удалить позицию
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {section.items.length === 0 ? (
                  <p className={styles.emptyHint}>В разделе пока нет позиций.</p>
                ) : null}
              </article>
            ))}
          </div>
          {pricing.sections.length === 0 ? (
            <p className={styles.emptyHint}>Разделы прайс-листа не добавлены.</p>
          ) : null}
        </div>

        <div className={styles.subsection}>
          <div className={styles.formActions}>
            <button className={styles.btn} type="button" onClick={savePricing} disabled={pricingSaving}>
              {pricingSaving ? "Сохранение…" : "Сохранить цены и акции"}
            </button>
          </div>
        </div>
      </section>
      ) : null}

      {activeTab === "stories" ? (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{editingStoryId ? "Редактирование сторис" : "Новый сторис"}</h2>
        <p className={styles.cardDesc}>
          {editingStoryId
            ? "Измените подпись или укажите новый URL видео. Если поле ссылки не менять — останется текущее видео."
            : "Вставьте прямую ссылку на видео (https://…). Загрузка файла с компьютера временно отключена."}
        </p>
        <form onSubmit={saveStory}>
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
          <div className={styles.formActions}>
            <button className={styles.btn} type="submit" disabled={storySaving}>
              {storySaving ? "Сохранение…" : editingStoryId ? "Сохранить" : "Добавить сторис"}
            </button>
            {editingStoryId ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={resetStoryForm}
                disabled={storySaving}
              >
                Отмена
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Загруженные сторис</h3>
          {stories.length > 1 ? (
            <p className={styles.hint}>
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
                      className={styles.thumbVideo}
                    />
                    <div className={styles.listBody}>
                      <div className={styles.listTitle}>{x.title}</div>
                      <div className={styles.listMeta}>{x.videoUrl}</div>
                      <div className={styles.listMeta}>{new Date(x.createdAt).toLocaleString("ru-RU")}</div>
                    </div>
                    </div>
                    <div className={styles.listActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
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
      </div>
    </div>
  );
}
