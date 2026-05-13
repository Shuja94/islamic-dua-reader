import { describe, expect, it, vi } from "vitest";
import { addBookmark, clampPage, copyShareText, getAutoContinueDelay, getProgress, loadLastPage, removeBookmark, saveLastPage, searchPages } from "./reader";

const samplePages = [
  { page: 1, title: "Cover", category: "Cover" },
  { page: 2, title: "Forgiveness Dua", category: "Forgiveness Duas" },
  { page: 3, title: "Family Dua", category: "Family Duas" }
];

describe("reader logic", () => {
  it("keeps navigation inside the book", () => {
    expect(clampPage(43, 42)).toBe(42);
    expect(clampPage(0, 42)).toBe(1);
  });

  it("calculates progress", () => {
    expect(getProgress(21, 42)).toBe(50);
  });

  it("adds and removes bookmarks", () => {
    expect(removeBookmark(addBookmark([3], 2), 3)).toEqual([2]);
  });

  it("saves and loads last page", () => {
    const storage = new Map();
    const fakeStorage = { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) };
    expect(saveLastPage(fakeStorage, 12)).toBe(true);
    expect(loadLastPage(fakeStorage, 42)).toBe(12);
  });

  it("searches pages", () => {
    expect(searchPages(samplePages, "family")).toHaveLength(1);
    expect(searchPages(samplePages, "3")[0].title).toBe("Family Dua");
  });

  it("falls back when clipboard is blocked", async () => {
    const result = await copyShareText({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) }, text: "https://example.test/?page=4" });
    expect(result.ok).toBe(false);
    expect(result.manualText).toContain("page=4");
  });

  it("maps auto continue speeds", () => {
    expect(getAutoContinueDelay("slow")).toBeGreaterThan(getAutoContinueDelay("fast"));
  });
});
