import { fmtDate, fmtMoney } from "./format";
import type { InvoiceRecord, ReminderEmail, ReminderTone } from "./types";

export function buildEmail(record: InvoiceRecord, tone: ReminderTone, businessName = "[Your Business]"): ReminderEmail {
  const amount = fmtMoney(record.outstanding);
  const due = fmtDate(record.due);
  const days = record.daysOverdue;
  const reference = record.invNo || "(no ref)";
  const customer = record.customer;
  const greeting = record.contact ? record.contact : customer;

  if (tone === "friendly") {
    return {
      subject: `Friendly reminder: invoice ${reference} (${amount})`,
      body: `Hi ${greeting},

I hope you're going well. This is a quick reminder that invoice ${reference} for ${amount}${record.contact ? ` (${customer})` : ""} was due on ${due}${days > 0 ? ` and is now ${days} day${days > 1 ? "s" : ""} overdue` : ""}.

If it's already on its way, please ignore this note. Otherwise, could you let me know when we can expect payment? Happy to resend the invoice or sort out any questions.

Thanks so much,
${businessName}`,
    };
  }

  if (tone === "firm") {
    return {
      subject: `Action required: overdue invoice ${reference} (${amount})`,
      body: `Hi ${greeting},

I'm following up on invoice ${reference} for ${amount}, which was due on ${due} and is now ${days} day${days > 1 ? "s" : ""} overdue. Our records show it remains unpaid.

Could you please arrange payment by the end of this week, or let me know if there's an issue I can help resolve? If payment has already been made, please send through the remittance so I can update our records.

I'd appreciate a reply confirming next steps.

Regards,
${businessName}`,
    };
  }

  return {
    subject: `Final notice: invoice ${reference} - ${amount} now ${days} days overdue`,
    body: `Dear ${greeting},

Despite previous reminders, invoice ${reference} for ${amount} remains unpaid. It was due on ${due} and is now ${days} day${days > 1 ? "s" : ""} overdue.

This is a final request for payment. Please arrange to settle the full outstanding amount within 7 days of this notice. If you are experiencing difficulty, contact me directly so we can discuss a payment arrangement.

If we don't hear from you, we may need to consider further steps to recover the amount owing.

Please treat this matter as urgent.

Regards,
${businessName}`,
  };
}

