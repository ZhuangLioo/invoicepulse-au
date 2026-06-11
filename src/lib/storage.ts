import { invoiceKey } from "./invoiceAnalysis";
import type { AnalysisResult, ReminderLog, ReminderLogEntry, ReminderTone, Snapshot, SnapshotDiff } from "./types";

// Everything here stays on the user's device. localStorage access is wrapped so the
// app still works (without history features) when storage is blocked or full.

const KEYS = {
  reminderLog: "invoicepulse.reminderLog.v1",
  snapshot: "invoicepulse.snapshot.v1",
  dismissed: "invoicepulse.dismissedIssues.v1",
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

function readJSON<T>(key: string, fallback: T, store = defaultStorage()): T {
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown, store = defaultStorage()) {
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked - history features degrade gracefully.
  }
}

// --- Reminder log -----------------------------------------------------------

export function loadReminderLog(store = defaultStorage()): ReminderLog {
  return readJSON<ReminderLog>(KEYS.reminderLog, {}, store);
}

export function logReminder(log: ReminderLog, key: string, tone: ReminderTone, store = defaultStorage()): ReminderLog {
  const entry: ReminderLogEntry = { tone, sentAt: new Date().toISOString() };
  const next: ReminderLog = { ...log, [key]: [...(log[key] || []), entry] };
  writeJSON(KEYS.reminderLog, next, store);
  return next;
}

export function lastReminder(log: ReminderLog, key: string): ReminderLogEntry | null {
  const entries = log[key];
  return entries && entries.length ? entries[entries.length - 1] : null;
}

/** Escalation ladder: nothing sent -> friendly -> firm -> final. */
export function suggestTone(log: ReminderLog, key: string, daysOverdue: number): ReminderTone {
  const last = lastReminder(log, key);
  if (last) {
    if (last.tone === "friendly") return "firm";
    return "final";
  }
  return daysOverdue > 45 ? "final" : daysOverdue > 14 ? "firm" : "friendly";
}

// --- Run-over-run snapshot ---------------------------------------------------

export function buildSnapshot(result: AnalysisResult): Snapshot {
  const perInvoice: Record<string, number> = {};
  result.records.forEach((record) => {
    if (record.isReceivable) perInvoice[invoiceKey(record)] = record.outstanding;
  });
  return {
    savedAt: new Date().toISOString(),
    asOf: result.asOf.toISOString().slice(0, 10),
    totalOutstanding: result.metrics.totalOutstanding,
    totalOverdue: result.metrics.totalOverdue,
    perInvoice,
  };
}

export function loadSnapshot(store = defaultStorage()): Snapshot | null {
  return readJSON<Snapshot | null>(KEYS.snapshot, null, store);
}

export function saveSnapshot(snapshot: Snapshot, store = defaultStorage()) {
  writeJSON(KEYS.snapshot, snapshot, store);
}

/**
 * Compare the current analysis with the previous saved snapshot.
 * "Recovered" means an invoice that was open last time and is now gone or reduced.
 */
export function diffSnapshot(previous: Snapshot, result: AnalysisResult): SnapshotDiff {
  const current: Record<string, number> = {};
  const overdueNow = new Set<string>();
  result.records.forEach((record) => {
    if (record.isReceivable) current[invoiceKey(record)] = record.outstanding;
    if (record.overdue) overdueNow.add(invoiceKey(record));
  });

  let recoveredAmount = 0;
  let recoveredCount = 0;
  Object.entries(previous.perInvoice).forEach(([key, amount]) => {
    const now = current[key];
    if (now === undefined) {
      recoveredAmount += amount;
      recoveredCount += 1;
    } else if (now < amount) {
      recoveredAmount += amount - now;
    }
  });

  let newOverdueAmount = 0;
  let newOverdueCount = 0;
  result.records.forEach((record) => {
    if (!record.overdue) return;
    const key = invoiceKey(record);
    if (previous.perInvoice[key] === undefined) {
      newOverdueAmount += record.outstanding;
      newOverdueCount += 1;
    }
  });

  return {
    previousSavedAt: previous.savedAt,
    recoveredAmount,
    recoveredCount,
    newOverdueAmount,
    newOverdueCount,
    outstandingDelta: result.metrics.totalOutstanding - previous.totalOutstanding,
  };
}

// --- Dismissed data issues ---------------------------------------------------

export function loadDismissed(store = defaultStorage()): Set<string> {
  return new Set(readJSON<string[]>(KEYS.dismissed, [], store));
}

export function saveDismissed(dismissed: Set<string>, store = defaultStorage()) {
  writeJSON(KEYS.dismissed, [...dismissed], store);
}

export function issueDismissKey(key: string, issueText: string) {
  return `${key}|${issueText}`;
}

/**
 * Remove dismissed issues from a result and recompute issue counts, so tabs,
 * badges, and exports all agree on what is still open.
 */
export function applyDismissals(result: AnalysisResult, dismissed: Set<string>): AnalysisResult {
  if (!dismissed.size) return result;

  let removed = 0;
  const records = result.records.map((record) => {
    const kept = record.issues.filter((issue) => !dismissed.has(issueDismissKey(invoiceKey(record), issue.t)));
    if (kept.length === record.issues.length) return record;
    removed += record.issues.length - kept.length;
    return { ...record, issues: kept, hasErr: kept.some((issue) => issue.err) };
  });

  if (!removed) return result;
  const issuesCount = records.filter((record) => record.issues.length).length;
  return { ...result, records, metrics: { ...result.metrics, issuesCount } };
}
