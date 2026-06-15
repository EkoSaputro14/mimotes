/**
 * Dimension Adapter Tests
 *
 * Tests for the adaptDimension function.
 */
import { describe, it, expect, vi } from "vitest";
import { adaptDimension } from "@/lib/rag/embedding-providers/dimension-adapter";

describe("adaptDimension", () => {
  it("same dimension returns as-is (L2 normalized)", () => {
    const vector = new Array(1536).fill(0);
    vector[0] = 1;
    vector[1] = 2;
    vector[2] = 3;

    const result = adaptDimension(vector, 1536);
    expect(result.length).toBe(1536);

    // Should be L2 normalized
    const norm = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it("same dimension passthrough preserves relative values", () => {
    const vector = new Array(1536).fill(0);
    vector[0] = 3;
    vector[1] = 4;
    // L2 norm of [3, 4] = 5, so normalized = [0.6, 0.8]

    const result = adaptDimension(vector, 1536);
    expect(result[0]).toBeCloseTo(0.6, 5);
    expect(result[1]).toBeCloseTo(0.8, 5);
  });

  it("zero-pads smaller vectors to target dimension", () => {
    const vector = [1, 2, 3, 4, 5];
    const result = adaptDimension(vector, 10);

    expect(result.length).toBe(10);
    // First 5 should have values, last 5 should be zero (before normalization)
    // After normalization, last 5 will still be non-zero only if first 5 are non-zero
    // Actually: padding adds zeros, then normalization divides by norm of padded vector
    // So padded = [1,2,3,4,5,0,0,0,0,0], norm = sqrt(55), normalized = padded/norm
    const norm = Math.sqrt(1 + 4 + 9 + 16 + 25);
    expect(result[0]).toBeCloseTo(1 / norm, 5);
    expect(result[5]).toBeCloseTo(0, 5);
    expect(result[9]).toBeCloseTo(0, 5);
  });

  it("zero-pads to 1536 dimensions by default", () => {
    const vector = [1, 2, 3];
    const result = adaptDimension(vector);

    expect(result.length).toBe(1536);
    // Last elements should be 0
    expect(result[1535]).toBeCloseTo(0, 5);
  });

  it("truncates larger vectors with warning", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const vector = new Array(3072).fill(0);
    vector[0] = 1;
    vector[1] = 2;
    vector[2] = 3;

    const result = adaptDimension(vector, 1536);

    expect(result.length).toBe(1536);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Truncating vector from 3072d to 1536d")
    );

    // Should be L2 normalized
    const norm = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);

    consoleWarnSpy.mockRestore();
  });

  it("L2 normalizes after adaptation", () => {
    const vector = new Array(1536).fill(0);
    vector[0] = 5;
    vector[1] = 12;
    // L2 norm = sqrt(25 + 144) = sqrt(169) = 13

    const result = adaptDimension(vector, 1536);
    const norm = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it("handles all-zero vector", () => {
    const vector = new Array(1536).fill(0);
    const result = adaptDimension(vector, 1536);
    expect(result.length).toBe(1536);
    // All zeros should remain zeros (norm=0, no division)
    expect(result.every((v) => v === 0)).toBe(true);
  });

  it("handles empty vector", () => {
    const vector: number[] = [];
    const result = adaptDimension(vector, 1536);
    expect(result.length).toBe(1536);
    expect(result.every((v) => v === 0)).toBe(true);
  });

  it("smaller vector zero-padding preserves original values (normalized)", () => {
    const vector = [10, 20, 30];
    const result = adaptDimension(vector, 6);

    expect(result.length).toBe(6);
    // Padded = [10, 20, 30, 0, 0, 0]
    // Norm = sqrt(100 + 400 + 900) = sqrt(1400)
    const norm = Math.sqrt(1400);
    expect(result[0]).toBeCloseTo(10 / norm, 5);
    expect(result[1]).toBeCloseTo(20 / norm, 5);
    expect(result[2]).toBeCloseTo(30 / norm, 5);
    expect(result[3]).toBeCloseTo(0, 5);
    expect(result[4]).toBeCloseTo(0, 5);
    expect(result[5]).toBeCloseTo(0, 5);
  });
});
