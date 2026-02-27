"use client";

import React, { useState } from "react";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Product {
  id: number | string;
  code?: string;
  name: string;
}

interface ProductSearchProps {
  items: Product[];
  placeholder: string;
  onSelect: (id: number | string) => void;
}

export const ProductSearch = React.forwardRef<
  HTMLInputElement,
  ProductSearchProps
>(({ items, placeholder, onSelect }, ref) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const lastSelectTime = React.useRef(0);

  const handleSelect = (id: number | string) => {
    lastSelectTime.current = Date.now();
    setSearch("");
    setOpen(false);
    onSelect(id);
  };

  // Auto-select if there's an exact barcode match
  React.useEffect(() => {
    if (!search) return;
    const exactMatch = items.find(
      (item) => item.code && item.code.toLowerCase() === search.toLowerCase()
    );
    if (exactMatch && (Date.now() - lastSelectTime.current > 500)) {
      handleSelect(exactMatch.id);
    }
  }, [search, items]);

  return (
    <Command shouldFilter={false}>
      <CommandInput
        ref={ref}
        value={search}
        onValueChange={setSearch}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            // If we just selected something, ignore these navigation keys
            if (Date.now() - lastSelectTime.current < 500) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }
        }}
        placeholder={placeholder}
      />
      <CommandList>
        {open && search.length > 1 &&
          items
            .filter(
              (item) =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.code?.toLowerCase().includes(search.toLowerCase())
            )
            .map((item) => {
              if (item.id === undefined || item.id === null) return null;
              return (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item.id)}
                >
                  {item.name}
                </CommandItem>
              );
            })}
      </CommandList>
    </Command>
  );
});

ProductSearch.displayName = "ProductSearch";
