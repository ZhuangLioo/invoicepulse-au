import { useCallback, useRef, useState } from "react";
import { AboutModal } from "./components/AboutModal";
import { Ic } from "./components/Icons";
import { ActionTab, CustomersTab, Dashboard, EmailModal, IssuesTab, Toast } from "./components/Results";
import { analyze } from "./lib/invoiceAnalysis";
import { parseInvoiceCSV } from "./lib/csvParser";
import { FIELDS, autoMap, emptyFieldMap } from "./lib/fieldMapping";
import { exportIssuesCSV, exportOverdueCSV, exportSummaryMD } from "./lib/exporters";
import { fmtDate } from "./lib/format";
import { SAMPLE_CSV } from "./lib/sampleData";
import type { AnalysisResult, CsvRow, FieldMap, InvoiceRecord } from "./lib/types";

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
      const analysis = analyze(raw.rows, map);
      setResult(analysis);
      setStage("results");
      setTab("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      showToast("Something went wrong analysing that file. Check your column mapping.");
    }
  }

  function reset() {
    setStage("upload");
    setRaw(null);
    setResult(null);
    setMap(emptyFieldMap());
    setParseWarn(null);
  }

  const reqMissing = FIELDS.filter((field) => field.req && !map[field.key]);

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
                Upload your invoice CSV from Xero, MYOB or Excel and get a 30-second health check: who owes you money, what's risky, and a ranked follow-up list with ready-to-send reminders.
              </p>
              <div className="hero-points">
                {["Ranked action list - not just another dashboard", "Australian-aware: ABN checksum, GST & due-date checks", "Friendly / firm / final reminder drafts in one click"].map((point) => (
                  <div className="hero-point" key={point}>
                    <span className="tick">{Ic.check}</span>
                    {point}
                  </div>
                ))}
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
                {Ic.lock} Processed entirely in your browser. Nothing is uploaded or stored.
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "mapping" && raw && (
        <div className="wrap analysis">
          <div className="ana-head">
            <div>
              <h2>Confirm your columns</h2>
              <div className="meta">
                Found <b>{raw.rows.length} rows</b> and <b>{raw.headers.length} columns</b> in <b className="mono">{raw.fname}</b>. We've matched them automatically - adjust anything that looks off.
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
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 600 }}>Column mapping</div>
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

          {tab === "dashboard" && <Dashboard result={result} onEmail={setEmailRecord} />}
          {tab === "actions" && <ActionTab result={result} onEmail={setEmailRecord} />}
          {tab === "customers" && <CustomersTab result={result} />}
          {tab === "issues" && <IssuesTab result={result} />}
        </div>
      )}

      <div className="footer">
        <div className="wrap footer-inner">
          <div className="disclaimer">
            <b style={{ color: "var(--ink-soft)" }}>Disclaimer:</b> InvoicePulse AU provides invoice data-quality and workflow insights only. It does not provide accounting, tax, legal or debt-collection advice. ABN and GST checks are reasonableness checks, not official validation. Always consult a qualified professional. Sample data is fictional, and your file is processed entirely in your browser - nothing is uploaded or stored.
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
      {emailRecord && <EmailModal record={emailRecord} onClose={() => setEmailRecord(null)} onCopy={copy} />}
      {toast && <Toast msg={toast} />}
    </>
  );
}

