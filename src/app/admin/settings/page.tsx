"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Database, FileSpreadsheet, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState<string | null>(null);

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(`import-${type}`);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Check console for details.");
    } finally {
      setLoading(null);
      e.target.value = ""; // Reset input
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
                  onChange={(e) => handleImport(e, "products")}
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
                  onChange={(e) => handleImport(e, "customers")}
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
    </div>
  );
}
