# User Stories

## US-001 Upload Invoice CSV

As a small business owner, I want to upload an invoice CSV so that I can quickly review open and overdue invoices.

Acceptance criteria:

- I can choose or drag a CSV file.
- I can load sample data without a file.
- I receive a clear error if the file is not usable.

## US-002 Confirm Column Mapping

As an admin user, I want to confirm which CSV columns map to invoice fields so that the analysis is based on the correct data.

Acceptance criteria:

- Required fields are highlighted if missing.
- Auto-matched fields are shown, including Xero/MYOB/QuickBooks-style headers.
- I can change mappings before analysis.
- I can see a preview of how the first rows will be read, with unreadable dates and amounts highlighted.
- I can set the "as at" date for the report.

## US-003 View Invoice Health Dashboard

As a business owner, I want to see total outstanding, overdue amount, overdue count, and average days overdue so that I understand receivables risk.

Acceptance criteria:

- Draft and void invoices do not count as outstanding.
- Paid invoices do not count as overdue, and "Unpaid" never counts as paid.
- The dashboard is readable on desktop and mobile.

## US-004 Prioritise Follow-Up

As an admin user, I want overdue invoices ranked by urgency so that I know who to contact first.

Acceptance criteria:

- The list is sorted by calculated priority.
- The reason for priority is visible.
- Missing email is shown as a blocker.

## US-005 Review Customer Behaviour

As a bookkeeper, I want to see customer-level payment behaviour so that I can identify repeat late payers.

Acceptance criteria:

- Customers are grouped by name.
- Average days late is calculated from paid invoice history.
- Risk labels are shown.

## US-006 Identify Data Quality Issues

As a systems analyst, I want invoice data issues flagged so that process or source-system problems can be fixed.

Acceptance criteria:

- Duplicate invoice numbers are flagged.
- Missing due dates are flagged; unreadable dates and totals are flagged as errors rather than silently guessed.
- Invalid ABNs are flagged.
- GST reasonableness warnings are shown.

## US-007 Generate Reminder Draft

As an admin user, I want to generate a reminder email so that I can follow up professionally without writing from scratch.

Acceptance criteria:

- I can select friendly, firm, or final notice tone.
- Contact name is used when available.
- I can copy the draft.

## US-008 Export Summary

As a business owner, I want to export a weekly summary so that I can share follow-up actions with my team or advisor.

Acceptance criteria:

- Summary includes headline metrics and the receivables aging table.
- Summary includes top follow-ups.
- Summary includes disclaimer text.
- CSV exports keep exact amounts (cents) for reconciliation.

## US-009 See Receivables Aging

As a business owner, I want my open invoices grouped into standard aging buckets so that I can read my receivables the way my accountant does.

Acceptance criteria:

- Buckets are Current / 1-30 / 31-60 / 61-90 / 90+ days overdue.
- Each bucket shows count and amount.
- A weighted receivable age headline is shown when invoice dates exist.

## US-010 Track Follow-Ups Week to Week

As an admin user, I want the tool to remember which reminders I sent and what changed since my last check, so that weekly triage carries context.

Acceptance criteria:

- I can mark a reminder as sent; the tone and date are remembered on this device.
- The next suggested tone escalates (friendly → firm → final).
- After re-uploading, I see what was recovered and what is newly overdue since the last check.
- Nothing is stored outside my browser.

## US-011 Infer Missing Due Dates

As a bookkeeper, I want missing due dates inferred from invoice date and payment terms so that incomplete exports still produce a usable overdue list.

Acceptance criteria:

- Inference only applies when the due date cell is blank.
- Inferred due dates are clearly flagged.
- Unreadable (non-blank) due dates are never inferred over.

## US-012 Dismiss Reviewed Issues

As a bookkeeper, I want to dismiss data-quality warnings I have already checked so that the issues list stays actionable.

Acceptance criteria:

- Each issue can be dismissed individually.
- Dismissals persist on this device and can be restored in one click.
- Counts and exports reflect dismissals.
