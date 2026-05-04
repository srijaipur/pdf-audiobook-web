export function chunkText(text: string): string[] {
  return text
    .replace(/\n/g, " ")
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}