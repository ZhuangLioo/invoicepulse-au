# Risk Register

| ID | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---:|---|
| R-1 | Users think this replaces accounting software | Confusion | Medium | Position clearly as invoice health check, not accounting platform |
| R-2 | GST/ABN checks are seen as official advice | Compliance risk | Medium | Prominent disclaimer and "reasonableness check" language; dismissals require user review |
| R-3 | Accounting-package presets are modelled, not validated against real current exports | First-run mapping failure | High | Exact-before-fuzzy mapping, manual mapping UI, parse preview before analysis, fixture tests; roadmap item to capture real export samples |
| R-4 | Real CSV exports vary widely beyond presets | Upload failure or poor mapping | High | Alias-based mapping, manual mapping, mapping preview highlights unreadable values |
| R-5 | Ambiguous or invalid dates silently misread | Wrong overdue amounts, lost trust | Medium | Strict day-first parsing, impossible dates rejected, "Unreadable date" errors, preview shows parsed dates before analysis |
| R-6 | Users upload sensitive financial data | Trust/privacy concern | Medium | Browser-only processing, no backend, clear privacy note |
| R-7 | On-device history (reminder log, snapshot) is misunderstood as cloud storage, or persists on shared devices | Privacy expectation mismatch | Medium | Explicit "this device only" copy in UI and disclaimer; keys documented in data dictionary; clearable via browser settings |
| R-8 | Risk scoring feels arbitrary | Low trust | Medium | Reasons visible per invoice; scoring weights documented in data dictionary |
| R-9 | Snapshot diff misleads when the user uploads a different dataset (other entity/period) | Wrong "recovered" numbers | Medium | Diff banner names the comparison date; resetting via new analysis overwrites snapshot; future: per-file snapshot keys |
| R-10 | Prototype is mistaken for finished SaaS | Expectation mismatch | Medium | Label as early prototype and portfolio project |
| R-11 | Mobile tables become hard to read | Poor usability | Medium | Horizontal scrolling and mobile smoke tests |
