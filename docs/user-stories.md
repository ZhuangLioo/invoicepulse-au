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
- Auto-matched fields are shown.
- I can change mappings before analysis.

## US-003 View Invoice Health Dashboard

As a business owner, I want to see total outstanding, overdue amount, overdue count, and average days overdue so that I understand receivables risk.

Acceptance criteria:

- Draft and void invoices do not count as outstanding.
- Paid invoices do not count as overdue.
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
- Missing due dates are flagged.
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

- Summary includes headline metrics.
- Summary includes top follow-ups.
- Summary includes disclaimer text.

