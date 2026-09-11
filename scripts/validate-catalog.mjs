import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const catalogDir = new URL("../catalog/sets/", import.meta.url);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const repeatModes = new Set(["one", "three", "infinite"]);
const repeatTargets = new Set(["current", "queue"]);

if (!existsSync(catalogDir)) {
  console.error("Catalog validation failed: catalog/sets does not exist.");
  process.exit(1);
}

const files = readdirSync(catalogDir)
  .filter((name) => name.endsWith(".json"))
  .sort();
const ids = new Set();
const errors = [];

for (const filename of files) {
  const path = join(catalogDir.pathname, filename);
  let value;
  try {
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${filename}: invalid JSON (${error.message})`);
    continue;
  }

  const fileId = basename(filename, ".json");
  if (value?.version !== 1) errors.push(`${filename}: version must be 1`);
  if (typeof value?.id !== "string" || !slugPattern.test(value.id)) {
    errors.push(`${filename}: id must use lowercase letters, numbers and hyphens`);
  } else {
    if (value.id !== fileId) errors.push(`${filename}: id must match the filename (${fileId})`);
    if (ids.has(value.id)) errors.push(`${filename}: duplicate id ${value.id}`);
    ids.add(value.id);
  }
  if (typeof value?.name !== "string" || !value.name.trim()) errors.push(`${filename}: name is required`);
  if (value?.description !== undefined && typeof value.description !== "string") {
    errors.push(`${filename}: description must be a string when present`);
  }
  if (!repeatModes.has(value?.repeatMode)) errors.push(`${filename}: invalid repeatMode`);
  if (!repeatTargets.has(value?.repeatTarget)) errors.push(`${filename}: invalid repeatTarget`);
  if (!Array.isArray(value?.recordings) || value.recordings.length === 0) {
    errors.push(`${filename}: recordings must contain at least one item`);
    continue;
  }

  value.recordings.forEach((recording, index) => {
    const prefix = `${filename}: recordings[${index}]`;
    if (!recording || typeof recording !== "object") {
      errors.push(`${prefix} must be an object`);
      return;
    }
    if (typeof recording.videoId !== "string" || !videoIdPattern.test(recording.videoId)) {
      errors.push(`${prefix}.videoId must be an 11-character YouTube video id`);
    }
    if (typeof recording.title !== "string" || !recording.title.trim()) {
      errors.push(`${prefix}.title is required`);
    }
  });
}

if (errors.length) {
  console.error("Catalog validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Catalog OK: ${files.length} curated set${files.length === 1 ? "" : "s"}.`);
