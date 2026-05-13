import { describe, expect, it, vi } from "vitest";
import {
  addBookmark,
  clampPage,
  copyShareText,
  getAutoContinueDelay,
  getProgress,
  loadLastPage,
  removeBookmark,
  saveLastPage,
  searchPages,
} from "./reader";

const samplePages = [
  { page: 1, title: "Cover", category: "Cover" },
  { page: 2, title: "Forgiveness Dua", category: "Forgiveness Duas" },
  { page: 3, title: "Family Dua", category: "Family Duas" },
];

describe("reader navigation", () => {
  it("next page does not pass the final page", () => {
    expect(clampPage(43, 42)).toBe(42);
  });

  it("previous page does not go before page 1", () => {
    expect(clampPage(0, 42)).toBe(1);
  });

  it("calculates reading progress", () => {
    expect(getProgress(21, 42)).toBe(50);
  });
});

describe("bookmarks and continuation", () => {
  it("adds and removes bookmarks", () => {
    const added = addBookmark([3], 2);
    expect(added).toEqual([2, 3]);
    expect(removeBookmark(added, 3)).toEqual([2]);
  });

  it("saves and loads the last page", () => {
    const storage = new Map();
    const fakeStorage = {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    };

    expect(saveLastPage(fakeStorage, 12)).toBe(true);
    expect(loadLastPage(fakeStorage, 42)).toBe(12);
  });
});

describe("search, share, and timing", () => {
  it("filters pages by title, category, or page number", () => {
    expect(searchPages(samplePages, "family")).toHaveLength(1);
    expect(searchPages(samplePages, "Forgiveness Duas")[0].page).toBe(2);
    expect(searchPages(samplePages, "3")[0].title).toBe("Family Dua");
  });

  it("returns manual share text when clipboard is blocked", async () => {
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error("blocked")) };
    const result = await copyShareText({ clipboard, text: "https://example.test/?page=4" });
    expect(result.ok).toBe(false);
    expect(result.manualText).toContain("page=4");
  });

  it("maps auto continue speeds to delays", () => {
    expect(getAutoContinueDelay("slow")).toBeGreaterThan(getAutoContinueDelay("fast"));
    expect(getAutoContinueDelay("unknown")).toBe(getAutoContinueDelay("medium"));
  });
});
