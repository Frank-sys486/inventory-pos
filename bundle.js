const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Setup paths
const buildPackDir = path.join(__dirname, 'build_pack');
const outputExe = 'FinOpenPOS_Pro.exe';

console.log("\n--- STARTING SINGLE-FILE BUNDLING ---");

// 2. Clean/Create build_pack folder
if (fs.existsSync(buildPackDir)) {
    console.log("Attempting to clean old build_pack...");
    try {
        fs.rmSync(buildPackDir, { recursive: true });
    } catch (e) {
        console.log("Notice: Could not fully clean build_pack (likely a file lock). Continuing...");
    }
}
if (!fs.existsSync(buildPackDir)) fs.mkdirSync(buildPackDir);

// 3. Copy essential files
const filesToCopy = [
  'Start_FinOpenPOS.exe', 
  'FinOpenPOS_Launcher.exe',
  'launcher.js',
  '.env',
  'unauthorized.html',
  'package.json'
];

const foldersToCopy = [
  '.next',
  'node_modules',
  'public'
];

console.log("Copying system files...");
filesToCopy.forEach(f => {
  // Check root first
  let src = path.join(__dirname, f);
  // Then check dist folder (where pkg often outputs)
  if (!fs.existsSync(src)) {
      src = path.join(__dirname, 'dist', f);
  }

  if (fs.existsSync(src)) {
      // Always rename the binary to a standard name for the SFX setup
      const destName = f.endsWith('.exe') ? 'Start_FinOpenPOS.exe' : f;
      fs.copyFileSync(src, path.join(buildPackDir, destName));
      console.log(`Copied file: ${f} as ${destName}`);
  }
});

foldersToCopy.forEach(f => {
  const src = path.join(__dirname, f);
  if (fs.existsSync(src)) {
    console.log(`Copying folder: ${f}... (This may take a minute)`);
    // Use xcopy for recursive folder copy on Windows
    execSync(`xcopy "${src}" "${path.join(buildPackDir, f)}" /E /I /H /Y /Q`);
  }
});

// 4. Create SFX Configuration
const sfxConfig = `
;The comment below contains SFX script commands
Path=%temp%\\FinOpenPOS_Runtime
SavePath
Setup=Start_FinOpenPOS.exe
Silent=1
Overwrite=1
Title=FinOpenPOS Loader
`;

fs.writeFileSync(path.join(__dirname, 'sfx_config.txt'), sfxConfig);

console.log("\n--- BUNDLE FOLDER PREPARED ---");
console.log(`Ready to pack ${buildPackDir} into ${outputExe}`);
console.log("\nINSTRUCTIONS FOR 1-FILE EXE:");
console.log("1. Select all files and folders INSIDE the 'build_pack' folder.");
console.log("2. Right-click -> Add to archive (using WinRAR).");
console.log("3. Check 'Create SFX archive'.");
console.log("4. Go to Advanced -> SFX Options -> Setup -> Run after extraction: Start_FinOpenPOS.exe");
console.log("5. Go to Modes -> Hide all.");
console.log("6. Go to Update -> Overwrite all files.");
console.log("7. Click OK to generate your standalone FinOpenPOS_Pro.exe");
