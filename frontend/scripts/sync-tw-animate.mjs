import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const pkgJsonPath = path.join(ROOT, "node_modules", "tw-animate-css", "package.json");
const srcPath = path.join(ROOT, "node_modules", "tw-animate-css", "dist", "tw-animate.css");
const outPath = path.join(ROOT, "src", "app", "tw-animate.css");

async function main() {
  const pkg = JSON.parse(await fs.readFile(pkgJsonPath, "utf8"));
  const css = await fs.readFile(srcPath, "utf8");

  const header = [
    "/*",
    `  Auto-synced from tw-animate-css@${pkg.version} (MIT)`,
    "  Source: node_modules/tw-animate-css/dist/tw-animate.css",
    "  Why: Turbopack + Tailwind v4 resolution can fail for `@import \"tw-animate-css\"`.",
    "*/",
    "",
  ].join("\n");

  await fs.writeFile(outPath, header + css.trim() + "\n", "utf8");
}

main().catch((err) => {
  // Avoid breaking installs in edge cases; builds will still fail if the CSS is missing.
  console.error("[sync-tw-animate] Failed:", err);
  process.exitCode = 0;
});

