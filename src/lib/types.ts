export type RiskLevel = "Low" | "Watch" | "High" | "Critical";

export type ReminderTone = "friendly" | "firm" | "final";

export type StatusClass = "active" | "paid" | "dead";

export type FieldKey =
  | "invoice_number"
  | "customer_name"
  | "contact_name"
  | "customer_abn"
  | "customer_email"
  | "invoice_date"
  | "due_date"
  | "paid_date"
  | "amount_ex_gst"
  | "gst_amount"
  | "amount_inc_gst"
  | "amount_paid"
  | "status"
  | "payment_terms"
  | "state";

export type FieldDefinition = {
  key: FieldKey;
  label: string;
  req: boolean;
};

export type FieldMap = Record<FieldKey, string>;

export type CsvRow = Record<string, unknown>;

export type InvoiceIssue = {
  t: string;
  err: boolean;
};

export type InvoiceRecord = {
  _id: number;
  invNo: string;
  customer: string;
  contact: string;
  abn: string | null;
  email: string;
  status: string;
  statusClass: StatusClass;
  invDate: Date | null;
  due: Date | null;
  /** True when due date was inferred from invoice date + payment terms. */
  dueInferred: boolean;
  paidDate: Date | null;
  total: number | null;
  exgst: number | null;
  gst: number | null;
  paid: number | null;
  outstanding: number;
  terms: string;
  state: string;
  abnOk?: boolean | null;
  gstFlag?: boolean;
  isDead?: boolean;
  fullyPaid?: boolean;
  isReceivable?: boolean;
  overdue?: boolean;
  daysOverdue: number;
  daysUntil: number | null;
  partial?: boolean;
  issues: InvoiceIssue[];
  hasErr: boolean;
  priority: number;
  priorityRisk: RiskLevel;
  reasons: string[];
};

export type CustomerSummary = {
  name: string;
  invoices: InvoiceRecord[];
  paidLate: number[];
  outstanding: number;
  overdueCount: number;
  overdueAmt: number;
  email: string;
  contact: string;
  abn: string | null;
  liveCount: number;
  avgDaysLate: number | null;
  historyCount: number;
  score: number;
  risk: RiskLevel;
};

export type AgingBucketKey = "current" | "d1_30" | "d31_60" | "d61_90" | "d90plus";

export type AgingBucket = {
  key: AgingBucketKey;
  label: string;
  count: number;
  amount: number;
};

export type AnalysisMetrics = {
  total: number;
  active: number;
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  avgDaysOverdue: number;
  /** Average age of open receivables in days, weighted by outstanding amount. */
  weightedAgeDays: number | null;
  issuesCount: number;
  critCount: number;
  deadCount: number;
  paidCount: number;
};

export type AnalysisResult = {
  records: InvoiceRecord[];
  customers: CustomerSummary[];
  actionList: InvoiceRecord[];
  aging: AgingBucket[];
  metrics: AnalysisMetrics;
  asOf: Date;
};

export type ReminderEmail = {
  subject: string;
  body: string;
};

/** One reminder the user marked as sent, persisted locally per invoice. */
export type ReminderLogEntry = {
  tone: ReminderTone;
  sentAt: string; // ISO date
};

export type ReminderLog = Record<string, ReminderLogEntry[]>;

/** Per-invoice outstanding snapshot used for run-over-run comparison. */
export type Snapshot = {
  savedAt: string; // ISO date-time
  asOf: string; // ISO date
  totalOutstanding: number;
  totalOverdue: number;
  perInvoice: Record<string, number>;
};

export type SnapshotDiff = {
  previousSavedAt: string;
  recoveredAmount: number;
  recoveredCount: number;
  newOverdueAmount: number;
  newOverdueCount: number;
  outstandingDelta: number;
};
