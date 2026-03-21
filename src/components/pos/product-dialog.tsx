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
import { ChevronsUpDown } from "lucide-react";

interface Product {
  id?: string;
  _id?: string;
  code?: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  in_stock: number;
  category: string;
  unit?: string;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (product: Product) => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: ProductDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [inStock, setInStock] = useState(0);
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("piece");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setCode(product.code || "");
      setName(product.name || "");
      setDescription(product.description || "");
      setPrice(product.price || 0);
      setCost(product.cost || 0);
      setInStock(product.in_stock || 0);
      setCategory(product.category || "");
      setUnit(product.unit || "piece");
    }
  }, [product, open]);

  const handleSave = async () => {
    if (!name || !price || !unit || !cost) {
      alert("Please fill in all required fields (Name, Price, Cost, Unit).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code,
        name,
        description,
        price,
        cost,
        in_stock: inStock,
        category,
        unit,
      };

      const url = product?.id || product?._id 
        ? `/api/products/${product.id || product._id}` 
        : "/api/products";
      
      const method = product?.id || product?._id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save product");
      }

      const savedProduct = await response.json();
      onSave(savedProduct);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error instanceof Error ? error.message : "Error saving product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            Update product details and stock information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">Code</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Extra details (printed on receipt)" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">Cost *</Label>
            <Input id="cost" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Price *</Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="flex-1" />
              <div className="relative w-[100px]">
                <Input list="unit-options" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" />
                <datalist id="unit-options">
                  <option value="piece" /><option value="weight" /><option value="long" />
                </datalist>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="in_stock" className="text-right">Stock</Label>
            <Input id="in_stock" type="number" value={inStock} onChange={(e) => setInStock(Number(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-3" placeholder="Category" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
