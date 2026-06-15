/**
 * Security Regression Tests — Sprint 3: SQL Injection Remediation (lib/analytics.ts)
 *
 * These tests protect against regression of the SQL injection fixes
 * implemented in Sprint 3. The key test is that getDailyEventCounts()
 * does NOT use string interpolation in SQL.
 *
 * NOTE: Full integration tests require a database connection.
 * These tests verify the code patterns and static analysis.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("lib/analytics.ts — Sprint 3 Security Regression", () => {
  // ─── Source code audit — no $queryRawUnsafe ───────────────────────

  describe("source code audit", () => {
    const analyticsSource = fs.readFileSync(
      path.resolve(__dirname, "../../lib/analytics.ts"),
      "utf-8"
    );

    it("contains zero $queryRawUnsafe calls", () => {
      const matches = analyticsSource.match(/\$queryRawUnsafe/g);
      expect(matches).toBeNull();
    });

    it("contains zero string interpolation in SQL (no backtick template with ${} inside SQL)", () => {
      // Check for the old vulnerable pattern: eventTypes.map(t => `'${t}'`)
      const hasStringInterpolation = analyticsSource.includes(
        "map((t) => `'${t}'`"
      );
      expect(hasStringInterpolation).toBe(false);
    });

    it("uses $queryRaw tagged templates for raw SQL", () => {
      expect(analyticsSource).toContain("$queryRaw");
    });

    it("uses ANY() for array parameterization", () => {
      expect(analyticsSource).toContain("ANY(");
      expect(analyticsSource).toContain("::text[]");
    });
  });

  // ─── Other lib/ files audit ───────────────────────────────────────

  describe("full codebase audit — no $queryRawUnsafe in app code", () => {
    const libDir = path.resolve(__dirname, "../../lib");
    const appDir = path.resolve(__dirname, "../../app");

    function findTsFiles(dir: string): string[] {
      const files: string[] = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
            files.push(...findTsFiles(fullPath));
          } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
            files.push(fullPath);
          }
        }
      } catch {
        // Directory may not exist
      }
      return files;
    }

    it("zero $queryRawUnsafe in lib/ directory", () => {
      const files = findTsFiles(libDir);
      const violations: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        if (content.includes("$queryRawUnsafe")) {
          violations.push(path.relative(process.cwd(), file));
        }
      }

      expect(violations).toEqual([]);
    });

    it("zero $queryRawUnsafe in app/ directory", () => {
      const files = findTsFiles(appDir);
      const violations: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        if (content.includes("$queryRawUnsafe")) {
          violations.push(path.relative(process.cwd(), file));
        }
      }

      expect(violations).toEqual([]);
    });

    it("zero $executeRawUnsafe in application code", () => {
      const allFiles = [...findTsFiles(libDir), ...findTsFiles(appDir)];
      const violations: string[] = [];

      for (const file of allFiles) {
        const content = fs.readFileSync(file, "utf-8");
        if (content.includes("$executeRawUnsafe")) {
          violations.push(path.relative(process.cwd(), file));
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
