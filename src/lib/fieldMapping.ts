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

const ALIASES: Record<FieldKey, string[]> = {
  invoice_number: ["invoice no", "invoice number", "invoice #", "invoice", "inv no", "inv", "number", "doc no", "reference", "ref"],
  customer_name: ["customer", "client", "customer name", "client name", "company", "account name", "debtor"],
  contact_name: ["contact name", "contact", "attention", "attn", "contact person", "first name", "recipient"],
  customer_abn: ["abn", "customer abn", "business number", "client abn", "tax number"],
  customer_email: ["email", "customer email", "client email", "contact email", "e-mail"],
  invoice_date: ["invoice date", "issue date", "date", "created", "issued", "date issued"],
  due_date: ["due date", "due", "payment due", "date due", "expiry"],
  paid_date: ["paid date", "date paid", "payment date", "settled", "paid on"],
  amount_ex_gst: ["amount (ex gst)", "amount ex gst", "ex gst", "subtotal", "net", "net amount", "excl gst", "amount excl"],
  gst_amount: ["gst", "gst amount", "tax", "vat", "tax amount"],
  amount_inc_gst: ["total", "total amount", "amount", "amount (inc gst)", "inc gst", "gross", "invoice total", "grand total", "incl gst"],
  amount_paid: ["amount paid", "paid", "paid amount", "received", "payment received"],
  status: ["status", "state of invoice", "invoice status", "payment status"],
  payment_terms: ["terms", "payment terms", "term", "net terms"],
  state: ["state", "region", "territory", "location"],
};

const normalizeHeader = (value: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[_\-./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function emptyFieldMap(): FieldMap {
  return Object.fromEntries(FIELDS.map((field) => [field.key, ""])) as FieldMap;
}

export function autoMap(headers: string[]): FieldMap {
  const map = emptyFieldMap();
  const used = new Set<string>();

  FIELDS.forEach((field) => {
    const candidates = [field.label, ...(ALIASES[field.key] || [])].map(normalizeHeader);
    let best = "";

    headers.forEach((header) => {
      if (used.has(header)) return;
      const normalized = normalizeHeader(header);
      if (candidates.includes(normalized)) best = header;
    });

    if (!best) {
      headers.forEach((header) => {
        if (used.has(header) || best) return;
        const normalized = normalizeHeader(header);
        const likelyMatch = candidates.some(
          (candidate) =>
            candidate &&
            (normalized.includes(candidate) || candidate.includes(normalized)) &&
            Math.abs(normalized.length - candidate.length) < 6,
        );
        if (likelyMatch) best = header;
      });
    }

    if (best) {
      map[field.key] = best;
      used.add(best);
    }
  });

  return map;
}

