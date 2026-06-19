import React from "react";
import { Monitor, Hash, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

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
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-black tracking-tighter text-white">
          FAZENDA <span className="font-light">MUNICIPAL</span>
        </h1>
        <p className="text-[10px] opacity-50 uppercase tracking-widest text-center">
          Atendimento v1.0
        </p>
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

      <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-800/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-sefaz-medium flex items-center justify-center font-bold text-white shadow-inner uppercase">
            {currentAttendant.name.substring(0, 2)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold leading-none text-white truncate">
              {currentAttendant.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] opacity-60 uppercase">{currentAttendant.guiche}</p>
              <button
                onClick={() => setShowGuicheModal(true)}
                className="text-[8px] px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
              >
                ALTERAR
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full mt-2 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <LogOut size={12} /> Sair
        </button>
      </div>
    </div>
  );
}
