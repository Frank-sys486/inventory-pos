# Troubleshooting Guide

| Issue | Possible Cause | Fix | Why |
| :--- | :--- | :--- | :--- |
| **"System Error Screen"** | An unexpected system crash. | The system has **automatically reported** this error. Click **"Try Again"** to reload the POS. | The system now logs all errors to the developer via Discord for fast resolution. |
| **"Receipt Not Printing"** | Printer driver issue or connection error. | Restart the printer; check if the printer service is running. | Thermal printers can occasionally lose connection with Electron. |
| **"Database Error"** | Locked file or corrupted data. | Restart the app or use the **Restore JSON** feature in Settings. | PouchDB can occasionally lock up on Windows if the system shuts down improperly. |
| **"Scanner Not Working"** | Focus is not on the search input. | Use the `F4` shortcut or simply start typing. | Any alphanumeric key now automatically redirects focus to the product search bar. |
| **"Blank White Screen"** | Next.js build error. | Check the `error.txt` file or terminal logs. | Standard for identifying startup failures. |
| **"CSV Order Items Missing"** | Exported CSV shows `[object Object]`. | This has been fixed in the latest version. Re-export your data from Settings. | The system now converts product lists into a readable format for CSV and JSON. |
