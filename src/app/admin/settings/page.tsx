"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Database, FileSpreadsheet, Loader2, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  
  // Import state
  const [importType, setImportType] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

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
        setImportSummary(data.details);
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
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your database, imports, and system configurations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-500" />
              <CardTitle>Export Database</CardTitle>
            </div>
            <CardDescription>Download your data in CSV format for backups or external analysis.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {["products", "customers", "orders", "transactions"].map((type) => (
                <Button 
                  key={type} 
                  variant="outline" 
                  className="capitalize"
                  disabled={!!loading}
                  onClick={() => handleExport(type)}
                >
                  {loading === `export-${type}` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
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
              <CardTitle>Import Data</CardTitle>
            </div>
            <CardDescription>Bulk upload products or customers via CSV file.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="import-products">Import Products</Label>
              <div className="flex gap-2">
                <Input 
                  id="import-products" 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => onFileChange(e, "products")}
                  disabled={!!loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-customers">Import Customers</Label>
              <div className="flex gap-2">
                <Input 
                  id="import-customers" 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => onFileChange(e, "customers")}
                  disabled={!!loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info Card */}
        <Card className="md:col-span-2">
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
              Import Summary
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold">Total Imported</p>
                <p className="text-3xl font-bold">{importSummary?.total}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold">Similar Items</p>
                <p className="text-3xl font-bold text-blue-600">{importSummary?.similar}</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Similarity Rate</span>
                <span className="text-sm font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{importSummary?.similarityPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${importSummary?.similarityPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {importSummary?.similar > 0 
                  ? "Note: High similarity means many items in the file have names similar to items already in your database."
                  : "Note: No similar names were detected in your current database."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSummaryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
