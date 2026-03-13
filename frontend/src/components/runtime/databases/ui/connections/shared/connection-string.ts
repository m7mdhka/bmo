export function parseUrl(raw: string): URL | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

