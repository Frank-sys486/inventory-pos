# MC Hardware System (formerly FinOpenPOS)

MC Hardware System is a production-ready, local-first Point of Sale (POS) and Inventory Management System designed for hardware stores. It uses Next.js 14, Electron, and PouchDB to ensure offline reliability and high performance.

## 🚀 Key Features

- **Rebranded & Production Ready:** Optimized for Windows (Primary) and macOS environments.
- **Security & Licensing:** Integrated Hardware ID (HWID) lock and baked-in master admin for secure deployment.
- **Local-First Architecture:** Works 100% offline with persistent PouchDB storage in the user's `AppData`.
- **Keyboard-Centric UX:** Optimized for speed with global hotkeys:
    - `F2` (Customer Management)
    - `F3` (Payment Interface)
    - `F4` (Product Search Focus)
    - `F9` (Print Receipt)
    - Alphanumeric keys automatically focus the search bar.
- **Thermal Receipt (58mm):** Professional thermal printing with smart line-wrapping, price alignment, and policy footer.
- **Inventory Analytics:** Real-time stock value tracking, profit margin analysis, and expense reports.

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router), React, Tailwind CSS
- **Desktop:** Electron (with ASAR stability & Smart Node Engine Discovery)
- **Database:** PouchDB (NoSQL, Local-first)
- **UI Components:** Shadcn UI & Lucide Icons
- **Charts:** Recharts

## Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-repo/MC-Hardware-System.git
cd FinOpenPOS
npm install
```

### 2. Run the Development Server
```bash
# Web development
npm run dev

# Electron development
npm run electron-dev
```

## Project Documentation
- **[GOALS.md](GOALS.md):** User outcomes and feature roadmap.
- **[RULES.md](RULES.md):** Coding standards and architecture.
- **[HOW-TO-USE.md](HOW-TO-USE.md):** Usage instructions for the app.
- **[TROUBLESHOOT.md](TROUBLESHOOT.md):** Common issues and fixes.
- **[FLOW.md](FLOW.md):** Application logic diagrams.
- **[SESSION_SUMMARY.md](SESSION_SUMMARY.md):** Detailed technical changes (Git Ignored).
