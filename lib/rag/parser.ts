import * as cheerio from "cheerio";
import * as XLSX from "xlsx";
import { validateUrl, safeFetch } from "@/lib/url-security";

export interface ParsedDocument {
  content: string;
  metadata: {
    title?: string;
    source: string;
    pageCount?: number;
  };
}

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return {
    content: sanitizeText(result.text),
    metadata: {
      title: result.info?.Title,
      source: "pdf",
      pageCount: result.numpages,
    },
  };
}

export async function parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return {
    content: sanitizeText(result.value),
    metadata: {
      source: "docx",
    },
  };
}

export async function parseTXT(buffer: Buffer): Promise<ParsedDocument> {
  return {
    content: sanitizeText(buffer.toString("utf-8")),
    metadata: {
      source: "txt",
    },
  };
}

export async function parseCSV(buffer: Buffer): Promise<ParsedDocument> {
  const { parse } = await import("csv-parse/sync");
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
  });

  // Convert CSV rows to readable text
  const content = (records as Record<string, string>[])
    .map((record) => {
      return Object.entries(record)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    })
    .join("\n");

  return {
    content: sanitizeText(content),
    metadata: {
      source: "csv",
    },
  };
}

export async function parseXLSX(buffer: Buffer): Promise<ParsedDocument> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const allContent: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to JSON (array of arrays)
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (data.length === 0) continue;

    allContent.push(`=== Sheet: ${sheetName} ===`);

    // Get column headers from first row
    const headers = Object.keys(data[0]);

    // Convert each row to readable text
    for (const row of data) {
      const rowText = headers
        .map((header) => {
          const val = row[header];
          const strVal = val !== null && val !== undefined ? String(val) : "";
          return `${header}: ${strVal}`;
        })
        .join(", ");
      allContent.push(rowText);
    }
  }

  return {
    content: sanitizeText(allContent.join("\n")),
    metadata: {
      source: "xlsx",
      title: workbook.SheetNames.join(", "),
    },
  };
}

/**
 * Sanitize text to remove problematic Unicode characters.
 * Removes BOM (U+FEFF), zero-width characters, and replaces
 * special dashes/quotes with ASCII equivalents.
 * This prevents ByteString errors in HTTP headers and API calls.
 */
export function sanitizeText(text: string): string {
  return (
    text
      // Remove BOM and zero-width characters
      .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "")
      // Replace smart quotes with ASCII equivalents
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      // Replace special dashes with regular hyphen
      .replace(/[\u2012\u2013\u2014\u2015]/g, "-")
      // Replace ellipsis
      .replace(/[\u2026]/g, "...")
      // Replace non-breaking space with regular space
      .replace(/[\u00A0]/g, " ")
      // Remove any remaining control characters except newline/tab
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  );
}

export async function parseURL(url: string): Promise<ParsedDocument> {
  // SSRF protection — validate URL before fetching
  const validation = await validateUrl(url);
  if (!validation.valid) {
    throw new Error(`URL validation failed: ${validation.error}`);
  }

  // Safe fetch with size limits, timeout, and redirect validation
  const result = await safeFetch(url, { maxBytes: 5 * 1024 * 1024, timeoutMs: 10_000 });
  if (!result.ok) {
    throw new Error(`Failed to fetch URL: ${result.error}`);
  }

  const html = result.body;
  const $ = cheerio.load(html);

  // Remove script and style elements
  $("script, style, nav, footer, header").remove();

  // Extract title
  const title = $("title").text().trim();

  // Extract main content
  const content = sanitizeText(
    $("body").text().replace(/\s+/g, " ").trim()
  );

  return {
    content,
    metadata: {
      title,
      source: "url",
    },
  };
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

/**
 * Check if a file type is an image.
 */
export function isImageFile(fileType: string): boolean {
  return IMAGE_EXTENSIONS.has(fileType.toLowerCase());
}

/**
 * Parse an image file. Returns empty content because image content
 * is processed separately via OCR and vision in image-processor.ts.
 */
export async function parseImage(
  _buffer: Buffer,
  fileType: string
): Promise<ParsedDocument> {
  return {
    content: "",
    metadata: {
      source: fileType.toLowerCase(),
    },
  };
}

export async function parseFile(
  buffer: Buffer,
  fileType: string,
  url?: string
): Promise<ParsedDocument> {
  let result: ParsedDocument;

  try {
    switch (fileType.toLowerCase()) {
      case "pdf":
        result = await parsePDF(buffer);
        break;
      case "docx":
        result = await parseDOCX(buffer);
        break;
      case "txt":
        result = await parseTXT(buffer);
        break;
      case "csv":
        result = await parseCSV(buffer);
        break;
      case "xlsx":
      case "xls":
        result = await parseXLSX(buffer);
        break;
      case "url":
        if (!url) throw new Error("URL is required for URL parsing");
        result = await parseURL(url);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error(
      `[Parser] Error parsing ${fileType} file:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }

  // Post-parse content validation
  if (fileType !== "url" && !result.content.trim()) {
    console.warn(
      `[Parser] Warning: ${fileType} file produced empty content. File may be malformed, image-only, or have extraction issues.`
    );
  }

  return result;
}
