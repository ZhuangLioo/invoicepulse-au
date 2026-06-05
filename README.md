# InvoicePulse AU

InvoicePulse AU is a browser-based invoice health check and follow-up triage tool for Australian small businesses.

Upload an invoice CSV exported from Xero, MYOB, QuickBooks, or Excel, then get a 30-second view of who owes money, which invoices are risky, and who to follow up today.

Live prototype: https://invoicepulseau.netlify.app/

## Why This Exists

Most small businesses already have a way to create invoices. The harder weekly task is deciding what to do with a messy list of open invoices.

InvoicePulse AU focuses on invoice triage:

- Which invoices are overdue?
- Which customers are repeat late payers?
- Which records have missing due dates, invalid ABNs, GST issues, duplicate invoice numbers, or missing emails?
- Which five invoices should be followed up first?
- What reminder email can be sent today?

This is not an accounting platform and does not replace Xero or MYOB. It is a lightweight diagnostic layer for exported invoice data.

## Core Features

- CSV upload with column auto-mapping
- Sample Australian invoice dataset
- Overdue invoice detection
- Outstanding and overdue amount calculation
- Draft, void, cancelled, and written-off invoice exclusion
- Duplicate invoice number detection
- ABN checksum validation
- GST reasonableness checks
- Customer payment behaviour scoring
- Ranked follow-up action list
- Friendly, firm, and final reminder drafts
- Overdue CSV export
- Data issues CSV export
- Weekly Markdown summary export
- In-browser processing with no server upload

## Privacy Model

The current version processes invoice CSV files entirely in the browser. No invoice data is uploaded, stored, or sent to a backend by this app.

Users should still avoid uploading real sensitive financial data into public demos unless they are comfortable with the environment they are using.

## Disclaimer

InvoicePulse AU provides invoice data-quality and workflow insights only. It does not provide accounting, tax, legal, or debt-collection advice. ABN and GST checks are reasonableness checks, not official validation. Users should consult qualified professionals for formal advice.

## Tech Stack

- React
- TypeScript
- Vite
- Papa Parse
- Vitest

## Project Structure

```text
src/
  components/          UI components and modals
  lib/                 CSV parsing, field mapping, analysis rules, exports
  styles.css           Prototype styling ported from the LinkedIn demo
docs/                  BA / Systems Analyst documentation
samples/               Fictional Australian invoice CSV
```

Key files:

- `src/lib/invoiceAnalysis.ts` - core business rules and risk scoring
- `src/lib/fieldMapping.ts` - standard invoice field model and CSV column matching
- `src/lib/csvParser.ts` - CSV parsing and warning handling
- `src/lib/reminderEmails.ts` - reminder draft generation
- `src/lib/exporters.ts` - CSV and Markdown export builders

## Run Locally

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
- [Data Dictionary](docs/data-dictionary.md)
- [System Overview](docs/system-overview.md)
- [Test Plan](docs/test-plan.md)
- [Risk Register](docs/risk-register.md)
- [Traceability Matrix](docs/traceability-matrix.md)

## Portfolio Context

This project is designed as a practical product and ICT Business Analyst / Systems Analyst portfolio piece. It demonstrates:

- Business problem framing
- Process improvement thinking
- Requirements analysis
- Data quality rules
- Australian SMB context
- Risk-based prioritisation
- Testable business logic
- User-facing product execution

## Roadmap

- Add PDF summary export
- Improve support for real Xero/MYOB/QuickBooks CSV variants
- Add more robust column mapping previews
- Add configurable risk scoring weights
- Add optional AI-assisted weekly commentary
- Explore Xero/MYOB integrations after CSV-first validation

