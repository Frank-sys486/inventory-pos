# Project Goals

## POS Experience (Keyboard-First)
- **Quick Sales:** A cashier can search/scan a product and finalize a sale in under 10 seconds.
- **Enhanced Hotkeys:** 
  - `F2`: Select Customer
  - `F3`: Select Payment Method
  - `F4`: Focus Product Search (You can also just start typing!)
  - `F9`: Finalize Transaction & Print Receipt
- **Offline Integrity:** Sales can be processed even if the internet goes down.

## Inventory Management
- **Stock Tracking:** Real-time inventory updates upon every transaction.
- **Low-Stock Alerts:** Automatically flag items that need restocking.
- **Easy Updates:** Bulk import/export via CSV (now supporting all data types including Orders and Transactions).
- **System Maintenance:** Full JSON Backup/Restore capability to move data between devices.

## System Reliability & Support
- **Visible Troubleshooting:** If a printer fails or the database is locked, a clear, actionable message is shown to the user.
- **Automatic Error Reporting:** Any system crash is automatically reported to the developer via Discord with a full technical stack trace.
- **Data Persistence:** No lost transactions; everything is stored locally via PouchDB.
- **Zero-Configuration Startup:** The app should open directly to the POS screen for non-technical users.
