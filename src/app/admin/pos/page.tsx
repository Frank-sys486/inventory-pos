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

type POSItem = {
  id: string;
  code?: string;
  name: string;
  price: number;
  unit: string;
  description: string;
  cost: number;
  in_stock: number;
  category: string;
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
  const [receiptContent, setReceiptContent] = useState("");
  
  const [isForDelivery, setIsForDelivery] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showTempEditDialog, setShowTempEditDialog] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<POSItem | null>(null);
  const [productForTempEdit, setProductForTempEdit] = useState<POSProduct | null>(null);

  const productRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchPaymentMethods();
    const recentCustomerId = localStorage.getItem("recentCustomerId");
    const recentPaymentMethodId = localStorage.getItem("recentPaymentMethodId");
    if (recentCustomerId) handleSelectCustomer(recentCustomerId);
    if (recentPaymentMethodId) handleSelectPaymentMethod(recentPaymentMethodId);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.map((item: any) => ({ ...item, id: item.id || item._id, description: item.description || "" })));
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
      setSelectedProducts(selectedProducts.map((p) => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
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
    setSelectedProducts(selectedProducts.map((p) => p.id === productId ? { ...p, quantity: newQuantity } : p));
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const generateReceiptContent = (title: string, deliveryActive: boolean) => {
    let html = "";
    const shopName = "GRACE HARDWARE";
    const shopAddress = "BLK4 LOT29 Las Palmas Subdivision Cay Pombo Sta. Maria, Bulacan";
    const shopPhone = "09173002334 / 09287890410";
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const receiptNum = "MC-" + Math.floor(100000 + Math.random() * 900000);

    const line = (left: string, right: string = "", options: { bold?: boolean, size?: 'sm' | 'base' | 'lg', center?: boolean } = {}) => {
      const isSplit = right !== "";
      const fontSize = options.size === 'sm' ? '11px' : options.size === 'lg' ? '16px' : '13px';
      const weight = options.bold ? 'bold' : 'normal';
      const align = options.center ? 'center' : 'left';
      
      if (isSplit) {
        return `<div class="receipt-line flex-row" style="font-weight: ${weight}; font-size: ${fontSize};">
          <span>${left}</span>
          <span>${right}</span>
        </div>`;
      }
      return `<div class="receipt-line" style="font-weight: ${weight}; font-size: ${fontSize}; text-align: ${align};">${left}</div>`;
    };

    const sep = () => `<div class="receipt-line" style="border-top: 1px dashed black; margin: 5px 0;"></div>`;

    // Header
    html += line(shopName, "", { bold: true, size: 'lg', center: true });
    html += line(shopAddress, "", { size: 'sm', center: true });
    html += line(shopPhone, "", { size: 'sm', center: true });
    html += sep();
    html += line(title, "", { bold: true, center: true });
    html += sep();

    // Meta Info
    html += line("DATE:", `${date} ${time}`, { size: 'sm' });
    html += line("RCPT:", receiptNum, { size: 'sm' });
    html += line("CASHIER:", "01 (ADMIN)", { size: 'sm' });
    html += sep();

    // Items
    html += line("QTY ITEM", "TOTAL", { bold: true });
    html += `<div style="border-top: 1px solid black; margin-bottom: 4px;"></div>`;

    selectedProducts.forEach((p) => {
      const itemTotal = (p.price * p.quantity).toFixed(2);
      html += line(`${p.quantity} ${p.name.toUpperCase()}`, itemTotal);
      html += line(`  @ ${p.price.toFixed(2)}`, "", { size: 'sm' });
    });

    // Total Section
    html += sep();
    const totalVal = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    html += line("TOTAL", totalVal.toFixed(2), { bold: true, size: 'lg' });
    html += sep();

    // Footer Info
    if (paymentMethod) html += line("TENDER:", paymentMethod.name.toUpperCase(), { size: 'sm' });
    if (selectedCustomer) {
      html += line("CUST:", selectedCustomer.name.toUpperCase(), { size: 'sm' });
      if (deliveryActive && selectedCustomer.address) {
        html += line("ADDRESS:", "", { bold: true, size: 'sm' });
        html += `<div class="receipt-line" style="font-size: 11px; white-space: normal; line-height: 1.1;">${selectedCustomer.address.toUpperCase()}</div>`;
      }
    }

    html += `<div style="margin-top: 10px;"></div>`;
    html += line("*** THANK YOU ***", "", { center: true });
    html += line("REPLACEMENT WITHIN", "", { size: 'sm', center: true });
    html += line("7 DAYS WITH RECEIPT", "", { size: 'sm', center: true });
    html += `<div style="margin-top: 20px;">.</div>`;

    setReceiptContent(html);
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
          items: selectedProducts.map((p) => ({ product_id: p.id, name: p.name, quantity: p.quantity, price: p.price })),
          total_amount: totalVal,
          status: 'completed'
        }),
      });
      if (!response.ok) throw new Error("Failed to create order");
      
      generateReceiptContent("CASH RECEIPT", isForDelivery);
      
      setSelectedProducts([]);
      setIsForDelivery(false);
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Something went wrong");
    }
  };

  const handleSaveCustomer = (newCustomer: any) => {
    const mapped = { ...newCustomer, id: newCustomer._id || newCustomer.id };
    setCustomers((prev) => [...prev, mapped]);
    setSelectedCustomer(mapped);
    setShowCustomerDialog(false);
  };

  const handleSaveProductMaster = (updatedProduct: any) => {
    const mapped = { ...updatedProduct, id: updatedProduct._id || updatedProduct.id };
    setProducts((prev) => prev.map(p => p.id === mapped.id ? mapped : p));
    setSelectedProducts((prev) => prev.map((p) => p.id === mapped.id ? { ...mapped, quantity: p.quantity } : p));
    setEditingProduct(null);
    setShowProductDialog(false);
  };

  const handleSaveTempProduct = (updatedProduct: POSProduct) => {
    setSelectedProducts((prev) => prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p));
    setProductForTempEdit(null);
    setShowTempEditDialog(false);
  };

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
            <label className="mb-2 block text-sm font-medium">Customer</label>
            <Combobox items={customers} placeholder="Select Customer" onSelect={handleSelectCustomer} />
            {selectedCustomer && (
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox id="delivery" checked={isForDelivery} onCheckedChange={(checked) => setIsForDelivery(!!checked)} />
                <label htmlFor="delivery" className="text-xs font-medium cursor-pointer">For Delivery (Print Address)</label>
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Payment Method</label>
            <Combobox items={paymentMethods} placeholder="Select Payment Method" onSelect={handleSelectPaymentMethod} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <div className="mt-2">
            <label className="mb-2 block text-sm font-medium">Add Product</label>
            <ProductSearch items={products} placeholder="Select Product" onSelect={handleSelectProduct} />
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
              {selectedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <input
                        type="number" min="1" value={product.quantity}
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
                      <Button title="Override" size="icon" variant="ghost" onClick={() => { setProductForTempEdit(product); setShowTempEditDialog(true); }}>
                        <Edit2Icon className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button title="Edit Master" size="icon" variant="ghost" onClick={() => { setEditingProduct(product); setShowProductDialog(true); }}>
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
              Print Receipt
            </Button>
          </div>
        </CardContent>
      </Card>

      <CustomerDialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog} onSave={handleSaveCustomer} />
      <ProductDialog open={showProductDialog} onOpenChange={setShowProductDialog} product={editingProduct} onSave={handleSaveProductMaster} />
      <POSProductEditDialog open={showTempEditDialog} onOpenChange={setShowTempEditDialog} product={productForTempEdit} onSave={handleSaveTempProduct} />

      <div id="printable-receipt" className="hidden print:block" dangerouslySetInnerHTML={{ __html: receiptContent }} />
      
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          body { margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt * { visibility: visible !important; }
          #printable-receipt { 
            position: absolute !important; 
            left: 50% !important; 
            transform: translateX(-50%) !important;
            top: 0 !important; 
            width: 50mm !important; 
            padding: 5mm 0 !important; 
            margin: 0 !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
          .receipt-line { 
            display: block !important; 
            width: 100% !important; 
            white-space: pre-wrap !important; 
            margin: 0 !important; 
            padding: 1px 0 !important; 
          }
          .flex-row {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}
