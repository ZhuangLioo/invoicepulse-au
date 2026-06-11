# Test Plan

## Test Objectives

Validate that InvoicePulse AU correctly parses invoice data, maps columns, applies business rules, ages receivables, flags data issues, ranks follow-up actions, tracks follow-ups, and exports useful reports.

## Automated Tests

Run with `npm test` (Vitest). All suites run in CI (GitHub Actions) on every push and pull request, alongside `tsc` type checking and a production build.

### `src/lib/format.test.ts` — parsing primitives

- strict date parsing: ISO, AU day-first, month names
- rejection of impossible dates (no silent rollover) and free text
- amount parsing: currency symbols, thousands separators, accounting negatives `(1,100.00)`, trailing minus
- display rounding vs export-exact (cents) money formatting
- local-date ISO stamping, CSV escaping

### `src/lib/fieldMapping.test.ts` — column mapping

- full auto-map of the bundled sample CSV
- auto-map and preset detection of Xero-style, MYOB-style, and QuickBooks-style fixtures
- exact-before-fuzzy ordering (generic aliases cannot steal exact matches)
- unknown headers stay unmapped

### `src/lib/invoiceAnalysis.test.ts` — business rules

- ABN checksum validation
- status classification: `Unpaid` stays active (substring-bug regression), paid/dead token and phrase matching
- payment-terms parsing (`14 days`, `Net 30`, `COD`)
- overdue calculation and draft/void exclusion
- outstanding and partial payment calculation
- unreadable vs missing due date distinction
- due-date inference from terms (and non-inference over unreadable values)
- aging buckets (Current / 1-30 / 31-60 / 61-90 / 90+) and weighted receivable age
- priority scoring order and visible reasons
- end-to-end analysis of all three accounting-package fixtures

### `src/lib/storage.test.ts` — on-device history

- reminder log persistence and read-back
- tone escalation ladder (friendly → firm → final)
- snapshot diff: recovered amount/count, newly overdue, outstanding delta
- issue dismissal application and no-op behaviour

### `src/lib/exporters.test.ts` — exports

- overdue CSV keeps cents
- CSV escaping of names with commas
- weekly Markdown contains headline metrics, aging table, and disclaimer

## Fixture Files (`samples/`)

| File | Purpose |
|---|---|
| `sample-invoices-au.csv` | Fictional generic dataset used by the in-app sample button |
| `fixture-xero-style.csv` | Headers modelled on a Xero invoice export (`InvoiceNumber`, `ContactName`, `TaxTotal`, …) |
| `fixture-myob-style.csv` | Headers modelled on a MYOB export with currency-formatted amounts |
| `fixture-quickbooks-style.csv` | Headers modelled on a QuickBooks export (`Txn Date`, `Num`, `Open Balance`, …) |

Note: fixtures are modelled approximations of each product's export layout. Validation against real exports from current product versions remains an open roadmap item (see risk register).

## Manual Smoke Test

1. Run `npm run dev`.
2. Open the app.
3. Click `Explore with sample data`.
4. Confirm mapped columns; check the parse preview shows readable dates/amounts and status classifications.
5. Change the "as at" date and run the health check.
6. Check dashboard totals, the aging bar, and bucket amounts.
7. Open Follow-up list; draft a reminder, mark it as sent, and confirm the chip appears.
8. Dismiss a data issue and restore it.
9. Re-upload the sample and confirm the "since your last check" banner appears.
10. Export overdue CSV (check cents) and weekly Markdown summary (check aging table).

## UAT Scenarios

### Scenario 1: Small Business Owner

The user uploads a weekly invoice export and wants to know which five invoices to chase first.

Expected result:

- dashboard highlights total overdue amount and aging
- top follow-up list is clear
- reminder drafts are usable and the sent log carries over to next week

### Scenario 2: Bookkeeper

The user reviews a client CSV with messy invoice data.

Expected result:

- duplicate invoices are flagged
- missing due dates are visible; unreadable dates are flagged as errors
- invalid ABNs and GST mismatches are warnings and can be dismissed after review

### Scenario 3: Systems Analyst Review

The reviewer inspects the project for business-rule quality.

Expected result:

- core rules are outside UI components
- automated tests cover high-risk logic and run in CI
- documentation explains assumptions, exclusions, and scoring weights
