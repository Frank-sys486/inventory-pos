const { execSync } = require('child_process');

function getHWID() {
    try {
        if (process.platform === 'win32') {
            // Use PowerShell to get the UUID, as wmic is often deprecated
            const output = execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"').toString();
            return output.trim();
        } else if (process.platform === 'darwin') {
            return execSync("ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk '{print $3}' | sed 's/\"//g'").toString().trim();
        } else {
            return 'linux-unsupported';
        }
    } catch (e) {
        return 'error-detecting-hwid';
    }
}

console.log("\n========================================");
console.log("YOUR UNIQUE HARDWARE ID:");
console.log(getHWID());
console.log("========================================\n");
console.log("Copy this ID and paste it into your .env file as ALLOWED_HWID");
