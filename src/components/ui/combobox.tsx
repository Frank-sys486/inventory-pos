"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  items: { id: number | string; name: string }[];
  placeholder: string;
  onSelect: (id: number | string) => void;
  noSelect?: boolean;
  className?: string;
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  ({ items, placeholder, onSelect, noSelect, className }, ref) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [popoverWidth, setPopoverWidth] = useState(0);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            ref={(element) => {
              // Handle internal ref logic for width
              if (element) {
                setPopoverWidth(element.offsetWidth);
              }
              // Handle forwarded ref
              if (typeof ref === "function") {
                ref(element);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLButtonElement | null>).current = element;
              }
            }}
          >
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: popoverWidth }}>
          <Command>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {items.map((item) => {
                  if (item.id === undefined || item.id === null) return null;
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => {
                        onSelect(item.id);
                        setOpen(false);
                        if (noSelect) return;
                        setValue(item.name);
                      }}
                    >
                      {item.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
Combobox.displayName = "Combobox";
