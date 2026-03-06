# FinOpenPOS - POS and Inventory Management System

This is a local-first Point of Sale (POS) and Inventory Management System designed for hardware stores. It uses Next.js, Electron, and PouchDB to ensure offline reliability and high performance.

## Features

- **Local-First Architecture:** Works 100% offline with local PouchDB sync.
- **QR/Barcode Integration:** Quick item scanning for fast checkout.
- **Keyboard-Centric UX:** Minimize mouse usage with global hotkeys (F1-F12).
- **Inventory Tracking:** Real-time stock updates and low-stock alerts.
- **Professional Reports:** Financial dashboards for Revenue, Profit, and Expenses.
- **Receipt Printing:** Automatic receipt generation for thermal printers.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Desktop:** Electron
- **Database:** PouchDB (NoSQL, Local-first)
- **UI Components:** Shadcn UI & Lucide Icons
- **Charts:** Recharts

## Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-repo/FinOpenPOS.git
cd FinOpenPOS
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
AUTH_SECRET=your_generated_secret_here
```

### 3. Run the Development Server
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
