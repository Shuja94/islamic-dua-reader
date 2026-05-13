export const STORAGE_KEYS = {
  lastPage: "dua-reader:last-page",
  bookmarks: "dua-reader:bookmarks"
};

export const clampPage = (page, totalPages) => {
  const parsed = Number(page);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(Math.round(parsed), 1), totalPages);
};

export const getProgress = (page, totalPages) => {
  if (!totalPages) return 0;
  return Math.round((clampPage(page, totalPages) / totalPages) * 100);
};

export const addBookmark = (bookmarks, page) => Array.from(new Set([...bookmarks, page])).sort((a, b) => a - b);
export const removeBookmark = (bookmarks, page) => bookmarks.filter((savedPage) => savedPage !== page);

export const loadLastPage = (storage, totalPages) => {
  try {
    return clampPage(storage.getItem(STORAGE_KEYS.lastPage) || 1, totalPages);
  } catch {
    return 1;
  }
};

export const saveLastPage = (storage, page) => {
  try {
    storage.setItem(STORAGE_KEYS.lastPage, String(page));
    return true;
  } catch {
    return false;
  }
};

export const loadBookmarks = (storage) => {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEYS.bookmarks) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
};

export const saveBookmarks = (storage, bookmarks) => {
  try {
    storage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
    return true;
  } catch {
    return false;
  }
};

export const searchPages = (pages, query) => {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return pages;
  return pages.filter((page) => String(page.page) === term || page.title.toLowerCase().includes(term) || page.category.toLowerCase().includes(term));
};

export const getAutoContinueDelay = (speed) => ({ slow: 30000, medium: 18000, fast: 10000 }[speed] || 18000);
export const createShareText = (origin, page) => `${origin}/?page=${page}`;

export const copyShareText = async ({ clipboard, text }) => {
  try {
    if (!clipboard?.writeText) throw new Error("Clipboard unavailable");
    await clipboard.writeText(text);
    return { ok: true, manualText: "" };
  } catch {
    return { ok: false, manualText: text };
  }
};
