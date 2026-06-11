import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseInvoiceCSV } from "./csvParser";
import { autoMap } from "./fieldMapping";
import { analyze, classifyStatus, parseTermsDays, validABN } from "./invoiceAnalysis";
import type { FieldMap } from "./types";

const asOf = new Date(2026, 5, 5); // 5 June 2026

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`../../samples/${name}`, import.meta.url)), "utf8");

function run(csv: string, mapOverride?: Partial<FieldMap>) {
  const parsed = parseInvoiceCSV(csv);
  const map = { ...autoMap(parsed.headers), ...mapOverride };
  return analyze(parsed.rows, map, asOf);
}

describe("validABN", () => {
  it("validates ABN checksum", () => {
    expect(validABN("53004085260")).toBe(true);
    expect(validABN("51 824 753 556")).toBe(true); // spaces are tolerated
    expect(validABN("12345678901")).toBe(false);
    expect(validABN("1234")).toBe(false);
    expect(validABN("")).toBeNull();
  });
});

describe("classifyStatus", () => {
  it("treats Unpaid as active, not paid (token matching, never substrings)", () => {
    expect(classifyStatus("Unpaid")).toBe("active");
    expect(classifyStatus("Not Paid")).toBe("active");
  });

  it("treats paid-like statuses as paid", () => {
    expect(classifyStatus("Paid")).toBe("paid");
    expect(classifyStatus("PAID")).toBe("paid");
    expect(classifyStatus("Settled")).toBe("paid");
    expect(classifyStatus("Closed")).toBe("paid");
    expect(classifyStatus("Paid by credit card")).toBe("paid"); // "credit" here must not mean credit note
  });

  it("treats draft/void/cancelled/written-off/credit-note as dead", () => {
    expect(classifyStatus("Draft")).toBe("dead");
    expect(classifyStatus("Void")).toBe("dead");
    expect(classifyStatus("Voided")).toBe("dead");
    expect(classifyStatus("Cancelled")).toBe("dead");
    expect(classifyStatus("Written Off")).toBe("dead");
    expect(classifyStatus("Write-off")).toBe("dead");
    expect(classifyStatus("Credit Note")).toBe("dead");
    expect(classifyStatus("Credit")).toBe("dead");
  });

  it("defaults unknown statuses to active", () => {
    expect(classifyStatus("Sent")).toBe("active");
    expect(classifyStatus("AUTHORISED")).toBe("active");
    expect(classifyStatus("")).toBe("active");
  });
});

describe("parseTermsDays", () => {
  it("reads common Australian terms formats", () => {
    expect(parseTermsDays("14 days")).toBe(14);
    expect(parseTermsDays("Net 30")).toBe(30);
    expect(parseTermsDays("7")).toBe(7);
    expect(parseTermsDays("COD")).toBe(0);
    expect(parseTermsDays("Due on receipt")).toBe(0);
  });

  it("returns null when terms are absent or unreadable", () => {
    expect(parseTermsDays("")).toBeNull();
    expect(parseTermsDays("whenever")).toBeNull();
  });
});

describe("overdue and exclusion rules", () => {
  it("detects overdue invoices and excludes draft or void records", () => {
    const csv = `Invoice No,Customer,Contact Name,ABN,Email,Invoice Date,Due Date,Paid Date,Amount (ex GST),GST,Total,Amount Paid,Status,Terms,State
INV-1,Coastline Cafe Pty Ltd,Dana,53004085260,accounts@example.com,2026-05-01,2026-05-15,,1000,100,1100,0,Sent,14 days,NSW
INV-2,Draftwork Studio,Alex,,alex@example.com,2026-05-01,2026-05-15,,1000,100,1100,0,Draft,14 days,NSW
INV-3,Cancelled Order Co,Pat,,pat@example.com,2026-05-01,2026-05-15,,1000,100,1100,0,Void,14 days,VIC`;
    const result = run(csv);

    expect(result.metrics.total).toBe(3);
    expect(result.metrics.deadCount).toBe(2);
    expect(result.metrics.active).toBe(1);
    expect(result.metrics.totalOutstanding).toBe(1100);
    expect(result.metrics.overdueCount).toBe(1);
    expect(result.actionList[0].daysOverdue).toBe(21);
  });

  it("keeps Unpaid invoices in receivables (regression for substring bug)", () => {
    const csv = `Invoice No,Customer,Due Date,Total,Status
INV-1,Acme,2026-05-01,1100,Unpaid`;
    const result = run(csv);
    expect(result.metrics.active).toBe(1);
    expect(result.metrics.overdueCount).toBe(1);
  });

  it("reduces outstanding by partial payments", () => {
    const csv = `Invoice No,Customer,Due Date,Total,Amount Paid,Status
INV-1,Acme,2026-05-01,1100,400,Sent`;
    const result = run(csv);
    expect(result.metrics.totalOutstanding).toBe(700);
    expect(result.records[0].partial).toBe(true);
  });

  it("does not mark paid invoices overdue", () => {
    const csv = `Invoice No,Customer,Due Date,Total,Amount Paid,Status
INV-1,Acme,2026-05-01,1100,1100,Paid`;
    const result = run(csv);
    expect(result.metrics.overdueCount).toBe(0);
    expect(result.metrics.paidCount).toBe(1);
  });
});

describe("data quality issues", () => {
  it("flags duplicates, bad ABN, GST mismatch, and missing email", () => {
    const csv = `Invoice No,Customer,ABN,Email,Invoice Date,Due Date,Amount (ex GST),GST,Total,Amount Paid,Status
INV-1,Greenline Landscaping,12345678901,,2026-05-01,2026-05-10,1000,50,1100,0,Sent
INV-1,Greenline Landscaping,12345678901,,2026-05-01,2026-05-10,1000,50,1100,0,Sent`;
    const result = run(csv);

    const issues = result.records.flatMap((record) => record.issues.map((issue) => issue.t));
    expect(issues).toContain("Duplicate invoice no.");
    expect(issues).toContain("Invalid ABN (checksum)");
    expect(issues).toContain("GST not ~10%");
    expect(issues).toContain("No contact email");
  });

  it("flags an unreadable due date as an error, not as missing", () => {
    const csv = `Invoice No,Customer,Due Date,Total,Status
INV-1,Acme,31/02/2026,1100,Sent`;
    const result = run(csv);
    const issues = result.records[0].issues.map((issue) => issue.t);
    expect(issues).toContain("Unreadable due date");
    expect(issues).not.toContain("Missing due date");
    expect(result.records[0].hasErr).toBe(true);
  });

  it("flags a truly missing due date", () => {
    const csv = `Invoice No,Customer,Due Date,Total,Status
INV-1,Acme,,1100,Sent`;
    const result = run(csv);
    expect(result.records[0].issues.map((issue) => issue.t)).toContain("Missing due date");
  });
});

describe("due date inference from terms", () => {
  it("infers due date as invoice date + terms when due date is blank", () => {
    const csv = `Invoice No,Customer,Invoice Date,Due Date,Total,Status,Terms
INV-1,Acme,2026-05-01,,1100,Sent,14 days`;
    const result = run(csv);
    const record = result.records[0];
    expect(record.dueInferred).toBe(true);
    expect(record.due).toEqual(new Date(2026, 4, 15));
    expect(record.daysOverdue).toBe(21);
    const issues = record.issues.map((issue) => issue.t);
    expect(issues.some((text) => text.startsWith("Due date inferred"))).toBe(true);
    expect(issues).not.toContain("Missing due date");
  });

  it("does not infer when the due date is present but unreadable", () => {
    const csv = `Invoice No,Customer,Invoice Date,Due Date,Total,Status,Terms
INV-1,Acme,2026-05-01,garbage,1100,Sent,14 days`;
    const result = run(csv);
    expect(result.records[0].dueInferred).toBe(false);
    expect(result.records[0].issues.map((issue) => issue.t)).toContain("Unreadable due date");
  });
});

describe("receivables aging", () => {
  it("buckets open invoices into current / 1-30 / 31-60 / 61-90 / 90+", () => {
    const csv = `Invoice No,Customer,Due Date,Total,Status
INV-1,A,2026-06-20,100,Sent
INV-2,B,2026-05-26,200,Sent
INV-3,C,2026-04-20,300,Sent
INV-4,D,2026-03-20,400,Sent
INV-5,E,2025-12-01,500,Sent`;
    const result = run(csv);
    const byKey = Object.fromEntries(result.aging.map((bucket) => [bucket.key, bucket]));
    expect(byKey.current.amount).toBe(100);
    expect(byKey.d1_30.amount).toBe(200);
    expect(byKey.d31_60.amount).toBe(300);
    expect(byKey.d61_90.amount).toBe(400);
    expect(byKey.d90plus.amount).toBe(500);
    expect(result.aging.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(5);
  });

  it("computes outstanding-weighted receivable age", () => {
    const csv = `Invoice No,Customer,Invoice Date,Due Date,Total,Status
INV-1,A,2026-05-26,2026-06-20,100,Sent
INV-2,B,2026-03-07,2026-04-20,300,Sent`;
    const result = run(csv);
    // ages: 10d (weight 100), 90d (weight 300) -> (10*100 + 90*300) / 400 = 70
    expect(result.metrics.weightedAgeDays).toBe(70);
  });
});

describe("priority scoring", () => {
  it("ranks bigger, older debts from repeat late payers higher", () => {
    const csv = `Invoice No,Customer,Email,Invoice Date,Due Date,Paid Date,Total,Amount Paid,Status
INV-1,Slow Co,slow@x.com,2026-01-01,2026-01-15,,12000,0,Sent
INV-2,Slow Co,slow@x.com,2025-10-01,2025-10-15,2025-11-20,5000,5000,Paid
INV-3,Quick Co,quick@x.com,2026-05-15,2026-05-29,,500,0,Sent`;
    const result = run(csv);
    expect(result.actionList[0].customer).toBe("Slow Co");
    expect(result.actionList[0].priority).toBeGreaterThan(result.actionList[1].priority);
    expect(result.actionList[0].reasons.join(" ")).toMatch(/late payer|overdue/);
  });

  it("flags missing email as an action blocker in scoring reasons", () => {
    const csv = `Invoice No,Customer,Due Date,Total,Status
INV-1,No Email Co,2026-05-01,5000,Sent`;
    const result = run(csv);
    expect(result.actionList[0].reasons).toContain("no email on file");
  });
});

describe("end-to-end on accounting-package fixtures", () => {
  it("analyses the Xero-style fixture", () => {
    const parsed = parseInvoiceCSV(fixture("fixture-xero-style.csv"));
    const result = analyze(parsed.rows, autoMap(parsed.headers), asOf);
    expect(result.metrics.total).toBe(5);
    expect(result.metrics.deadCount).toBe(1); // DRAFT row
    expect(result.metrics.paidCount).toBe(1);
    // 4620 + 1915 (part-paid) + 7200 open
    expect(result.metrics.totalOutstanding).toBeCloseTo(13735, 2);
  });

  it("analyses the MYOB-style fixture with currency-formatted amounts", () => {
    const parsed = parseInvoiceCSV(fixture("fixture-myob-style.csv"));
    const result = analyze(parsed.rows, autoMap(parsed.headers), asOf);
    expect(result.metrics.deadCount).toBe(1); // Credit row
    expect(result.metrics.totalOutstanding).toBeCloseTo(16940 + 1375 + 7920, 2);
  });

  it("analyses the QuickBooks-style fixture", () => {
    const parsed = parseInvoiceCSV(fixture("fixture-quickbooks-style.csv"));
    const result = analyze(parsed.rows, autoMap(parsed.headers), asOf);
    expect(result.metrics.paidCount).toBe(1);
    expect(result.metrics.overdueCount).toBeGreaterThanOrEqual(2);
  });
});
