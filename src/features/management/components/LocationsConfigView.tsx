import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Pen, Trash2, MapPin, Ban, CheckCircle } from "lucide-react";
import { Location, DbTicketWindow } from "@/features/queue/types";
import {
  getLocationsAction,
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
  getTicketWindowsAction,
  createNextTicketWindowAction,
  deleteTicketWindowAction,
} from "@/features/queue/actions";

interface LocationsConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function LocationsConfigView({ triggerSuccess }: LocationsConfigViewProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [newLocationName, setNewLocationName] = useState("");

  const loadLocations = React.useCallback(async () => {
    const res = await getLocationsAction();
    if (res.success && res.data) {
      const locs = res.data as Location[];
      setLocations(locs);
      if (selectedLocationId === null && locs.length > 0) {
        setSelectedLocationId(0);
      }
    }
  }, [selectedLocationId]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const loadWindows = React.useCallback(async () => {
    if (selectedLocationId !== null) {
      const res = await getTicketWindowsAction(selectedLocationId);
      if (res.success && res.data) {
        setTicketWindows(res.data as DbTicketWindow[]);
      }
    }
  }, [selectedLocationId]);

  useEffect(() => {
    loadWindows();
  }, [loadWindows]);

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingLocation && editingLocationId !== null) {
      // Preserve the current isActive state when editing the name
      const currLoc = locations.find(l => l.id === editingLocationId);
      const res = await updateLocationAction(editingLocationId, newLocationName, currLoc?.isActive ?? true);
      if (res.success) {
        triggerSuccess("Local atualizado!");
        setShowLocationModal(false);
        loadLocations();
      } else {
        alert(res.error || "Erro ao atualizar");
      }
    } else {
      const res = await createLocationAction(newLocationName);
      if (res.success) {
        triggerSuccess("Local criado!");
        setShowLocationModal(false);
        loadLocations();
      } else {
        alert(res.error || "Erro ao criar");
      }
    }
  };

  const handleToggleActive = async (loc: Location) => {
    const res = await updateLocationAction(loc.id, loc.name, !loc.isActive);
    if (res.success) {
      triggerSuccess(loc.isActive ? "Local bloqueado!" : "Local ativado!");
      loadLocations();
    } else {
      alert(res.error || "Erro ao alterar status");
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este local?")) {
      const res = await deleteLocationAction(id);
      if (res.success) {
        triggerSuccess("Local excluído!");
        if (selectedLocationId === id) setSelectedLocationId(0);
        loadLocations();
      } else {
        alert(res.error || "Erro ao excluir local");
      }
    }
  };

  const handleCreateTicketWindow = async () => {
    if (selectedLocationId === null) return;
    const res = await createNextTicketWindowAction(selectedLocationId);
    if (res.success) {
      triggerSuccess("Guichê criado com sucesso!");
      loadWindows();
    } else {
      alert(res.error || "Erro ao criar guichê");
    }
  };

  const handleDeleteTicketWindow = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este guichê?")) {
      const res = await deleteTicketWindowAction(id);
      if (res.success) {
        triggerSuccess("Guichê excluído!");
        loadWindows();
      } else {
        alert(res.error || "Erro ao excluir guichê");
      }
    }
  };

  return (
    <motion.div
      key="config_locations"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LOCAIS */}
        <div className="bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
              Locais
            </h3>
            <button
              onClick={() => {
                setNewLocationName("");
                setIsEditingLocation(false);
                setShowLocationModal(true);
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all cursor-pointer"
            >
              + Novo Local
            </button>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-1 border border-emerald-50 rounded-2xl p-2 bg-emerald-50/20">
            <div className="space-y-2">
              {locations.map((loc) => {
                const isSelected = selectedLocationId === loc.id;
                const isPrincipal = loc.id === 0;

                return (
                  <div 
                    key={loc.id} 
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? "bg-amber-50 border-amber-200" : "bg-white border-emerald-100 hover:bg-emerald-50"
                    } ${!loc.isActive ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-sefaz-dark">
                          {loc.name} {isPrincipal && <span className="text-amber-500 ml-1">(Principal)</span>}
                        </p>
                        <p className="text-[10px] font-bold text-sefaz-accent uppercase">
                          {loc.isActive ? "Ativo" : "Bloqueado"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {!isPrincipal && (
                        <button onClick={() => handleToggleActive(loc)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg" title={loc.isActive ? "Bloquear Local" : "Ativar Local"}>
                          {loc.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setNewLocationName(loc.name);
                          setEditingLocationId(loc.id);
                          setIsEditingLocation(true);
                          setShowLocationModal(true);
                        }} 
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        title="Editar"
                      >
                        <Pen size={16} />
                      </button>
                      {!isPrincipal && (
                        <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* GUICHÊS */}
        <div className="bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
              Guichês
            </h3>
            {selectedLocationId !== null && (
              <button
                onClick={handleCreateTicketWindow}
                className="px-4 py-2 bg-sefaz-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all cursor-pointer"
              >
                + Guichê
              </button>
            )}
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 border border-emerald-50 rounded-2xl p-2 bg-emerald-50/20">
            {selectedLocationId === null ? (
              <div className="h-full flex items-center justify-center text-sm font-bold text-emerald-600/50">
                Selecione um local ao lado.
              </div>
            ) : ticketWindows.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm font-bold text-emerald-600/50">
                Nenhum guichê neste local.
              </div>
            ) : (
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
            )}
          </div>
        </div>

      </div>

      {/* MODAL DE LOCAL */}
      <Modal 
        isOpen={showLocationModal} 
        onClose={() => setShowLocationModal(false)}
        className="max-w-md w-full p-8"
      >
        <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
          {isEditingLocation ? "Editar Local" : "Novo Local"}
        </h3>
        <form onSubmit={handleLocationSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Apelido do Local
            </label>
            <input
              type="text"
              required
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-sm font-bold"
              placeholder="Ex: Anexo 1"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowLocationModal(false)}
              className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl text-xs"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
