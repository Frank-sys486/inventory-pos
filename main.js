const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

// Simple logger to file
const logPath = path.join(app.getPath('userData'), 'pos-debug.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logPath, line);
  console.log(msg);
}

const startServer = async () => {
  log("Initializing Next.js engine...");
  try {
    const next = require('next');
    const dir = __dirname;
    const dev = false;
    const hostname = 'localhost';
    
    log(`App Directory: ${dir}`);
    
    const nextApp = next({ dev, hostname, dir });
    const handler = nextApp.getRequestHandler();

    await nextApp.prepare();
    log("Next.js prepare() successful.");
    
    const server = http.createServer((req, res) => {
      handler(req, res);
    });

    return new Promise((resolve) => {
      // Listen on port 0 to get any available port
      server.listen(0, () => {
        const { port } = server.address();
        log(`Server listening on http://${hostname}:${port}`);
        resolve(port);
      });
    });
  } catch (err) {
    log(`CRITICAL ERROR starting server: ${err.message}`);
    log(err.stack);
    return null;
  }
};

function getHWID() {
  try {
    if (process.platform === "win32") {
      return execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"').toString().trim();
    }
    if (process.platform === "darwin") {
      return execSync("ioreg -rd1 -c IOPlatformExpertDevice | grep -E 'IOPlatformUUID' | awk '{print $3}' | sed 's/\"//g'").toString().trim();
    }
    return "unknown";
  } catch (e) { 
    log(`Error detecting HWID: ${e.message}`);
    return "error"; 
  }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "FinOpenPOS Diagnostic Mode",
    autoHideMenuBar: false, // Show menu for debugging
    backgroundColor: '#111111',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  // 1. Initialize Environment immediately
  const { loadEnvConfig } = require('@next/env');
  const envDir = app.isPackaged ? process.resourcesPath : __dirname;
  const envPath = path.join(envDir, '.env');
  
  log(`Loading Environment from: ${envDir}`);
  loadEnvConfig(envDir);

  // 2. Run Diagnostics
  const currentHWID = getHWID();
  const envExists = fs.existsSync(envPath);
  const envStatus = envExists ? "FOUND" : "MISSING";
  
  // Prefer HWID from .env, fallback to hardcoded
  const allowedHWID = process.env.ALLOWED_HWID || "00000000-0000-0000-0000-309C232230F0";
  const authSecretStatus = process.env.AUTH_SECRET ? "LOADED" : "NOT_FOUND";

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Open DevTools in development mode
    win.webContents.openDevTools();
  }

  if (allowedHWID && currentHWID !== allowedHWID) {
    log(`HWID Mismatch: Detected [${currentHWID}] expected [${allowedHWID}]`);
    log(`Env Diagnostics: Path [${envPath}] | Status [${envStatus}] | AuthSecret [${authSecretStatus}]`);
    
    win.loadFile(path.join(__dirname, 'unauthorized.html'), {
      query: { 
        hwid: currentHWID,
        expectedHwid: allowedHWID,
        envPath: envPath,
        envStatus: envStatus,
        authStatus: authSecretStatus
      }
    });
    return;
  }

  win.loadURL('data:text/html,<body style="background:#111;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0"><div><h1 style="text-align:center">FinOpenPOS</h1><p style="text-align:center">Initializing Engine...</p><p style="font-size:12px;opacity:0.5;text-align:center">Check DevTools (F12) for logs</p></div></body>');

  const port = await startServer();
  
  if (!port) {
    win.loadURL(`data:text/html,<body style="background:red;color:white;padding:20px;font-family:monospace"><h1>Server Failed to Start</h1><p>Check the log file at: ${logPath.replace(/\\/g, '/')}</p></body>`);
    return;
  }

  // Poll for localhost readiness
  let attempts = 0;
  const poll = () => {
    attempts++;
    log(`Polling server at port ${port} (Attempt ${attempts})...`);
    http.get(`http://localhost:${port}/login`, (res) => {
      log(`Server responded with status: ${res.statusCode}`);
      win.loadURL(`http://localhost:${port}/login`);
    }).on('error', (e) => {
      if (attempts > 30) {
        log("Server poll timed out after 30 seconds.");
        win.loadURL('data:text/html,<body style="background:orange;color:white;padding:20px"><h1>Timeout</h1><p>Server is taking too long to respond.</p></body>');
      } else {
        setTimeout(poll, 1000);
      }
    });
  };

  poll();
}

app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());
