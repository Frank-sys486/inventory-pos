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
  DialogDescription,
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

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "active" | "inactive";
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerStatus, setNewCustomerStatus] = useState<"active" | "inactive">("active");
  
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "all" });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.map((c: any) => ({ ...c, id: c._id })));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (filters.status !== "all" && customer.status !== filters.status) return false;
      return (
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [customers, filters.status, searchTerm]);

  const resetForm = () => {
    setSelectedCustomerId(null);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setNewCustomerStatus("active");
  };

  const handleAddCustomer = useCallback(async () => {
    if (!newCustomerName) return;
    try {
      const payload = {
        name: newCustomerName,
        email: newCustomerEmail,
        phone: newCustomerPhone,
        address: newCustomerAddress,
        status: newCustomerStatus,
      };
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error creating customer");

      await fetchCustomers();
      setShowNewCustomerDialog(false);
      resetForm();
    } catch (error) { console.error(error); }
  }, [newCustomerName, newCustomerEmail, newCustomerPhone, newCustomerAddress, newCustomerStatus]);

  const handleEditCustomer = useCallback(async () => {
    if (!selectedCustomerId) return;
    try {
      const payload = {
        name: newCustomerName,
        email: newCustomerEmail,
        phone: newCustomerPhone,
        address: newCustomerAddress,
        status: newCustomerStatus,
      };
      const response = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error updating customer");

      await fetchCustomers();
      setIsEditCustomerDialogOpen(false);
      resetForm();
    } catch (error) { console.error(error); }
  }, [selectedCustomerId, newCustomerName, newCustomerEmail, newCustomerPhone, newCustomerAddress, newCustomerStatus]);

  const handleDeleteCustomer = useCallback(async () => {
    if (!customerToDelete) return;
    try {
      const response = await fetch(`/api/customers/${customerToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error deleting customer");
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      setIsDeleteConfirmationOpen(false);
      setCustomerToDelete(null);
    } catch (error) { console.error(error); }
  }, [customerToDelete, customers]);

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2Icon className="mx-auto h-12 w-12 animate-spin" /></div>;

  return (
    <Card className="flex flex-col gap-6 p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
              />
              <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1"><FilterIcon className="w-4 h-4" /><span>Filters</span></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={filters.status === "all"} onCheckedChange={() => setFilters({ status: "all" })}>All Statuses</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.status === "active"} onCheckedChange={() => setFilters({ status: "active" })}>Active</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.status === "inactive"} onCheckedChange={() => setFilters({ status: "inactive" })}>Inactive</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" onClick={() => setShowNewCustomerDialog(true)}><PlusCircle className="w-4 h-4 mr-2" />Add Customer</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone || "N/A"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{customer.address || "N/A"}</TableCell>
                  <TableCell>{customer.status}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCustomerId(customer.id);
                          setNewCustomerName(customer.name);
                          setNewCustomerEmail(customer.email || "");
                          setNewCustomerPhone(customer.phone || "");
                          setNewCustomerAddress(customer.address || "");
                          setNewCustomerStatus(customer.status || "active");
                          setIsEditCustomerDialogOpen(true);
                        }}
                      >
                        <FilePenIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setCustomerToDelete(customer);
                          setIsDeleteConfirmationOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog
        open={showNewCustomerDialog || isEditCustomerDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewCustomerDialog(false);
            setIsEditCustomerDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showNewCustomerDialog ? "Create New Customer" : "Edit Customer"}</DialogTitle>
            <DialogDescription>{showNewCustomerDialog ? "Enter details for the new customer." : "Update details for the existing customer."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name *</Label>
              <Input id="name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input id="phone" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input id="address" value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} className="col-span-3" placeholder="For delivery purposes" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={newCustomerStatus} onValueChange={(value: "active" | "inactive") => setNewCustomerStatus(value)}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setShowNewCustomerDialog(false); setIsEditCustomerDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={showNewCustomerDialog ? handleAddCustomer : handleEditCustomer}>{showNewCustomerDialog ? "Create Customer" : "Update Customer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete this customer?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteConfirmationOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
