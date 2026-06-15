/**
 * Vitest setup file — runs before each test file.
 * Configures Testing Library and global test utilities.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});
