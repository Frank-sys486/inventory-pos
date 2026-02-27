# FinOpenPOS Build Guide (Secure Standalone)

This guide explains how to package the POS system into a **single, secure, and hardware-locked executable** for Windows and macOS.

---

## 🔒 Security Overview
The standalone versions use a **Hardware ID (HWID) Lock**. The application will only run on the computer with the specific ID hardcoded in the launcher.

### 1. Find the Computer's HWID
Before building, you must get the unique ID of the target computer:
1. Open a terminal on that computer.
2. Run: `node get-hwid.js`
3. Copy the ID (e.g., `00000000-0000-0000-0000-309C232230F0`).

### 2. Update the Lock
Open `launcher.js` and `main.js` in your source code and update the `ALLOWED_HWID` variable with the ID you copied.

### 3. Configure the Environment (.env)
The standalone EXE requires a `.env` file to be present in the project root *before* you build. Ensure your `.env` contains:
* `MONGODB_URI`: The connection string for the database.
* `AUTH_SECRET`: A secure key for login sessions.
* `AUTH_TRUST_HOST=true`: Required for standalone authentication.
* `DEVELOPER_MODE`: Set to `false` for production/client use.

---

## 🪟 Windows Build (Single .EXE)

### Step 1: Prepare the Engine
Run this command to compile the web application:
```powershell
npm run build
```

### Step 2: Prepare the Bundle Folder
Run the bundler script to gather all necessary files:
```powershell
node bundle.js
```
This creates a `build_pack` folder containing the engine and the secure binary.

### Step 3: Create the Single EXE (WinRAR Method)
1. Open the **`build_pack`** folder.
2. Select **all files and folders** inside.
3. Right-click and select **"Add to archive..."** (Requires WinRAR).
4. Check the **"Create SFX archive"** box.
5. Go to **Advanced tab** -> **SFX Options** button.
6. In **Setup tab** -> "Run after extraction", type: `Start_FinOpenPOS.exe`.
7. In **Modes tab** -> Select **"Hide all"**.
8. In **Update tab** -> Select **"Overwrite all files"**.
9. Click **OK** twice to generate your single `FinOpenPOS_Pro.exe`.

---

## 🍎 macOS Build (Single .APP)

*Note: You MUST perform these steps on a Mac computer.*

### Step 1: Set Up
1. Copy the project folder to the Mac.
2. Install dependencies: `npm install`.

### Step 2: Build & Package
We use the pre-configured Electron builder which handles the Mac "App Bundle" structure automatically.

Run:
```bash
npm run build && npx electron-builder --mac
```

### Step 3: Result
Look in the `dist/` folder for:
*   **`FinOpenPOS.dmg`** (Installer)
*   **`mac/FinOpenPOS.app`** (Standalone App)

---

## ⚠️ Important Notes
*   **Database:** The standalone files contain the app code, but the **MongoDB database** remains external. Ensure the destination computer has MongoDB installed or update `.env` to use a cloud database (Atlas).
*   **Closed Source:** The generated `.exe` and `.app` files are compiled binaries. Your `src/` code and logic are hidden from the end-user.
*   **Updates:** Any time you change the code, you must repeat the "Build" steps above to generate a new standalone file.
