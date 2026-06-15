/**
 * Dimension Adapter
 *
 * Adapts embedding vectors to a target dimension (default 1536).
 * - Same dimension → return as-is
 * - Smaller → zero-pad trailing dimensions
 * - Larger → truncate with warning
 * - L2 normalize after adaptation
 */

const TARGET_DIMENSION = 1536;

/**
 * L2-normalize a vector in-place.
 */
function l2Normalize(vector: number[]): number[] {
  let norm = 0;
  for (const val of vector) {
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }
  return vector;
}

/**
 * Adapt a vector to the target dimension.
 * - Same dimension → L2 normalize and return
 * - Smaller → zero-pad trailing dimensions, then L2 normalize
 * - Larger → truncate with console warning, then L2 normalize
 */
export function adaptDimension(
  vector: number[],
  targetDimension: number = TARGET_DIMENSION
): number[] {
  if (vector.length === targetDimension) {
    // Same dimension — just normalize
    return l2Normalize([...vector]);
  }

  if (vector.length < targetDimension) {
    // Smaller — zero-pad trailing dimensions
    const padded = new Array(targetDimension).fill(0);
    for (let i = 0; i < vector.length; i++) {
      padded[i] = vector[i];
    }
    return l2Normalize(padded);
  }

  // Larger — truncate with warning
  console.warn(
    `[DimensionAdapter] Truncating vector from ${vector.length}d to ${targetDimension}d. ` +
    `This may lose information.`
  );
  const truncated = vector.slice(0, targetDimension);
  return l2Normalize(truncated);
}
