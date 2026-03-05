"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { SortOption } from "./CatalogueFilters";
import { SORT_OPTIONS } from "./CatalogueFilters";

type SortDropdownProps = {
  value: SortOption;
  onChange: (sort: SortOption) => void;
};

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel = SORT_OPTIONS.find((o) => o.id === value)?.label ?? "Featured";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-aurora-border bg-aurora-surface text-sm font-medium text-aurora-text hover:border-aurora-primary/40 transition-colors"
      >
        {currentLabel}
        <ChevronDown className={`w-4 h-4 text-aurora-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 py-1 rounded-xl bg-aurora-surface border border-aurora-border shadow-xl min-w-[180px] z-50">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                value === opt.id
                  ? "text-aurora-primary bg-aurora-accent/10"
                  : "text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
