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
      {categories.map((cat) => (
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
          className="relative group bg-white rounded-[20px] p-3 shadow-sm border border-emerald-100/50 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center text-center overflow-hidden active:scale-95 disabled:grayscale aspect-square cursor-pointer"
        >
          <div
            className={`w-8 h-8 ${cat.color} text-white rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform duration-300`}
          >
            <cat.icon size={16} />
          </div>

          <div className="flex flex-col items-center justify-center w-full px-1">
            <h3 className="text-[9px] font-black text-sefaz-dark leading-[1.1] uppercase break-words line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {cat.name}
            </h3>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
