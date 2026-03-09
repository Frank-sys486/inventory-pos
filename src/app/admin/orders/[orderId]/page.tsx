"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';

type Order = {
  _id: string;
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  total_amount: number;
  amount_received?: number;
  change?: number;
  paymentMethod?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
};

export default function OrderDetailsPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${params.orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Sold Item Details</h1>
        <Card>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Sold Item Details</h1>
        <p>Order not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Transaction #{order._id ? order._id.substring(0, 8) : 'N/A'}...</span>
            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
              {order.status}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div>
            <h3 className="font-semibold mb-2">Customer Details</h3>
            <div className="text-sm text-muted-foreground">
              <p><strong>Name:</strong> {order.customer?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {order.customer?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {order.customer?.phone || 'N/A'}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Items Sold</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items && order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end border-t pt-4">
            <div className="text-right space-y-1 min-w-[200px]">
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium uppercase">{order.paymentMethod || "Cash"}</span>
              </div>
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-muted-foreground">Amount Received:</span>
                <span className="font-medium">{formatCurrency(order.amount_received || order.total_amount)}</span>
              </div>
              <div className="flex justify-between gap-8 text-sm pb-2 border-b">
                <span className="text-muted-foreground">Change:</span>
                <span className="font-medium text-green-600">{formatCurrency(order.change || 0)}</span>
              </div>
              <div className="flex justify-between gap-8 pt-2">
                <span className="font-semibold text-lg">Total Amount:</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
