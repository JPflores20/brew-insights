import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleccionar...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-9 px-3 py-2 text-left font-normal",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center overflow-hidden">
            {selected.length > 0 ? (
              selected.map((item) => (
                <Badge
                  variant="secondary"
                  key={item}
                  className="flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnselect(item);
                  }}
                >
                  {item}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command className="w-full">
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => {
                    const isSelected = selected.includes(option);
                    if (isSelected) {
                        onChange(selected.filter((i) => i !== option));
                    } else {
                        onChange([...selected, option]);
                    }
                  }}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selected.includes(option)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <span>{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
