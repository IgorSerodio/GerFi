import React from "react";
import { Location } from "@/features/management/types";;

interface LocationSelectorProps {
  locations: Location[];
  value: number;
  onChange: (id: number) => void;
  className?: string;
  heightClass?: string;
  textSizeClass?: string;
}

export default function LocationSelector({ 
  locations, 
  value, 
  onChange, 
  className = "rounded-xl",
  heightClass = "h-10",
  textSizeClass = "text-[10px]"
}: LocationSelectorProps) {
  const roundedClass = className.split(' ').find(c => c.startsWith('rounded')) || 'rounded-xl';
  
  const radiusMap: Record<string, string> = {
    'rounded-sm': 'rounded-r-sm',
    'rounded-md': 'rounded-r-md',
    'rounded-lg': 'rounded-r-lg',
    'rounded-xl': 'rounded-r-xl',
    'rounded-2xl': 'rounded-r-2xl',
    'rounded-3xl': 'rounded-r-3xl',
    'rounded-full': 'rounded-r-full',
    'rounded': 'rounded-r',
  };
  const roundedRightClass = radiusMap[roundedClass] || 'rounded-r-xl';

  return (
    <div className={`flex items-center transition-all focus-within:ring-2 focus-within:ring-sefaz-accent/50 cursor-pointer overflow-hidden ${heightClass} ${className}`}>
      <div className="bg-sefaz-dark h-full flex items-center pl-4 pr-3 shrink-0">
        <label htmlFor="location-select" className={`${textSizeClass} font-black text-emerald-50 uppercase tracking-widest cursor-pointer`}>
          Local:
        </label>
      </div>
      <select
        id="location-select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent outline-none px-4 py-0 m-0 box-border h-full ${textSizeClass} font-black uppercase tracking-widest cursor-pointer flex-1 transition-colors border border-emerald-200 ${roundedRightClass}`}
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name} {loc.id === 0 ? "(Principal)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
