# iPos System (v2.0)

iPos System is a production-ready, local-first Point of Sale (POS) and Inventory Management System. 

This version has been modernized to run on **React 19**, **Next.js 16**, **Tailwind CSS v4**, and **Electron 41**.

## 🚀 Key Features

- **Hardware Locked Architecture**: Security is baked into the binary.
- **Local-First PouchDB**: Works 100% offline with zero database setup.
- **React 19 & Next.js 16**: Utilizing the latest React features and Next.js Turbopack engine.
- **Tailwind CSS v4**: Modern, high-performance CSS-first styling.
- **Electron 41**: Robust desktop integration with native hardware access.
- **Discord Error Logging**: Automatic crash reports sent via secure webhooks.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Shadcn/UI.
- **State Management**: React Hooks & Context API.
- **Database**: PouchDB (LevelDB adapter for local storage).
- **Desktop**: Electron 41 (Chromium 134+).
- **Charts**: Recharts 3.0.

## 🏁 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Development
```bash
# Run Next.js in dev mode
npm run dev

# Run Electron (after building client)
npm run electron-dev
```

### 3. Production Build
```bash
# Build the Next.js client
npm run build:client

# Package for Windows
npm run build-win
```

## 🔒 Security

This system uses a **Hardware UUID (HWID) lock** to prevent unauthorized distribution. The `ALLOWED_HWID` is hardcoded in `main.js` during the build process to ensure the application only runs on verified hardware.

---
Developed with ❤️ for secure, high-performance retail management.
