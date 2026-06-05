import Papa from "papaparse";
import type { CsvRow } from "./types";

export type ParsedInvoiceCSV = {
  headers: string[];
  rows: CsvRow[];
  warning: string | null;
};

export function parseInvoiceCSV(text: string): ParsedInvoiceCSV {
  if (!text || !text.trim()) {
    throw new Error("That file looks empty.");
  }

  const parsed = Papa.parse<CsvRow>(text.trim(), {
    header: true,
    skipEmptyLines: "greedy",
  });

  const headers = (parsed.meta.fields || []).filter((header) => header && header.trim());
  const rows = (parsed.data || []).filter((row) => Object.values(row).some((value) => value !== null && String(value).trim() !== ""));

  if (!headers.length) {
    throw new Error("No column headers found. Make sure the first row names your columns.");
  }
  if (!rows.length) {
    throw new Error("No data rows found below the header.");
  }

  let warning: string | null = null;
  if (parsed.errors && parsed.errors.length) {
    const rowsAffected = [...new Set(parsed.errors.map((error) => error.row).filter((row) => row !== undefined))].slice(0, 5);
    if (rowsAffected.length) {
      warning = `We had trouble with ${parsed.errors.length} row${parsed.errors.length > 1 ? "s" : ""} (around row ${rowsAffected
        .map((row) => Number(row) + 2)
        .join(", ")}). They've been skipped or partially read - check those lines in your file if numbers look off.`;
    }
  }

  return { headers, rows, warning };
}

