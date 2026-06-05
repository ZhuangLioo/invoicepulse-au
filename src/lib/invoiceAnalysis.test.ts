import { describe, expect, it } from "vitest";
import { parseInvoiceCSV } from "./csvParser";
import { autoMap } from "./fieldMapping";
import { analyze, validABN } from "./invoiceAnalysis";

const asOf = new Date(2026, 5, 5);

describe("validABN", () => {
  it("validates ABN checksum", () => {
    expect(validABN("53004085260")).toBe(true);
    expect(validABN("12345678901")).toBe(false);
    expect(validABN("")).toBeNull();
  });
});

describe("invoice analysis", () => {
  it("detects overdue invoices and excludes draft or void records", () => {
    const csv = `Invoice No,Customer,Contact Name,ABN,Email,Invoice Date,Due Date,Paid Date,Amount (ex GST),GST,Total,Amount Paid,Status,Terms,State
INV-1,Coastline Cafe Pty Ltd,Dana,53004085260,accounts@example.com,2026-05-01,2026-05-15,,1000,100,1100,0,Sent,14 days,NSW
INV-2,Draftwork Studio,Alex,,alex@example.com,2026-05-01,2026-05-15,,1000,100,1100,0,Draft,14 days,NSW
INV-3,Cancelled Order Co,Pat,,pat@example.com,2026-05-01,2026-05-15,,1000,100,1100,0,Void,14 days,VIC`;
    const parsed = parseInvoiceCSV(csv);
    const result = analyze(parsed.rows, autoMap(parsed.headers), asOf);

    expect(result.metrics.total).toBe(3);
    expect(result.metrics.deadCount).toBe(2);
    expect(result.metrics.active).toBe(1);
    expect(result.metrics.totalOutstanding).toBe(1100);
    expect(result.metrics.overdueCount).toBe(1);
    expect(result.actionList[0].daysOverdue).toBe(21);
  });

  it("flags data-quality issues", () => {
    const csv = `Invoice No,Customer,ABN,Email,Invoice Date,Due Date,Amount (ex GST),GST,Total,Amount Paid,Status
INV-1,Greenline Landscaping,12345678901,,2026-05-01,2026-05-10,1000,50,1100,0,Sent
INV-1,Greenline Landscaping,12345678901,,2026-05-01,2026-05-10,1000,50,1100,0,Sent`;
    const parsed = parseInvoiceCSV(csv);
    const result = analyze(parsed.rows, autoMap(parsed.headers), asOf);

    const issues = result.records.flatMap((record) => record.issues.map((issue) => issue.t));
    expect(issues).toContain("Duplicate invoice no.");
    expect(issues).toContain("Invalid ABN (checksum)");
    expect(issues).toContain("GST not ~10%");
    expect(issues).toContain("No contact email");
  });
});

