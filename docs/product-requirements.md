# Product Requirements

## Product Summary

InvoicePulse AU is a lightweight invoice health check and follow-up triage tool for Australian small businesses. The MVP is CSV-first and browser-only: users upload exported invoice data, confirm column mapping, and receive risk-ranked invoice actions.

## Goals

1. Help users identify who owes money.
2. Help users prioritise overdue invoices.
3. Help users find invoice data quality issues.
4. Generate practical follow-up outputs.
5. Demonstrate a professional BA/System Analyst project.

## Non-Goals

- Replacing Xero, MYOB, QuickBooks, or accounting software
- Taking payments
- Storing invoice data
- Providing tax, accounting, legal, or debt collection advice
- Performing official ABN lookup

## MVP Features

### CSV Upload

Users can upload a CSV file or load fictional sample data.

Acceptance criteria:

- CSV files can be read in-browser.
- Empty files are rejected.
- Files without headers are rejected.
- Files over 8MB are rejected.
- Parse warnings are shown without blocking usable files.

### Column Mapping

Users can confirm automatically mapped fields.

Acceptance criteria:

- Required fields are invoice number, customer, due date, and total.
- Common field aliases are detected.
- Users can manually adjust every field.
- Analysis cannot run if required fields are missing.

### Invoice Analysis

The tool calculates outstanding and overdue status.

Acceptance criteria:

- Overdue means due date is before analysis date and money is still owing.
- Paid invoices are not overdue.
- Draft, void, cancelled, written-off, and credit records are excluded from receivables.
- Partial payments reduce outstanding amount.

### Australian Checks

The tool performs Australian-oriented data quality checks.

Acceptance criteria:

- ABN checksum validation is applied when ABN is present.
- GST is checked against 10% of ex-GST amount or 1/11 of total.
- AU date formats are supported.
- Checks are labelled as reasonableness checks, not official validation.

### Follow-Up List

The tool ranks overdue invoices by priority.

Acceptance criteria:

- More days overdue increases priority.
- Higher outstanding amount increases priority.
- Repeat late-paying customer history increases priority.
- Missing email is flagged because it blocks action.
- The dashboard shows the top five follow-ups.

### Reminder Drafts

Users can generate reminder emails.

Acceptance criteria:

- Friendly, firm, and final reminder tones are available.
- Contact name is used when provided.
- Customer name, invoice number, amount, due date, and days overdue are included.
- Email text can be copied.

### Exports

Users can export reports.

Acceptance criteria:

- Overdue report exports as CSV.
- Data issues export as CSV.
- Weekly summary exports as Markdown.

## Non-Functional Requirements

- Browser-only processing for MVP privacy.
- Responsive layout with horizontal scrolling for data tables.
- Business rules must be testable outside UI components.
- Error and warning messages must use plain English.
- No backend dependency in MVP.

