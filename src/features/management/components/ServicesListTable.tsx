import React from "react";
import { Pen, Trash2 } from "lucide-react";
import { DbCategory } from "@/features/management/types";;

interface ServicesListTableProps {
  categories: DbCategory[];
  handleEditCategory: (cat: DbCategory) => void;
  handleDeleteCategory: (id: number) => void;
}

export function ServicesListTable({
  categories,
  handleEditCategory,
  handleDeleteCategory,
}: ServicesListTableProps) {
  return (
    <div className="overflow-y-auto custom-scrollbar flex-1 border border-emerald-50 rounded-2xl p-2 bg-emerald-50/20">
      <table className="w-full text-left">
        <thead className="bg-emerald-50/50 sticky top-0 backdrop-blur-sm z-10">
          <tr>
            <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase">Sigla</th>
            <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase">Nome</th>
            <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-50">
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-emerald-50/50 transition-colors">
              <td className="px-4 py-3 text-xs font-black text-sefaz-accent">{cat.ticketChar || "-"}</td>
              <td className="px-4 py-3 text-xs font-bold text-sefaz-dark">{cat.name}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => handleEditCategory(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer mr-2">
                  <Pen size={16} />
                </button>
                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
