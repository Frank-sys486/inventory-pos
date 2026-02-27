const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

const ALLOWED_HWID = "00000000-0000-0000-0000-309C232230F0";
const currentHWID = getHWID();

console.log("\n========================================");
console.log("      FIN OPEN POS SECURE LAUNCHER      ");
console.log("========================================\n");

if (currentHWID !== ALLOWED_HWID) {
  console.log("\x1b[41m\x1b[37m ERROR: UNAUTHORIZED HARDWARE DETECTED \x1b[0m");
  console.log("\nThis software license is locked to a different computer.");
  console.log("ID Detected: " + currentHWID);
  console.log("\nPlease contact your administrator for a license transfer.");
  
  console.log("\nPress Enter to exit...");
  process.stdin.on('data', () => process.exit(1));
} else {
  console.log("\x1b[42m\x1b[30m SUCCESS: HARDWARE VERIFIED \x1b[0m");
  console.log("\nStarting system... (This window must stay open)");

  const root = process.cwd();
  const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

  if (!fs.existsSync(nextBin)) {
    console.log("\x1b[31mError: Next.js engine not found in node_modules.\x1b[0m");
    process.exit(1);
  }

  // Start Next.js using the local binary directly (no global npm/node needed)
  const startProcess = spawn('node', [nextBin, 'start'], {
    cwd: root,
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production', 
      AUTH_TRUST_HOST: 'true' 
    }
  });

  // Open browser after 5 seconds
  setTimeout(() => {
    const startCmd = process.platform === 'win32' ? 'start' : 'open';
    try {
      execSync(`${startCmd} http://localhost:3000`);
      console.log("\n>>> POS is ready at http://localhost:3000");
    } catch (e) {
      console.log("\n>>> Server started. Please open http://localhost:3000 in your browser.");
    }
  }, 5000);

  startProcess.on('close', (code) => {
    console.log(`System exited with code ${code}`);
    process.exit(code);
  });
}
