# Test Plan

## Test Objectives

Validate that InvoicePulse AU correctly parses invoice data, maps columns, applies business rules, flags data issues, ranks follow-up actions, and exports useful reports.

## Unit Tests

Covered in `src/lib/invoiceAnalysis.test.ts`:

- ABN checksum validation
- overdue calculation
- draft and void exclusion
- outstanding amount calculation
- duplicate invoice detection
- GST reasonableness warning
- missing email warning

## Manual Smoke Test

1. Run `npm run dev`.
2. Open the app.
3. Click `Explore with sample data`.
4. Confirm mapped columns.
5. Run health check.
6. Check dashboard totals.
7. Open Follow-up list.
8. Generate a reminder email.
9. Export overdue CSV.
10. Export weekly Markdown summary.

## Fixture CSV Tests

Maintain fixture files for:

- clean data
- overdue-heavy data
- missing required fields
- duplicate invoices
- invalid ABNs
- GST mismatch
- draft and void invoices
- partial payments

## UAT Scenarios

### Scenario 1: Small Business Owner

The user uploads a weekly invoice export and wants to know which five invoices to chase first.

Expected result:

- dashboard highlights total overdue amount
- top follow-up list is clear
- reminder drafts are usable

### Scenario 2: Bookkeeper

The user reviews a client CSV with messy invoice data.

Expected result:

- duplicate invoices are flagged
- missing due dates are visible
- invalid ABNs and GST mismatches are warnings

### Scenario 3: Systems Analyst Review

The reviewer inspects the project for business-rule quality.

Expected result:

- core rules are outside UI components
- tests cover high-risk logic
- documentation explains assumptions and exclusions

