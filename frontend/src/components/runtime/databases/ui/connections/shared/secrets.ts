export function maskSecret(v?: string) {
  return v && v.length ? "********" : "—";
}

