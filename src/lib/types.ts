export type RiskLevel = "Low" | "Watch" | "High" | "Critical";

export type ReminderTone = "friendly" | "firm" | "final";

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
  invDate: Date | null;
  due: Date | null;
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

export type AnalysisMetrics = {
  total: number;
  active: number;
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  avgDaysOverdue: number;
  issuesCount: number;
  critCount: number;
  deadCount: number;
  paidCount: number;
};

export type AnalysisResult = {
  records: InvoiceRecord[];
  customers: CustomerSummary[];
  actionList: InvoiceRecord[];
  metrics: AnalysisMetrics;
  asOf: Date;
};

export type ReminderEmail = {
  subject: string;
  body: string;
};

