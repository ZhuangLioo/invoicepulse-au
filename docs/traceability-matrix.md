# Traceability Matrix

| Requirement | User Story | Implementation | Test Coverage |
|---|---|---|---|
| CSV upload | US-001 | `App.tsx`, `csvParser.ts` | Manual smoke test |
| Column mapping | US-002 | `fieldMapping.ts`, `App.tsx` | Manual smoke test |
| Overdue calculation | US-003 | `invoiceAnalysis.ts` | `invoiceAnalysis.test.ts` |
| Draft/void exclusion | US-003 | `invoiceAnalysis.ts` | `invoiceAnalysis.test.ts` |
| Follow-up ranking | US-004 | `invoiceAnalysis.ts`, `Results.tsx` | Manual smoke test |
| Customer behaviour score | US-005 | `invoiceAnalysis.ts` | Manual smoke test |
| Data quality issues | US-006 | `invoiceAnalysis.ts`, `Results.tsx` | `invoiceAnalysis.test.ts` |
| Reminder drafts | US-007 | `reminderEmails.ts`, `Results.tsx` | Manual smoke test |
| Export reports | US-008 | `exporters.ts` | Manual smoke test |

