const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Setup paths
const buildPackDir = path.join(__dirname, 'build_pack');
const outputExe = 'FinOpenPOS_Pro.exe';

console.log("\n--- STARTING IMPROVED SINGLE-FILE BUNDLING ---");

// 2. Clean/Create build_pack folder with lock safety
if (fs.existsSync(buildPackDir)) {
    console.log("Attempting to clean old build_pack...");
    try {
        fs.rmSync(buildPackDir, { recursive: true, force: true });
    } catch (e) {
        console.log("Notice: Some files in build_pack are locked. Overwriting instead...");
    }
}
if (!fs.existsSync(buildPackDir)) fs.mkdirSync(buildPackDir, { recursive: true });

// 3. Compile the secure launcher fresh with HWID injection
console.log("Injecting HWID and compiling secure launcher...");
try {
    // Read HWID from .env
    const envContent = fs.readFileSync('.env', 'utf8');
    const hwidMatch = envContent.match(/ALLOWED_HWID=([^\r\n]+)/);
    const targetHWID = hwidMatch ? hwidMatch[1].trim() : "";

    if (!targetHWID) {
        console.error("Error: ALLOWED_HWID not found in .env file!");
        process.exit(1);
    }

    console.log(`Locking build to HWID: ${targetHWID}`);

    // Create a temporary launcher with the ID baked in
    let launcherContent = fs.readFileSync('launcher.js', 'utf8');
    launcherContent = launcherContent.replace(
        'const ALLOWED_HWID = process.env.ALLOWED_HWID || "DEVELOPMENT_MODE";',
        `const ALLOWED_HWID = "${targetHWID}";`
    );
    fs.writeFileSync('launcher_temp.js', launcherContent);

    // Compile the temp file
    execSync('npx pkg launcher_temp.js --targets node18-win-x64 --output Start_FinOpenPOS.exe');
    fs.unlinkSync('launcher_temp.js'); // Clean up temp file
    console.log("Binary compilation successful.");
} catch (e) {
    console.log(`Warning: Binary compilation failed: ${e.message}`);
}

// 4. List of EVERY essential file/folder for Next.js Standalone
const essentials = [
  'Start_FinOpenPOS.exe',
  'unauthorized.html',
  '.env',
  'package.json',
  'next.config.mjs',
  '.next',
  'node_modules',
  'public'
];

console.log("Gathering all system components...");
essentials.forEach(item => {
  const src = path.join(__dirname, item);
  const dest = path.join(buildPackDir, item);
  
  if (fs.existsSync(src)) {
      try {
          if (fs.lstatSync(src).isDirectory()) {
              console.log(`Copying folder: ${item}...`);
              // Use cpSync for native, robust recursive copy (Node 16.7+)
              fs.cpSync(src, dest, { recursive: true });
          } else {
              fs.copyFileSync(src, dest);
              console.log(`Copied file: ${item}`);
          }
      } catch (err) {
          console.error(`Error copying ${item}: ${err.message}`);
      }
  } else {
      console.warn(`Warning: Essential item not found: ${item}`);
  }
});

console.log("\n--- BUNDLE FOLDER PREPARED ---");
console.log(`Path: ${buildPackDir}`);
console.log("\nFINAL STEP: Create the single EXE using WinRAR SFX:");
console.log("1. Open 'build_pack' and select ALL items.");
console.log("2. Right-click -> Add to archive (WinRAR).");
console.log("3. Check 'Create SFX archive'.");
console.log("4. Advanced -> SFX Options -> Setup -> Run after extraction: Start_FinOpenPOS.exe");
console.log("5. Modes -> Hide all.");
console.log("6. Update -> Overwrite all files.");
console.log("7. Click OK. Your 1-file standalone is ready.");
