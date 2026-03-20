import { readFileSync } from "fs";
import { log, error } from "../../utils/logger.js";

export interface ParsedCsv {
  commentLines: string[];
  header: string[];
  separator: string;
  rows: Record<string, string>[];
}

const COMMENT_PREFIX = "#";
const SEP_LINE_PREFIX = "Sep=";

function detectSeparator(commentLines: string[], headerLine: string): string {
  const sepLine = commentLines.find((l) => l.startsWith(SEP_LINE_PREFIX));
  if (sepLine) {
    const sep = sepLine.slice(SEP_LINE_PREFIX.length).trim();
    return sep || ";";
  }
  return headerLine.includes(";") ? ";" : ",";
}

function findColumnIndex(header: string[], name: string): number {
  const lower = name.toLowerCase();
  const i = header.findIndex((h) => h.trim().toLowerCase() === lower);
  return i >= 0 ? i : -1;
}

export function parseVillagesCsv(filePath: string): ParsedCsv {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((line) => line.length > 0);

  const commentLines: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith(COMMENT_PREFIX) || line.startsWith(SEP_LINE_PREFIX)) {
      commentLines.push(line);
      i++;
    } else {
      break;
    }
  }

  if (i >= lines.length) {
    throw new Error("CSV has no header or data rows");
  }

  const headerLine = lines[i];
  const separator = detectSeparator(commentLines, headerLine);
  const header = headerLine.split(separator).map((c) => c.trim());
  i++;

  const xIdx = findColumnIndex(header, "x");
  const zIdx = findColumnIndex(header, "z");
  if (xIdx < 0 || zIdx < 0) {
    throw new Error(
      `CSV must have 'x' and 'z' columns (case-insensitive). Found columns: ${header.join(", ")}`
    );
  }

  const rows: Record<string, string>[] = [];
  for (; i < lines.length; i++) {
    const parts = lines[i].split(separator);
    const row: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      row[header[c]] = parts[c]?.trim() ?? "";
    }
    const xRaw = row[header[xIdx]];
    const zRaw = row[header[zIdx]];
    const x = parseInt(xRaw, 10);
    const z = parseInt(zRaw, 10);
    if (Number.isNaN(x) || Number.isNaN(z)) {
      error("Skipping invalid row (x=%s, z=%s) at line %d", xRaw, zRaw, i + 1);
      continue;
    }
    rows.push(row);
  }

  log("Parsed %d rows from %s", rows.length, filePath);
  return { commentLines, header, separator, rows };
}
