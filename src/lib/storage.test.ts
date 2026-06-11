import { describe, expect, it } from "vitest";
import { parseInvoiceCSV } from "./csvParser";
import { autoMap } from "./fieldMapping";
import { analyze, invoiceKey } from "./invoiceAnalysis";
import {
  applyDismissals,
  buildSnapshot,
  diffSnapshot,
  issueDismissKey,
  lastReminder,
  loadReminderLog,
  logReminder,
  suggestTone,
} from "./storage";
import type { ReminderLog } from "./types";

const asOf = new Date(2026, 5, 5);

function fakeStore() {
  const data: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
  };
}

function run(csv: string) {
  const parsed = parseInvoiceCSV(csv);
  return analyze(parsed.rows, autoMap(parsed.headers), asOf);
}

describe("reminder log", () => {
  it("persists and reads back entries", () => {
    const store = fakeStore();
    let log: ReminderLog = loadReminderLog(store);
    expect(log).toEqual({});

    log = logReminder(log, "INV-1|Acme", "friendly", store);
    expect(lastReminder(log, "INV-1|Acme")?.tone).toBe("friendly");
    expect(loadReminderLog(store)["INV-1|Acme"]).toHaveLength(1);
  });

  it("escalates the suggested tone: nothing -> friendly -> firm -> final", () => {
    const store = fakeStore();
    let log: ReminderLog = {};
    expect(suggestTone(log, "k", 5)).toBe("friendly");
    log = logReminder(log, "k", "friendly", store);
    expect(suggestTone(log, "k", 5)).toBe("firm");
    log = logReminder(log, "k", "firm", store);
    expect(suggestTone(log, "k", 5)).toBe("final");
  });

  it("starts firmer for badly overdue invoices with no history", () => {
    expect(suggestTone({}, "k", 20)).toBe("firm");
    expect(suggestTone({}, "k", 60)).toBe("final");
  });
});

describe("run-over-run snapshot diff", () => {
  it("reports recovered and newly overdue amounts", () => {
    const before = run(`Invoice No,Customer,Due Date,Total,Status
INV-1,Acme,2026-05-01,1000,Sent
INV-2,Beta,2026-05-01,2000,Sent`);
    const snapshot = buildSnapshot(before);
    expect(Object.keys(snapshot.perInvoice)).toHaveLength(2);

    // Next week: INV-1 fully paid, INV-2 part-paid, INV-3 is new and overdue.
    const after = run(`Invoice No,Customer,Due Date,Total,Amount Paid,Status
INV-1,Acme,2026-05-01,1000,1000,Paid
INV-2,Beta,2026-05-01,2000,500,Sent
INV-3,Gamma,2026-05-20,750,0,Sent`);
    const diff = diffSnapshot(snapshot, after);

    expect(diff.recoveredAmount).toBe(1500); // 1000 cleared + 500 part-paid
    expect(diff.recoveredCount).toBe(1); // only INV-1 fully cleared
    expect(diff.newOverdueCount).toBe(1);
    expect(diff.newOverdueAmount).toBe(750);
    expect(diff.outstandingDelta).toBe(2250 - 3000);
  });
});

describe("dismissible issues", () => {
  it("removes dismissed issues and recomputes counts", () => {
    const result = run(`Invoice No,Customer,ABN,Due Date,Total,Status
INV-1,Acme,12345678901,2026-05-01,1000,Sent`);
    const record = result.records[0];
    expect(record.issues.map((issue) => issue.t)).toContain("Invalid ABN (checksum)");

    const dismissed = new Set([issueDismissKey(invoiceKey(record), "Invalid ABN (checksum)")]);
    const applied = applyDismissals(result, dismissed);
    expect(applied.records[0].issues.map((issue) => issue.t)).not.toContain("Invalid ABN (checksum)");
  });

  it("returns the result unchanged when nothing is dismissed", () => {
    const result = run(`Invoice No,Customer,Due Date,Total,Status
INV-1,Acme,2026-05-01,1000,Sent`);
    expect(applyDismissals(result, new Set())).toBe(result);
  });
});
