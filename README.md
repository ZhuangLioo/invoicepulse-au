# InvoicePulse AU

InvoicePulse AU is a browser-based invoice health check and follow-up triage tool for Australian small businesses.

Upload an invoice CSV exported from Xero, MYOB, QuickBooks, or Excel, then get a 30-second view of who owes money, how receivables are aging, which invoices are risky, and who to follow up today - with reminder history carried over week to week.

Live prototype: https://invoicepulseau.netlify.app/

## Why This Exists

Most small businesses already have a way to create invoices. The harder weekly task is deciding what to do with a messy list of open invoices.

InvoicePulse AU focuses on invoice triage:

- Which invoices are overdue, and how old is the debt (aging buckets)?
- Which customers are repeat late payers?
- Which records have missing due dates, invalid ABNs, GST issues, duplicate invoice numbers, or missing emails?
- Which five invoices should be followed up first?
- What reminder email can be sent today - and what was already sent last week?
- What changed since the last check?

This is not an accounting platform and does not replace Xero or MYOB. It is a lightweight diagnostic layer for exported invoice data.

## Core Features

Onboarding

- Guided landing page: three-step how-it-works, capability cards, and an explicit "What your file needs" panel covering the hard structure rules (.csv only, one header row, one invoice per row, four required columns) and what gets cleaned up automatically vs. what must be fixed in the file

Analysis

- CSV upload with column auto-mapping (exact-before-fuzzy), including headers modelled on Xero, MYOB, and QuickBooks export layouts with format detection
- Mapping-step parse preview: see how dates, amounts, and statuses will be read before running the check; unreadable values are highlighted
- Configurable "as at" reporting date
- Receivables aging (Current / 1-30 / 31-60 / 61-90 / 90+ days) with amount-weighted receivable age
- Overdue detection with strict day-first AU date parsing (impossible dates are flagged, never silently rolled over)
- Due-date inference from invoice date + payment terms when the due date is blank
- Status classification by whole tokens ("Unpaid" is never treated as paid; "Paid by credit card" is never treated as a credit note)
- Draft, void, cancelled, credit-note, and written-off invoice exclusion
- Duplicate invoice number detection, ABN checksum validation, GST reasonableness checks
- Customer payment behaviour scoring and a ranked follow-up action list with visible reasons

Weekly workflow

- Friendly, firm, and final reminder drafts; "mark as sent" log with automatic tone escalation
- Run-over-run comparison: recovered amounts and newly overdue invoices since your last check
- Dismissible data-quality issues (after review), with one-click restore

Exports

- Overdue CSV (cents-exact amounts), data issues CSV, weekly Markdown summary with aging table

## Privacy Model

Invoice CSV files are processed entirely in the browser. No invoice data is uploaded, stored, or sent to a backend by this app.

Optional history features (reminder log, last-analysis snapshot, dismissed issues) are stored only in the browser's localStorage on the user's device, are documented in the [data dictionary](docs/data-dictionary.md), and can be cleared via browser settings.

Users should still avoid uploading real sensitive financial data into public demos unless they are comfortable with the environment they are using.

## Disclaimer

InvoicePulse AU provides invoice data-quality and workflow insights only. It does not provide accounting, tax, legal, or debt-collection advice. ABN and GST checks are reasonableness checks, not official validation. The Xero/MYOB/QuickBooks header presets are modelled on common export layouts and are not endorsed by or validated with those vendors. Users should consult qualified professionals for formal advice.

## Tech Stack

- React 19
- TypeScript (strict)
- Vite
- Papa Parse
- Vitest (59 unit tests) + GitHub Actions CI (type check, tests, build)

## Project Structure

```text
src/
  components/          UI components and modals (incl. aging card, mapping preview, diff banner)
  lib/                 CSV parsing, field mapping, analysis rules, on-device storage, exports
  styles.css           Dark data-forward design system (Space Grotesk / Inter / JetBrains Mono)
docs/                  BA / Systems Analyst documentation
samples/               Fictional sample CSV + Xero/MYOB/QuickBooks-style fixtures
.github/workflows/     CI pipeline
```

Key files:

- `src/lib/invoiceAnalysis.ts` - business rules, status classification, aging, risk scoring
- `src/lib/fieldMapping.ts` - field model, exact-then-fuzzy CSV column matching, preset detection
- `src/lib/format.ts` - strict date/amount parsing, display vs export formatting
- `src/lib/storage.ts` - reminder log, run-over-run snapshot, issue dismissals (localStorage)
- `src/lib/csvParser.ts` - CSV parsing and warning handling
- `src/lib/reminderEmails.ts` - reminder draft generation
- `src/lib/exporters.ts` - CSV and Markdown export builders

## Run Locally

Requires Node.js 20.19+ (Node 22 LTS recommended).

```bash
npm install
npm run dev
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## Documentation

- [Business Case](docs/business-case.md)
- [Product Requirements](docs/product-requirements.md)
- [User Stories](docs/user-stories.md)
- [Data Dictionary](docs/data-dictionary.md) - includes status/date/amount rules and scoring weights
- [System Overview](docs/system-overview.md)
- [Test Plan](docs/test-plan.md)
- [Risk Register](docs/risk-register.md)
- [Traceability Matrix](docs/traceability-matrix.md) - requirements → implementation → tests

## Portfolio Context

This project is designed as a practical product and ICT Business Analyst / Systems Analyst portfolio piece. It demonstrates:

- Business problem framing
- Process improvement thinking
- Requirements analysis with requirement-to-test traceability
- Data quality rules and strict parsing discipline
- Australian SMB context (ABN, GST, day-first dates, AR aging)
- Risk-based prioritisation with documented scoring weights
- Testable business logic verified in CI
- User-facing product execution

## Roadmap

- Validate header presets against captured real Xero/MYOB/QuickBooks exports
- Add PDF summary export
- Add configurable risk scoring weights
- Per-dataset snapshot keys so multi-client bookkeepers get correct run-over-run diffs
- Add optional AI-assisted weekly commentary
- Explore Xero/MYOB integrations after CSV-first validation
