const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

/**
 * FINAL DIAGNOSTIC ARCHITECTURE
 * This version is designed to catch the error and DISPLAY it 
 * on the screen so we can stop guessing.
 */

const isPackaged = app.isPackaged;
const baseDir = __dirname;
const userDataPath = app.getPath('userData');
const logPath = path.join(userDataPath, 'pos-debug.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(logPath, line); } catch (e) {}
  console.log(msg);
}

// 1. Immediate Environment Loading
try {
  const { loadEnvConfig } = require('@next/env');
  const envDir = isPackaged ? process.resourcesPath : baseDir;
  log(`Loading Environment from: ${envDir}`);
  loadEnvConfig(envDir);
} catch (e) {
  log(`Env Load Error: ${e.message}`);
}

async function startServer() {
  try {
    const next = require('next');
    const dir = isPackaged ? baseDir.replace('app.asar', 'app.asar.unpacked') : baseDir;
    
    log(`Next.js Root: ${dir}`);
    
    const nextApp = next({ 
      dev: false, 
      hostname: '127.0.0.1', 
      dir: dir 
    });
    
    const handler = nextApp.getRequestHandler();
    await nextApp.prepare();
    
    const server = http.createServer((req, res) => handler(req, res));

    return new Promise((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        log(`Server active on port: ${port}`);
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

  if (process.env.DEVELOPER_MODE === 'true' || !isPackaged) {
    win.webContents.openDevTools();
  }

  const currentHWID = getHWID().toUpperCase();
  const allowedHWID = (process.env.ALLOWED_HWID || "00000000-0000-0000-0000-309C232230F0").toUpperCase().trim();

  // SECURE LOCK
  if (allowedHWID !== "DEVELOPMENT_MODE" && currentHWID !== allowedHWID) {
    win.loadFile(path.join(baseDir, 'unauthorized.html'), {
      query: { hwid: currentHWID, expectedHwid: allowedHWID }
    });
    return;
  }

  win.loadURL('data:text/html,<body style="background:#111;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h1>FinOpenPOS Initializing...</h1></body>');

  const result = await startServer();
  
  if (result.error) {
    // DISPLAY THE ERROR ON SCREEN
    const errorHtml = `
      <body style="background:#450a0a;color:white;padding:40px;font-family:monospace">
        <h1 style="color:#f87171">CRITICAL ENGINE ERROR</h1>
        <p>The Next.js server failed to start on your Mac.</p>
        <div style="background:rgba(0,0,0,0.5);padding:20px;border-radius:8px;border:1px solid #7f1d1d">
          <strong>Error:</strong> ${result.error}<br><br>
          <strong>Stack:</strong> <pre style="font-size:12px;opacity:0.7">${result.stack}</pre>
        </div>
        <p style="margin-top:20px;opacity:0.5">Please copy this error and send it to Gemini.</p>
      </body>
    `;
    win.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`);
    return;
  }

  const port = result;
  const target = `http://127.0.0.1:${port}/login`;

  // Wait for server
  const poll = (attempts = 0) => {
    http.get(target, (res) => {
      win.loadURL(target);
    }).on('error', () => {
      if (attempts > 30) {
        win.loadURL(`data:text/html,<body style="background:orange;padding:20px"><h1>Connection Timeout</h1><p>Server started on port ${port} but is not responding.</p></body>`);
      } else {
        setTimeout(() => poll(attempts + 1), 1000);
      }
    });
  };

  poll();
}

app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());
