import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Pen, Trash2, FileText, Briefcase, Heart, Shield, Star, Zap, Car, Smartphone, Home, Gavel, Landmark, Building, GraduationCap, Banknote, Search, X, Plus } from "lucide-react";
import { DbCategory, DbTicketWindow } from "@/features/queue/types";
import {
  getCategoriesAction,
  getTicketWindowsAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createNextTicketWindowAction,
  deleteTicketWindowAction,
} from "@/features/queue/actions";

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

interface ServicesConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function ServicesConfigView({ triggerSuccess }: ServicesConfigViewProps) {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [newResolution, setNewResolution] = useState("");
  const [newCategory, setNewCategory] = useState<Omit<DbCategory, "id">>({
    ticketChar: "SRV",
    name: "",
    description: "",
    icon: "FileText",
    color: "#10b981",
    expectedTimeNormal: 30,
    expectedTimePriority: 30,
    resolutions: [],
  });

  const loadData = React.useCallback(async () => {
    const resCategories = await getCategoriesAction();
    if (resCategories.success && resCategories.data) {
      setCategories(resCategories.data as DbCategory[]);
    }
    const resWindows = await getTicketWindowsAction();
    if (resWindows.success && resWindows.data) {
      setTicketWindows(resWindows.data as DbTicketWindow[]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleCreateTicketWindow = async () => {
    const res = await createNextTicketWindowAction();
    if (res.success) {
      triggerSuccess("Guichê criado com sucesso!");
      loadData();
    } else {
      alert(res.error || "Erro ao criar guichê");
    }
  };

  const handleDeleteTicketWindow = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este guichê?")) {
      const res = await deleteTicketWindowAction(id);
      if (res.success) {
        triggerSuccess("Guichê excluído!");
        loadData();
      } else {
        alert(res.error || "Erro ao excluir guichê");
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingCategory && editingCategoryId !== null) {
      const res = await updateCategoryAction(editingCategoryId, newCategory);
      if (res.success) {
        triggerSuccess("Serviço atualizado com sucesso!");
        setShowCategoryModal(false);
        loadData();
      } else {
        alert(res.error || "Erro ao atualizar");
      }
    } else {
      const res = await createCategoryAction(newCategory);
      if (res.success) {
        triggerSuccess("Serviço cadastrado com sucesso!");
        setShowCategoryModal(false);
        loadData();
      } else {
        alert(res.error || "Erro ao cadastrar");
      }
    }
  };

  const handleEditCategory = (cat: DbCategory) => {
    setNewCategory({
      ticketChar: cat.ticketChar || "SRV",
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "FileText",
      color: cat.color || "#10b981",
      expectedTimeNormal: cat.expectedTimeNormal || 30,
      expectedTimePriority: cat.expectedTimePriority || 30,
      resolutions: cat.resolutions || [],
    });
    setNewResolution("");
    setEditingCategoryId(cat.id);
    setIsEditingCategory(true);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este serviço?")) {
      const res = await deleteCategoryAction(id);
      if (res.success) {
        triggerSuccess("Serviço excluído!");
        loadData();
      } else {
        alert(res.error || "Erro ao excluir serviço");
      }
    }
  };

  return (
    <motion.div
      key="config_services"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Serviços */}
        <div className="bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
              Serviços
            </h3>
            <button
              onClick={() => {
                setNewCategory({ ticketChar: "SRV", name: "", description: "", icon: "FileText", color: "#10b981", expectedTimeNormal: 30, expectedTimePriority: 30, resolutions: [] });
                setNewResolution("");
                setIsEditingCategory(false);
                setShowCategoryModal(true);
              }}
              className="px-4 py-2 bg-sefaz-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all cursor-pointer"
            >
              + Novo Serviço
            </button>
          </div>
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
        </div>

        {/* Guichês */}
        <div className="bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
              Guichês
            </h3>
            <button
              onClick={handleCreateTicketWindow}
              className="px-4 py-2 bg-sefaz-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all cursor-pointer"
            >
              + Novo Guichê
            </button>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-1 border border-emerald-50 rounded-2xl p-2 bg-emerald-50/20">
            <table className="w-full text-left">
              <thead className="bg-emerald-50/50 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase">ID</th>
                  <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase">Nome</th>
                  <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {ticketWindows.map((tw) => (
                  <tr key={tw.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-sefaz-accent">#{tw.id}</td>
                    <td className="px-4 py-3 text-xs font-black text-sefaz-dark">{tw.name}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteTicketWindow(tw.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Edit Modal */}
      <Modal 
        isOpen={showCategoryModal} 
        onClose={() => setShowCategoryModal(false)}
        className="max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
                {isEditingCategory ? "Editar Serviço" : "Cadastrar Serviço"}
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
                          className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
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
                    {newCategory.resolutions?.map((res, idx) => (
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
                    onClick={() => setShowCategoryModal(false)}
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
    </motion.div>
  );
}
