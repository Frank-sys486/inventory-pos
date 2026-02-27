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
    const port = 3000;
    
    log(`App Directory: ${dir}`);
    
    const nextApp = next({ dev, hostname, port, dir });
    const handler = nextApp.getRequestHandler();

    await nextApp.prepare();
    log("Next.js prepare() successful.");
    
    http.createServer((req, res) => {
      handler(req, res);
    }).listen(port, () => {
      log(`Server listening on http://${hostname}:${port}`);
    });
    return true;
  } catch (err) {
    log(`CRITICAL ERROR starting server: ${err.message}`);
    log(err.stack);
    return false;
  }
};

function getHWID() {
  try {
    if (process.platform === "win32") {
      return execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"').toString().trim();
    }
    return "unknown";
  } catch (e) { return "error"; }
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

  // Open DevTools immediately to see errors
  win.webContents.openDevTools();

  const currentHWID = getHWID();
  const allowedHWID = "00000000-0000-0000-0000-309C232230F0";

  if (allowedHWID && currentHWID !== allowedHWID) {
    log("HWID Mismatch. Blocking access.");
    win.loadFile(path.join(__dirname, 'unauthorized.html'));
    return;
  }

  win.loadURL('data:text/html,<body style="background:#111;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0"><div><h1 style="text-align:center">FinOpenPOS</h1><p style="text-align:center">Initializing Engine...</p><p style="font-size:12px;opacity:0.5;text-align:center">Check DevTools (F12) for logs</p></div></body>');

  const success = await startServer();
  
  if (!success) {
    win.loadURL(`data:text/html,<body style="background:red;color:white;padding:20px;font-family:monospace"><h1>Server Failed to Start</h1><p>Check the log file at: ${logPath.replace(/\\/g, '/')}</p></body>`);
    return;
  }

  // Poll for localhost readiness
  let attempts = 0;
  const poll = () => {
    attempts++;
    log(`Polling server (Attempt ${attempts})...`);
    http.get('http://localhost:3000', (res) => {
      log(`Server responded with status: ${res.statusCode}`);
      win.loadURL('http://localhost:3000');
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
