import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";

const { slugifyIdea, deduplicatePath, STOP_WORDS } = await import(
  "../../../electron/project-utils.js"
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("slugifyIdea", () => {
  it("strips stop words and creates slug", () => {
    expect(slugifyIdea("A portfolio website for my art")).toBe("portfolio-art");
  });

  it("handles restaurant menu idea", () => {
    expect(slugifyIdea("Build me a restaurant menu")).toBe(
      "me-restaurant-menu"
    );
  });

  it("falls back to my-project for all Hebrew", () => {
    expect(slugifyIdea("אתר לעסק שלי")).toBe("my-project");
  });

  it("falls back to my-project for empty string", () => {
    expect(slugifyIdea("")).toBe("my-project");
  });

  it("keeps alphanumeric and limits to 3 words", () => {
    expect(slugifyIdea("cafe123 online ordering system today")).toBe(
      "cafe123-online-ordering"
    );
  });

  it("strips Hebrew and keeps English words", () => {
    expect(slugifyIdea("אתר portfolio שלי art gallery")).toBe(
      "portfolio-art-gallery"
    );
  });

  it("normalizes excessive whitespace", () => {
    expect(slugifyIdea("  cool   project  here  today  ")).toBe(
      "cool-project-here"
    );
  });

  it("strips special characters", () => {
    expect(slugifyIdea("my @cool #project!")).toBe("cool-project");
  });

  it("handles only stop words → my-project", () => {
    expect(slugifyIdea("build a website for my page")).toBe("my-project");
  });

  it("lowercases all words", () => {
    expect(slugifyIdea("COOL PROJECT")).toBe("cool-project");
  });
});

describe("STOP_WORDS", () => {
  it("contains English stop words", () => {
    expect(STOP_WORDS.has("the")).toBe(true);
    expect(STOP_WORDS.has("website")).toBe(true);
    expect(STOP_WORDS.has("build")).toBe(true);
  });

  it("contains Hebrew stop words", () => {
    expect(STOP_WORDS.has("של")).toBe(true);
    expect(STOP_WORDS.has("אתר")).toBe(true);
    expect(STOP_WORDS.has("רוצה")).toBe(true);
  });
});

describe("deduplicatePath", () => {
  it("returns the slug if directory does not exist", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const name = await deduplicatePath("/base", "my-slug");
    expect(name).toBe("my-slug");
  });

  it("appends counter when directory exists", async () => {
    vi.spyOn(fs, "existsSync")
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const name = await deduplicatePath("/base", "my-slug");
    expect(name).toBe("my-slug-2");
  });

  it("increments counter until finding available name", async () => {
    vi.spyOn(fs, "existsSync")
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const name = await deduplicatePath("/base", "my-slug");
    expect(name).toBe("my-slug-4");
  });
});
