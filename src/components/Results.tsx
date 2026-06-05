import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import { buildEmail } from "../lib/reminderEmails";
import { fmtDate, fmtMoney } from "../lib/format";
import type { AnalysisResult, InvoiceRecord, ReminderTone, RiskLevel } from "../lib/types";
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

export function EmailModal({ record, onClose, onCopy }: { record: InvoiceRecord; onClose: () => void; onCopy: (text: string) => void }) {
  const [tone, setTone] = useState<ReminderTone>(record.daysOverdue > 45 ? "final" : record.daysOverdue > 14 ? "firm" : "friendly");
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

export function Dashboard({ result, onEmail }: { result: AnalysisResult; onEmail: (record: InvoiceRecord) => void }) {
  const metrics = result.metrics;
  const top = result.actionList.slice(0, 5);

  return (
    <div>
      <div className="kpis">
        <KPI label="Total Outstanding" value={fmtMoney(metrics.totalOutstanding)} mono accent="var(--forest-2)" sub={<span>{metrics.active} open invoice{metrics.active !== 1 ? "s" : ""}</span>} />
        <KPI label="Overdue" value={fmtMoney(metrics.totalOverdue)} mono accent="var(--rust)" sub={<span><span className="trend" style={{ color: "var(--rust)" }}>{metrics.overdueCount}</span> invoices past due</span>} />
        <KPI label="Avg Days Overdue" value={metrics.avgDaysOverdue} accent="var(--amber)" sub={<span>across overdue invoices</span>} />
        <KPI label="Needs Action Now" value={metrics.critCount} accent="var(--crit)" sub={<span>high / critical priority</span>} />
      </div>

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

export function ActionTab({ result, onEmail }: { result: AnalysisResult; onEmail: (record: InvoiceRecord) => void }) {
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
                  <th>Why</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((record) => (
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
                    <td className="num mono" style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>{fmtDate(record.due)}</td>
                    <td className="num">
                      <span className="days-badge over">{record.daysOverdue}d</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--ink-faint)", maxWidth: 180 }}>{record.reasons[0] || "-"}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => onEmail(record)} aria-label={"Draft reminder for " + record.customer}>
                        {Ic.mail}
                      </button>
                    </td>
                  </tr>
                ))}
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

export function IssuesTab({ result }: { result: AnalysisResult }) {
  const rows = result.records.filter((record) => record.issues.length);
  if (!rows.length) {
    return (
      <div className="card empty">
        {Ic.check}
        <div>No data quality issues found. Clean export.</div>
      </div>
    );
  }

  return (
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
  );
}
