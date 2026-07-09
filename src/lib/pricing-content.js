function uid(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultPricingContent() {
  return {
    promotions: [
      {
        id: "promo-first-free",
        title: "Первое посещение",
        details: "Бесплатно",
      },
      {
        id: "promo-first-pass",
        title: "Первый абонемент на 8 занятий",
        details: "3200 рублей",
      },
      {
        id: "promo-friend",
        title: "Приведи друга",
        details: "50% скидка на абонемент",
      },
    ],
    sections: [
      {
        id: "sec-passes",
        title: "Абонементы",
        items: [
          { id: "pass-8", title: "8 занятий", price: "3600", note: "" },
          { id: "pass-24", title: "24 занятия", price: "9800", note: "" },
          { id: "pass-48", title: "48 занятий", price: "17200", note: "" },
        ],
      },
      {
        id: "sec-individual",
        title: "Индивидуальные занятия с тренером",
        items: [
          { id: "ind-single", title: "Разовое", price: "2000 рублей", note: "" },
          { id: "ind-pack", title: "Пакет из 3-х занятий", price: "5200", note: "" },
        ],
      },
      {
        id: "sec-self",
        title: "Самоподготовка (сампо)",
        items: [{ id: "self-one", title: "С человека", price: "250 рублей", note: "" }],
      },
    ],
  };
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePromotion(item) {
  const title = normalizeText(item?.title);
  const details = normalizeText(item?.details);
  if (!title && !details) return null;
  return {
    id: normalizeText(item?.id) || uid("promo"),
    title: title || "Акция",
    details,
  };
}

function normalizeSectionItem(item) {
  const title = normalizeText(item?.title);
  const price = normalizeText(item?.price);
  const note = normalizeText(item?.note);
  if (!title && !price && !note) return null;
  return {
    id: normalizeText(item?.id) || uid("price"),
    title: title || "Новая позиция",
    price,
    note,
  };
}

function normalizeSection(section) {
  const title = normalizeText(section?.title);
  const items = Array.isArray(section?.items)
    ? section.items.map(normalizeSectionItem).filter(Boolean)
    : [];
  if (!title && items.length === 0) return null;
  return {
    id: normalizeText(section?.id) || uid("section"),
    title: title || "Раздел",
    items,
  };
}

export function normalizePricingContent(input) {
  if (!input || typeof input !== "object") {
    return createDefaultPricingContent();
  }

  const promotions = Array.isArray(input.promotions)
    ? input.promotions.map(normalizePromotion).filter(Boolean)
    : [];
  const sections = Array.isArray(input.sections)
    ? input.sections.map(normalizeSection).filter(Boolean)
    : [];

  return {
    promotions,
    sections,
  };
}
