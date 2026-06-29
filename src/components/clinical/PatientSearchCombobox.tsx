import React, { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface PatientOption {
  id: string;
  name: string;
}

interface PatientSearchComboboxProps {
  patients: PatientOption[];
  value: string;
  onChange: (patientId: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function PatientSearchCombobox({
  patients,
  value,
  onChange,
  placeholder = "Search by patient name…",
  id,
  className,
}: PatientSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = patients.find((p) => p.id === value);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 8);
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [patients, query]);

  function handleSelect(patient: PatientOption) {
    onChange(patient.id);
    setQuery(patient.name);
    setOpen(false);
  }

  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(true);
    if (selected && !query) setQuery(selected.name);
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          value={query || selected?.name || ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) onChange("");
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-8"
          autoComplete="off"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
          role="listbox"
        >
          {suggestions.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={p.id === value}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                  p.id === value && "bg-secondary text-primary font-medium",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(p)}
              >
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{p.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-md">
          No patients match &quot;{query.trim()}&quot;
        </div>
      )}
    </div>
  );
}
