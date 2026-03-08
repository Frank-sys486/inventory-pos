"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface POSProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: POSProduct | null;
  onSave: (updatedProduct: POSProduct) => void;
}

export function POSProductEditDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: ProductEditDialogProps) {
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [tempName, setTempName] = useState<string>("");

  useEffect(() => {
    if (product) {
      setTempPrice(product.price);
      setTempName(product.name);
    }
  }, [product, open]);

  const handleApply = () => {
    if (product) {
      onSave({
        ...product,
        name: tempName,
        price: tempPrice,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Override Item</DialogTitle>
          <DialogDescription>
            This change only applies to the current transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temp-name" className="text-right">Name</Label>
            <Input 
              id="temp-name" 
              value={tempName} 
              onChange={(e) => setTempName(e.target.value)} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temp-price" className="text-right">Price</Label>
            <Input 
              id="temp-price" 
              type="number" 
              value={tempPrice} 
              onChange={(e) => setTempPrice(Number(e.target.value))} 
              className="col-span-3" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply to Cart</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
