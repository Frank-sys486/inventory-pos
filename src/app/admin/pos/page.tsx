"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { ProductSearch } from "@/components/ui/product-search";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PlusIcon, FilePenIcon, Trash2, Edit2Icon } from "lucide-react";
import { CustomerDialog } from "@/components/pos/customer-dialog";
import { ProductDialog } from "@/components/pos/product-dialog";
import { POSProductEditDialog } from "@/components/pos/product-edit-dialog";
import { Checkbox } from "@/components/ui/checkbox";

const pad = (left: string, right: string, width = 32) => {
  const leftStr = String(left);
  const rightStr = String(right);
  const space = width - leftStr.length - rightStr.length;
  if (space < 0) return leftStr + " " + rightStr;
  return leftStr + " ".repeat(space) + rightStr;
};

const center = (text: string, width = 32) => {
  const str = String(text);
  const space = Math.max(0, width - str.length);
  const left = Math.floor(space / 2);
  return " ".repeat(left) + str;
};

type POSItem = {
  id: string;
  code?: string;
  name: string;
  price: number;
  unit: string;
  description: string;
  cost: number;
  in_stock: number;
  category: string; // Required to match dialog
};

type Customer = {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
};

type PaymentMethod = {
  id: string;
  name: string;
};

interface POSProduct extends POSItem {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<POSItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<POSProduct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState<number | null>(null);
  const [receiptContent, setReceiptContent] = useState("");
  
  // Dialog States
  const [isForDelivery, setIsForDelivery] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showTempEditDialog, setShowTempEditDialog] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<POSItem | null>(null);
  const [productForTempEdit, setProductForTempEdit] = useState<POSProduct | null>(null);

  // Refs for keyboard navigation
  const customerRef = useRef<HTMLButtonElement>(null);
  const paymentRef = useRef<HTMLButtonElement>(null);
  const productRef = useRef<HTMLInputElement>(null);
  const quantityInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchPaymentMethods();

    const recentCustomerId = localStorage.getItem("recentCustomerId");
    const recentPaymentMethodId = localStorage.getItem("recentPaymentMethodId");

    if (recentCustomerId) handleSelectCustomer(recentCustomerId);
    if (recentPaymentMethodId) handleSelectPaymentMethod(recentPaymentMethodId);
  }, []);

  useEffect(() => {
    if (selectedCustomer) localStorage.setItem("recentCustomerId", selectedCustomer.id);
  }, [selectedCustomer]);

  useEffect(() => {
    if (paymentMethod) localStorage.setItem("recentPaymentMethodId", paymentMethod.id);
  }, [paymentMethod]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.map((item: any) => ({ 
        ...item, 
        id: item.id || item._id,
        description: item.description || "" // Ensure string for dialog
      })));
    } catch (error) { console.error("Error fetching products:", error); }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.map((item: any) => ({ ...item, id: item.id || item._id })));
    } catch (error) { console.error("Error fetching customers:", error); }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) throw new Error("Failed to fetch payment methods");
      const data = await response.json();
      setPaymentMethods(data.map((item: any) => ({ ...item, id: item.id || item._id })));
    } catch (error) { console.error("Error fetching payment methods:", error); }
  };

  const handleAddProduct = (product: POSItem) => {
    if (selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleSelectProduct = (productId: string | number) => {
    const product = products.find((p) => p.id === productId.toString());
    if (!product) return;
    handleAddProduct(product);
    setTimeout(() => productRef.current?.focus(), 200);
  };

  const handleSelectCustomer = (customerId: string | number) => {
    const customer = customers.find((c) => c.id === customerId.toString());
    if (customer) setSelectedCustomer(customer);
  };

  const handleSelectPaymentMethod = (paymentMethodId: string | number) => {
    const method = paymentMethods.find((pm) => pm.id === paymentMethodId.toString());
    if (method) setPaymentMethod(method);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const generateReceiptContent = (title: string) => {
    let content = "";
    const shopName = "GRACE HARDWARE";
    const shopAddress = "BLK4 LOT29 Las Palmas Subdivision Cay Pombo Sta. Maria, Bulacan";
    const shopPhone = "09173002334 / 09287890410";
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const receiptNum = "MC-" + Math.floor(100000 + Math.random() * 900000);
    const charWidth = 32;
    
    const lineWrapper = (text: string, bold = false, large = false) => {
      const style = `display: block; ${bold ? 'font-weight: bold;' : ''} ${large ? 'font-size: 18px;' : ''}`;
      return `<div class="receipt-line" style="${style}">${text}</div>`;
    };

    const separator = "-".repeat(charWidth);
    const dash = "- ".repeat(charWidth / 2).trim();

    content += lineWrapper(center(shopName, charWidth), true, true);
    content += lineWrapper(center(shopAddress, charWidth));
    content += lineWrapper(center(shopPhone, charWidth));
    content += lineWrapper(dash);
    content += lineWrapper(center(title, charWidth), true);
    content += lineWrapper(dash);

    content += lineWrapper(pad("DATE:", `${date} ${time}`, charWidth));
    content += lineWrapper(pad("RCPT:", receiptNum, charWidth));
    content += lineWrapper(pad("CASHIER:", "01 (ADMIN)", charWidth));
    content += lineWrapper(dash);

    content += lineWrapper(pad("QTY ITEM", "TOTAL", charWidth));
    content += lineWrapper(separator);

    selectedProducts.forEach((p) => {
      const itemTotal = (p.price * p.quantity).toFixed(2);
      content += lineWrapper(pad(`${p.quantity} ${p.name.toUpperCase().substring(0, 20)}`, itemTotal, charWidth));
      content += lineWrapper(`  @ ${p.price.toFixed(2)}`);
    });

    content += lineWrapper(dash);
    const totalVal = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    content += lineWrapper(pad("TOTAL", totalVal.toFixed(2), charWidth), true);
    content += lineWrapper(dash);

    if (paymentMethod) {
      content += lineWrapper(pad("TENDER:", paymentMethod.name.toUpperCase(), charWidth));
    }
    if (selectedCustomer) {
      content += lineWrapper(pad("CUST:", selectedCustomer.name.toUpperCase(), charWidth));
      if (isForDelivery && selectedCustomer.address) {
        content += lineWrapper(`ADDR: ${selectedCustomer.address.toUpperCase()}`);
      }
    }
    content += "\n";

    content += lineWrapper(center("*** THANK YOU ***", charWidth));
    content += lineWrapper(center("REPLACEMENT WITHIN", charWidth));
    content += lineWrapper(center("7 DAYS WITH RECEIPT", charWidth));
    content += "\n\n\n";

    setReceiptContent(content);
    setTimeout(() => window.print(), 300);
  };

  const handlePrintReceipt = async () => {
    if (!selectedCustomer || !paymentMethod || selectedProducts.length === 0) {
      alert("Please select customer and payment method");
      return;
    }

    const totalVal = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          paymentMethod: paymentMethod.name,
          items: selectedProducts.map((p) => ({
            product_id: p.id,
            name: p.name,
            quantity: p.quantity,
            price: p.price,
          })),
          total_amount: totalVal,
          status: 'completed'
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      generateReceiptContent("CASH RECEIPT");
      setSelectedProducts([]);
      setIsForDelivery(false);
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Something went wrong");
    }
  };

  // CALLBACKS
  const handleSaveCustomer = (newCustomer: any) => {
    const mapped = { ...newCustomer, id: newCustomer._id || newCustomer.id };
    setCustomers((prev) => [...prev, mapped]);
    setSelectedCustomer(mapped);
    setShowCustomerDialog(false);
  };

  const handleSaveProductMaster = (updatedProduct: any) => {
    const mapped = { ...updatedProduct, id: updatedProduct._id || updatedProduct.id };
    setProducts((prev) => prev.map(p => p.id === mapped.id ? mapped : p));
    setSelectedProducts((prev) => 
      prev.map((p) => p.id === mapped.id ? { ...mapped, quantity: p.quantity } : p)
    );
    setEditingProduct(null);
    setShowProductDialog(false);
  };

  const handleSaveTempProduct = (updatedProduct: POSProduct) => {
    setSelectedProducts((prev) => 
      prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p)
    );
    setProductForTempEdit(null);
    setShowTempEditDialog(false);
  };

  const ShortcutBadge = ({ k }: { k: string }) => (
    <span className="ml-2 inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
      {k}
    </span>
  );

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sale Details</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowCustomerDialog(true)}>
              <PlusIcon className="w-4 h-4 mr-1" /> New Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">
              Customer <ShortcutBadge k="F2" />
            </label>
            <Combobox
              ref={customerRef}
              items={customers}
              placeholder="Select Customer"
              onSelect={handleSelectCustomer}
            />
            {selectedCustomer && (
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox 
                  id="delivery" 
                  checked={isForDelivery} 
                  onCheckedChange={(checked) => setIsForDelivery(!!checked)} 
                />
                <label htmlFor="delivery" className="text-xs font-medium cursor-pointer">
                  For Delivery (Print Address)
                </label>
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">
              Payment Method <ShortcutBadge k="F3" />
            </label>
            <Combobox
              ref={paymentRef}
              items={paymentMethods}
              placeholder="Select Payment Method"
              onSelect={handleSelectPaymentMethod}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <div className="mt-2">
            <label className="mb-2 block text-sm font-medium">
              Add Product <ShortcutBadge k="F4" />
            </label>
            <ProductSearch
              ref={productRef}
              items={products}
              placeholder="Select Product"
              onSelect={handleSelectProduct}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                        className="w-16 p-1 border rounded"
                      />
                      <span className="ml-2 text-muted-foreground">{product.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(product.quantity * product.price)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {/* CART ONLY EDIT */}
                      <Button title="Edit for this sale only" size="icon" variant="ghost" onClick={() => {
                        setProductForTempEdit(product);
                        setShowTempEditDialog(true);
                      }}>
                        <Edit2Icon className="w-4 h-4 text-blue-500" />
                      </Button>
                      {/* MASTER EDIT */}
                      <Button title="Edit master product details" size="icon" variant="ghost" onClick={() => {
                        setEditingProduct(product);
                        setShowProductDialog(true);
                      }}>
                        <FilePenIcon className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveProduct(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-right">
            <strong>Total: {formatCurrency(selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0))}</strong>
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="w-full sm:w-auto" onClick={handlePrintReceipt} disabled={selectedProducts.length === 0 || !selectedCustomer || !paymentMethod}>
              Print Receipt <ShortcutBadge k="F9" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <CustomerDialog 
        open={showCustomerDialog} 
        onOpenChange={setShowCustomerDialog} 
        onSave={handleSaveCustomer} 
      />
      
      {/* Master Inventory Edit */}
      <ProductDialog 
        open={showProductDialog} 
        onOpenChange={setShowProductDialog} 
        product={editingProduct}
        onSave={handleSaveProductMaster} 
      />

      {/* Transaction Only Edit */}
      <POSProductEditDialog 
        open={showTempEditDialog}
        onOpenChange={setShowTempEditDialog}
        product={productForTempEdit}
        onSave={handleSaveTempProduct}
      />

      <div id="printable-receipt" className="hidden print:block" dangerouslySetInnerHTML={{ __html: receiptContent }} />
      
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt * { visibility: visible !important; }
          #printable-receipt { position: fixed; left: 0; top: 0; width: 100%; text-align: center; }
          .receipt-line { display: inline-block; width: 32ch; text-align: left; white-space: pre; font-family: monospace; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
