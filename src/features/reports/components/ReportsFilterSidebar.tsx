import React, { useState, useRef, useEffect } from "react";
import { DbCategory, Location } from "@/features/management/types";;
import { User } from "@/features/users/types";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Printer, Activity, Clock, CalendarDays, Timer, TrendingUp, Trophy } from "lucide-react";

export const ADVANCED_REPORTS = [
  { id: "peak_hours", label: "Horário de Pico", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "busy_days", label: "Dias mais Movimentados", icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "wait_time", label: "Tempo Médio de Espera", icon: Timer, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "evolution", label: "Evolução do Fluxo", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "most_requested_services", label: "Serviços mais procurados", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "avg_service_duration", label: "Duração média de atendimento", icon: Timer, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "performance_ranking", label: "Ranking de Desempenho", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
];

export interface ReportFiltersType {
  startDate: string;
  endDate: string;
  service: string;
  locationId: number | "all";
  attendants: string[];
}

interface ReportsFilterSidebarProps {
  reportType: "analytical" | "synthetic";
  setReportType: (type: "analytical" | "synthetic") => void;
  reportFilters: ReportFiltersType;
  setReportFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
  categories: DbCategory[];
  locations: Location[];
  users: User[];
  selectedModels: string[];
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>;
  isGeneratingReport: boolean;
  onGenerateReport: () => void;
}

export default function ReportsFilterSidebar({
  reportType,
  setReportType,
  reportFilters,
  setReportFilters,
  categories,
  locations,
  users,
  selectedModels,
  setSelectedModels,
  isGeneratingReport,
  onGenerateReport,
}: ReportsFilterSidebarProps) {
  const [attendantSearch, setAttendantSearch] = useState("");
  const [isAttendantDropdownOpen, setIsAttendantDropdownOpen] = useState(false);
  const attendantDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attendantDropdownRef.current && !attendantDropdownRef.current.contains(event.target as Node)) {
        setIsAttendantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="lg:col-span-4 space-y-6 print:hidden">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-emerald-100">
        <h3 className="font-black text-sefaz-dark uppercase tracking-tight mb-8">
          Filtros do Relatório
        </h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2 bg-emerald-50/50 p-1.5 rounded-2xl">
              <button
                onClick={() => setReportType("analytical")}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                  reportType === "analytical"
                    ? "bg-sefaz-accent text-white shadow-md"
                    : "text-sefaz-accent opacity-60"
                }`}
              >
                Analítico
              </button>
              <button
                onClick={() => setReportType("synthetic")}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                  reportType === "synthetic"
                    ? "bg-sefaz-accent text-white shadow-md"
                    : "text-sefaz-accent opacity-60"
                }`}
              >
                Sintético
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2 font-display">
                Início
              </label>
              <input
                type="date"
                value={reportFilters.startDate}
                onChange={(e) =>
                  setReportFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2 font-display">
                Fim
              </label>
              <input
                type="date"
                value={reportFilters.endDate}
                onChange={(e) =>
                  setReportFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2 font-display">
              Serviço
            </label>
            <select
              value={reportFilters.service}
              onChange={(e) =>
                setReportFilters((prev) => ({ ...prev, service: e.target.value }))
              }
              className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold text-xs"
            >
              <option value="all">Todos os Serviços</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2 font-display">
              Local
            </label>
            <select
              value={reportFilters.locationId}
              onChange={(e) =>
                setReportFilters((prev) => ({
                  ...prev,
                  locationId: e.target.value === "all" ? "all" : Number(e.target.value),
                }))
              }
              className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold text-xs"
            >
              <option value="all">Todos os Locais</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 relative" ref={attendantDropdownRef}>
            <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2 font-display">
              Servidores
            </label>
            
            <div className="w-full p-2 bg-emerald-50/50 rounded-2xl border border-emerald-100 min-h-[56px] flex flex-wrap gap-2 items-center">
              {reportFilters.attendants.map((attName) => (
                <div key={attName} className="flex items-center gap-1 bg-sefaz-accent text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tight">
                  {attName}
                  <button 
                    onClick={() => setReportFilters((prev) => ({ ...prev, attendants: prev.attendants.filter((a: string) => a !== attName) }))}
                    className="ml-1 hover:text-emerald-200 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              <div className="flex-1 min-w-[120px] flex items-center gap-2 px-2">
                <Search size={14} className="text-emerald-400" />
                <input
                  type="text"
                  value={attendantSearch}
                  onChange={(e) => {
                    setAttendantSearch(e.target.value);
                    setIsAttendantDropdownOpen(true);
                  }}
                  onFocus={() => setIsAttendantDropdownOpen(true)}
                  placeholder={reportFilters.attendants.length === 0 ? "Buscar servidor..." : "Adicionar mais..."}
                  className="w-full bg-transparent outline-none font-bold text-xs text-sefaz-dark placeholder:text-emerald-300"
                />
              </div>
            </div>

            <AnimatePresence>
              {isAttendantDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-10 w-full mt-2 bg-white border border-emerald-100 rounded-2xl shadow-xl max-h-[250px] overflow-y-auto custom-scrollbar"
                >
                  {users
                    .filter(u => 
                      !reportFilters.attendants.includes(u.name) && 
                      (u.name.toLowerCase().includes(attendantSearch.toLowerCase()) || 
                       u.matricula?.toLowerCase().includes(attendantSearch.toLowerCase()))
                    )
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setReportFilters((prev) => ({ ...prev, attendants: [...prev.attendants, user.name] }));
                          setAttendantSearch("");
                          setIsAttendantDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 border-b border-emerald-50 last:border-0 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-black text-sefaz-dark uppercase tracking-tight">{user.name}</div>
                        <div className="text-[10px] font-bold text-sefaz-accent opacity-60 mt-0.5">Matrícula: {user.matricula}</div>
                      </button>
                    ))}
                  {users.filter(u => !reportFilters.attendants.includes(u.name) && (u.name.toLowerCase().includes(attendantSearch.toLowerCase()) || u.matricula?.toLowerCase().includes(attendantSearch.toLowerCase()))).length === 0 && (
                    <div className="px-4 py-4 text-xs font-bold text-center text-sefaz-accent opacity-60">
                      Nenhum servidor encontrado
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3 pt-4 border-t border-emerald-50">
            <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Indicadores Avançados
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {ADVANCED_REPORTS.map((report) => {
                const isSelected = selectedModels.includes(report.id);
                return (
                  <button
                    key={report.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedModels(selectedModels.filter((id) => id !== report.id));
                      } else {
                        setSelectedModels([...selectedModels, report.id]);
                      }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-sefaz-accent border-sefaz-accent shadow-md text-white"
                        : "bg-white border-emerald-100 hover:border-emerald-200"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tight">
                      {report.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
            className="w-full py-4 bg-sefaz-accent text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-sefaz-dark transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
          >
            {isGeneratingReport ? (
              <Activity className="animate-spin" size={20} />
            ) : (
              <Printer size={20} />
            )}
            {isGeneratingReport ? "Gerando..." : "Gerar Relatório"}
          </button>
        </div>
      </div>
    </aside>
  );
}
