import React from "react";
import { Monitor, Hash, MapPin } from "lucide-react";

interface AttendantState {
  name: string;
  guiche: string;
}

interface AttendantSidebarProps {
  currentAttendant: AttendantState;
  showServiceConfig: boolean;
  setShowServiceConfig: (show: boolean) => void;
  setShowGuicheModal: (show: boolean) => void;
}

export default function AttendantSidebar({
  currentAttendant,
  showServiceConfig,
  setShowServiceConfig,
  setShowGuicheModal,
}: AttendantSidebarProps) {
  return (
    <div className="w-64 bg-sefaz-dark text-emerald-100 p-6 flex flex-col">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black tracking-tighter text-white">
          FAZENDA <span className="font-light">MUNICIPAL</span>
        </h1>
        <p className="text-[10px] opacity-50 uppercase tracking-widest text-center">
          Atendimento v1.0
        </p>
      </div>

      <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-800/30 text-center mb-6">
        <p className="text-[10px] text-emerald-100/50 uppercase tracking-widest mb-2 font-bold">
          Local de Trabalho
        </p>
        <div className="flex items-center justify-center gap-2 mb-3 text-white">
          <MapPin size={16} className="text-emerald-400" />
          <span className="font-black tracking-tight">{currentAttendant.guiche}</span>
        </div>
        <button
          onClick={() => setShowGuicheModal(true)}
          className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          Alterar Guichê
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        <button
          onClick={() => setShowServiceConfig(false)}
          className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all cursor-pointer ${
            !showServiceConfig
              ? "bg-white text-sefaz-dark shadow-lg"
              : "hover:bg-white/10 text-emerald-100"
          }`}
        >
          <Monitor size={20} />
          <span className="font-bold text-sm tracking-tight">Painel Principal</span>
        </button>
        <button
          onClick={() => setShowServiceConfig(true)}
          className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all cursor-pointer ${
            showServiceConfig
              ? "bg-white text-sefaz-dark shadow-lg"
              : "hover:bg-white/10 text-emerald-100"
          }`}
        >
          <Hash size={20} />
          <span className="font-bold text-sm tracking-tight">Meus Serviços</span>
        </button>
      </nav>
    </div>
  );
}
