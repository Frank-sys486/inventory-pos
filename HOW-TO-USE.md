# How-to-Use Guide (MC Hardware System)

## 1. Setting Up the Database
The app uses PouchDB, which automatically initializes a local database. No manual setup is needed.

## 2. Managing Products
1. Go to **Products** (`/admin/products`).
2. Click **Add Product** or press `N`.
3. Fill in the details (Name, Price, SKU/QR).
4. Save.

## 3. Processing a Sale (POS)
The POS is designed for speed using keyboard-first navigation:
1. **Focus Fields:**
   - `F2`: Select Customer
   - `F3`: Select Payment Method
   - `F4`: Focus Product Search (You can also just start typing!)
2. **Add Products:**
   - **Scanner:** Scan any barcode/QR code to add instantly.
   - **Manual:** Type the name or code. The system now safely handles numeric SKU codes (e.g., `123`).
3. **Checkout:**
   - Press `F9` or click **Create Transaction**.
   - Enter the **Amount Received**.
   - Press `Enter` to finalize and **Print Receipt**.

## 4. System Maintenance & Data Management
Go to **Settings** (`/admin/settings`) for advanced data operations:
- **Full System Backup (JSON):** Export all your data (Products, Customers, Orders, Transactions) into a single file. Highly recommended at the end of each day.
- **Full System Restore (JSON):** Upload a previous JSON backup to restore your entire database.
- **CSV Imports/Exports:** 
   - Export individual tables for use in Excel/Google Sheets.
   - Bulk upload data. **Note:** Orders and Transactions now export correctly with all item details included.

## 5. Error Reporting
If the system encounters a technical problem:
1. A red **Error Screen** will appear automatically.
2. The system sends a detailed report (App Version, Client ID, and Error Details) to the developer's **Discord** instantly.
3. You can click **Try Again** to return to the POS.

## 6. Checking Sales Reports
1. Go to the **Dashboard** (`/admin`).
2. View real-time charts for Revenue, Profit, and Expenses.
3. Click **Print Summary** to get a thermal-printed report of your current sales.
