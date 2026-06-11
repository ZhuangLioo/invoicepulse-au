# Data Dictionary

## Input Fields

| Field | Required | Type | Description |
|---|---:|---|---|
| invoice_number | Yes | string | Invoice identifier used for duplicate detection |
| customer_name | Yes | string | Customer or business name |
| contact_name | No | string | Person used in reminder greeting |
| customer_abn | No | string | Australian Business Number for checksum validation |
| customer_email | No | string | Follow-up email address |
| invoice_date | No | date | Invoice issue date; also used for due-date inference and receivable age |
| due_date | Yes | date | Payment due date used for overdue calculation |
| paid_date | No | date | Payment date used for customer history |
| amount_ex_gst | No | number | Amount excluding GST |
| gst_amount | No | number | GST amount |
| amount_inc_gst | Yes | number | Total invoice amount |
| amount_paid | No | number | Amount already paid |
| status | No | string | Invoice status such as Sent, Paid, Draft, Void, Overdue |
| payment_terms | No | string | Terms such as 7 days, 14 days, Net 30, COD |
| state | No | string | Australian state or territory |

If `amount_inc_gst` cannot be matched, an outstanding-balance column (`Open Balance`, `Amount Due`, `Balance Due`) is accepted as a last-resort total.

## Derived Fields

| Field | Type | Description |
|---|---|---|
| statusClass | active / paid / dead | Classification of the raw status (see Status Handling) |
| dueInferred | boolean | True when due date was derived from invoice date + payment terms |
| outstanding | number | `max(0, total - paid)`; total when no paid amount |
| daysOverdue | number | Days between the as-at date and due date, when positive |
| priority | 0-100 | Follow-up priority score (see Scoring) |
| weightedAgeDays | number | Average age of open receivables since invoice date, weighted by outstanding amount |

## Status Handling

Statuses are matched as **whole tokens or exact phrases, never substrings** — so `Unpaid` does not match `paid`, and `Paid by credit card` does not match `credit`.

Paid-like tokens:

- paid, settled, closed

Dead/non-receivable tokens and phrases:

- draft, void, voided, deleted
- cancelled / canceled
- written off / write off / writeoff
- credit note, credit (exact phrase only)

Explicitly active despite containing "paid": `unpaid`, `not paid`, `part paid`, `partially paid`.

Unrecognised statuses are treated as active. Dead statuses are excluded from outstanding totals, overdue counts, and most data-quality warnings.

## Date Handling

Dates are parsed **strictly**. A value that is present but unparseable is flagged as an `Unreadable … date` error rather than treated as missing — a silently wrong date is worse than a flagged one.

Supported formats:

- `yyyy-mm-dd` (optionally with a time part, which is dropped)
- `dd/mm/yyyy`, `dd-mm-yyyy`, `dd.mm.yyyy` — always day-first (Australian)
- `5 Jun 2026`, `05-Jun-2026`, `Jun 5, 2026` (month names)

Rejected (returns unreadable, never guesses):

- impossible dates such as `31/02/2026` (no silent rollover)
- free text and any other format

## Due Date Inference

When the due date column is **blank** (not unreadable) and both an invoice date and parseable payment terms exist, the due date is inferred as `invoice_date + terms` and flagged with an informational issue `Due date inferred from terms`.

Recognised terms: `N days`, `Net N`, a bare number, `COD` / `due on receipt` / `immediate` (0 days).

## Amount Handling

- Currency symbols (`$`, `A$`, `AUD`), commas, and spaces are stripped.
- Accounting negatives are supported: `(1,100.00)` parses as `-1100.00`, as does trailing-minus `1100-`.
- Unparseable values present in the file are flagged as `Unreadable total` errors.
- On-screen amounts are rounded to whole dollars; **CSV exports keep cents** for reconciliation.

## Receivables Aging

Open (receivable) invoices are bucketed by days overdue at the as-at date:

| Bucket | Definition |
|---|---|
| Current | Not yet due |
| 1-30 days | 1-30 days overdue |
| 31-60 days | 31-60 days overdue |
| 61-90 days | 61-90 days overdue |
| 90+ days | More than 90 days overdue |

## GST Check

GST is checked against:

- 10% of amount excluding GST, when available
- 1/11 of amount including GST, when ex-GST amount is not available

Tolerance is `max($1, 2%)` of the expected GST. Mixed supplies with GST-free items can legitimately trigger this warning; users can dismiss a checked warning (stored on-device only). This is a reasonableness check only.

## Scoring

### Invoice priority (0-100)

| Factor | Points |
|---|---|
| Days overdue | up to 30 (scaled over 90 days) + 6 base |
| Outstanding amount | 4 / 8 / 14 / 20 / 25 (>$1k / >$3k / >$8k / >$15k tiers) |
| Customer history: avg >14 days late | +20 |
| Customer history: avg >5 days late | +11 |
| Customer has >1 overdue invoice | +12 |
| No email on file | +10 |
| Part-paid | -6 |

Risk labels: Critical ≥70, High ≥50, Watch ≥25, otherwise Low. Every score is accompanied by visible plain-English reasons.

### Customer behaviour score (0-100)

| Factor | Points |
|---|---|
| Avg days late: >30 / >14 / >5 / >0 | 45 / 32 / 18 / 8 |
| Overdue invoice count | 12 each, capped at 30 |
| Overdue amount: >$10k / >$3k / >$0 | 20 / 12 / 5 |

Risk labels: Critical ≥70, High ≥45, Watch ≥22, otherwise Low.

## Locally Stored Data (this device only)

| Key | Contents |
|---|---|
| `invoicepulse.reminderLog.v1` | Per-invoice reminder log: tone + sent date for each "Mark as sent" |
| `invoicepulse.snapshot.v1` | Last analysis snapshot: per-invoice outstanding, used for run-over-run comparison |
| `invoicepulse.dismissedIssues.v1` | Issue dismissals (invoice + issue text) |

Nothing is transmitted; clearing browser storage removes all of it.
