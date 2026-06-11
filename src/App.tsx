import { useCallback, useMemo, useRef, useState } from "react";
import { AboutModal } from "./components/AboutModal";
import { Ic } from "./components/Icons";
import { ActionTab, CustomersTab, Dashboard, EmailModal, IssuesTab, MappingPreview, Toast } from "./components/Results";
import { analyze, invoiceKey } from "./lib/invoiceAnalysis";
import { parseInvoiceCSV } from "./lib/csvParser";
import { FIELDS, PRESET_LABELS, autoMap, detectPreset, emptyFieldMap } from "./lib/fieldMapping";
import { exportIssuesCSV, exportOverdueCSV, exportSummaryMD } from "./lib/exporters";
import { fmtDate, parseDate, toISODate, todayMidnight } from "./lib/format";
import { SAMPLE_CSV } from "./lib/sampleData";
import {
  applyDismissals,
  buildSnapshot,
  diffSnapshot,
  issueDismissKey,
  loadDismissed,
  loadReminderLog,
  loadSnapshot,
  logReminder,
  saveDismissed,
  saveSnapshot,
  suggestTone,
} from "./lib/storage";
import type { AnalysisResult, CsvRow, FieldMap, InvoiceRecord, ReminderTone, SnapshotDiff } from "./lib/types";

type Stage = "upload" | "mapping" | "results";
type TabKey = "dashboard" | "actions" | "customers" | "issues";

type RawUpload = {
  headers: string[];
  rows: CsvRow[];
  fname: string;
};

export default function App() {
  const [stage, setStage] = useState<Stage>("upload");
  const [raw, setRaw] = useState<RawUpload | null>(null);
  const [map, setMap] = useState<FieldMap>(() => emptyFieldMap());
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [emailRecord, setEmailRecord] = useState<InvoiceRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [parseWarn, setParseWarn] = useState<string | null>(null);
  const [asOfText, setAsOfText] = useState(() => toISODate(todayMidnight()));
  const [reminderLog, setReminderLog] = useState(() => loadReminderLog());
  const [dismissed, setDismissed] = useState(() => loadDismissed());
  const [diff, setDiff] = useState<SnapshotDiff | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard"));
    },
    [showToast],
  );

  function ingest(text: string, fname: string) {
    setParseWarn(null);
    try {
      const parsed = parseInvoiceCSV(text);
      setRaw({ headers: parsed.headers, rows: parsed.rows, fname });
      setMap(autoMap(parsed.headers));
      setParseWarn(parsed.warning);
      setStage("mapping");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not read that file as CSV.");
    }
  }

  function onFile(file?: File | null) {
    if (!file) return;
    const okType = /\.csv$/i.test(file.name) || file.type === "text/csv" || file.type === "text/plain";
    if (!okType) {
      showToast("Please upload a .csv file (export one from Xero, MYOB or Excel).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("That file is over 8MB - try exporting a smaller date range.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => showToast("Could not read that file - try again.");
    reader.onload = (event) => ingest(String(event.target?.result || ""), file.name);
    reader.readAsText(file);
  }

  function loadSample() {
    ingest(SAMPLE_CSV, "sample-invoices-au.csv");
  }

  function runAnalysis() {
    if (!raw) return;
    try {
      const asOf = parseDate(asOfText) || todayMidnight();
      const analysis = applyDismissals(analyze(raw.rows, map, asOf), dismissed);

      const previous = loadSnapshot();
      setDiff(previous ? diffSnapshot(previous, analysis) : null);
      saveSnapshot(buildSnapshot(analysis));

      setResult(analysis);
      setStage("results");
      setTab("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      showToast(`Analysis failed: ${detail}. Check the column mapping and try again.`);
    }
  }

  function reset() {
    setStage("upload");
    setRaw(null);
    setResult(null);
    setMap(emptyFieldMap());
    setParseWarn(null);
    setDiff(null);
  }

  function markReminderSent(record: InvoiceRecord, tone: ReminderTone) {
    setReminderLog((log) => logReminder(log, invoiceKey(record), tone));
    showToast("Logged as sent on this device");
  }

  function dismissIssue(record: InvoiceRecord, issueText: string) {
    const next = new Set(dismissed);
    next.add(issueDismissKey(invoiceKey(record), issueText));
    setDismissed(next);
    saveDismissed(next);
    if (result) setResult(applyDismissals(result, next));
  }

  function restoreDismissed() {
    const next = new Set<string>();
    setDismissed(next);
    saveDismissed(next);
    if (raw) {
      const asOf = parseDate(asOfText) || todayMidnight();
      setResult(analyze(raw.rows, map, asOf));
    }
    showToast("Dismissed issues restored");
  }

  const reqMissing = FIELDS.filter((field) => field.req && !map[field.key]);
  const preset = useMemo(() => (raw ? detectPreset(raw.headers) : null), [raw]);

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <div className="brand">
            <div className="brand-mark">{Ic.pulse}</div>
            <div>
              <div className="brand-name">
                InvoicePulse <span className="au">AU</span>
              </div>
              <div className="brand-sub">Invoice health check</div>
            </div>
          </div>
          <div className="topbar-actions">
            {stage === "results" && result && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => exportSummaryMD(result)}>
                  {Ic.download} Weekly summary
                </button>
                <button className="btn btn-ghost btn-sm" onClick={reset}>
                  {Ic.back} New file
                </button>
              </>
            )}
            {stage !== "results" && (
              <button className="btn btn-ghost btn-sm" onClick={loadSample}>
                {Ic.spark} Try sample
              </button>
            )}
            <button className="about-link" onClick={() => setShowAbout(true)}>
              About
            </button>
          </div>
        </div>
      </div>

      {stage === "upload" && (
        <>
          <div className="wrap hero">
            <div className="hero-grid">
              <div>
                <div className="eyebrow">
                  <span className="dot" />
                  For Australian small business
                </div>
                <h1>
                  Know exactly <em>who to chase</em> for payment today.
                </h1>
                <p className="hero-lede">
                  Upload your invoice CSV from Xero, MYOB, QuickBooks or Excel and get a 30-second health check: aged receivables, a risk-ranked follow-up list, and ready-to-send reminders.
                </p>
                <div className="steps">
                  <div className="step">
                    <div className="step-num">1</div>
                    <div className="step-body">
                      <div className="t">Drop in your CSV</div>
                      <div className="d">
                        Columns are matched automatically - <b>messy headers are fine</b>, Xero / MYOB / QuickBooks layouts are recognised.
                      </div>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-num">2</div>
                    <div className="step-body">
                      <div className="t">Confirm with a live preview</div>
                      <div className="d">
                        See exactly how your first rows will be read - <b>unreadable dates and amounts are flagged before</b> anything is calculated.
                      </div>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-num">3</div>
                    <div className="step-body">
                      <div className="t">Act on a ranked list</div>
                      <div className="d">
                        Copy a friendly, firm or final reminder, <b>mark it as sent</b>, and next week's check remembers where you left off.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={"dropzone" + (drag ? " drag" : "")}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDrag(false);
                  onFile(event.dataTransfer.files[0]);
                }}
              >
                <div className="dz-icon">{Ic.upload}</div>
                <div className="dz-title">Drop your invoice CSV</div>
                <div className="dz-sub">Exported from Xero, MYOB, QuickBooks or a spreadsheet</div>
                <div className="dz-actions">
                  <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
                    {Ic.file} Choose CSV file
                  </button>
                  <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(event) => onFile(event.target.files?.[0])} />
                </div>
                <div className="dz-divider">or</div>
                <button className="btn btn-gold" onClick={loadSample} style={{ width: "100%", justifyContent: "center" }}>
                  {Ic.spark} Explore with sample data
                </button>
                <div className="dz-note">
                  {Ic.lock} Your invoice data never leaves your browser. Follow-up history is saved only on this device.
                </div>
                <div className="dz-req">
                  .csv only (save .xlsx as CSV first) · <a href="#file-format">see file requirements ↓</a>
                </div>
              </div>
            </div>
          </div>

          <div className="wrap landing-sec">
            <h2>What you get in 30 seconds</h2>
            <div className="sub">Every number comes with a visible reason - no black-box scores.</div>
            <div className="feature-grid">
              <div className="feature-card">
                <div className="icon">{Ic.bars}</div>
                <div className="t">Receivables aging</div>
                <div className="d">
                  The view your accountant expects: <b>Current / 1-30 / 31-60 / 61-90 / 90+</b> buckets plus an amount-weighted age of your book.
                </div>
              </div>
              <div className="feature-card">
                <div className="icon">{Ic.target}</div>
                <div className="t">Ranked follow-up list</div>
                <div className="d">
                  Overdue invoices scored by amount, days overdue and <b>customer payment history</b> - chase the right five first.
                </div>
              </div>
              <div className="feature-card">
                <div className="icon">{Ic.shield}</div>
                <div className="t">Australian data checks</div>
                <div className="d">
                  <b>ABN checksum</b> validation, <b>GST ~10%</b> reasonableness, duplicate invoice numbers, day-first date handling.
                </div>
              </div>
              <div className="feature-card">
                <div className="icon">{Ic.mail}</div>
                <div className="t">Reminders that escalate</div>
                <div className="d">
                  Friendly → firm → final drafts. Mark one as sent and the <b>next tone is pre-selected</b> when you come back.
                </div>
              </div>
              <div className="feature-card">
                <div className="icon">{Ic.trend}</div>
                <div className="t">Week-over-week change</div>
                <div className="d">
                  Re-upload next week and see <b>what was recovered and what's newly overdue</b> since your last check.
                </div>
              </div>
              <div className="feature-card">
                <div className="icon">{Ic.download}</div>
                <div className="t">Reports you can share</div>
                <div className="d">
                  Overdue CSV with <b>cents-exact</b> amounts, a data-issues CSV, and a weekly Markdown summary for your team or advisor.
                </div>
              </div>
            </div>
          </div>

          <div className="wrap" id="file-format">
            <div className="req-panel">
              <div className="req-head">
                {Ic.table}
                <h2>What your file needs</h2>
              </div>
              <div className="req-sub">
                The structure rules are strict so the numbers can be trusted - everything else is flexible.
              </div>
              <div className="req-grid">
                <div className="req-col ok">
                  <h4>{Ic.check} Required structure</h4>
                  <div className="req-item">A <code>.csv</code> file - save Excel <code>.xlsx</code> as CSV first</div>
                  <div className="req-item">First row = column names (one header row)</div>
                  <div className="req-item">One row = one invoice</div>
                  <div className="req-item">
                    Four columns we can find: <code>invoice no</code>, <code>customer</code>, <code>due date</code>, <code>total</code>
                  </div>
                  <div className="req-item">Missing due dates are OK if invoice date + terms (e.g. <code>14 days</code>) exist</div>
                </div>
                <div className="req-col warn">
                  <h4>{Ic.spark} Handled automatically</h4>
                  <div className="req-item">Any column names or order - Xero / MYOB / QuickBooks headers recognised</div>
                  <div className="req-item">Amounts with <code>$</code>, commas, or accounting negatives <code>(1,100.00)</code></div>
                  <div className="req-item">Mixed date formats: <code>2026-05-15</code>, <code>15/05/2026</code>, <code>5 Jun 2026</code></div>
                  <div className="req-item">Status wording: Sent, Open, Unpaid, AUTHORISED, Paid, Void…</div>
                  <div className="req-item">Anything unreadable is flagged in the preview - never silently guessed</div>
                </div>
                <div className="req-col bad">
                  <h4>{Ic.ban} Not supported (clean these up)</h4>
                  <div className="req-item">Merged cells or multi-row report titles above the header</div>
                  <div className="req-item">Subtotal / grand-total rows mixed in with invoices</div>
                  <div className="req-item">Grouped sections separated by blank label rows</div>
                  <div className="req-item">Multiple sheets in one file (export the invoice list only)</div>
                  <div className="req-item">Files over 8MB - export a smaller date range</div>
                </div>
              </div>
            </div>

            <div className="trust-strip">
              <span className="trust-item">{Ic.lock} 100% in-browser - no upload, no server</span>
              <span className="trust-item">
                {Ic.check} <span className="mono">59</span>&nbsp;automated tests on every release
              </span>
              <span className="trust-item">{Ic.shield} ABN-aware · GST-aware · day-first dates</span>
              <span className="trust-item">{Ic.spark} Transparent scoring - every rank shows its reasons</span>
            </div>
          </div>
        </>
      )}

      {stage === "mapping" && raw && (
        <div className="wrap analysis">
          <div className="ana-head">
            <div>
              <h2>Confirm your columns</h2>
              <div className="meta">
                Found <b>{raw.rows.length} rows</b> and <b>{raw.headers.length} columns</b> in <b className="mono">{raw.fname}</b>
                {preset && (
                  <>
                    {" "}· looks like a <b>{PRESET_LABELS[preset]}</b> export
                  </>
                )}
                . We've matched them automatically - adjust anything that looks off.
              </div>
            </div>
            <div className="head-actions">
              <button className="btn btn-ghost" onClick={reset}>
                {Ic.back} Back
              </button>
              <button className="btn btn-primary" onClick={runAnalysis} disabled={reqMissing.length > 0}>
                {Ic.pulse} Run health check
              </button>
            </div>
          </div>
          {parseWarn && (
            <div style={{ background: "var(--watch-bg)", color: "var(--amber)", padding: "11px 16px", borderRadius: 10, fontSize: 13, marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start", fontWeight: 500 }}>
              {Ic.alert} <span>{parseWarn}</span>
            </div>
          )}
          {reqMissing.length > 0 && (
            <div style={{ background: "var(--crit-bg)", color: "var(--crit)", padding: "11px 16px", borderRadius: 10, fontSize: 13, marginBottom: 18, display: "flex", gap: 8, alignItems: "center", fontWeight: 500 }}>
              {Ic.alert} Map these required fields to continue: <b>{reqMissing.map((field) => field.label).join(", ")}</b>
            </div>
          )}
          <div className="map-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 600 }}>Column mapping</div>
              <label className="asof">
                Report as at
                <input type="date" value={asOfText} onChange={(event) => setAsOfText(event.target.value)} />
              </label>
            </div>
            <div className="map-grid">
              {FIELDS.map((field) => (
                <div className="map-item" key={field.key}>
                  <label>
                    {field.label}
                    {field.req && <span className="req">*</span>}
                  </label>
                  <select
                    value={map[field.key] || ""}
                    className={field.req && !map[field.key] ? "unmapped" : ""}
                    onChange={(event) => setMap({ ...map, [field.key]: event.target.value })}
                  >
                    <option value="">- not mapped -</option>
                    {raw.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                  {map[field.key] && <span className="matched">{Ic.check} matched</span>}
                </div>
              ))}
            </div>
          </div>
          <MappingPreview rows={raw.rows} map={map} />
        </div>
      )}

      {stage === "results" && result && (
        <div className="wrap analysis">
          <div className="ana-head">
            <div>
              <h2>Invoice health check</h2>
              <div className="meta">
                As at <b>{fmtDate(result.asOf)}</b> · <b>{result.metrics.total}</b> invoices analysed · <b>{result.metrics.paidCount}</b> paid · <b>{result.metrics.overdueCount}</b> overdue
                {result.metrics.deadCount > 0 && (
                  <>
                    {" "}· <b>{result.metrics.deadCount}</b> draft/void excluded
                  </>
                )}
              </div>
            </div>
            <div className="head-actions">
              <button className="btn btn-ghost" onClick={() => exportOverdueCSV(result)}>
                {Ic.download} Overdue CSV
              </button>
              <button className="btn btn-ghost" onClick={() => exportIssuesCSV(result)}>
                {Ic.download} Issues CSV
              </button>
              <button className="btn btn-primary" onClick={() => exportSummaryMD(result)}>
                {Ic.download} Weekly summary
              </button>
            </div>
          </div>

          <div className="tabs">
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "actions", label: "Follow-up list", count: result.metrics.overdueCount },
              { key: "customers", label: "Customers", count: result.customers.length },
              { key: "issues", label: "Data issues", count: result.metrics.issuesCount },
            ].map((item) => (
              <button key={item.key} className={"tab" + (tab === item.key ? " active" : "")} onClick={() => setTab(item.key as TabKey)}>
                {item.label}
                {item.count !== undefined && <span className="badge">{item.count}</span>}
              </button>
            ))}
          </div>

          {tab === "dashboard" && <Dashboard result={result} diff={diff} onEmail={setEmailRecord} />}
          {tab === "actions" && <ActionTab result={result} reminderLog={reminderLog} onEmail={setEmailRecord} />}
          {tab === "customers" && <CustomersTab result={result} />}
          {tab === "issues" && <IssuesTab result={result} dismissedCount={dismissed.size} onDismiss={dismissIssue} onRestore={restoreDismissed} />}
        </div>
      )}

      <div className="footer">
        <div className="wrap footer-inner">
          <div className="disclaimer">
            <b style={{ color: "var(--ink-soft)" }}>Disclaimer:</b> InvoicePulse AU provides invoice data-quality and workflow insights only. It does not provide accounting, tax, legal or debt-collection advice. ABN and GST checks are reasonableness checks, not official validation. Always consult a qualified professional. Sample data is fictional, and your file is processed entirely in your browser - nothing is uploaded to any server. Reminder history and dismissed issues are stored only in this browser's local storage and can be cleared at any time.
          </div>
          <div className="credit-card">
            <div className="credit-name">
              A portfolio prototype by <b>Alvin Li</b> · Sydney
            </div>
            <span className="otw">
              <span className="live" />
              Open to Business Analyst / Product roles
            </span>
            <div className="credit-links">
              <a href="https://www.linkedin.com/in/alvin-zhuang-li-0999b0380/" target="_blank" rel="noopener">
                LinkedIn
              </a>
              <a href="mailto:alvinli1996@gmail.com">Email</a>
              <button className="about-link" style={{ padding: 0, fontSize: 12.5, color: "var(--forest-2)" }} onClick={() => setShowAbout(true)}>
                About this project
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {emailRecord && (
        <EmailModal
          record={emailRecord}
          initialTone={suggestTone(reminderLog, invoiceKey(emailRecord), emailRecord.daysOverdue)}
          lastSent={reminderLog[invoiceKey(emailRecord)]?.slice(-1)[0] || null}
          onClose={() => setEmailRecord(null)}
          onCopy={copy}
          onMarkSent={markReminderSent}
        />
      )}
      {toast && <Toast msg={toast} />}
    </>
  );
}
