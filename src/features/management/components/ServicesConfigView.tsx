import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DbCategory } from "@/features/queue/types";
import {
  getCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/features/queue/actions";
import { ServicesListTable } from "./ServicesListTable";
import { ServiceFormModal } from "./modals/ServiceFormModal";

interface ServicesConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function ServicesConfigView({ triggerSuccess }: ServicesConfigViewProps) {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

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
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="grid grid-cols-1 gap-8">
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
          
          <ServicesListTable
            categories={categories}
            handleEditCategory={handleEditCategory}
            handleDeleteCategory={handleDeleteCategory}
          />
        </div>
      </div>

      <ServiceFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        isEditing={isEditingCategory}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        handleCategorySubmit={handleCategorySubmit}
        newResolution={newResolution}
        setNewResolution={setNewResolution}
      />
    </motion.div>
  );
}
