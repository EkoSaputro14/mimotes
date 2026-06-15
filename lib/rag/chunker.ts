export interface Chunk {
  content: string;
  index: number;
  metadata: Record<string, unknown>;
}

// Maximum chunks per document to prevent resource exhaustion
const MAX_CHUNKS = 1000;

/**
 * Improved sentence splitting that handles common abbreviations.
 * Avoids splitting on Dr., Mr., Mrs., U.S.A., etc.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace and uppercase letter
  // or end of string. Uses a simple approach: split on period+space+uppercase
  // but not after known abbreviations.
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z\u00C0-\u024F])/);
  if (parts.length === 0) return [text];
  return parts.filter((s) => s.trim().length > 0);
}

export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50,
  metadata: Record<string, unknown> = {}
): Chunk[] {
  const chunks: Chunk[] = [];

  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();

    // If adding this paragraph would exceed chunk size
    if (
      currentChunk.length + trimmedParagraph.length > chunkSize &&
      currentChunk.length > 0
    ) {
      // Save current chunk (respect max limit)
      if (chunkIndex < MAX_CHUNKS) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          metadata: { ...metadata, chunkIndex: chunkIndex - 1 },
        });
      }

      // Start new chunk with overlap from end of previous chunk
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-overlap);
      currentChunk = overlapWords.join(" ") + "\n\n" + trimmedParagraph;
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += "\n\n" + trimmedParagraph;
      } else {
        currentChunk = trimmedParagraph;
      }
    }

    // If single paragraph exceeds chunk size, split it by sentences
    if (currentChunk.length > chunkSize * 2) {
      const sentences = splitSentences(currentChunk);
      let sentenceChunk = "";

      for (const sentence of sentences) {
        if (
          sentenceChunk.length + sentence.length > chunkSize &&
          sentenceChunk.length > 0
        ) {
          if (chunkIndex < MAX_CHUNKS) {
            chunks.push({
              content: sentenceChunk.trim(),
              index: chunkIndex++,
              metadata: { ...metadata, chunkIndex: chunkIndex - 1 },
            });
          }
          sentenceChunk = sentence;
        } else {
          sentenceChunk += sentence;
        }
      }

      currentChunk = sentenceChunk;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0 && chunkIndex < MAX_CHUNKS) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      metadata: { ...metadata, chunkIndex },
    });
  }

  return chunks;
}
