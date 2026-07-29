import React from "react";
import { DbCategory } from "@/features/management/types";

interface SubcategoryFilterProps {
  categories: DbCategory[];
  selectedService: string;
  selectedSubcategories: string[];
  onChange: (subcategories: string[]) => void;
}

export function SubcategoryFilter({ categories, selectedService, selectedSubcategories, onChange }: SubcategoryFilterProps) {
  if (selectedService === "all") return null;

  const category = categories.find((c) => c.id.toString() === selectedService);
  if (!category || !category.resolutions || category.resolutions.length === 0) return null;

  const toggleSubcategory = (res: string) => {
    if (selectedSubcategories.includes(res)) {
      onChange(selectedSubcategories.filter((r) => r !== res));
    } else {
      onChange([...selectedSubcategories, res]);
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-emerald-50">
      <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2 font-display">
        Subcategorias
      </label>
      <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-3 max-h-[160px] overflow-y-auto custom-scrollbar space-y-2">
        {category.resolutions.map((res) => {
          const isSelected = selectedSubcategories.includes(res);
          return (
            <label
              key={res}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-sefaz-accent border-sefaz-accent shadow-sm text-white"
                  : "bg-white border-emerald-100 hover:border-emerald-200 text-sefaz-dark"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                  isSelected ? "border-white bg-white/20" : "border-emerald-200 bg-emerald-50"
                }`}
              >
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-bold leading-tight flex-1">{res}</span>
              <input
                type="checkbox"
                className="hidden"
                checked={isSelected}
                onChange={() => toggleSubcategory(res)}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
