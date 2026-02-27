import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { execSync } from "child_process";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hardware System",
  description: "Developed by Frank Borromeo",
};

function getHWID() {
  try {
    if (process.platform === "win32") {
      // Use PowerShell as wmic is often missing or deprecated
      return execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"').toString().trim();
    } else if (process.platform === "darwin") {
      return execSync("ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk '{print $3}' | sed 's/\"//g'").toString().trim();
    }
    return "unsupported-platform";
  } catch (e) {
    return "error";
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentHWID = getHWID();
  const allowedHWID = process.env.ALLOWED_HWID;

  // Security Check: Lock the app if HWIDs don't match
  // We only check if allowedHWID is actually set in .env
  if (allowedHWID && currentHWID !== allowedHWID) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-950 text-white p-10 text-center">
            <h1 className="text-6xl font-bold mb-4">⚠️</h1>
            <h2 className="text-3xl font-bold mb-2">UNAUTHORIZED HARDWARE</h2>
            <p className="text-xl opacity-80 max-w-md">
              This software is licensed to a different computer. 
              Please contact the administrator to transfer your license.
            </p>
            <div className="mt-8 p-4 bg-black/20 rounded font-mono text-sm">
              ID: {currentHWID}
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  );
}
