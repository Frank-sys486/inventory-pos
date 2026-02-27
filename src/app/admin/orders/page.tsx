"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2Icon,
  PlusCircle,
  Trash2,
  SearchIcon,
  FilterIcon,
  FilePenIcon,
  EyeIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type Order = {
  id: string
  customer_id: string
  total_amount: number
  status: 'completed' | 'pending' | 'cancelled'
  created_at: string
  customer: {
    name: string
  }
}

type Customer = {
  _id: string
  name: string
}

type Product = {
  _id: string
  name: string
  price: number
  in_stock: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [newOrderProducts, setNewOrderProducts] = useState<
    { _id: string; name: string; quantity: number; price: number }[]
  >([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false)
  const [newOrderCustomerName, setNewOrderCustomerName] = useState('')
  const [newOrderTotal, setNewOrderTotal] = useState('')
  const [newOrderStatus, setNewOrderStatus] = useState<
    'completed' | 'pending' | 'cancelled'
  >('pending')
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false)
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
  })
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [openProductSearch, setOpenProductSearch] = useState(false)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/customers'),
          fetch('/api/products'),
        ])

        if (!ordersRes.ok) throw new Error('Failed to fetch orders')
        if (!customersRes.ok) throw new Error('Failed to fetch customers')
        if (!productsRes.ok) throw new Error('Failed to fetch products')

        const ordersData = await ordersRes.json()
        const customersData = await customersRes.json()
        const productsData = await productsRes.json()

        setOrders(ordersData)
        setCustomers(customersData)
        setProducts(productsData)
      } catch (error) {
        setError((error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status) {
        return false;
      }
      return (
        (order.customer && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.id.toString().includes(searchTerm)
      );
    });
  }, [orders, filters.status, searchTerm]);

  const handleAddProductToOrder = (product: Product) => {
    setNewOrderProducts((prev) => {
      const existingProduct = prev.find((p) => p._id === product._id);
      if (existingProduct) {
        return prev.map((p) =>
          p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const handleRemoveProductFromOrder = (productId: string) => {
    setNewOrderProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  const handleUpdateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProductFromOrder(productId);
    } else {
      setNewOrderProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, quantity } : p))
      );
    }
  };

  const newOrderTotalAmount = useMemo(() => {
    return newOrderProducts.reduce((acc, p) => acc + p.price * p.quantity, 0);
  }, [newOrderProducts]);

  const resetSelectedOrder = () => {
    setSelectedOrderId(null);
    setNewOrderCustomerName("");
    setNewOrderTotal("");
    setNewOrderStatus("pending");
    setSelectedCustomerId(null);
    setNewOrderProducts([]);
  };

  const handleAddOrder = useCallback(async () => {
    try {
      const newOrder = {
        customerId: selectedCustomerId,
        products: newOrderProducts.map(p => ({ id: p._id, name: p.name, quantity: p.quantity, price: p.price })),
        total: newOrderTotalAmount,
        paymentMethod: 'Cash', // Or get from form
        status: newOrderStatus,
      };
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) {
        throw new Error("Error creating order");
      }

      const createdOrder = await response.json();
      // Manually add customer data to the new order for immediate UI update
      const customer = customers.find(c => c._id === selectedCustomerId);
      const createdOrderWithCustomer = {
        ...createdOrder,
        id: createdOrder._id,
        customer: customer ? { name: customer.name } : null
      };

      setOrders([createdOrderWithCustomer, ...orders]);
      setShowNewOrderDialog(false);
      resetSelectedOrder();
    } catch (error) {
      console.error(error);
    }
  }, [selectedCustomerId, newOrderProducts, newOrderTotalAmount, newOrderStatus, orders, customers]);

  const handleEditOrder = useCallback(async () => {
    if (!selectedOrderId) return;
    try {
      const updatedOrder = {
        id: selectedOrderId,
        total_amount: parseFloat(newOrderTotal),
        status: newOrderStatus,
        created_at: orders.find(o => o.id === selectedOrderId)?.created_at, // Preserve the original created_at
      };
      const response = await fetch(`/api/orders/${selectedOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedOrder),
      });

      if (!response.ok) {
        throw new Error("Error updating order");
      }

      const updatedOrderData = await response.json();
      setOrders(orders.map((o) => (o.id === updatedOrderData.id ? updatedOrderData : o)));
      setIsEditOrderDialogOpen(false);
      resetSelectedOrder();
    } catch (error) {
      console.error(error);
    }
  }, [selectedOrderId, newOrderTotal, newOrderStatus, orders]);

  const handleDeleteOrder = useCallback(async () => {
    if (!orderToDelete) return;
    try {
      const response = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error deleting order");
      }

      setOrders(orders.filter((o) => o.id !== orderToDelete.id));
      setIsDeleteConfirmationOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error(error);
    }
  }, [orderToDelete, orders]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      status: value,
    }));
  };

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
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <Card>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex flex-col gap-6 p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={handleSearch}
                className="pr-8"
              />
              <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <FilterIcon className="w-4 h-4" />
                  <span>Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.status === "all"}
                  onCheckedChange={() => handleFilterChange("all")}
                >
                  All Statuses
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "completed"}
                  onCheckedChange={() => handleFilterChange("completed")}
                >
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "pending"}
                  onCheckedChange={() => handleFilterChange("pending")}
                >
                  Pending
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "cancelled"}
                  onCheckedChange={() => handleFilterChange("cancelled")}
                >
                  Cancelled
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" onClick={() => setShowNewOrderDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customer ? order.customer.name : 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setNewOrderCustomerName(order.customer ? order.customer.name : "");
                          setNewOrderTotal(order.total_amount.toString());
                          setNewOrderStatus(order.status);
                          setIsEditOrderDialogOpen(true);
                        }}
                      >
                        <FilePenIcon className="w-4 h-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setOrderToDelete(order);
                          setIsDeleteConfirmationOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                      <Link href={`/admin/orders/${order.id}`} prefetch={false}>
                        <Button size="icon" variant="ghost">
                          <EyeIcon className="w-4 h-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {/* Pagination can be added here if needed */}
      </CardFooter>

      {/* Create Order Dialog */}
      <Dialog
        open={showNewOrderDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewOrderDialog(false);
            resetSelectedOrder();
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer" className="text-right">Customer</Label>
                <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId || ""}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>{customer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                value={newOrderStatus}
                onValueChange={(value: "completed" | "pending" | "cancelled") =>
                  setNewOrderStatus(value)
                }
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              </div>

            </div>
            <div className="space-y-4">
              <div>
                <Label>Products</Label>
                <Popover open={openProductSearch} onOpenChange={setOpenProductSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {productSearch ? products.find(p => p._id === productSearch)?.name : "Add a product"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search products..." />
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem
                            key={product._id}
                            value={product._id}
                            onSelect={(currentValue) => {
                              const selectedProduct = products.find(p => p._id === currentValue);
                              if (selectedProduct) handleAddProductToOrder(selectedProduct);
                              setOpenProductSearch(false);
                            }}
                          >
                            {product.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                {newOrderProducts.map(product => (
                  <div key={product._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => handleUpdateProductQuantity(product._id, parseInt(e.target.value))}
                        className="w-16"
                      />
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveProductFromOrder(product._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">Total: {formatCurrency(newOrderTotalAmount)}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewOrderDialog(false);
                resetSelectedOrder();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddOrder}>
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Order Dialog (kept simple for now) */}
      <Dialog open={isEditOrderDialogOpen} onOpenChange={setIsEditOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                value={newOrderTotal}
                onChange={(e) => setNewOrderTotal(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newOrderStatus}
                onValueChange={(value: "completed" | "pending" | "cancelled") =>
                  setNewOrderStatus(value)
                }
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditOrderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditOrder}>Update Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          Are you sure you want to delete this order? This action cannot be undone.
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
