// functions/src/utils/cleanText.ts

/**
 * -----------------------------
 * TEXT CLEANUP
 * Optimized for audiobook TTS
 * -----------------------------
 */

export function cleanText(raw: string): string {
  let text = raw;

  /**
   * Normalize line endings
   */
  text = text.replace(/\r\n/g, "\n");

  /**
   * Remove excessive whitespace
   */
  text = text.replace(/[ \t]+/g, " ");

  /**
   * Remove repeated blank lines
   */
  text = text.replace(/\n{3,}/g, "\n\n");

  /**
   * Remove isolated page numbers
   */
  text = text.replace(/^\s*\d+\s*$/gm, "");

  /**
   * Remove short junk lines
   * Example:
   * ----
   * ***
   * _
   */
  text = text.replace(
    /^[\s\-_*=~`|<>]{2,}$/gm,
    ""
  );

  /**
   * Remove common OCR junk
   */
  text = text.replace(/[^\S\r\n]{2,}/g, " ");

  /**
   * Remove repeated headers/footers
   * Heuristic:
   * lines under 80 chars repeated 3+ times
   */
  const lines = text.split("\n");

  const frequencyMap: Record<string, number> = {};

  lines.forEach((line) => {
    const normalized = line.trim();

    if (
      normalized.length > 0 &&
      normalized.length < 80
    ) {
      frequencyMap[normalized] =
        (frequencyMap[normalized] || 0) + 1;
    }
  });

  const repeatedLines = new Set(
    Object.entries(frequencyMap)
      .filter(([_, count]) => count >= 3)
      .map(([line]) => line)
  );

  text = lines
    .filter((line) => {
      const normalized = line.trim();

      return !repeatedLines.has(normalized);
    })
    .join("\n");

  /**
   * Normalize punctuation spacing
   */
  text = text.replace(/\s+([.,!?;:])/g, "$1");

  /**
   * Normalize paragraph spacing
   */
  text = text.replace(/\n{2,}/g, "\n\n");

  /**
   * Final trim
   */
  text = text.trim();

  return text;
}