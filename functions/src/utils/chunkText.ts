// functions/src/utils/chunkText.ts

/**
 * Sentence-aware text chunking
 * Optimized for TTS processing.
 */

const MAX_CHUNK_LENGTH = 4000;

export interface TextChunk {
  order: number;
  text: string;
}

export function chunkText(text: string): TextChunk[] {
  /**
   * Normalize whitespace
   */
  const normalized = text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();

  /**
   * Split by sentence boundaries
   */
  const sentences = normalized.match(
    /[^.!?]+[.!?]+(\s|$)/g
  ) || [normalized];

  const chunks: TextChunk[] = [];

  let currentChunk = "";
  let order = 0;

  for (const sentence of sentences) {
    /**
     * If adding sentence exceeds limit,
     * finalize current chunk.
     */
    if (
      currentChunk.length + sentence.length >
      MAX_CHUNK_LENGTH
    ) {
      chunks.push({
        order,
        text: currentChunk.trim(),
      });

      order++;

      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }

  /**
   * Push remaining chunk
   */
  if (currentChunk.trim().length > 0) {
    chunks.push({
      order,
      text: currentChunk.trim(),
    });
  }

  return chunks;
}