const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

/**
 * HARDENED PRODUCTION ARCHITECTURE
 * Security is 'baked-in' to the binary to prevent user tampering.
 */

const isPackaged = app.isPackaged;
const baseDir = __dirname;

// --- CRITICAL: HARDCODED SECURITY CONFIGURATION ---
// This cannot be modified by the end-user as it lives in the ASAR.
const ALLOWED_HWID = "00000000-0000-0000-0000-309C232230F0"; 
const MASTER_ADMIN_EMAIL = "admin@pos.com";
const MASTER_ADMIN_PASSWORD = "admin123";
const PERMANENT_AUTH_SECRET = "finopenpos-ultra-secure-key-2026-xyz";

let userDataPath;
try {
  userDataPath = app.getPath('userData');
} catch (e) {
  userDataPath = path.join(process.env.HOME || process.env.USERPROFILE, '.finopenpos');
}

const dataPath = path.join(userDataPath, 'data');
const logPath = path.join(userDataPath, 'pos-debug.log');

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// 1. Force inject security into environment for the Next.js process
process.env.DATA_PATH = dataPath;
process.env.AUTH_TRUST_HOST = "true";
process.env.AUTH_SECRET = PERMANENT_AUTH_SECRET;
process.env.ADMIN_EMAIL = MASTER_ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = MASTER_ADMIN_PASSWORD;
process.env.ALLOWED_HWID = ALLOWED_HWID;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(logPath, line); } catch (e) {}
  console.log(msg);
}

// Still load .env for non-security settings if developer wants, 
// but critical security is already forced above.
try {
  const { loadEnvConfig } = require('@next/env');
  const envDir = isPackaged ? process.resourcesPath : baseDir;
  loadEnvConfig(envDir);
} catch (e) {
  log(`Optional Env Load Skip: ${e.message}`);
}

let serverInstance = null;

async function startServer() {
  if (serverInstance) return serverInstance;

  try {
    const next = require('next');
    const dir = isPackaged ? baseDir.replace('app.asar', 'app.asar.unpacked') : baseDir;
    
    // Ensure forced security variables are available to Next.js
    process.env.DATA_PATH = dataPath;
    process.env.AUTH_TRUST_HOST = "true";
    process.env.AUTH_SECRET = PERMANENT_AUTH_SECRET;

    const nextApp = next({ dev: false, hostname: '127.0.0.1', dir: dir });
    const handler = nextApp.getRequestHandler();
    await nextApp.prepare();
    
    const server = http.createServer((req, res) => handler(req, res));

    serverInstance = new Promise((resolve, reject) => {
      const port = 3000;
      server.listen(port, '127.0.0.1', () => {
        const url = `http://127.0.0.1:${port}`;
        process.env.NEXTAUTH_URL = url;
        log(`Server active on: ${url}`);
        resolve(port);
      });
      
      server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
          log("Port 3000 busy, using dynamic...");
          server.listen(0, '127.0.0.1', () => {
            const dPort = server.address().port;
            const dUrl = `http://127.0.0.1:${dPort}`;
            process.env.NEXTAUTH_URL = dUrl;
            log(`Dynamic active: ${dUrl}`);
            resolve(dPort);
          });
        } else { reject(e); }
      });
    });
    return serverInstance;
  } catch (err) {
    return { error: err.message, stack: err.stack };
  }
}

function getHWID() {
  try {
    if (process.platform === "win32") {
      return execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"').toString().trim();
    }
    if (process.platform === "darwin") {
      return execSync("ioreg -rd1 -c IOPlatformExpertDevice | grep -E 'IOPlatformUUID' | awk '{print $3}' | sed 's/\"//g'").toString().trim();
    }
    return "unknown";
  } catch (e) { return "error"; }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "FinOpenPOS",
    backgroundColor: '#111111',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const isDevMode = process.env.DEVELOPER_MODE === 'true' || !isPackaged;
  if (isDevMode) win.webContents.openDevTools();

  const currentHWID = getHWID().toUpperCase();

  // SECURE HARDWARE LOCK
  if (ALLOWED_HWID !== "DEVELOPMENT_MODE" && currentHWID !== ALLOWED_HWID) {
    log(`BLOCK: Unauthorized Hardware [${currentHWID}]`);
    win.loadFile(path.join(baseDir, 'unauthorized.html'), {
      query: { hwid: currentHWID, expectedHwid: "LOCKED_BY_ADMIN" }
    });
    return;
  }

  win.loadURL('data:text/html,<body style="background:#111;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h1>FinOpenPOS Initializing...</h1></body>');

  const result = await startServer();
  if (result.error) {
    const errorHtml = `<body style="background:#450a0a;color:white;padding:40px;font-family:monospace"><h1>CRITICAL ERROR</h1><pre>${result.error}</pre></body>`;
    win.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`);
    return;
  }

  const port = result;
  const target = `http://127.0.0.1:${port}/login`;

  const poll = (attempts = 0) => {
    http.get(target, (res) => {
      win.loadURL(target);
    }).on('error', () => {
      if (attempts > 60) {
        win.loadURL(`data:text/html,<body style="background:orange;padding:20px"><h1>Timeout</h1></body>`);
      } else {
        setTimeout(() => poll(attempts + 1), 1000);
      }
    });
  };

  poll();
}

app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());
