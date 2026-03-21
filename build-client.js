const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * PRODUCTION CLIENT BUILD SCRIPT
 * This script ensures a clean build of the Next.js client
 * and prepares it for Electron packaging.
 */

function run(command) {
  console.log(`\nExecuting: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error during: ${command}`);
    process.exit(1);
  }
}

console.log("--- STARTING IPOS SYSTEM CLIENT BUILD ---");

// 1. Clean previous builds
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  console.log("Cleaning .next directory...");
  fs.rmSync(nextDir, { recursive: true, force: true });
}

// 2. Build Next.js
// We use 'next build' which is now Turbopack-enabled by default in v15/v16
run("npm run build");

console.log("\n--- CLIENT BUILD COMPLETE ---");
console.log("The .next folder is now ready for Electron packaging.");
