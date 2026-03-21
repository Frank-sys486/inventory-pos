const { execSync } = require('child_process');

function getHWID() {
    try {
        if (process.platform === 'win32') {
            // Use PowerShell to get the UUID, as wmic is often deprecated
            const output = execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"').toString();
            return output.trim();
        } else if (process.platform === 'darwin') {
            // macOS: Using ioreg to get the IOPlatformUUID
            return execSync("ioreg -rd1 -c IOPlatformExpertDevice | grep -E 'IOPlatformUUID' | awk '{print $3}' | sed 's/\"//g'").toString().trim();
        } else {
            return 'linux-unsupported';
        }
    } catch (e) {
        return 'error-detecting-hwid: ' + e.message;
    }
}

console.log("\n========================================");
console.log("   iPos System - HARDWARE ID FINDER");
console.log("========================================");
console.log("\nYOUR UNIQUE HARDWARE ID IS:\n");
console.log("  >>> " + getHWID() + " <<<");
console.log("\n========================================");
console.log("Copy this ID and paste it into main.js and launcher.js.");
console.log("========================================\n");
