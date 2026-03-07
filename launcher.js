const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

function getHWID() {
  try {
    if (process.platform === "win32") {
      return execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"').toString().trim();
    } else if (process.platform === "darwin") {
      return execSync(`ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk '{print $3}' | sed 's/"//g'`).toString().trim();
    }
    return "unknown";
  } catch (e) {
    return "error";
  }
}

// This value is automatically injected by bundle.js during compilation
const ALLOWED_HWID = process.env.ALLOWED_HWID || "DEVELOPMENT_MODE";
const currentHWID = getHWID();

console.log("\n========================================");
console.log("      FIN OPEN POS SECURE LAUNCHER      ");
console.log("========================================\n");

function getSystemNodePath() {
  const commonPaths = [
    'node.exe',
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe',
  ];

  for (const p of commonPaths) {
    try {
      const fullPath = p.includes(':') ? p : execSync(`where ${p}`).toString().split('\r\n')[0].trim();
      const version = execSync(`"${fullPath}" -v`).toString().trim();
      if (parseInt(version.replace('v', '').split('.')[0]) >= 18) return fullPath;
    } catch (e) {}
  }
  return 'node';
}

async function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

function panic(error) {
  const desktop = path.join(require('os').homedir(), 'Desktop', 'POS_ERROR_LOG.txt');
  const msg = `CRITICAL ERROR AT ${new Date().toLocaleString()}\n\n${error}\n\nWorking Dir: ${process.cwd()}\n\nPlease send this file to support.`;
  fs.writeFileSync(desktop, msg);
  console.error(msg);
  process.exit(1);
}

(async () => {
  try {
    const root = process.cwd();
    console.log(`Working Directory: ${root}`);

    if (ALLOWED_HWID !== "DEVELOPMENT_MODE" && currentHWID.toUpperCase() !== ALLOWED_HWID.toUpperCase()) {
      console.log("\x1b[41m\x1b[37m ERROR: UNAUTHORIZED HARDWARE DETECTED \x1b[0m");
      console.log("\nThis software license is locked to a different computer.");
      console.log("ID Detected: " + currentHWID);
      console.log("\nPlease contact your administrator for a license transfer.");
      console.log("\nPress Enter to exit...");
      process.stdin.on('data', () => process.exit(1));
      return;
    }

    console.log("\x1b[42m\x1b[30m SUCCESS: HARDWARE VERIFIED \x1b[0m");
    console.log("\nStarting system... (This window must stay open)");

    const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

    if (!fs.existsSync(nextBin)) {
      panic(`Next.js engine not found at: ${nextBin}\nMake sure the 'node_modules' folder is inside your zip/sfx.`);
    }

    // 1. Find an available port
    const port = await findAvailablePort(3000);
    const nodePath = getSystemNodePath();
    const url = `http://127.0.0.1:${port}`;

    console.log(`Using Node Engine: ${nodePath}`);
    console.log(`Assigning Port: ${port}`);

    // 2. Start Next.js
    const startProcess = spawn(nodePath, [nextBin, 'start', '-p', port.toString(), '-H', '127.0.0.1'], {
      cwd: root,
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'production', 
        AUTH_TRUST_HOST: 'true',
        NEXTAUTH_URL: url
      }
    });

    // 3. Open browser
    let browserOpened = false;
    const checkReady = setInterval(() => {
      const http = require('http');
      http.get(`${url}/login`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 302) {
          if (!browserOpened) {
            console.log(`\n>>> System is ready! Opening ${url}/login`);
            const startCmd = process.platform === 'win32' ? 'start' : 'open';
            execSync(`${startCmd} ${url}/login`);
            browserOpened = true;
            clearInterval(checkReady);
          }
        }
      }).on('error', () => {});
    }, 2000);

    startProcess.on('close', (code) => {
      console.log(`System exited with code ${code}`);
      process.exit(code);
    });

  } catch (err) {
    panic(err.stack || err.message);
  }
})();
