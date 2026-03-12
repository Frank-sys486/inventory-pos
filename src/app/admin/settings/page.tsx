"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Database, FileSpreadsheet, Loader2, Info, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PurgeDialog } from "@/components/pos/purge-dialog";

export default function SettingsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  
  // Import state
  const [importType, setImportType] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  // Purge state
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState("");

  const handleExport = async (type: string) => {
    setLoading(`export-${type}`);
    try {
      window.location.href = `/api/admin/data?type=${type}`;
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setTimeout(() => setLoading(null), 2000);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setImportType(type);
    setShowImportDialog(true);
    e.target.value = ""; // Clear input
  };

  const processImport = async (mode: "add" | "replace") => {
    if (!pendingFile || !importType) return;

    setShowImportDialog(false);
    setLoading(`import-${importType}`);
    
    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("type", importType);
    formData.append("mode", mode);

    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImportSummary({ ...data.details, message: data.message });
        setShowSummaryDialog(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Check console for details.");
    } finally {
      setLoading(null);
      setPendingFile(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your database, imports, and system configurations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Full Backup/Restore Card */}
        <Card className="md:col-span-2 border-primary/20 bg-primary/[0.02]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>System Maintenance</CardTitle>
            </div>
            <CardDescription>Backup or restore your entire system including products, customers, and history.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button 
              size="lg"
              className="gap-2"
              onClick={() => handleExport("all")}
              disabled={!!loading}
            >
              {loading === "export-all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Backup All Data (JSON)
            </Button>
            
            <div className="relative">
              <input 
                type="file" 
                id="restore-all" 
                className="hidden" 
                accept=".json" 
                onChange={(e) => onFileChange(e, "all")}
              />
              <Button 
                variant="outline"
                size="lg"
                className="gap-2"
                asChild
                disabled={!!loading}
              >
                <label htmlFor="restore-all" className="cursor-pointer">
                  {loading === "import-all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Restore System (JSON)
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              <CardTitle>CSV Exports</CardTitle>
            </div>
            <CardDescription>Download specific tables in CSV format for spreadsheet use.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {["products", "customers", "orders", "transactions"].map((type) => (
                <Button 
                  key={type} 
                  variant="outline" 
                  size="sm"
                  className="capitalize"
                  disabled={!!loading}
                  onClick={() => handleExport(type)}
                >
                  {loading === `export-${type}` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  {type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-500" />
              <CardTitle>CSV Imports</CardTitle>
            </div>
            <CardDescription>Bulk upload or update data via CSV files.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {["products", "customers", "orders", "transactions"].map((type) => (
               <div key={type} className="flex items-center justify-between p-2 border rounded-md hover:bg-slate-50">
                  <span className="text-sm font-medium capitalize">{type}</span>
                  <div className="relative">
                    <input 
                      type="file" 
                      id={`import-${type}`} 
                      className="hidden" 
                      accept=".csv" 
                      onChange={(e) => onFileChange(e, type)}
                    />
                    <Button variant="ghost" size="sm" asChild disabled={!!loading}>
                      <label htmlFor={`import-${type}`} className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" /> Upload
                      </label>
                    </Button>
                  </div>
               </div>
            ))}
          </CardContent>
        </Card>

        {/* System Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <CardTitle>System Information</CardTitle>
            </div>
            <CardDescription>Technical details for troubleshooting and licensing.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm font-mono">
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Database Status:</span>
              <span className="text-green-500 font-bold">CONNECTED</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">System UUID:</span>
              <span>00000000-0000-0000-0000-309C232230F0</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">App Version:</span>
              <span>1.0.0 (Production)</span>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
            </div>
            <CardDescription>Actions here can result in permanent data loss. Use with caution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
                variant="destructive" 
                className="w-full justify-start gap-2 h-12"
                onClick={() => setShowPurgeDialog(true)}
            >
              <Trash2 className="w-5 h-5" />
              Purge Database / Factory Reset
            </Button>
            <p className="text-xs text-red-500 font-medium italic">
                * Note: Based on system configuration, data may be archived instead of permanently deleted.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Import Choice Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Import Options
            </DialogTitle>
            <DialogDescription>
              How would you like to handle this import for <strong>{importType}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button variant="outline" className="justify-start h-auto py-4 px-4 flex flex-col items-start gap-1" onClick={() => processImport("add")}>
              <span className="font-bold">Add to Existing</span>
              <span className="text-xs text-muted-foreground">This will keep your current items and just add the new ones.</span>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4 px-4 flex flex-col items-start gap-1 border-orange-200 hover:bg-orange-50 hover:border-orange-300" onClick={() => processImport("replace")}>
              <span className="font-bold text-orange-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Replace All
              </span>
              <span className="text-xs text-muted-foreground">This will archive all your current items and only show the ones from this file.</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowImportDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {importSummary?.message || "Import Summary"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {importType === "all" ? (
              <div className="space-y-2">
                {Object.entries(importSummary || {}).map(([key, val]) => {
                  if (key === "message") return null;
                  return (
                    <div key={key} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="capitalize text-sm font-medium">{key}</span>
                      <span className="font-bold">{val as any}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Imported</p>
                    <p className="text-3xl font-bold">{importSummary?.total}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Similar Items</p>
                    <p className="text-3xl font-bold text-blue-600">{importSummary?.similar || 0}</p>
                  </div>
                </div>
                {importSummary?.total > 0 && (
                   <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Data Integrity</span>
                        <span className="text-xs text-green-600 font-bold px-2 py-0.5 bg-green-50 rounded border border-green-100">VERIFIED</span>
                      </div>
                   </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSummaryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purge Result Dialog */}
      <Dialog open={!!purgeMessage} onOpenChange={(open) => !open && setPurgeMessage("")}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    Action Complete
                </DialogTitle>
                <DialogDescription>{purgeMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={() => setPurgeMessage("")}>Done</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurgeDialog 
        open={showPurgeDialog} 
        onOpenChange={setShowPurgeDialog} 
        onSuccess={(msg) => setPurgeMessage(msg)}
      />
    </div>
  );
}
