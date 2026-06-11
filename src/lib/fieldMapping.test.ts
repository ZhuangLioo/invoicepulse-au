import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseInvoiceCSV } from "./csvParser";
import { autoMap, detectPreset, emptyFieldMap, FIELDS } from "./fieldMapping";

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`../../samples/${name}`, import.meta.url)), "utf8");

describe("autoMap - generic spreadsheet headers", () => {
  it("maps the bundled sample CSV completely", () => {
    const headers = "Invoice No,Customer,ABN,Contact Name,Email,Invoice Date,Due Date,Paid Date,Amount (ex GST),GST,Total,Amount Paid,Status,Terms,State".split(",");
    const map = autoMap(headers);
    FIELDS.forEach((field) => {
      expect(map[field.key], `field ${field.key}`).not.toBe("");
    });
  });

  it("leaves unknown headers unmapped", () => {
    const map = autoMap(["Foo", "Bar"]);
    expect(map.invoice_number).toBe("");
    expect(map.amount_inc_gst).toBe("");
  });
});

describe("autoMap - Xero-style export", () => {
  const parsed = parseInvoiceCSV(fixture("fixture-xero-style.csv"));
  const map = autoMap(parsed.headers);

  it("is detected as a Xero layout", () => {
    expect(detectPreset(parsed.headers)).toBe("xero");
  });

  it("maps all required and key optional fields", () => {
    expect(map.invoice_number).toBe("InvoiceNumber");
    expect(map.customer_name).toBe("ContactName");
    expect(map.customer_email).toBe("EmailAddress");
    expect(map.invoice_date).toBe("InvoiceDate");
    expect(map.due_date).toBe("DueDate");
    expect(map.amount_inc_gst).toBe("Total");
    expect(map.gst_amount).toBe("TaxTotal");
    expect(map.amount_paid).toBe("InvoiceAmountPaid");
    expect(map.status).toBe("Status");
  });
});

describe("autoMap - MYOB-style export", () => {
  const parsed = parseInvoiceCSV(fixture("fixture-myob-style.csv"));
  const map = autoMap(parsed.headers);

  it("is detected as a MYOB layout", () => {
    expect(detectPreset(parsed.headers)).toBe("myob");
  });

  it("maps all required fields", () => {
    expect(map.invoice_number).toBe("Invoice No.");
    expect(map.customer_name).toBe("Co./Last Name");
    expect(map.customer_email).toBe("Addr 1 - Email");
    expect(map.due_date).toBe("Due Date");
    expect(map.amount_inc_gst).toBe("Amount");
    expect(map.gst_amount).toBe("GST Amount");
    expect(map.amount_paid).toBe("Amount Paid");
    expect(map.payment_terms).toBe("Terms of Payment");
  });
});

describe("autoMap - QuickBooks-style export", () => {
  const parsed = parseInvoiceCSV(fixture("fixture-quickbooks-style.csv"));
  const map = autoMap(parsed.headers);

  it("is detected as a QuickBooks layout", () => {
    expect(detectPreset(parsed.headers)).toBe("quickbooks");
  });

  it("maps all required fields", () => {
    expect(map.invoice_number).toBe("Num");
    expect(map.customer_name).toBe("Name");
    expect(map.invoice_date).toBe("Txn Date");
    expect(map.due_date).toBe("Due Date");
    expect(map.amount_inc_gst).toBe("Amount");
    expect(map.payment_terms).toBe("Terms");
  });
});

describe("detectPreset", () => {
  it("returns null for generic headers", () => {
    expect(detectPreset(["Invoice No", "Customer", "Due Date", "Total"])).toBeNull();
  });
});

describe("emptyFieldMap", () => {
  it("contains every canonical field, unmapped", () => {
    const map = emptyFieldMap();
    expect(Object.keys(map)).toHaveLength(FIELDS.length);
    Object.values(map).forEach((value) => expect(value).toBe(""));
  });
});
