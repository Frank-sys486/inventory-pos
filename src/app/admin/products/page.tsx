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
  AlertCircle,
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

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || "Uncategorized"));
    return Array.from(cats).sort();
  }, [products]);

  // Similarity Search Logic
  const similarProducts = useMemo(() => {
    if (!productName || productName.length < 2) return [];
    
    const queryWords = productName.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    return products
      .filter(p => p.id !== selectedProductId) // Don't match self when editing
      .map(p => {
        const targetName = p.name.toLowerCase();
        // Count how many query words are present in the target name
        const matches = queryWords.filter(word => targetName.includes(word)).length;
        const score = matches / queryWords.length;
        return { product: p, score };
      })
      .filter(item => item.score > 0.3) // Adjust threshold as needed
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.product);
  }, [productName, products, selectedProductId]);

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
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (filters.category !== "all" && product.category !== filters.category) {
        return false;
      }

      if (filters.inStock !== "all") {
        const stock = product.in_stock || 0;
        if (filters.inStock === "in-stock" && stock <= 0) return false;
        if (filters.inStock === "out-of-stock" && stock > 0) return false;
        if (filters.inStock === "low-stock" && (stock < 1 || stock > 10)) return false;
      }

      return true;
    });
  }, [products, filters.category, filters.inStock, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (type: "category" | "inStock", value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
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
      <Card className="flex flex-col gap-6 p-6 h-[calc(100vh-100px)]">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Items</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search items or categories..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pr-8 min-w-[250px]"
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
                <DropdownMenuContent align="end" className="w-56 overflow-y-auto max-h-[400px]">
                  <DropdownMenuLabel>Stock Level</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={filters.inStock === "all"} onCheckedChange={() => handleFilterChange("inStock", "all")}>All Levels</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={filters.inStock === "in-stock"} onCheckedChange={() => handleFilterChange("inStock", "in-stock")}>In Stock</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={filters.inStock === "low-stock"} onCheckedChange={() => handleFilterChange("inStock", "low-stock")}>Low Stock (1-10)</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={filters.inStock === "out-of-stock"} onCheckedChange={() => handleFilterChange("inStock", "out-of-stock")}>Out of Stock</DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Categories</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={filters.category === "all"} onCheckedChange={() => handleFilterChange("category", "all")}>All Categories</DropdownMenuCheckboxItem>
                  {categories.map(cat => (
                    <DropdownMenuCheckboxItem key={cat} checked={filters.category === cat} onCheckedChange={() => handleFilterChange("category", cat)}>
                      {cat}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="sm" onClick={() => setIsAddProductDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b flex flex-wrap items-center justify-between gap-4 text-sm shrink-0">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-muted-foreground font-medium uppercase text-[10px] flex items-center gap-1">
                  Inv. Value (Cost)
                  <span className="cursor-help" title="Total capital tied up in stock (Unit Cost * Stock)">ⓘ</span>
                </span>
                <span className="text-blue-600 font-bold text-lg leading-none">
                  {formatCurrency(filteredProducts.reduce((sum, p) => sum + (Number(p.cost || 0) * Number(p.in_stock || 0)), 0))}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground font-medium uppercase text-[10px] flex items-center gap-1">
                  Inv. Value (Retail)
                  <span className="cursor-help" title="Total potential sales if all stock is sold (Unit Price * Stock)">ⓘ</span>
                </span>
                <span className="text-green-600 font-bold text-lg leading-none">
                  {formatCurrency(filteredProducts.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.in_stock || 0)), 0))}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground font-medium uppercase text-[10px] flex items-center gap-1">
                  Potential Profit
                  <span className="cursor-help" title="Projected profit from current stock ((Price - Cost) * Stock)">ⓘ</span>
                </span>
                <span className="text-orange-600 font-bold text-lg leading-none">
                  {formatCurrency(filteredProducts.reduce((sum, p) => sum + ((Number(p.price || 0) - Number(p.cost || 0)) * Number(p.in_stock || 0)), 0))}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground font-medium uppercase text-[10px]">Total Stock</span>
              <span className="text-foreground font-bold text-lg leading-none">
                {filteredProducts.reduce((sum, p) => sum + Number(p.in_stock || 0), 0)} <span className="text-[10px] font-normal text-muted-foreground">units</span>
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 relative border-b">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
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
                {filteredProducts.map((product) => (
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
        <CardFooter className="shrink-0 p-2">
          <p className="text-[10px] text-muted-foreground italic">Showing {filteredProducts.length} total items</p>
        </CardFooter>
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
        <DialogContent className="max-w-2xl">
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
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
              </div>
              <div className="grid gap-2 relative">
                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                <Input id="name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Type product name..." />
                
                {/* Similarity Search Suggestions */}
                {similarProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground bg-muted/50 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> SIMILAR ITEMS ALREADY ADDED:
                    </div>
                    {similarProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex flex-col border-t first:border-t-0"
                        onClick={() => {
                          setProductName(p.name);
                          setProductCategory(p.category);
                          setProductUnit(p.unit || "piece");
                          setProductDescription(p.description);
                        }}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground">{p.category} | {formatCurrency(p.price)} | {p.in_stock} in stock</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <div className="relative">
                  <Input list="category-options" id="category" value={productCategory} onChange={(e) => setProductCategory(e.target.value)} placeholder="Select or type category" />
                  <datalist id="category-options">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Cost Price (Capital) <span className="text-red-500">*</span></Label>
                <Input id="cost" type="number" value={productCost} onChange={(e) => setProductCost(Number(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Selling Price <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                  <Input id="price" type="number" value={productPrice} onChange={(e) => setProductPrice(Number(e.target.value))} className="flex-1" />
                  <span className="text-sm">/</span>
                  <Input list="unit-options" className="w-[100px]" value={productUnit} onChange={(e) => setProductUnit(e.target.value)} placeholder="Unit" />
                  <datalist id="unit-options">
                    <option value="piece" />
                    <option value="weight" />
                    <option value="long" />
                  </datalist>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="in_stock">Initial Stock</Label>
                <Input id="in_stock" type="number" value={productInStock} onChange={(e) => setProductInStock(Number(e.target.value))} />
              </div>
              <div className="p-4 bg-muted/20 rounded-lg border border-dashed text-xs text-muted-foreground mt-4">
                <strong>Tip:</strong> If you see a similar item in the list above while typing, click it to automatically fill the category and description.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddProductDialogOpen(false); setIsEditProductDialogOpen(false); resetSelectedProduct(); }}>Cancel</Button>
            <Button onClick={isAddProductDialogOpen ? handleAddProduct : handleEditProduct}>
              {isAddProductDialogOpen ? "Add Item" : "Save Changes"}
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
            <Button variant="outline" onClick={() => setIsDeleteConfirmationOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
