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

const separator = "-".repeat(32);

type Product = {
  id: number | string;
  code?: string;
  name: string;
  price: number;
  unit: string;
};

type Customer = {
  id: number | string;
  name:string;
};

type PaymentMethod = {
  id: number | string;
  name: string;
};

interface POSProduct extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<POSProduct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState<number | null>(null);
  const [receiptContent, setReceiptContent] = useState("");

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

    if (recentCustomerId) {
      handleSelectCustomer(recentCustomerId);
    }
    if (recentPaymentMethodId) {
      handleSelectPaymentMethod(recentPaymentMethodId);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      localStorage.setItem("recentCustomerId", selectedCustomer.id.toString());
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (paymentMethod) {
      localStorage.setItem("recentPaymentMethodId", paymentMethod.id.toString());
    }
  }, [paymentMethod]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // if focus is on an input, don't trigger global shortcuts
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.key !== "F8" && e.key !== "F9") return;
      }

      switch (e.key) {
        case "F2":
          e.preventDefault();
          customerRef.current?.focus();
          break;
        case "F3":
          e.preventDefault();
          paymentRef.current?.focus();
          break;
        case "F4":
          e.preventDefault();
          productRef.current?.focus();
          break;
        case "F9":
          e.preventDefault();
          handlePrintReceipt();
          break;
        case "F8":
          e.preventDefault();
          handlePrintInvoice();
          break;
        case "Backspace":
        case "Delete":
          if (highlightedProductIndex !== null) {
            e.preventDefault();
            handleRemoveProduct(selectedProducts[highlightedProductIndex].id);
            setHighlightedProductIndex(null);
          }
          break;
        default:
          if (/^[a-zA-Z0-9]$/.test(e.key)) {
            productRef.current?.focus();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedCustomer, paymentMethod, selectedProducts, highlightedProductIndex]); 

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(
        data.map((item: any) => ({ ...item, id: item.id || item._id }))
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(
        data.map((item: any) => ({ ...item, id: item.id || item._id }))
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) throw new Error("Failed to fetch payment methods");
      const data = await response.json();
      setPaymentMethods(
        data.map((item: any) => ({ ...item, id: item.id || item._id }))
      );
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleAddProduct = (product: Product) => {
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

  const handleSelectProduct = (productId: number | string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    handleAddProduct(product);
    
    setTimeout(() => {
      productRef.current?.focus();
    }, 200);
  };

  const handleSelectCustomer = (customerId: number | string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
    }
  };

  const handleSelectPaymentMethod = (paymentMethodId: number | string) => {
    const method = paymentMethods.find((pm) => pm.id === paymentMethodId);
    if (method) {
      setPaymentMethod(method);
    }
  };

  const handleQuantityChange = (
    productId: number | string,
    newQuantity: number
  ) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleRemoveProduct = (productId: number | string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const generateReceiptContent = (title: string) => {
    let content = "";
    const shopName = "GRACE HARDWARE";
    const address = "123 COMMERCE AVENUE";
    const phone = "TEL: (555) 019-8372";
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const receiptNum = "#TM-" + Math.floor(100000 + Math.random() * 900000);
    const charWidth = 32;
    
    const lineWrapper = (text: string, bold = false, large = false) => {
      const style = `display: block; ${bold ? 'font-weight: bold;' : ''} ${large ? 'font-size: 18px;' : ''}`;
      return `<div class="receipt-line" style="${style}">${text}</div>`;
    };

    const separator = "-".repeat(charWidth);
    const dash = "- ".repeat(charWidth / 2).trim();

    content += lineWrapper(center(shopName, charWidth), true, true);
    content += lineWrapper(center(address, charWidth));
    content += lineWrapper(center(phone, charWidth));
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
    content += lineWrapper(pad("SUBTOTAL", total.toFixed(2), charWidth));
    content += lineWrapper(pad("TAX (0.0%)", "0.00", charWidth));
    content += lineWrapper(pad("TOTAL", total.toFixed(2), charWidth), true);
    content += lineWrapper(dash);

    if (paymentMethod) {
      content += lineWrapper(pad("TENDER:", paymentMethod.name.toUpperCase(), charWidth));
    }
    if (selectedCustomer) {
      content += lineWrapper(pad("CUST:", selectedCustomer.name.toUpperCase(), charWidth));
    }
    content += "\n";

    content += lineWrapper(center("*** THANK YOU ***", charWidth));
    content += lineWrapper(center("RETURNS ACCEPTED WITHIN", charWidth));
    content += lineWrapper(center("30 DAYS WITH RECEIPT", charWidth));
    content += "\n";
    content += lineWrapper(center("882910394812", charWidth));
    content += "\n\n\n";

    setReceiptContent(content);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handlePrintInvoice = () => {
    if (selectedProducts.length === 0) return;
    generateReceiptContent("PROFORMA INVOICE");
  };

  const handlePrintReceipt = async () => {
    if (!selectedCustomer || !paymentMethod || selectedProducts.length === 0) {
      alert("Please select customer and payment method");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          paymentMethod: paymentMethod.name,
          products: selectedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            price: p.price,
          })),
          total,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      generateReceiptContent("CASH RECEIPT");

      setSelectedProducts([]);
      setSelectedCustomer(null);
      setPaymentMethod(null);
      customerRef.current?.focus();
    } catch (error) {
      console.error("Error processing sale:", error);
      alert(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const total = selectedProducts.reduce(
    (sum, product) => sum + product.price * (product.quantity || 1),
    0
  );

  const ShortcutBadge = ({ k }: { k: string }) => (
    <span className="ml-2 inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
      {k}
    </span>
  );

  const handleQuantityKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setHighlightedProductIndex((prev) => {
          const nextIndex =
            prev === null || prev <= 0
              ? selectedProducts.length - 1
              : prev - 1;
          quantityInputRefs.current[nextIndex]?.focus();
          return nextIndex;
        });
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedProductIndex((prev) => {
          const nextIndex =
            prev === null || prev >= selectedProducts.length - 1
              ? 0
              : prev + 1;
          quantityInputRefs.current[nextIndex]?.focus();
          return nextIndex;
        });
        break;
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sale Details</CardTitle>
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
                <TableRow
                  key={product.id}
                  className={cn(
                    highlightedProductIndex === index ? "bg-muted/50" : ""
                  )}
                >
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <input
                        ref={(el) => {
                          quantityInputRefs.current[index] = el;
                        }}
                        type="number"
                        min="1"
                        value={product.quantity || 1}
                        onKeyDown={(e) => handleQuantityKeyDown(e, index)}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          handleQuantityChange(
                            product.id,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-16 p-1 border rounded"
                      />
                      <span className="ml-2 text-muted-foreground">
                        {product.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(
                      (product.quantity || 1) * product.price
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-right">
            <strong>Total: {formatCurrency(total)}</strong>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button
              className="w-full sm:w-auto"
              onClick={handlePrintReceipt}
              disabled={
                selectedProducts.length === 0 ||
                !selectedCustomer ||
                !paymentMethod
              }
            >
              Print Receipt <ShortcutBadge k="F9" />
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={handlePrintInvoice}
              disabled={selectedProducts.length === 0}
            >
              Print Invoice <ShortcutBadge k="F8" />
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Hidden Receipt for Printing */}
      <div 
        id="printable-receipt" 
        className="hidden print:block text-black p-0 m-0"
        dangerouslySetInnerHTML={{ __html: receiptContent }}
      />
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          /* Standard hack to print ONLY one nested element */
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            text-align: center !important;
          }
          /* Lock each line to exactly 32 monospaced characters */
          .receipt-line {
            display: inline-block !important;
            width: 32ch !important;
            text-align: left !important;
            white-space: pre !important;
            font-family: monospace !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
