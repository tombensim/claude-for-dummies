const fs = require("fs");
const path = require("path");

const STOP_WORDS = new Set([
  // English
  "a", "an", "the", "for", "my", "our", "website", "site", "page", "web",
  "want", "build", "create", "make", "need", "like", "would", "about",
  "that", "this", "with", "and", "but", "just", "some", "very",
  // Hebrew
  "של", "אתר", "עמוד", "דף", "אני", "שלי", "בשביל", "לי", "את", "עם",
  "רוצה", "לבנות", "ליצור", "משהו", "זה", "הוא", "היא", "גם", "אבל", "רק",
]);

function slugifyIdea(idea) {
  // Transliterate Hebrew to nothing (strip it), keep ASCII
  const ascii = idea
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, " ") // strip non-ASCII (Hebrew etc.)
    .replace(/[^a-z0-9\s-]/g, "")  // keep letters, digits, spaces, hyphens
    .trim();

  const words = ascii
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));

  const slug = words.slice(0, 3).join("-") || "my-project";
  return slug;
}

async function deduplicatePath(baseDir, slug) {
  let name = slug;
  let counter = 1;
  while (fs.existsSync(path.join(baseDir, name))) {
    counter++;
    name = `${slug}-${counter}`;
  }
  return name;
}

module.exports = { STOP_WORDS, slugifyIdea, deduplicatePath };
