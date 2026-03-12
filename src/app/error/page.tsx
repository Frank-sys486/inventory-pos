"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, ChevronDown, ChevronUp, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("message") || "An unexpected error occurred.";
  const [showDetails, setShowDetails] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    // Automatically report the error to the developer via Discord
    const reportError = async () => {
      try {
        await fetch("/api/report-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: errorMsg,
            location: window.location.href,
            stack: new Error().stack, // Simplified stack trace
          }),
        });
        setReportSent(true);
      } catch (e) {
        console.error("Failed to auto-report error:", e);
      }
    };

    reportError();
  }, [errorMsg]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="max-w-md w-full border-red-100 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Something went wrong</CardTitle>
          <p className="text-slate-500 mt-2">
            The system encountered an error. A report has been automatically sent to the developer.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
            <p className="text-sm font-mono text-slate-700 break-words">{errorMsg}</p>
          </div>
          
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-slate-400 flex items-center hover:text-slate-600 transition-colors"
          >
            {showDetails ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {showDetails ? "Hide technical details" : "Show technical details"}
          </button>
          
          {showDetails && (
            <div className="bg-slate-900 p-3 rounded text-[10px] text-slate-300 font-mono overflow-auto max-h-32">
              User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}<br/>
              URL: {typeof window !== 'undefined' ? window.location.href : 'Unknown'}<br/>
              Status: {reportSent ? "✅ Report Sent" : "⏳ Sending Report..."}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={() => window.location.href = "/admin/pos"}
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Link href="/admin" className="w-full">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" /> Go to Dashboard
            </Button>
          </Link>
          {reportSent && (
            <p className="text-[10px] text-center text-green-600 font-medium">
              ✓ Developer has been notified.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
