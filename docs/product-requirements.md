# Product Requirements

## Product Summary

InvoicePulse AU is a lightweight invoice health check and follow-up triage tool for Australian small businesses. The MVP is CSV-first and browser-only: users upload exported invoice data, confirm column mapping with a live parse preview, and receive a receivables-aging view, risk-ranked follow-up actions, and on-device follow-up tracking.

## Goals

1. Help users identify who owes money.
2. Help users prioritise overdue invoices.
3. Help users find invoice data quality issues.
4. Generate practical follow-up outputs.
5. Make weekly re-checks useful: show what changed and what was already chased.
6. Demonstrate a professional BA/System Analyst project.

## Non-Goals

- Replacing Xero, MYOB, QuickBooks, or accounting software
- Taking payments
- Storing invoice data on any server
- Providing tax, accounting, legal, or debt collection advice
- Performing official ABN lookup

## MVP Features

### FR-1 CSV Upload

Users can upload a CSV file or load fictional sample data.

Acceptance criteria:

- CSV files can be read in-browser.
- Empty files are rejected.
- Files without headers are rejected.
- Files over 8MB are rejected.
- Parse warnings are shown without blocking usable files.
- The landing page states the hard structure rules before upload: `.csv` only (xlsx must be saved as CSV), one header row, one invoice per row, four findable required columns; merged cells, report titles, and subtotal rows are explicitly called out as unsupported.

### FR-2 Column Mapping & Parse Preview

Users can confirm automatically mapped fields and see how rows will be interpreted before analysis.

Acceptance criteria:

- Required fields are invoice number, customer, due date, and total.
- Common field aliases are detected, including headers modelled on Xero, MYOB, and QuickBooks export layouts.
- Exact alias matches are resolved for all fields before any fuzzy matching, so generic aliases cannot steal another field's column.
- When a file resembles a known accounting-package layout, the detected format is shown.
- A preview of the first rows shows parsed dates, amounts, and status classification; unreadable values are highlighted before analysis.
- Users can manually adjust every field.
- Users can set the "as at" reporting date (defaults to today).
- Analysis cannot run if required fields are missing.

### FR-3 Invoice Analysis

The tool calculates outstanding and overdue status.

Acceptance criteria:

- Overdue means due date is before the as-at date and money is still owing.
- Paid invoices are not overdue; `Unpaid` and similar statuses are never treated as paid (token matching, not substrings).
- Draft, void, cancelled, written-off, and credit-note records are excluded from receivables.
- Partial payments reduce outstanding amount.
- A missing due date is inferred from invoice date + payment terms when possible, and flagged as inferred.
- Values that are present but unreadable (dates, totals) are flagged as errors, never silently guessed.

### FR-4 Receivables Aging

The tool presents the standard accounts-receivable aging view.

Acceptance criteria:

- Open invoices are bucketed: Current / 1-30 / 31-60 / 61-90 / 90+ days overdue.
- Each bucket shows invoice count and total amount.
- A weighted average receivable age (by outstanding amount) is shown when invoice dates are available.
- The aging table is included in the weekly Markdown summary.

### FR-5 Australian Checks

The tool performs Australian-oriented data quality checks.

Acceptance criteria:

- ABN checksum validation is applied when ABN is present.
- GST is checked against 10% of ex-GST amount or 1/11 of total.
- AU day-first date formats are supported; impossible dates are rejected, not rolled over.
- Checks are labelled as reasonableness checks, not official validation.

### FR-6 Follow-Up List

The tool ranks overdue invoices by priority.

Acceptance criteria:

- More days overdue increases priority.
- Higher outstanding amount increases priority.
- Repeat late-paying customer history increases priority.
- Missing email is flagged because it blocks action.
- The dashboard shows the top five follow-ups.
- Scoring weights are documented in the data dictionary and reasons are visible per invoice.

### FR-7 Reminder Drafts & Follow-Up Tracking

Users can generate reminder emails and track what was sent.

Acceptance criteria:

- Friendly, firm, and final reminder tones are available.
- Contact name is used when provided.
- Customer name, invoice number, amount, due date, and days overdue are included.
- Email text can be copied.
- Users can mark a reminder as sent; the log is stored on-device only.
- The suggested tone escalates based on the last reminder sent (friendly → firm → final).
- The follow-up list shows the last reminder sent per invoice.

### FR-8 Run-over-Run Comparison

Repeat use shows what changed since the previous check.

Acceptance criteria:

- Each analysis saves an on-device snapshot of per-invoice outstanding amounts.
- The next analysis reports amount recovered, invoices cleared, and newly overdue invoices since the previous snapshot.

### FR-9 Data Issue Management

Users can manage data-quality findings.

Acceptance criteria:

- Duplicate invoice numbers, missing/unreadable dates and totals, invalid ABNs, and GST mismatches are flagged.
- Individual issues can be dismissed after review; dismissals persist on-device and can be restored.
- Issue counts and exports reflect dismissals.

### FR-10 Exports

Users can export reports.

Acceptance criteria:

- Overdue report exports as CSV with exact amounts (cents preserved).
- Data issues export as CSV.
- Weekly summary exports as Markdown including headline metrics and the aging table.

## Non-Functional Requirements

- Browser-only processing; no invoice data leaves the device. On-device storage is limited to reminder log, snapshot, and dismissals, and is documented in the data dictionary.
- The landing page must guide first use (three-step how-it-works), surface capabilities before upload (feature cards), and carry visible trust signals (privacy, automated test count, transparent scoring).
- Visual design: dark, data-forward theme (Space Grotesk / Inter / JetBrains Mono, cyan-teal accent system) intended to read as a credible data tool.
- Responsive layout with horizontal scrolling for data tables.
- Business rules must be testable outside UI components; unit tests run in CI on every push.
- Error and warning messages must use plain English; analysis failures surface the underlying error.
- No backend dependency in MVP.
