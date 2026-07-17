import React from "react";
import { Modal } from "@/components/ui/Modal";
import { FileText, Briefcase, Heart, Shield, Star, Zap, Car, Smartphone, Home, Gavel, Landmark, Building, GraduationCap, Banknote, Search, X, Plus } from "lucide-react";
import { DbCategory } from "@/features/management/types";;

const AVAILABLE_ICONS = [
  { name: "FileText", icon: FileText },
  { name: "Users", icon: Briefcase }, // using Briefcase as fallback or UsersIcon
  { name: "Briefcase", icon: Briefcase },
  { name: "Heart", icon: Heart },
  { name: "Shield", icon: Shield },
  { name: "Star", icon: Star },
  { name: "Zap", icon: Zap },
  { name: "Car", icon: Car },
  { name: "Smartphone", icon: Smartphone },
  { name: "Home", icon: Home },
  { name: "Gavel", icon: Gavel },
  { name: "Landmark", icon: Landmark },
  { name: "Building", icon: Building },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Banknote", icon: Banknote },
  { name: "Search", icon: Search },
];

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  newCategory: Omit<DbCategory, "id">;
  setNewCategory: (cat: Omit<DbCategory, "id">) => void;
  handleCategorySubmit: (e: React.FormEvent) => void;
  newResolution: string;
  setNewResolution: (res: string) => void;
}

export function ServiceFormModal({
  isOpen,
  onClose,
  isEditing,
  newCategory,
  setNewCategory,
  handleCategorySubmit,
  newResolution,
  setNewResolution,
}: ServiceFormModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
        {isEditing ? "Editar Serviço" : "Cadastrar Serviço"}
      </h3>

      <form onSubmit={handleCategorySubmit} className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1 space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Sigla
            </label>
            <input
              type="text"
              maxLength={3}
              required
              value={newCategory.ticketChar}
              onChange={(e) => setNewCategory({ ...newCategory, ticketChar: e.target.value.toUpperCase() })}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold text-center uppercase"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Nome
            </label>
            <input
              type="text"
              required
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
            Descrição (Opcional)
          </label>
          <input
            type="text"
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Ícone Visual
            </label>
            <div className="grid grid-cols-4 gap-2 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 max-h-32 overflow-y-auto custom-scrollbar">
              {AVAILABLE_ICONS.map((IconObj) => (
                <button
                  key={IconObj.name}
                  type="button"
                  onClick={() => setNewCategory({ ...newCategory, icon: IconObj.name })}
                  className={`flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                    newCategory.icon === IconObj.name
                      ? "bg-sefaz-accent text-white border-sefaz-accent shadow-md scale-105"
                      : "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                  }`}
                  title={IconObj.name}
                >
                  <IconObj.icon size={20} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Cor (HEX)
            </label>
            <input
              type="color"
              required
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              className="w-full h-10 p-1 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Tempo Normal (min)
            </label>
            <input
              type="number"
              required
              min={1}
              value={newCategory.expectedTimeNormal}
              onChange={(e) => setNewCategory({ ...newCategory, expectedTimeNormal: parseInt(e.target.value) || 30 })}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Tempo Prioritário (min)
            </label>
            <input
              type="number"
              required
              min={1}
              value={newCategory.expectedTimePriority}
              onChange={(e) => setNewCategory({ ...newCategory, expectedTimePriority: parseInt(e.target.value) || 30 })}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
            Subcategorias do Serviço
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newResolution}
              onChange={(e) => setNewResolution(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newResolution.trim()) {
                    setNewCategory({ ...newCategory, resolutions: [...(newCategory.resolutions || []), newResolution.trim()] });
                    setNewResolution("");
                  }
                }
              }}
              className="flex-1 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
              placeholder="Adicionar nova subcategoria..."
            />
            <button
              type="button"
              onClick={() => {
                if (newResolution.trim()) {
                  setNewCategory({ ...newCategory, resolutions: [...(newCategory.resolutions || []), newResolution.trim()] });
                  setNewResolution("");
                }
              }}
              className="p-3 bg-sefaz-accent text-white rounded-xl hover:bg-sefaz-dark transition-all cursor-pointer flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {newCategory.resolutions?.map((res: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-emerald-50 text-sefaz-dark px-3 py-1.5 rounded-lg border border-emerald-100 text-xs font-bold">
                <span>{res}</span>
                <button
                  type="button"
                  onClick={() => {
                    const newRes = [...(newCategory.resolutions || [])];
                    newRes.splice(idx, 1);
                    setNewCategory({ ...newCategory, resolutions: newRes });
                  }}
                  className="text-red-500 hover:text-red-700 cursor-pointer p-0.5 rounded-md hover:bg-red-50 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-500 pl-2">
            A opção &quot;Outro(s)&quot; será adicionada automaticamente.
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-4 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest hover:bg-sefaz-dark transition-all shadow-xl text-xs cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
