export function todayMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let text = String(value).trim();
  if (!text) return null;

  // Accounting negative: (1,100.00) means -1100.00
  let negative = false;
  const parens = text.match(/^\((.+)\)$/);
  if (parens) {
    negative = true;
    text = parens[1];
  }
  // Trailing minus: "1100-" used by some exports
  if (/^[\d.,$\sAUD]*-$/.test(text)) {
    negative = true;
    text = text.slice(0, -1);
  }

  text = text.replace(/^(AUD|AU\$|A\$)/i, "").replace(/[$,\s]/g, "");
  if (!/^-?\d*\.?\d+$/.test(text)) return null;

  const parsed = Number.parseFloat(text);
  if (Number.isNaN(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

function buildValidDate(year: number, month: number, day: number): Date | null {
  if (year < 1900 || year > 2200 || month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(year, month, day);
  // Reject silent rollover, e.g. 31/02 becoming 3 March
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

/**
 * Strict date parser. Day-first (Australian) for numeric formats.
 * Returns null for anything ambiguous or invalid rather than guessing -
 * a silently wrong due date is worse than a flagged unreadable one.
 */
export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value).trim();
  if (!text) return null;

  // ISO: yyyy-mm-dd (optionally with a time part, which is ignored)
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})([T\s].*)?$/);
  if (match) return buildValidDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  // AU numeric: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy (day first, always)
  match = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    return buildValidDate(year, Number(match[2]) - 1, Number(match[1]));
  }

  // Month-name: "5 Jun 2026", "05-Jun-2026", "5 June 2026"
  match = text.match(/^(\d{1,2})[\s\-/]([A-Za-z]{3,9})\.?[\s\-/,]+(\d{4})$/);
  if (match) {
    const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
    if (month === undefined) return null;
    return buildValidDate(Number(match[3]), month, Number(match[1]));
  }

  // Month-name first: "Jun 5, 2026", "June 5 2026"
  match = text.match(/^([A-Za-z]{3,9})\.?[\s\-/]+(\d{1,2})[\s,]+(\d{4})$/);
  if (match) {
    const month = MONTHS[match[1].slice(0, 3).toLowerCase()];
    if (month === undefined) return null;
    return buildValidDate(Number(match[3]), month, Number(match[2]));
  }

  return null;
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function fmtMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return "$" + Math.round(value).toLocaleString("en-AU");
}

/** Exact amount with cents - use in exports, where rounding breaks reconciliation. */
export function fmtMoneyExact(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return value.toFixed(2);
}

export function fmtDate(value: Date | null | undefined) {
  if (!value) return "-";
  return value.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toISODate(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
