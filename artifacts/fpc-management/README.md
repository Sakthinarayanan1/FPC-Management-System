# FPC Desk · frontend prototype

Browser-only prototype for Green Valley Farmer Producer Company and the TSF monitoring workspace. No backend, real authentication, payment rails, or file storage is connected. Records are fictional and persist in this browser's local storage.

## Demo role reachability

Every profile is available from the role picker and the in-app role switcher. Role-specific menus are generated from `src/lib/config.ts`.

| Role | Reachable | Role-specific navigation |
| --- | --- | --- |
| TSF Central Admin | Yes | National dashboard, monitoring, FPC onboarding/directory, analytics, consolidated MIS, audit/support |
| FPC Admin / Manager | Yes | Overview, approvals, farmer/shareholder records, purchases, sales, inventory, finance, compliance, reports, settings |
| Accountant / Finance Officer | Yes | Finance dashboard, ledgers, payments, expenses, share capital, dividends |
| Procurement / Purchase Officer | Yes | Procurement dashboard, purchase entries, farmers, input supply, stock, market rates |
| Sales / Marketing Officer | Yes | Sales dashboard, sales entries, buyers, input supply, stock, market intelligence |
| Inventory / Stock Manager | Yes | Stock dashboard, stock register, movements, godowns, adjustments, unit converter |
| Data Entry Operator | Yes | Data entry home, farmer/shareholder/purchase/sales entry, bulk upload, sync centre, rejected entries |
| Compliance / Documentation Officer | Yes | Compliance dashboard, filings, meetings, document vault, shareholder register, gallery, reports |
| Field Staff | Yes | Field home, farmer registration, baseline survey, purchase draft, field farmer list, gallery, sync centre |
| Director / Board Member / Auditor | Yes | Oversight, read-only records, audit trail, board pack |
| Farmer | Yes | Member home, profile, own sales, ledger/payments, inputs, messages/support |
| Shareholder | Yes | Member home, shareholding, dividend/benefits, meetings, company information, messages/support |

## Implemented prototype paths

- Local persistence and reset-to-seed control; role switching; English/Hindi/Odia navigation and title labels.
- Seeded Green Valley scenarios, eight-FPC TSF directory, masked contact/bank references, INR Indian digit grouping, and unit conversion (including tonne/quintal/bag).
- Purchase create → approve → stock increase; sale create → approve → stock decrease and cost/margin calculation; payment create → farmer ledger credit; approvals produce notification and audit events.
- Farmer, shareholder, purchase, sale, payment, filing, expense, buyer, and godown quick-create forms; filters/search, status chips, table actions, report export feedback.
- Offline simulation and sync queue with conflict-resolution affordance; member benefit and receipt-oriented views; approvals, report library, monitoring matrix, settings, mock backup restore and audit trail.
- TSF seven-step FPC onboarding with field validation, 10-second local autosave, draft/submitted/rejected/active states, approval/rejection reasons, typed-name delete protection, reasoned deactivation, reactivation, and Excel/CSV/TSV import validation.
- FPC Company Profile editor with seven company sections plus bank accounts, locked FPC code/onboarding date, before-save change comparison, immediate fields, TSF-approved protected changes, notifications, audit history, and licence-renewal reminders.
- Seven FPC reports with FPC filters, row drill-down, real `.xlsx` downloads, and print-to-PDF.
- A 41-item FPC Admin setup checklist linked to the screen for each check; the checklist state is calculated from current saved demo records.
- Exact shared footer text on application pages and role picker.

## FPC Admin checklist · 41 implemented rows

- The checklist lives under **FPC Admin / Manager → Setup Checklist**. Each screen link below is also present in role-specific navigation.

| # | Checklist row | Status | Screen path |
| --- | --- | --- | --- |
| 1 | FPC legal profile | Implemented | `/fpc-profile` |
| 2 | Company documents | Implemented | `/compliance/documents` |
| 3 | Bank account details | Implemented | `/finance/bank-book` |
| 4 | Board and user roster | Implemented | `/administration/users` |
| 5 | Annual meeting calendar | Implemented | `/compliance/meetings` |
| 6 | Farmer register | Implemented | `/farmers` |
| 7 | Farmer unique IDs | Implemented | `/farmers` |
| 8 | Farmer KYC records | Implemented | `/farmers` |
| 9 | Shareholder register | Implemented | `/shareholders` |
| 10 | Paid-up share capital | Implemented | `/shareholders` |
| 11 | Share certificate register | Implemented | `/shareholders/certificates` |
| 12 | Farmer baseline | Implemented | `/farmers/baseline` |
| 13 | Commodity master | Implemented | `/agri-business/commodity-master` |
| 14 | Unit and pack-size master | Implemented | `/inventory/unit-converter` |
| 15 | Buyer master | Implemented | `/agri-business/buyers-suppliers` |
| 16 | Supplier master | Implemented | `/agri-business/buyers-suppliers` |
| 17 | Produce purchase register | Implemented | `/agri-business/produce-purchase` |
| 18 | Input purchase workflow | Implemented | `/agri-business/input-purchase` |
| 19 | Produce sales register | Implemented | `/agri-business/produce-sale` |
| 20 | Input sales workflow | Implemented | `/agri-business/input-sale` |
| 21 | Produce inventory | Implemented | `/inventory/produce` |
| 22 | Input inventory | Implemented | `/inventory/inputs` |
| 23 | Godown register | Implemented | `/inventory/godowns-units` |
| 24 | Stock movement register | Implemented | `/inventory/movements` |
| 25 | Farmer ledger | Implemented | `/finance/farmer-ledger` |
| 26 | Buyer ledger | Implemented | `/finance/buyer-ledger` |
| 27 | Supplier ledger | Implemented | `/finance/supplier-ledger` |
| 28 | Cash book | Implemented | `/finance/cash-book` |
| 29 | Bank book | Implemented | `/finance/bank-book` |
| 30 | Expense register | Implemented | `/finance/expense-register` |
| 31 | FPC audit trail | Implemented | `/administration/audit` |
| 32 | Receipts and payment reconciliation | Implemented | `/finance/receipts-payments` |
| 33 | Income and expenditure review | Implemented | `/finance/income-expenditure` |
| 34 | Filing tracker | Implemented | `/compliance/filings` |
| 35 | Admin filing approvals | Implemented | `/compliance/filings` |
| 36 | Licence renewals | Implemented | `/fpc-profile/licences` |
| 37 | Multi-FPC link review | Implemented | `/farmers/multi-fpc` |
| 38 | Profile and sub-user changes | Implemented | `/approvals` |
| 39 | Dividend and patronage approval | Implemented | `/approvals` |
| 40 | Budget and target review | Implemented | `/analytics` |
| 41 | Offline draft sync queue | Implemented | `/administration/sync` |

## Regression checks

1. Start as TSF Central Admin. Download the Excel template, import a valid row, confirm it appears as a Draft, then import a duplicate CIN and confirm the row-level validation report rejects it.
2. Open a Draft, complete all seven sections, submit it, review it from Pending FPC Approvals, and approve it. Confirm it becomes Active, receives its FPC code, records the default-master provisioning and creates the invite preview.
3. Reject a submitted FPC with a reason. Confirm the reason is shown on the rejected record; attempt Delete without the exact company name and confirm it remains.
4. Switch to FPC Admin / Manager → Company Profile. Change a contact field and a protected licence number, compare the displayed old/new values, and save. Confirm the contact change applies immediately and the licence change appears in Approvals.
5. Approve the licence request as TSF Central Admin. Confirm the profile shows the new licence value and the pending-change marker clears; check Change History and Audit Trail.
6. Use Approvals to approve a profile request, a sub-user request, a dividend run, and a farmer link request. Confirm each destination record and notification updates.
7. Create and export a buyer and supplier; confirm the rows, open balances, soft-delete behavior, and CSV export.
8. As FPC Admin, simulate offline mode, save an onboarding draft, and confirm it appears in Sync Centre. Restore the connection and sync it; confirm the item is marked synced.
9. Open each of the seven FPC reports, change the FPC filter, drill into a row, download an `.xlsx`, and open print-to-PDF.

## Visible stubs / intentional simulation

- No real OTP/authentication, external database/API, payment transfer, bank/Aadhaar verification, live sync, SMS/email delivery, or durable document storage. The app stores records in this browser's local storage; licence/logo upload keeps a filename or temporary preview, not durable file bytes. The SMS invite is a preview only.
- Several other operational modules still use shared record-table/form patterns rather than complete domain workflows: user/permission matrix editor, detailed farmer 360 tabs and KYC camera capture, share transfer/allotment and PDF certificate, full input-credit issue/recovery, stock transfer/physical adjustment approval, advanced filing acknowledgement/vault versioning, AGM quorum/minutes and RSVP, detailed buyer receipt screen, meeting voting, tickets/FAQ, advanced report column/filter builder, and board pack PDF.
- Analytics charts and monitoring cells are representative demo visuals; map is a location/status list, not geographic GIS.
- Hindi and Odia translate navigation/page titles only. The role-specific offline flow is simulated in the browser; no service worker/background sync is included.
- The purchaser/member seed quantities and finance figures are illustrative mock values, not operational records.

## Layout

`src/lib/config.ts` contains role navigation, labels and the permission helper; `src/lib/store.ts` contains the typed local seed, persistence and unit/money helpers. `src/App.tsx` implements the role shell, dashboards, lists, dialogs and workflow interactions. The palette uses the requested deep green and amber with a field-office layout and responsive member/field views.
