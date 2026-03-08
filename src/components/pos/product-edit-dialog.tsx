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
  description: string;
  cost: number;
  in_stock: number;
  category: string;
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
  const [tempTotal, setTempTotal] = useState<number>(0);

  useEffect(() => {
    if (product) {
      setTempPrice(product.price);
      setTempName(product.name);
      setTempTotal(product.price * product.quantity);
    }
  }, [product, open]);

  const handlePriceChange = (price: number) => {
    setTempPrice(price);
    if (product) {
      setTempTotal(price * product.quantity);
    }
  };

  const handleTotalChange = (total: number) => {
    setTempTotal(total);
    if (product && product.quantity > 0) {
      setTempPrice(Number((total / product.quantity).toFixed(2)));
    }
  };

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
              onChange={(e) => handlePriceChange(Number(e.target.value))} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temp-total" className="text-right">Total</Label>
            <Input 
              id="temp-total" 
              type="number" 
              value={tempTotal} 
              onChange={(e) => handleTotalChange(Number(e.target.value))} 
              className="col-span-3" 
            />
          </div>
          {product && (
            <p className="text-[10px] text-center opacity-50 col-span-4">
              Quantity: {product.quantity} {product.unit}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply to Cart</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
