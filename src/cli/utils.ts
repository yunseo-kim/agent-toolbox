import { resolve } from "node:path";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";

export function green(text: string): string {
  return `${GREEN}${text}${RESET}`;
}

export function red(text: string): string {
  return `${RED}${text}${RESET}`;
}

export function yellow(text: string): string {
  return `${YELLOW}${text}${RESET}`;
}

export function dim(text: string): string {
  return `${DIM}${text}${RESET}`;
}

export function bold(text: string): string {
  return `${BOLD}${text}${RESET}`;
}

export function cyan(text: string): string {
  return `${CYAN}${text}${RESET}`;
}

export function resolveRootDir(metaDir: string): string {
  return resolve(metaDir, "../..");
}

/**
 * Parse CLI arguments into a key-value map.
 * Handles --key value pairs and repeatable --skill flags.
 */
export function parseArgs(argv: string[]): Record<string, string | string[]> {
  const args: Record<string, string | string[]> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const nextToken = argv[i + 1];
    const value = nextToken && !nextToken.startsWith("--") ? nextToken : "true";

    if (key === "skill") {
      const current = args[key];
      if (!Array.isArray(current)) {
        args[key] = current ? [String(current)] : [];
      }
      if (value !== "true") {
        const arr = args[key] as string[];
        arr.push(value);
      }
    } else {
      args[key] = value;
    }

    if (value !== "true") {
      i += 1;
    }
  }

  return args;
}

/**
 * Strip ANSI escape codes from a string for width calculation.
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Truncate a string to maxWidth, appending "..." if truncated.
 */
function truncate(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) {
    return text;
  }
  return text.slice(0, maxWidth - 3) + "...";
}

/**
 * Format data as a column-aligned table string.
 * Computes column widths from headers and cell content.
 */
export function formatTable(
  headers: string[],
  rows: string[][],
  options?: { maxColWidth?: number; padding?: number },
): string {
  const maxColWidth = options?.maxColWidth ?? 60;
  const padding = options?.padding ?? 2;

  // Truncate cells
  const truncatedHeaders = headers.map((h) => truncate(h, maxColWidth));
  const truncatedRows = rows.map((row) =>
    row.map((cell) => truncate(cell, maxColWidth)),
  );

  // Calculate column widths from visible content
  const colWidths = truncatedHeaders.map((h) => stripAnsi(h).length);
  for (const row of truncatedRows) {
    for (let i = 0; i < row.length; i += 1) {
      const cellWidth = stripAnsi(row[i]).length;
      if (i < colWidths.length && cellWidth > colWidths[i]) {
        colWidths[i] = cellWidth;
      }
    }
  }

  const pad = " ".repeat(padding);
  const lines: string[] = [];

  // Header row
  const headerLine = truncatedHeaders
    .map((h, i) => {
      const visible = stripAnsi(h).length;
      return h + " ".repeat(Math.max(0, colWidths[i] - visible));
    })
    .join(pad);
  lines.push(bold(headerLine));

  // Separator
  const separator = colWidths.map((w) => "─".repeat(w)).join(pad);
  lines.push(dim(separator));

  // Data rows
  for (const row of truncatedRows) {
    const rowLine = row
      .map((cell, i) => {
        const visible = stripAnsi(cell).length;
        const width = i < colWidths.length ? colWidths[i] : visible;
        return cell + " ".repeat(Math.max(0, width - visible));
      })
      .join(pad);
    lines.push(rowLine);
  }

  return lines.join("\n");
}
