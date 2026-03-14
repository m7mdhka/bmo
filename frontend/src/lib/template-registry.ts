import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

export type TemplateSource = "official" | "community";

type TemplateManifest = {
  name: string;
  description: string;
  category: string;
  tags: string[];
  bmoTemplateVersion: number;
  icon?: string;
  homepage?: string;
  postCreateCommands?: string[];
  language?: string;
  maintainedBy?: string;
};

export type TemplateRecord = {
  id: string;
  name: string;
  description: string;
  source: TemplateSource;
  tags: string[];
  language: string;
  maintainedBy: string;
  url?: string;
  icon: string;
  category: string;
};

const TEMPLATES_ROOT = path.resolve(process.cwd(), "..", "templates");

function titleFromSlug(slug: string) {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferLanguage(manifest: TemplateManifest) {
  if (manifest.language?.trim()) return manifest.language.trim();

  const lowerTags = manifest.tags.map((tag) => tag.toLowerCase());
  if (lowerTags.includes("typescript")) return "TypeScript";
  if (lowerTags.includes("javascript")) return "JavaScript";
  if (lowerTags.includes("python")) return "Python";
  if (lowerTags.includes("markdown")) return "Markdown";
  if (lowerTags.includes("html")) return "HTML";
  return "Any";
}

async function readManifest(manifestPath: string) {
  const raw = await fs.readFile(manifestPath, "utf8");
  return JSON.parse(raw) as TemplateManifest;
}

export async function loadTemplates(): Promise<TemplateRecord[]> {
  const sourceEntries = await fs.readdir(TEMPLATES_ROOT, { withFileTypes: true }).catch(() => []);
  const templates: TemplateRecord[] = [];

  for (const sourceEntry of sourceEntries) {
    if (!sourceEntry.isDirectory()) continue;
    if (sourceEntry.name !== "official" && sourceEntry.name !== "community") continue;

    const source = sourceEntry.name;
    const sourceDir = path.join(TEMPLATES_ROOT, source);
    const templateEntries = await fs.readdir(sourceDir, { withFileTypes: true }).catch(() => []);

    for (const entry of templateEntries) {
      if (!entry.isDirectory()) continue;

      const slug = entry.name;
      const manifestPath = path.join(sourceDir, slug, "bmo-template.json");
      try {
        const manifest = await readManifest(manifestPath);
        templates.push({
          id: slug,
          name: manifest.name?.trim() || titleFromSlug(slug),
          description: manifest.description?.trim() || "No description provided.",
          source,
          tags: Array.isArray(manifest.tags) ? manifest.tags : [],
          language: inferLanguage(manifest),
          maintainedBy: manifest.maintainedBy?.trim() || (source === "official" ? "BMO team" : "community"),
          url: manifest.homepage,
          icon: manifest.icon?.trim() || manifest.category || "template",
          category: manifest.category?.trim() || "general",
        });
      } catch {
        // Ignore invalid manifests until template validation is added.
      }
    }
  }

  return templates.sort((a, b) => {
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.name.localeCompare(b.name);
  });
}
