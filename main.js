const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

// Initialize Environment immediately at the top level
const { loadEnvConfig } = require('@next/env');
const isPackaged = app.isPackaged;
const baseDir = __dirname;
const envDir = isPackaged ? process.resourcesPath : baseDir;

// Simple logger to file
const userDataPath = app.getPath('userData');
const dataPath = path.join(userDataPath, 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}
process.env.DATA_PATH = dataPath;

const logPath = path.join(userDataPath, 'pos-debug.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logPath, line);
  } catch (e) {}
  console.log(msg);
}

// Load .env variables early
log(`Loading Environment from: ${envDir}`);
loadEnvConfig(envDir);

const startServer = async () => {
  log("Initializing Next.js engine...");
  try {
    const next = require('next');
    
    // Use app.asar.unpacked if available, otherwise use __dirname
    const dir = isPackaged 
      ? baseDir.replace('app.asar', 'app.asar.unpacked') 
      : baseDir;

    log(`Next.js engine will run from: ${dir}`);
    
    const dev = false;
    const hostname = '127.0.0.1';
    
    const nextApp = next({ dev, hostname, dir });
    const handler = nextApp.getRequestHandler();

    await nextApp.prepare();
    log("Next.js prepare() successful.");
    
    const server = http.createServer((req, res) => {
      handler(req, res);
    });

    return new Promise((resolve) => {
      // Listen on 127.0.0.1, port 0 for dynamic available port
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        log(`Server listening on http://127.0.0.1:${port}`);
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
      // More robust Mac UUID retrieval
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
    title: "FinOpenPOS",
    autoHideMenuBar: false,
    show: false, // Don't show until ready or error
    backgroundColor: '#111111',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  // Show window as soon as it's ready to prevent black screen
  win.once('ready-to-show', () => {
    win.show();
  });

  const isDev = !isPackaged || process.env.NODE_ENV === 'development' || process.env.DEVELOPER_MODE === 'true';
  if (isDev) {
    win.webContents.openDevTools();
  }

  // Diagnostics & Hardware Lock
  const currentHWID = getHWID().toUpperCase();
  const allowedHWID = (process.env.ALLOWED_HWID || "00000000-0000-0000-0000-309C232230F0").toUpperCase().trim();
  
  const envPath = path.join(envDir, '.env');
  const envExists = fs.existsSync(envPath);
  const envStatus = envExists ? "FOUND" : "MISSING";
  const authSecretStatus = process.env.AUTH_SECRET ? "LOADED" : "NOT_FOUND";

  log(`HWID Check: Current [${currentHWID}] | Allowed [${allowedHWID}]`);

  if (allowedHWID && currentHWID !== allowedHWID) {
    log(`HWID Mismatch. Redirecting to unauthorized page.`);
    win.loadFile(path.join(baseDir, 'unauthorized.html'), {
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

  // Splash Screen
  win.loadURL('data:text/html,<body style="background:#111;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0"><div><h1 style="text-align:center">FinOpenPOS</h1><p style="text-align:center">Initializing Engine...</p></div></body>');

  const port = await startServer();
  
  if (!port) {
    win.loadURL(`data:text/html,<body style="background:red;color:white;padding:20px;font-family:monospace"><h1>Server Failed to Start</h1><p>Check the log file at: ${logPath.replace(/\\/g, '/')}</p></body>`);
    return;
  }

  // Poll for server readiness
  let attempts = 0;
  const poll = () => {
    attempts++;
    log(`Polling server at http://127.0.0.1:${port}/login (Attempt ${attempts})...`);
    
    const request = http.get(`http://127.0.0.1:${port}/login`, (res) => {
      log(`Server responded with status: ${res.statusCode}`);
      if (res.statusCode === 200 || res.statusCode === 302) {
        win.loadURL(`http://127.0.0.1:${port}/login`);
      } else {
        setTimeout(poll, 1000);
      }
    });

    request.on('error', (e) => {
      log(`Poll error: ${e.message}`);
      if (attempts > 60) {
        log("Server poll timed out after 60 seconds.");
        win.loadURL('data:text/html,<body style="background:orange;color:white;padding:20px"><h1>Timeout</h1><p>The server is taking too long to start. Please check the logs.</p></body>');
      } else {
        setTimeout(poll, 1000);
      }
    });
  };

  poll();
}

app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());
