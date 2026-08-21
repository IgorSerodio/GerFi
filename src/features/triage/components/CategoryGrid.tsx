import React from "react";
import { motion } from "motion/react";
import { Category } from "./types";

interface CategoryGridProps {
  categories: Category[];
  selectService: (cat: Category) => void;
  printing: boolean;
}

export default function CategoryGrid({
  categories,
  selectService,
  printing,
}: CategoryGridProps) {
  return (
    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 overflow-y-auto pr-2 pb-6 custom-scrollbar p-1">
      {categories.map((cat) => {
        const isHex = cat.color.startsWith('#');

        return (
          <motion.button
            key={cat.id}
            onClick={() => selectService(cat)}
            disabled={printing}
            whileHover={{
              scale: 1.1,
              zIndex: 40,
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative group bg-white rounded-[20px] p-3 shadow-sm border-2 border-sefaz-dark hover:border-emerald-700 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center text-center overflow-hidden active:scale-95 disabled:grayscale aspect-square cursor-pointer"
          >
            <div
              className={`w-12 h-12 ${isHex ? '' : cat.color} text-white rounded-2xl flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}
              style={isHex ? { backgroundColor: cat.color } : undefined}
            >
              <cat.icon size={24} />
            </div>

            <div className="flex flex-col items-center justify-center w-full px-1 h-8 shrink-0">
              <h3 className={`${cat.name.length <= 12 ? 'text-xs' : cat.name.length <= 20 ? 'text-[10px]' : 'text-[9px]'} font-black text-sefaz-dark leading-tight uppercase break-words line-clamp-2 group-hover:text-emerald-700 transition-colors`}>
                {cat.name}
              </h3>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
