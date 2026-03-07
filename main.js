const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

/**
 * PRODUCTION-READY ARCHITECTURE
 * This version handles the 500 Internal Server Error by ensuring 
 * the database path is ALWAYS writable and correctly passed to Next.js.
 */

const isPackaged = app.isPackaged;
const baseDir = __dirname;

// CRITICAL: Initialize paths early and safely
let userDataPath;
try {
  userDataPath = app.getPath('userData');
} catch (e) {
  // Fallback if app is not fully ready
  userDataPath = path.join(process.env.HOME || process.env.USERPROFILE, '.finopenpos');
}

const dataPath = path.join(userDataPath, 'data');
const logPath = path.join(userDataPath, 'pos-debug.log');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Export to environment for Next.js engine
process.env.DATA_PATH = dataPath;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(logPath, line); } catch (e) {}
  console.log(msg);
}

log(`SYSTEM STARTUP`);
log(`Packaged: ${isPackaged}`);
log(`Data Path: ${dataPath}`);

// Load .env variables early
try {
  const { loadEnvConfig } = require('@next/env');
  const envDir = isPackaged ? process.resourcesPath : baseDir;
  log(`Loading Environment from: ${envDir}`);
  loadEnvConfig(envDir);

  // Safety check for Auth Secret
  if (!process.env.AUTH_SECRET) {
    log("WARNING: AUTH_SECRET missing. Setting temporary fallback.");
    process.env.AUTH_SECRET = "finopenpos-secure-fallback-secret-12345-abcde";
  }

  // CRITICAL: Force trust host for production dynamic ports
  process.env.AUTH_TRUST_HOST = "true";
  } catch (e) {
  log(`Env Load Error: ${e.message}`);
  }

  async function startServer() {
  try {
  const next = require('next');
  const dir = isPackaged ? baseDir.replace('app.asar', 'app.asar.unpacked') : baseDir;

  log(`Next.js Root: ${dir}`);

  // Ensure DATA_PATH and AUTH settings are preserved
  process.env.DATA_PATH = dataPath;
  process.env.AUTH_TRUST_HOST = "true";

  const nextApp = next({ 
    dev: false, 
    hostname: 'localhost', 
    dir: dir 
  });

  const handler = nextApp.getRequestHandler();
  await nextApp.prepare();

  const server = http.createServer((req, res) => handler(req, res));

  return new Promise((resolve, reject) => {
    server.listen(0, 'localhost', () => {
      const { port } = server.address();
      const url = `http://localhost:${port}`;
      process.env.NEXTAUTH_URL = url;
      log(`Server active on: ${url}`);
      resolve(port);
    });
    server.on('error', reject);
  });
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

  // Open DevTools immediately if requested via .env or in dev mode
  const isDevMode = process.env.DEVELOPER_MODE === 'true' || !isPackaged;
  if (isDevMode) {
    win.webContents.openDevTools();
    log("Developer Mode Active: Console Opened.");
  }

  const currentHWID = getHWID().toUpperCase();
  const allowedHWID = (process.env.ALLOWED_HWID || "00000000-0000-0000-0000-309C232230F0").toUpperCase().trim();

  if (allowedHWID !== "DEVELOPMENT_MODE" && currentHWID !== allowedHWID) {
    win.loadFile(path.join(baseDir, 'unauthorized.html'), {
      query: { hwid: currentHWID, expectedHwid: allowedHWID }
    });
    return;
  }

  win.loadURL('data:text/html,<body style="background:#111;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h1>FinOpenPOS Initializing...</h1></body>');

  const result = await startServer();
  
  if (result.error) {
    const errorHtml = `
      <body style="background:#450a0a;color:white;padding:40px;font-family:monospace">
        <h1 style="color:#f87171">CRITICAL ENGINE ERROR</h1>
        <p>Next.js server failed to start.</p>
        <pre>${result.error}</pre>
      </body>
    `;
    win.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`);
    return;
  }

  const port = result;
  const target = `http://localhost:${port}/login`;

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
