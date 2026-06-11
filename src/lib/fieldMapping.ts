import type { FieldDefinition, FieldKey, FieldMap } from "./types";

export const FIELDS: FieldDefinition[] = [
  { key: "invoice_number", label: "Invoice No.", req: true },
  { key: "customer_name", label: "Customer", req: true },
  { key: "contact_name", label: "Contact Name", req: false },
  { key: "customer_abn", label: "ABN", req: false },
  { key: "customer_email", label: "Email", req: false },
  { key: "invoice_date", label: "Invoice Date", req: false },
  { key: "due_date", label: "Due Date", req: true },
  { key: "paid_date", label: "Paid Date", req: false },
  { key: "amount_ex_gst", label: "Amount (ex GST)", req: false },
  { key: "gst_amount", label: "GST", req: false },
  { key: "amount_inc_gst", label: "Total", req: true },
  { key: "amount_paid", label: "Amount Paid", req: false },
  { key: "status", label: "Status", req: false },
  { key: "payment_terms", label: "Terms", req: false },
  { key: "state", label: "State", req: false },
];

// Aliases cover common spreadsheet headers plus headers modelled on Xero, MYOB,
// and QuickBooks CSV exports (e.g. Xero "InvoiceNumber"/"ContactName"/"TaxTotal",
// QuickBooks "Open balance"/"No.", MYOB "Customer PO/Invoice No."-style labels).
const ALIASES: Record<FieldKey, string[]> = {
  invoice_number: ["invoice no", "invoice number", "invoicenumber", "invoice #", "invoice", "inv no", "inv", "number", "no", "num", "doc no", "reference", "ref", "transaction number"],
  customer_name: ["customer", "client", "customer name", "client name", "company", "account name", "debtor", "contact", "contactname", "contact name 1", "co last name", "name"],
  contact_name: ["contact name", "attention", "attn", "contact person", "first name", "recipient", "addressee"],
  customer_abn: ["abn", "customer abn", "business number", "client abn", "tax number", "abn branch"],
  customer_email: ["email", "customer email", "client email", "contact email", "e-mail", "emailaddress", "email address", "addr 1 email"],
  invoice_date: ["invoice date", "invoicedate", "issue date", "date", "created", "issued", "date issued", "transaction date", "txn date"],
  due_date: ["due date", "duedate", "due", "payment due", "date due", "expiry", "payment due date", "due dates"],
  paid_date: ["paid date", "date paid", "payment date", "settled", "paid on", "last payment date", "fully paid on", "fullypaidondate"],
  amount_ex_gst: ["amount (ex gst)", "amount ex gst", "ex gst", "subtotal", "net", "net amount", "excl gst", "amount excl", "subtotal amount", "taxable amount"],
  gst_amount: ["gst", "gst amount", "tax", "vat", "tax amount", "taxtotal", "tax total", "total tax", "gst total"],
  amount_inc_gst: ["total", "total amount", "amount", "amount (inc gst)", "inc gst", "gross", "invoice total", "grand total", "incl gst", "invoice amount", "total inc gst"],
  amount_paid: ["amount paid", "paid", "paid amount", "received", "payment received", "amountpaid", "invoiceamountpaid", "amount applied", "total paid"],
  status: ["status", "state of invoice", "invoice status", "payment status", "invoicestatus"],
  payment_terms: ["terms", "payment terms", "term", "net terms", "payment is due", "terms of payment"],
  state: ["state", "region", "territory", "location", "billing state"],
};

// "Open balance" / "Amount due" style headers mean outstanding, not the invoice
// total - mapped to Total only when nothing better exists (kept out of ALIASES).
const BALANCE_FALLBACKS = ["open balance", "balance due", "amount due", "amountdue", "invoiceamountdue", "outstanding", "outstanding amount", "balance"];

export type FormatPreset = "xero" | "myob" | "quickbooks";

// Signature headers modelled on each product's export layout. Detection is
// informational only - mapping still goes through autoMap + user confirmation.
const PRESET_SIGNATURES: Record<FormatPreset, string[]> = {
  xero: ["invoicenumber", "contactname", "taxtotal"],
  myob: ["co last name", "invoice no", "gst amount"],
  quickbooks: ["open balance", "txn date", "num"],
};

const normalizeHeader = (value: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[_\-./#*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function detectPreset(headers: string[]): FormatPreset | null {
  const normalized = headers.map(normalizeHeader);
  const entries = Object.entries(PRESET_SIGNATURES) as Array<[FormatPreset, string[]]>;
  for (const [preset, signature] of entries) {
    const hits = signature.filter((header) => normalized.includes(header)).length;
    if (hits >= 2) return preset;
  }
  return null;
}

export const PRESET_LABELS: Record<FormatPreset, string> = {
  xero: "Xero",
  myob: "MYOB",
  quickbooks: "QuickBooks",
};

export function emptyFieldMap(): FieldMap {
  return Object.fromEntries(FIELDS.map((field) => [field.key, ""])) as FieldMap;
}

export function autoMap(headers: string[]): FieldMap {
  const map = emptyFieldMap();
  const used = new Set<string>();
  const candidatesFor = (key: FieldKey) => {
    const field = FIELDS.find((item) => item.key === key)!;
    return [field.label, ...(ALIASES[key] || [])].map(normalizeHeader);
  };

  // Pass 1: exact alias matches for every field first, so a generic alias on one
  // field can never steal a column another field matches exactly (e.g. "Due Date"
  // must reach due_date before invoice_date's fuzzy "date" sees it).
  FIELDS.forEach((field) => {
    const candidates = candidatesFor(field.key);
    let best = "";
    headers.forEach((header) => {
      if (used.has(header)) return;
      if (candidates.includes(normalizeHeader(header))) best = header;
    });
    if (best) {
      map[field.key] = best;
      used.add(best);
    }
  });

  // Pass 2: fuzzy match leftovers only - header must contain the alias.
  FIELDS.forEach((field) => {
    if (map[field.key]) return;
    const candidates = candidatesFor(field.key);
    let best = "";
    headers.forEach((header) => {
      if (used.has(header) || best) return;
      const normalized = normalizeHeader(header);
      const likelyMatch = candidates.some((candidate) => candidate && normalized.includes(candidate) && Math.abs(normalized.length - candidate.length) < 6);
      if (likelyMatch) best = header;
    });
    if (best) {
      map[field.key] = best;
      used.add(best);
    }
  });

  // Last resort for the required total: accept an outstanding-balance column.
  if (!map.amount_inc_gst) {
    headers.forEach((header) => {
      if (map.amount_inc_gst || used.has(header)) return;
      if (BALANCE_FALLBACKS.includes(normalizeHeader(header))) {
        map.amount_inc_gst = header;
        used.add(header);
      }
    });
  }

  return map;
}
