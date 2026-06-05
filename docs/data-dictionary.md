# Data Dictionary

| Field | Required | Type | Description |
|---|---:|---|---|
| invoice_number | Yes | string | Invoice identifier used for duplicate detection |
| customer_name | Yes | string | Customer or business name |
| contact_name | No | string | Person used in reminder greeting |
| customer_abn | No | string | Australian Business Number for checksum validation |
| customer_email | No | string | Follow-up email address |
| invoice_date | No | date | Invoice issue date |
| due_date | Yes | date | Payment due date used for overdue calculation |
| paid_date | No | date | Payment date used for customer history |
| amount_ex_gst | No | number | Amount excluding GST |
| gst_amount | No | number | GST amount |
| amount_inc_gst | Yes | number | Total invoice amount |
| amount_paid | No | number | Amount already paid |
| status | No | string | Invoice status such as Sent, Paid, Draft, Void, Overdue |
| payment_terms | No | string | Terms such as 7 days, 14 days, 30 days |
| state | No | string | Australian state or territory |

## Status Handling

Paid-like statuses:

- paid
- settled
- closed

Dead/non-receivable statuses:

- draft
- void
- cancelled / canceled
- deleted
- written off / write off
- credit

Dead statuses are excluded from outstanding totals, overdue counts, and most data-quality warnings.

## Date Handling

Supported date formats:

- `yyyy-mm-dd`
- `dd/mm/yyyy`
- `dd-mm-yyyy`
- browser-supported date strings as a fallback

## GST Check

GST is checked against:

- 10% of amount excluding GST, when available
- 1/11 of amount including GST, when ex-GST amount is not available

A small rounding tolerance is allowed. This is a reasonableness check only.

