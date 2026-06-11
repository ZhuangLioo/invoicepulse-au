# Traceability Matrix

Requirements (FR-x) are defined in [product-requirements.md](product-requirements.md); user stories in [user-stories.md](user-stories.md). Automated suites run in CI (`.github/workflows/ci.yml`).

| Requirement | User Story | Implementation | Test Coverage |
|---|---|---|---|
| FR-1 CSV upload | US-001 | `App.tsx`, `csvParser.ts` | `fieldMapping.test.ts` (parse of fixtures); manual smoke test |
| FR-2 Column mapping & parse preview | US-002 | `fieldMapping.ts`, `Results.tsx` (MappingPreview), `App.tsx` | `fieldMapping.test.ts` (sample + 3 fixtures, preset detection); manual smoke test for preview UI |
| FR-2 As-at date | US-002 | `App.tsx` | `invoiceAnalysis.test.ts` (analyze takes asOf); manual smoke test |
| FR-3 Overdue calculation | US-003 | `invoiceAnalysis.ts` | `invoiceAnalysis.test.ts` ("overdue and exclusion rules") |
| FR-3 Draft/void exclusion | US-003 | `invoiceAnalysis.ts` (classifyStatus) | `invoiceAnalysis.test.ts` ("classifyStatus", exclusion tests) |
| FR-3 Unpaid-is-not-paid (token matching) | US-003 | `invoiceAnalysis.ts` (classifyStatus) | `invoiceAnalysis.test.ts` (substring-bug regression) |
| FR-3 Due-date inference from terms | US-011 | `invoiceAnalysis.ts` (parseTermsDays) | `invoiceAnalysis.test.ts` ("due date inference from terms") |
| FR-3 Strict date/amount parsing | US-006 | `format.ts` | `format.test.ts` |
| FR-4 Receivables aging & weighted age | US-009 | `invoiceAnalysis.ts`, `Results.tsx` (AgingCard) | `invoiceAnalysis.test.ts` ("receivables aging") |
| FR-5 ABN checksum | US-006 | `invoiceAnalysis.ts` (validABN) | `invoiceAnalysis.test.ts` ("validABN") |
| FR-5 GST reasonableness | US-006 | `invoiceAnalysis.ts` | `invoiceAnalysis.test.ts` ("data quality issues") |
| FR-6 Follow-up ranking | US-004 | `invoiceAnalysis.ts`, `Results.tsx` | `invoiceAnalysis.test.ts` ("priority scoring") |
| FR-6 Customer behaviour score | US-005 | `invoiceAnalysis.ts` | `invoiceAnalysis.test.ts` (late-payer scoring) |
| FR-7 Reminder drafts | US-007 | `reminderEmails.ts`, `Results.tsx` (EmailModal) | manual smoke test |
| FR-7 Follow-up tracking & tone escalation | US-010 | `storage.ts`, `Results.tsx`, `App.tsx` | `storage.test.ts` ("reminder log") |
| FR-8 Run-over-run comparison | US-010 | `storage.ts` (snapshot/diff), `Results.tsx` (DiffBanner) | `storage.test.ts` ("run-over-run snapshot diff") |
| FR-9 Data quality issues | US-006 | `invoiceAnalysis.ts`, `Results.tsx` | `invoiceAnalysis.test.ts` ("data quality issues") |
| FR-9 Dismissible issues | US-012 | `storage.ts` (applyDismissals), `Results.tsx`, `App.tsx` | `storage.test.ts` ("dismissible issues") |
| FR-10 Export reports (cents, aging table) | US-008 | `exporters.ts` | `exporters.test.ts` |

## Gaps

- Reminder draft content (FR-7 tone wording) is covered by manual review only.
- The mapping preview and dismiss/restore UI interactions are manual smoke-test items (no component-level UI tests yet).
- Accounting-package fixtures are modelled layouts, not captured real exports (risk register item R-3).
