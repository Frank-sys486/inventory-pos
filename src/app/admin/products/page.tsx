"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  SearchIcon,
  FilterIcon,
  FilePenIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  LoaderIcon,
  Loader2Icon,
  ChevronsUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  code?: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  in_stock: number;
  category: string;
  unit?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    inStock: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState(0);
  const [productCost, setProductCost] = useState(0);
  const [productInStock, setProductInStock] = useState(0);
  const [productCategory, setProductCategory] = useState("");
  const [productUnit, setProductUnit] = useState("piece");
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const resetSelectedProduct = () => {
    setSelectedProductId(null);
    setProductCode("");
    setProductName("");
    setProductDescription("");
    setProductPrice(0);
    setProductCost(0);
    setProductInStock(0);
    setProductCategory("");
    setProductUnit("piece");
  };

  const handleAddProduct = useCallback(async () => {
    if (!productName || !productPrice || !productUnit || !productCost) {
      alert("Please fill in all required fields (Name, Price, Cost, Unit).");
      return;
    }

    try {
      const newProduct = {
        code: productCode,
        name: productName,
        description: productDescription,
        cost: productCost,
        price: productPrice,
        in_stock: productInStock,
        category: productCategory,
        unit: productUnit,
      };
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const addedProduct = await response.json();
        setProducts([...products, { ...addedProduct, id: addedProduct._id || addedProduct.id }]);
        setIsAddProductDialogOpen(false);
        resetSelectedProduct();
      } else {
        const errorData = await response.json();
        console.error("Failed to add product:", errorData);
        alert(`Failed to add product: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  }, [productCode, productName, productDescription, productPrice, productCost, productInStock, productCategory, productUnit, products]);

  const handleEditProduct = useCallback(async () => {
    if (!selectedProductId) return;

    if (!productName || !productPrice || !productUnit || !productCost) {
      alert("Please fill in all required fields (Name, Price, Cost, Unit).");
      return;
    }

    try {
      const updatedProduct = {
        id: selectedProductId,
        code: productCode,
        name: productName,
        description: productDescription,
        price: productPrice,
        cost: productCost,
        in_stock: productInStock,
        category: productCategory,
        unit: productUnit,
      };
      const response = await fetch(`/api/products/${selectedProductId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        const updatedProductFromServer = await response.json();
        const mappedProduct = { ...updatedProductFromServer, id: updatedProductFromServer._id || updatedProductFromServer.id };
        setProducts(
          products.map((p) => (p.id === mappedProduct.id ? mappedProduct : p))
        );
        setIsEditProductDialogOpen(false);
        resetSelectedProduct();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update product: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  }, [selectedProductId, productCode, productName, productDescription, productPrice, productCost, productInStock, productCategory, productUnit, products]);


  const handleDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productToDelete.id));
        setIsDeleteConfirmationOpen(false);
        setProductToDelete(null);
      } else {
        console.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }, [productToDelete, products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data.map((item: any) => ({ ...item, id: item._id || item.id })));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.category !== "all" && product.category !== filters.category) {
        return false;
      }
      if (
        filters.inStock !== "all" &&
        filters.inStock === "in-stock" &&
        product.in_stock === 0
      ) {
        return false;
      }
      return product.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [products, filters.category, filters.inStock, searchTerm]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type: "category" | "inStock", value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card className="flex flex-col gap-6 p-6">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
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
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "all"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "all")
                    }
                  >
                    All Categories
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "electronics"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "electronics")
                    }
                  >
                    Electronics
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "home"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "home")
                    }
                  >
                    Home
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "health"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "health")
                    }
                  >
                    Health
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "all"}
                    onCheckedChange={() => handleFilterChange("inStock", "all")}
                  >
                    All Stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "in-stock"}
                    onCheckedChange={() =>
                      handleFilterChange("inStock", "in-stock")
                    }
                  >
                    In Stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "out-of-stock"}
                    onCheckedChange={() =>
                      handleFilterChange("inStock", "out-of-stock")
                    }
                  >
                    Out of Stock
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="sm" onClick={() => setIsAddProductDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{formatCurrency(product.cost || 0)}</TableCell>
                    <TableCell>
                      {formatCurrency(product.price)}
                      <span className="text-muted-foreground text-xs ml-1">/ {product.unit || "piece"}</span>
                    </TableCell>
                    <TableCell>{product.in_stock}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setProductCode(product.code || "");
                            setProductName(product.name);
                            setProductDescription(product.description);
                            setProductPrice(product.price);
                            setProductCost(product.cost || 0);
                            setProductInStock(product.in_stock);
                            setProductCategory(product.category);
                            setProductUnit(product.unit || "piece");
                            setIsEditProductDialogOpen(true);
                          }}
                        >
                          <FilePenIcon className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteConfirmationOpen(true);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
      <Dialog
        open={isAddProductDialogOpen || isEditProductDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddProductDialogOpen(false);
            setIsEditProductDialogOpen(false);
            resetSelectedProduct();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddProductDialogOpen ? "Add New Product" : "Edit Product"}
            </DialogTitle>
            <DialogDescription>
              {isAddProductDialogOpen
                ? "Enter the details of the new product."
                : "Edit the details of the product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                Cost <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cost"
                type="number"
                value={productCost}
                onChange={(e) => setProductCost(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="price"
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  / <span className="text-red-500">*</span>
                </span>
                <div className="relative w-[120px]">
                  <Input
                    list="unit-options"
                    placeholder="Unit"
                    value={productUnit}
                    onChange={(e) => setProductUnit(e.target.value)}
                    className="pr-8"
                  />
                  <datalist id="unit-options">
                    <option value="piece" />
                    <option value="weight" />
                    <option value="long" />
                  </datalist>
                  <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="in_stock" className="text-right">
                In Stock
              </Label>
              <Input
                id="in_stock"
                type="number"
                value={productInStock}
                onChange={(e) => setProductInStock(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3 relative">
                <Input
                  list="category-options"
                  id="category"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="pr-8"
                  placeholder="Select or type a category"
                />
                <datalist id="category-options">
                  <option value="electronics" />
                  <option value="clothing" />
                  <option value="books" />
                  <option value="home" />
                </datalist>
                <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={
                isAddProductDialogOpen ? handleAddProduct : handleEditProduct
              }
            >
              {isAddProductDialogOpen ? "Add Product" : "Update Product"}
            </Button>
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
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
