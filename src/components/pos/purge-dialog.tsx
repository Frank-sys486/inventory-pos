"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

interface PurgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
}

export function PurgeDialog({ open, onOpenChange, onSuccess }: PurgeDialogProps) {
  const [password, setPassword] = useState("");
  const [purgeType, setPurgeType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePurge = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, type: purgeType }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.message);
        onOpenChange(false);
        setPassword("");
      } else {
        setError(data.error || "Failed to purge data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-red-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Purge Data
          </DialogTitle>
          <DialogDescription>
            This action will delete your data. Based on system settings, it will either be archived or permanently removed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>What do you want to delete?</Label>
            <select 
              className="w-full p-2 border rounded-md text-sm"
              value={purgeType}
              onChange={(e) => setPurgeType(e.target.value)}
            >
              <option value="all">Everything (Factory Reset)</option>
              <option value="products">Products Only</option>
              <option value="customers">Customers Only</option>
              <option value="orders">Orders & Sales Only</option>
              <option value="transactions">Transactions/Expenses Only</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purge-password">Account Password</Label>
            <div className="relative">
              <Input
                id="purge-password"
                type="password"
                placeholder="Enter your password to confirm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? "border-red-500" : ""}
              />
              <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          </div>
        </div>

        <DialogFooter className="bg-red-50 -mx-6 -mb-6 p-4 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handlePurge}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Deletion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
