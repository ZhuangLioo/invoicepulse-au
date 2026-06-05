import { daysBetween, fmtMoney, parseDate, parseNumber } from "./format";
import { TODAY } from "./sampleData";
import type { AnalysisResult, CsvRow, CustomerSummary, FieldMap, InvoiceRecord, RiskLevel } from "./types";

const PAID_STATUS = ["paid", "settled", "closed"];
const DEAD_STATUS = ["void", "cancelled", "canceled", "draft", "deleted", "written off", "write off", "credit"];

export function validABN(raw: unknown): boolean | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\s/g, "");
  if (!/^\d{11}$/.test(digits)) return false;

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const numbers = digits.split("").map(Number);
  numbers[0] -= 1;
  const sum = numbers.reduce((acc, value, index) => acc + value * weights[index], 0);
  return sum % 89 === 0;
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 70) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Watch";
  return "Low";
}

function customerRiskFromScore(score: number): RiskLevel {
  if (score >= 70) return "Critical";
  if (score >= 45) return "High";
  if (score >= 22) return "Watch";
  return "Low";
}

function read(row: CsvRow, map: FieldMap, key: keyof FieldMap) {
  return map[key] ? row[map[key]] : undefined;
}

export function analyze(rows: CsvRow[], map: FieldMap, asOf = TODAY): AnalysisResult {
  const seen: Record<string, number> = {};

  const records: InvoiceRecord[] = rows.map((row, index) => {
    const total = parseNumber(read(row, map, "amount_inc_gst"));
    const exgst = parseNumber(read(row, map, "amount_ex_gst"));
    const gst = parseNumber(read(row, map, "gst_amount"));
    const paid = parseNumber(read(row, map, "amount_paid"));
    const invNo = String(read(row, map, "invoice_number") || "").trim();
    const due = parseDate(read(row, map, "due_date"));
    const paidDate = parseDate(read(row, map, "paid_date"));
    const invDate = parseDate(read(row, map, "invoice_date"));
    const status = String(read(row, map, "status") || "").trim();
    const abn = read(row, map, "customer_abn") ? String(read(row, map, "customer_abn")).trim() : null;
    const email = read(row, map, "customer_email") ? String(read(row, map, "customer_email")).trim() : "";
    const contact = read(row, map, "contact_name") ? String(read(row, map, "contact_name")).trim() : "";
    const outstanding = paid !== null && total !== null ? Math.max(0, total - paid) : total !== null ? total : 0;

    seen[invNo] = (seen[invNo] || 0) + 1;

    return {
      _id: index,
      invNo,
      customer: String(read(row, map, "customer_name") || "").trim() || "(no name)",
      contact,
      abn,
      email,
      status,
      invDate,
      due,
      paidDate,
      total,
      exgst,
      gst,
      paid,
      outstanding,
      terms: String(read(row, map, "payment_terms") || "").trim(),
      state: String(read(row, map, "state") || "").trim(),
      daysOverdue: 0,
      daysUntil: null,
      issues: [],
      hasErr: false,
      priority: 0,
      priorityRisk: "Low",
      reasons: [],
    };
  });

  records.forEach((record) => {
    const issues = [];
    const status = record.status.toLowerCase();
    const isDead = DEAD_STATUS.some((dead) => status.includes(dead));
    const isPaidStatus = PAID_STATUS.some((paid) => status.includes(paid));
    const fullyPaid = !isDead && (isPaidStatus || (record.total !== null && record.outstanding === 0 && record.paid !== null));

    record.isDead = isDead;
    record.fullyPaid = fullyPaid;
    record.isReceivable = !isDead && !fullyPaid && record.outstanding > 0;

    if (record.due && record.isReceivable) {
      const diff = daysBetween(asOf, record.due);
      if (diff > 0) {
        record.overdue = true;
        record.daysOverdue = diff;
      } else {
        record.overdue = false;
        record.daysUntil = -diff;
      }
    } else {
      record.overdue = false;
    }

    record.partial = record.paid !== null && record.paid > 0 && record.outstanding > 0 && !isDead;

    if (isDead) {
      if (seen[record.invNo] > 1 && record.invNo) issues.push({ t: "Duplicate invoice no.", err: true });
      record.issues = issues;
      record.hasErr = issues.some((issue) => issue.err);
      return;
    }

    if (
      record.due &&
      daysBetween(asOf, record.due) > 0 &&
      record.outstanding > 0 &&
      !fullyPaid &&
      status &&
      !status.includes("overdue") &&
      (status.includes("sent") || status.includes("open") || status.includes("unpaid") || status.includes("approved"))
    ) {
      issues.push({ t: `Status says "${record.status}" but past due`, err: false });
    }

    if (!record.invNo) issues.push({ t: "Missing invoice no.", err: true });
    if (seen[record.invNo] > 1 && record.invNo) issues.push({ t: "Duplicate invoice no.", err: true });
    if (!record.due) issues.push({ t: "Missing due date", err: true });
    if (!record.email && !fullyPaid) issues.push({ t: "No contact email", err: false });
    if (record.total === null) issues.push({ t: "Missing total", err: true });
    if (record.total !== null && record.total <= 0) issues.push({ t: "Zero / negative total", err: true });

    const abnOk = validABN(record.abn);
    record.abnOk = abnOk;
    if (abnOk === false) issues.push({ t: "Invalid ABN (checksum)", err: false });

    record.gstFlag = false;
    if (record.gst !== null && record.gst > 0) {
      let expected: number | null = null;
      if (record.exgst !== null && record.exgst > 0) expected = record.exgst * 0.1;
      else if (record.total !== null && record.total > 0) expected = record.total / 11;

      if (expected !== null) {
        const diff = Math.abs(record.gst - expected);
        const tolerance = Math.max(1, expected * 0.02);
        if (diff > tolerance) {
          record.gstFlag = true;
          issues.push({ t: "GST not ~10%", err: false });
        }
      }
    }

    record.issues = issues;
    record.hasErr = issues.some((issue) => issue.err);
  });

  const byCustomer: Record<string, CustomerSummary> = {};
  records.forEach((record) => {
    if (!byCustomer[record.customer]) {
      byCustomer[record.customer] = {
        name: record.customer,
        invoices: [],
        paidLate: [],
        outstanding: 0,
        overdueCount: 0,
        overdueAmt: 0,
        email: record.email,
        contact: record.contact,
        abn: record.abn,
        liveCount: 0,
        avgDaysLate: null,
        historyCount: 0,
        score: 0,
        risk: "Low",
      };
    }

    const customer = byCustomer[record.customer];
    customer.invoices.push(record);
    if (record.email && !customer.email) customer.email = record.email;
    if (record.contact && !customer.contact) customer.contact = record.contact;
    if (record.isDead) return;

    if (record.isReceivable) {
      customer.outstanding += record.outstanding;
      customer.liveCount += 1;
    }
    if (record.overdue) {
      customer.overdueCount += 1;
      customer.overdueAmt += record.outstanding;
    }
    if (record.fullyPaid && record.paidDate && record.due) {
      customer.paidLate.push(daysBetween(record.paidDate, record.due));
    }
  });

  Object.values(byCustomer).forEach((customer) => {
    const lates = customer.paidLate;
    customer.avgDaysLate = lates.length ? Math.round(lates.reduce((sum, value) => sum + value, 0) / lates.length) : null;
    customer.historyCount = lates.length;

    let score = 0;
    if (customer.avgDaysLate !== null) {
      if (customer.avgDaysLate > 30) score += 45;
      else if (customer.avgDaysLate > 14) score += 32;
      else if (customer.avgDaysLate > 5) score += 18;
      else if (customer.avgDaysLate > 0) score += 8;
    }
    score += Math.min(30, customer.overdueCount * 12);
    if (customer.overdueAmt > 10000) score += 20;
    else if (customer.overdueAmt > 3000) score += 12;
    else if (customer.overdueAmt > 0) score += 5;

    customer.score = Math.min(100, Math.round(score));
    customer.risk = customerRiskFromScore(customer.score);
  });

  records.forEach((record) => {
    if (!record.overdue) return;

    const reasons = [];
    let score = 0;
    const daysPoints = Math.min(30, Math.round((record.daysOverdue / 90) * 30) + (record.daysOverdue > 0 ? 6 : 0));
    score += daysPoints;
    reasons.push(`${record.daysOverdue} days overdue`);

    const amountPoints = record.outstanding > 15000 ? 25 : record.outstanding > 8000 ? 20 : record.outstanding > 3000 ? 14 : record.outstanding > 1000 ? 8 : 4;
    score += amountPoints;
    reasons.push(`${fmtMoney(record.outstanding)} outstanding`);

    const customer = byCustomer[record.customer];
    if (customer.avgDaysLate !== null && customer.avgDaysLate > 14) {
      score += 20;
      reasons.push(`repeat late payer (avg ${customer.avgDaysLate}d)`);
    } else if (customer.avgDaysLate !== null && customer.avgDaysLate > 5) {
      score += 11;
      reasons.push("history of paying late");
    } else if (customer.overdueCount > 1) {
      score += 12;
      reasons.push(`${customer.overdueCount} overdue invoices`);
    }

    if (!record.email) {
      score += 10;
      reasons.push("no email on file");
    }
    if (record.partial) {
      score = Math.max(0, score - 6);
      reasons.push("part-paid");
    }

    record.priority = Math.min(100, score);
    record.priorityRisk = riskFromScore(record.priority);
    record.reasons = reasons;
  });

  const receivables = records.filter((record) => record.isReceivable);
  const overdueRecords = records.filter((record) => record.overdue);
  const totalOutstanding = receivables.reduce((sum, record) => sum + record.outstanding, 0);
  const totalOverdue = overdueRecords.reduce((sum, record) => sum + record.outstanding, 0);
  const avgDaysOverdue = overdueRecords.length ? Math.round(overdueRecords.reduce((sum, record) => sum + record.daysOverdue, 0) / overdueRecords.length) : 0;
  const issuesCount = records.filter((record) => record.issues.length).length;
  const critCount = overdueRecords.filter((record) => record.priorityRisk === "Critical" || record.priorityRisk === "High").length;
  const deadCount = records.filter((record) => record.isDead).length;

  const customers = Object.values(byCustomer)
    .filter((customer) => customer.outstanding > 0 || customer.historyCount > 0 || customer.overdueCount > 0)
    .sort((a, b) => b.score - a.score || b.outstanding - a.outstanding);
  const actionList = [...overdueRecords].sort((a, b) => b.priority - a.priority || b.outstanding - a.outstanding);

  return {
    records,
    customers,
    actionList,
    metrics: {
      total: records.length,
      active: receivables.length,
      totalOutstanding,
      totalOverdue,
      overdueCount: overdueRecords.length,
      avgDaysOverdue,
      issuesCount,
      critCount,
      deadCount,
      paidCount: records.filter((record) => record.fullyPaid).length,
    },
    asOf,
  };
}

