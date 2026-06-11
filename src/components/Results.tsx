import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import { buildEmail } from "../lib/reminderEmails";
import { classifyStatus, invoiceKey } from "../lib/invoiceAnalysis";
import { fmtDate, fmtMoney, parseDate, parseNumber } from "../lib/format";
import { lastReminder } from "../lib/storage";
import type { AnalysisResult, CsvRow, FieldMap, InvoiceRecord, ReminderLog, ReminderLogEntry, ReminderTone, RiskLevel, SnapshotDiff, StatusClass } from "../lib/types";
import { Ic } from "./Icons";

export function Toast({ msg }: { msg: string }) {
  return (
    <div className="toast">
      {Ic.check}
      {msg}
    </div>
  );
}

export function RiskPill({ level }: { level: RiskLevel }) {
  return (
    <span className={"pill " + level}>
      <span className="pdot" />
      {level}
    </span>
  );
}

export function ScoreBar({ score, level }: { score: number; level: RiskLevel }) {
  const color = {
    Critical: "var(--crit)",
    High: "var(--high)",
    Watch: "var(--watch)",
    Low: "var(--low)",
  }[level];

  return (
    <div className="scorebar">
      <div className="track">
        <div className="fill" style={{ width: score + "%", background: color }} />
      </div>
      <span className="num">{score}</span>
    </div>
  );
}

const TONE_LABELS: Record<ReminderTone, string> = { friendly: "Friendly", firm: "Firm", final: "Final Notice" };

function daysAgo(iso: string) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  return diff === 0 ? "today" : diff === 1 ? "1d ago" : `${diff}d ago`;
}

export function EmailModal({
  record,
  initialTone,
  lastSent,
  onClose,
  onCopy,
  onMarkSent,
}: {
  record: InvoiceRecord;
  initialTone: ReminderTone;
  lastSent: ReminderLogEntry | null;
  onClose: () => void;
  onCopy: (text: string) => void;
  onMarkSent: (record: InvoiceRecord, tone: ReminderTone) => void;
}) {
  const [tone, setTone] = useState<ReminderTone>(initialTone);
  const [marked, setMarked] = useState(false);
  const email = useMemo(() => buildEmail(record, tone), [record, tone]);
  const tones: Array<{ key: ReminderTone; label: string }> = [
    { key: "friendly", label: "Friendly" },
    { key: "firm", label: "Firm" },
    { key: "final", label: "Final Notice" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Reminder for {record.customer}</h3>
            <div className="sub mono">
              {record.invNo} · {fmtMoney(record.outstanding)} · {record.daysOverdue} days overdue
            </div>
            {lastSent && (
              <div className="sub" style={{ marginTop: 4, color: "var(--ink-faint)" }}>
                Last sent: {TONE_LABELS[lastSent.tone]} {daysAgo(lastSent.sentAt)} - suggested next step is pre-selected
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            {Ic.x}
          </button>
        </div>
        <div className="modal-body">
          <div className="tone-tabs">
            {tones.map((item) => (
              <button key={item.key} className={"tone-tab" + (tone === item.key ? " active" : "")} onClick={() => setTone(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="email-field">Subject</div>
          <div className="email-subject">{email.subject}</div>
          <div className="email-field">Message</div>
          <div className="email-body">{email.body}</div>
          {!record.email && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--rust)", display: "flex", gap: 6, alignItems: "center" }}>
              {Ic.alert}
              <span>No email on file for this customer - add one before sending.</span>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={marked}
            onClick={() => {
              onMarkSent(record, tone);
              setMarked(true);
            }}
          >
            {Ic.check} {marked ? "Logged" : "Mark as sent"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onCopy(email.subject + "\n\n" + email.body)}>
            {Ic.copy} Copy email
          </button>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, accent, mono }: { label: string; value: string | number; sub?: ReactNode; accent: string; mono?: boolean }) {
  return (
    <div className="kpi" style={{ "--accent": accent } as CSSProperties}>
      <div className="kpi-label">{label}</div>
      <div className={"kpi-value" + (mono ? " mono" : "")}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

const BUCKET_COLORS = ["var(--low)", "var(--watch)", "var(--high)", "var(--rust)", "var(--crit)"];

function AgingCard({ result }: { result: AnalysisResult }) {
  const total = result.aging.reduce((sum, bucket) => sum + bucket.amount, 0);
  return (
    <div className="aging-card">
      <div className="sec-title" style={{ margin: 0 }}>
        <h3>Receivables aging</h3>
        <span className="hint">- open invoices by how far past due</span>
      </div>
      {total <= 0 ? (
        <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 10 }}>No open receivables.</div>
      ) : (
        <>
          <div className="aging-bar">
            {result.aging.map(
              (bucket, index) =>
                bucket.amount > 0 && <div key={bucket.key} className="aging-seg" style={{ width: `${(bucket.amount / total) * 100}%`, background: BUCKET_COLORS[index] }} title={`${bucket.label}: ${fmtMoney(bucket.amount)}`} />,
            )}
          </div>
          <div className="aging-legend">
            {result.aging.map((bucket, index) => (
              <div key={bucket.key} className="aging-item">
                <span className="aging-dot" style={{ background: BUCKET_COLORS[index] }} />
                <span className="aging-label">{bucket.label}</span>
                <span className="aging-amt mono">{fmtMoney(bucket.amount)}</span>
                <span className="aging-count">
                  {bucket.count} inv{bucket.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DiffBanner({ diff }: { diff: SnapshotDiff }) {
  const since = new Date(diff.previousSavedAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
  return (
    <div className="diff-banner">
      {Ic.spark}
      <span>
        Since your last check ({since}): <b style={{ color: "var(--low)" }}>{fmtMoney(diff.recoveredAmount)} recovered</b>
        {diff.recoveredCount > 0 && <> ({diff.recoveredCount} invoice{diff.recoveredCount !== 1 ? "s" : ""} cleared)</>}
        {" · "}
        <b style={{ color: diff.newOverdueCount ? "var(--rust)" : "var(--ink-faint)" }}>
          {diff.newOverdueCount ? `${fmtMoney(diff.newOverdueAmount)} newly overdue (${diff.newOverdueCount})` : "no new overdue invoices"}
        </b>
        {" · "}outstanding {diff.outstandingDelta <= 0 ? "down" : "up"} {fmtMoney(Math.abs(diff.outstandingDelta))}
      </span>
    </div>
  );
}

export function Dashboard({ result, diff, onEmail }: { result: AnalysisResult; diff: SnapshotDiff | null; onEmail: (record: InvoiceRecord) => void }) {
  const metrics = result.metrics;
  const top = result.actionList.slice(0, 5);

  return (
    <div>
      {diff && <DiffBanner diff={diff} />}
      <div className="kpis">
        <KPI label="Total Outstanding" value={fmtMoney(metrics.totalOutstanding)} mono accent="var(--forest-2)" sub={<span>{metrics.active} open invoice{metrics.active !== 1 ? "s" : ""}</span>} />
        <KPI label="Overdue" value={fmtMoney(metrics.totalOverdue)} mono accent="var(--rust)" sub={<span><span className="trend" style={{ color: "var(--rust)" }}>{metrics.overdueCount}</span> invoices past due</span>} />
        <KPI label="Avg Days Overdue" value={metrics.avgDaysOverdue} accent="var(--amber)" sub={<span>across overdue invoices</span>} />
        <KPI
          label="Receivables Age"
          value={metrics.weightedAgeDays !== null ? `${metrics.weightedAgeDays}d` : "-"}
          accent="var(--sage)"
          sub={<span>weighted by amount owing</span>}
        />
        <KPI label="Needs Action Now" value={metrics.critCount} accent="var(--crit)" sub={<span>high / critical priority</span>} />
      </div>

      <AgingCard result={result} />

      <div className="sec-title">
        <h3>Who to follow up today</h3>
        <span className="hint">- ranked by amount, days overdue & customer history</span>
      </div>
      {top.length === 0 ? (
        <div className="card empty">
          {Ic.check}
          <div>Nothing overdue. You're all caught up.</div>
        </div>
      ) : (
        <div className="action-card">
          {top.map((record, index) => (
            <div className="action-row" key={record._id}>
              <div className={"rank " + (index === 0 ? "r1" : index === 1 ? "r2" : index === 2 ? "r3" : "rx")}>{index + 1}</div>
              <div className="action-main">
                <div className="t">
                  {record.customer} <span className="inv-no" style={{ marginLeft: 6 }}>{record.invNo}</span>
                </div>
                <div className="d">
                  <RiskPill level={record.priorityRisk} />
                  {record.reasons.slice(0, 2).map((reason) => (
                    <span key={reason}>· {reason}</span>
                  ))}
                </div>
              </div>
              <div className="action-amt">
                <div className="a">{fmtMoney(record.outstanding)}</div>
                <div className="s">{record.daysOverdue}d overdue</div>
              </div>
              <button className="btn btn-gold btn-sm" onClick={() => onEmail(record)}>
                {Ic.mail} Remind
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActionTab({ result, reminderLog, onEmail }: { result: AnalysisResult; reminderLog: ReminderLog; onEmail: (record: InvoiceRecord) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RiskLevel | "All">("All");
  const list = result.actionList.filter((record) => {
    if (filter !== "All" && record.priorityRisk !== filter) return false;
    if (query && !(record.customer.toLowerCase().includes(query.toLowerCase()) || record.invNo.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      <div className="filterbar">
        {(["All", "Critical", "High", "Watch", "Low"] as Array<RiskLevel | "All">).map((item) => (
          <button key={item} className={"filter-chip" + (filter === item ? " active" : "")} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
        <input className="search" placeholder="Search customer or invoice..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {list.length === 0 ? (
        <div className="card empty">
          {Ic.inbox}
          <div>No matching overdue invoices.</div>
        </div>
      ) : (
        <>
          <div className="scroll-hint">swipe table to see more</div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th className="num">Outstanding</th>
                  <th className="num">Due</th>
                  <th className="num">Overdue</th>
                  <th>Last reminder</th>
                  <th>Why</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((record) => {
                  const sent = lastReminder(reminderLog, invoiceKey(record));
                  return (
                    <tr key={record._id}>
                      <td style={{ minWidth: 130 }}>
                        <ScoreBar score={record.priority} level={record.priorityRisk} />
                      </td>
                      <td className="inv-no">
                        {record.invNo}
                        {result.records.filter((item) => item.invNo === record.invNo).length > 1 && <span title="duplicate" style={{ color: "var(--rust)" }}> !</span>}
                      </td>
                      <td className="cust-name">
                        {record.customer}
                        {!record.email && <span style={{ color: "var(--rust)", fontSize: 11, fontWeight: 400 }} title="no email"> · no email</span>}
                      </td>
                      <td className="num mono" style={{ fontWeight: 600 }}>
                        {fmtMoney(record.outstanding)}
                        {record.partial && <div style={{ fontSize: 10, color: "var(--ink-faint)" }}>part-paid</div>}
                      </td>
                      <td className="num mono" style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>
                        {fmtDate(record.due)}
                        {record.dueInferred && <div style={{ fontSize: 10 }}>from terms</div>}
                      </td>
                      <td className="num">
                        <span className="days-badge over">{record.daysOverdue}d</span>
                      </td>
                      <td>
                        {sent ? (
                          <span className="sent-chip" title={new Date(sent.sentAt).toLocaleString("en-AU")}>
                            {TONE_LABELS[sent.tone]} · {daysAgo(sent.sentAt)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>-</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--ink-faint)", maxWidth: 180 }}>{record.reasons[0] || "-"}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => onEmail(record)} aria-label={"Draft reminder for " + record.customer}>
                          {Ic.mail}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function CustomersTab({ result }: { result: AnalysisResult }) {
  return (
    <>
      <div className="scroll-hint">swipe table to see more</div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Risk</th>
              <th className="num">Outstanding</th>
              <th className="num">Overdue inv.</th>
              <th className="num">Avg days late</th>
              <th style={{ width: 160 }}>Behaviour score</th>
            </tr>
          </thead>
          <tbody>
            {result.customers.map((customer) => (
              <tr key={customer.name}>
                <td className="cust-name">
                  {customer.name}
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 400 }}>{customer.historyCount > 0 ? `${customer.historyCount} paid on record` : "no payment history"}</div>
                </td>
                <td>
                  <RiskPill level={customer.risk} />
                </td>
                <td className="num mono" style={{ fontWeight: 600 }}>{fmtMoney(customer.outstanding)}</td>
                <td className="num mono">{customer.overdueCount || "-"}</td>
                <td className="num mono" style={{ color: customer.avgDaysLate && customer.avgDaysLate > 14 ? "var(--rust)" : "var(--ink-soft)" }}>{customer.avgDaysLate !== null ? customer.avgDaysLate + "d" : "-"}</td>
                <td>
                  <ScoreBar score={customer.score} level={customer.risk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function IssuesTab({
  result,
  dismissedCount,
  onDismiss,
  onRestore,
}: {
  result: AnalysisResult;
  dismissedCount: number;
  onDismiss: (record: InvoiceRecord, issueText: string) => void;
  onRestore: () => void;
}) {
  const rows = result.records.filter((record) => record.issues.length);

  const restoreBar = dismissedCount > 0 && (
    <div style={{ fontSize: 12, color: "var(--ink-faint)", margin: "10px 2px 0", display: "flex", gap: 8, alignItems: "center" }}>
      <span>
        {dismissedCount} issue{dismissedCount !== 1 ? "s" : ""} dismissed on this device.
      </span>
      <button className="about-link" style={{ padding: 0, fontSize: 12 }} onClick={onRestore}>
        Restore all
      </button>
    </div>
  );

  if (!rows.length) {
    return (
      <div>
        <div className="card empty">
          {Ic.check}
          <div>No open data quality issues. Clean export.</div>
        </div>
        {restoreBar}
      </div>
    );
  }

  return (
    <div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Issues found</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record._id}>
                <td className="inv-no">{record.invNo || "-"}</td>
                <td className="cust-name">{record.customer}</td>
                <td>
                  {record.issues.map((issue) => (
                    <span key={issue.t} className={"issue-tag" + (issue.err ? " err" : "")}>
                      {issue.err ? Ic.alert : null}
                      {issue.t}
                      <button className="issue-x" title="Dismiss - I've checked this" aria-label={`Dismiss issue: ${issue.t}`} onClick={() => onDismiss(record, issue.t)}>
                        ×
                      </button>
                    </span>
                  ))}
                </td>
                <td>
                  {record.hasErr ? (
                    <span className="pill Critical">
                      <span className="pdot" />
                      Error
                    </span>
                  ) : (
                    <span className="pill Watch">
                      <span className="pdot" />
                      Warning
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {restoreBar}
    </div>
  );
}

// --- Mapping-stage parse preview ---------------------------------------------

const STATUS_CLASS_LABELS: Record<StatusClass, { label: string; color: string }> = {
  active: { label: "open", color: "var(--forest-2)" },
  paid: { label: "paid", color: "var(--low)" },
  dead: { label: "excluded", color: "var(--ink-faint)" },
};

function PreviewCell({ raw, ok, text }: { raw: unknown; ok: boolean; text: string }) {
  const hasRaw = raw !== null && raw !== undefined && String(raw).trim() !== "";
  if (!hasRaw) return <td style={{ color: "var(--ink-faint)" }}>-</td>;
  if (!ok)
    return (
      <td style={{ color: "var(--crit)", fontWeight: 600 }} title={`Could not read "${String(raw)}"`}>
        unreadable
      </td>
    );
  return <td className="mono">{text}</td>;
}

/**
 * Shows how the first rows will actually be interpreted with the current
 * mapping, so wrong dates / amounts / status classes are caught before analysis.
 */
export function MappingPreview({ rows, map }: { rows: CsvRow[]; map: FieldMap }) {
  const sample = rows.slice(0, 5);
  const get = (row: CsvRow, key: keyof FieldMap) => (map[key] ? row[map[key]] : undefined);

  return (
    <div className="map-card" style={{ marginTop: 0 }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 600 }}>Preview - how we'll read your first {sample.length} rows</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "4px 0 12px" }}>
        If a date or amount shows <b style={{ color: "var(--crit)" }}>unreadable</b>, fix the mapping (or the file) before running the check.
      </div>
      <div className="tbl-wrap" style={{ boxShadow: "none" }}>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Invoice date</th>
              <th>Due date</th>
              <th className="num">Total</th>
              <th>Status reading</th>
            </tr>
          </thead>
          <tbody>
            {sample.map((row, index) => {
              const invDate = parseDate(get(row, "invoice_date"));
              const due = parseDate(get(row, "due_date"));
              const total = parseNumber(get(row, "amount_inc_gst"));
              const status = String(get(row, "status") || "").trim();
              const cls = STATUS_CLASS_LABELS[classifyStatus(status)];
              return (
                <tr key={index}>
                  <td className="inv-no">{String(get(row, "invoice_number") || "-")}</td>
                  <td className="cust-name">{String(get(row, "customer_name") || "-")}</td>
                  <PreviewCell raw={get(row, "invoice_date")} ok={!!invDate} text={fmtDate(invDate)} />
                  <PreviewCell raw={get(row, "due_date")} ok={!!due} text={fmtDate(due)} />
                  <PreviewCell raw={get(row, "amount_inc_gst")} ok={total !== null} text={fmtMoney(total)} />
                  <td>
                    {status ? (
                      <span style={{ fontSize: 12 }}>
                        {status} <b style={{ color: cls.color }}>→ {cls.label}</b>
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-faint)" }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
