import { Ic } from "./Icons";

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>About InvoicePulse AU</h3>
            <div className="sub">Why I built this - and what it's for</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            {Ic.x}
          </button>
        </div>
        <div className="modal-body about-body">
          <p>
            <b>The problem.</b> Australian small businesses do not struggle to <i>create</i> invoices - they struggle to know <i>who to chase for payment today</i>. The data sits in Xero, MYOB or a spreadsheet as a list, not a decision.
          </p>
          <p>
            <b>What this does.</b> Upload an invoice CSV and get a 30-second health check: total outstanding, what is overdue, a follow-up list ranked by amount, days overdue and customer payment history - plus friendly, firm, and final reminder drafts you can copy and send.
          </p>
          <h4>The honest part</h4>
          <p>
            This is an <b>early prototype, not a finished product</b>. Xero and MYOB already have aged-receivables reports and automated reminders, so this project tests whether a lightweight triage layer is useful enough to stand on its own.
          </p>
          <h4>What it shows</h4>
          <ul>
            <li>Australian-aware logic: ABN checksum validation, GST reasonableness checks, AU date handling</li>
            <li>Business-rule thinking: status-vs-due-date conflicts, duplicate detection, transparent priority scoring</li>
            <li>End-to-end product design: from problem framing to a working, usable tool</li>
          </ul>
          <h4>About me</h4>
          <p>
            I'm <b>Alvin Li</b>, based in Sydney, looking for <b>Business Analyst / Product</b> roles. I like turning messy real-world problems into structured, usable things.
          </p>
          <div className="about-cta">
            <a className="btn btn-primary btn-sm" href="https://www.linkedin.com/in/alvin-zhuang-li-0999b0380/" target="_blank" rel="noopener">
              Connect on LinkedIn
            </a>
            <a className="btn btn-ghost btn-sm" href="mailto:alvinli1996@gmail.com">
              Get in touch
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

