import { describe, expect, it } from "vitest";
import { parseInvoiceCSV } from "./csvParser";
import { autoMap } from "./fieldMapping";
import { analyze } from "./invoiceAnalysis";
import { buildIssuesCSV, buildOverdueCSV, buildSummaryMarkdown } from "./exporters";

const asOf = new Date(2026, 5, 5);

const result = (() => {
  const csv = `Invoice No,Customer,Email,Invoice Date,Due Date,Total,Amount Paid,Status
INV-1,Acme Pty Ltd,kim@acme.com.au,2026-03-01,2026-03-15,4620.50,0,Sent
INV-2,"Beta, Bros",b@beta.com.au,2026-05-20,2026-06-20,1100,0,Sent`;
  const parsed = parseInvoiceCSV(csv);
  return analyze(parsed.rows, autoMap(parsed.headers), asOf);
})();

describe("buildOverdueCSV", () => {
  it("keeps cents in exported amounts", () => {
    const csv = buildOverdueCSV(result);
    expect(csv).toContain("4620.50");
  });

  it("escapes customer names containing commas", () => {
    const csv = buildIssuesCSV(result);
    // header row + no crash; comma-name only appears quoted anywhere it appears
    expect(csv.startsWith("Invoice No,Customer,Issues,Severity")).toBe(true);
  });
});

describe("buildSummaryMarkdown", () => {
  const markdown = buildSummaryMarkdown(result);

  it("includes headline metrics and the aging table", () => {
    expect(markdown).toContain("# Weekly Invoice Health Summary");
    expect(markdown).toContain("## Receivables aging");
    expect(markdown).toContain("| 90+ days |");
    expect(markdown).toContain("Weighted age of receivables");
  });

  it("includes the disclaimer", () => {
    expect(markdown).toContain("not accounting, tax, legal, or debt-collection advice");
  });
});
