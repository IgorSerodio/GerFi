"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Printer, FileText, Clock, CalendarDays, Timer, TrendingUp, Activity, Trophy, X, Search } from "lucide-react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { getReportsDataAction, getReportFiltersDataAction } from "@/features/reports/actions";
import { getCategoriesAction } from "@/features/queue/actions";
import { DbCategory, Location } from "@/features/queue/types";
import { User } from "@/features/users/types";

interface ReportResultData {
  stats: {
    total: number;
    avgWait: string;
    avgService: string;
    efficiency: string;
  };
  categoryAggregation: Array<{ name: string; count: number; value: number }>;
  attendantRanking: Array<{ name: string; count: number; avgDuration: number; rating: number }>;
  detailRows: Array<{
    time: string;
    started: string;
    completed: string;
    ref: string;
    desk: string;
    user: string;
    status: string;
  }>;
  reportType: "analytical" | "synthetic";
  selectedModels: string[];
  evolutionSeries: Array<{ time: string; total: number; avg: number; wait: number }>;
  peakHours: Array<{ time: string; total: number; avg: number; wait: number }>;
  busyDays: Array<{ name: string; value: number }>;
  categoryAvgDuration: Array<{ name: string; value: number }>;
}

const ADVANCED_REPORTS = [
  { id: "peak_hours", label: "Horário de Pico", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "busy_days", label: "Dias mais Movimentados", icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "wait_time", label: "Tempo Médio de Espera", icon: Timer, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "evolution", label: "Evolução do Fluxo", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "most_requested_services", label: "Serviços mais procurados", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "avg_service_duration", label: "Duração média de atendimento", icon: Timer, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "performance_ranking", label: "Ranking de Desempenho", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
];

export default function ReportsView() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reportType, setReportType] = useState<"analytical" | "synthetic">("analytical");
  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    service: "all",
    locationId: "all" as number | "all",
    attendants: [] as string[],
  });
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResultData | null>(null);

  const [attendantSearch, setAttendantSearch] = useState("");
  const [isAttendantDropdownOpen, setIsAttendantDropdownOpen] = useState(false);
  const attendantDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadFiltersData = async () => {
      const [catRes, filtersRes] = await Promise.all([
        getCategoriesAction(),
        getReportFiltersDataAction()
      ]);
      
      if (catRes.success && catRes.data) {
        setCategories(catRes.data as DbCategory[]);
      }
      if (filtersRes.success && filtersRes.data) {
        setLocations(filtersRes.data.locations);
        setUsers(filtersRes.data.users);
      }
    };
    loadFiltersData();

    const handleClickOutside = (event: MouseEvent) => {
      if (attendantDropdownRef.current && !attendantDropdownRef.current.contains(event.target as Node)) {
        setIsAttendantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const res = await getReportsDataAction({
      reportType,
      startDate: reportFilters.startDate,
      endDate: reportFilters.endDate,
      service: reportFilters.service,
      locationId: reportFilters.locationId,
      attendants: reportFilters.attendants,
      selectedModels,
    });
    if (res.success && res.data) {
      setReportResult(res.data);
    } else {
      alert("Erro ao gerar relatório: " + (res.error || ""));
    }
    setIsGeneratingReport(false);
  };

  const renderReportChart = (modelId: string) => {
    if (!reportResult) return null;

    switch (modelId) {
      case "evolution":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reportResult.evolutionSeries}>
              <defs>
                <linearGradient id={`colorTotal-${modelId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
              <Tooltip formatter={(value) => [value, "Quantidade"]} />
              <Area type="monotone" dataKey="total" name="Quantidade" stroke="#10b981" strokeWidth={3} fill={`url(#colorTotal-${modelId})`} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "peak_hours":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reportResult.peakHours}>
              <defs>
                <linearGradient id={`colorTotal-${modelId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
              <Tooltip formatter={(value) => [value, "Quantidade"]} />
              <Area type="monotone" dataKey="total" name="Quantidade" stroke="#10b981" strokeWidth={3} fill={`url(#colorTotal-${modelId})`} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "busy_days":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={reportResult.busyDays}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
              <Tooltip formatter={(value) => [value, "Quantidade"]} />
              <Bar dataKey="value" name="Quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        );
      case "wait_time":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportResult.evolutionSeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
              <Tooltip formatter={(value) => [`${value} min`, "Tempo Médio de Espera"]} />
              <Line type="monotone" dataKey="wait" name="Tempo Médio de Espera" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "most_requested_services":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={reportResult.categoryAggregation}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
              <Tooltip formatter={(value) => [value, "Quantidade"]} />
              <Bar dataKey="count" name="Quantidade" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        );
      case "avg_service_duration":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={reportResult.categoryAvgDuration}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
              <Tooltip formatter={(value) => [`${value} min`, "Tempo Médio"]} />
              <Bar dataKey="value" name="Tempo Médio" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        );
      case "performance_ranking":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={reportResult.attendantRanking}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
              <Tooltip formatter={(value) => [value, "Quantidade"]} />
              <Bar dataKey="count" name="Quantidade" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Filtros */}
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
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${reportType === "analytical"
                      ? "bg-sefaz-accent text-white shadow-md"
                      : "text-sefaz-accent opacity-60"
                    }`}
                >
                  Analítico
                </button>
                <button
                  onClick={() => setReportType("synthetic")}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${reportType === "synthetic"
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
                    setReportFilters({ ...reportFilters, startDate: e.target.value })
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
                    setReportFilters({ ...reportFilters, endDate: e.target.value })
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
                  setReportFilters({ ...reportFilters, service: e.target.value })
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
                  setReportFilters({ ...reportFilters, locationId: e.target.value === "all" ? "all" : Number(e.target.value) })
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
                      onClick={() => setReportFilters(prev => ({ ...prev, attendants: prev.attendants.filter(a => a !== attName) }))}
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-1 bg-white border border-emerald-100 rounded-2xl shadow-xl max-h-[200px] overflow-y-auto custom-scrollbar"
                  >
                    {users
                      .filter(u => 
                        !reportFilters.attendants.includes(u.name) && 
                        (u.name.toLowerCase().includes(attendantSearch.toLowerCase()) || 
                         u.matricula.toLowerCase().includes(attendantSearch.toLowerCase()))
                      )
                      .map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setReportFilters(prev => ({ ...prev, attendants: [...prev.attendants, user.name] }));
                            setAttendantSearch("");
                            setIsAttendantDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 border-b border-emerald-50 last:border-0 transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-bold text-sefaz-dark">{user.name}</div>
                          <div className="text-[10px] font-medium text-sefaz-accent opacity-60">Matrícula: {user.matricula}</div>
                        </button>
                      ))}
                    {users.filter(u => !reportFilters.attendants.includes(u.name) && (u.name.toLowerCase().includes(attendantSearch.toLowerCase()) || u.matricula.toLowerCase().includes(attendantSearch.toLowerCase()))).length === 0 && (
                      <div className="px-4 py-3 text-xs text-center text-sefaz-accent opacity-60">
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
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${isSelected
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
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="w-full py-5 bg-sefaz-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-sefaz-dark transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingReport ? "Gerando..." : "Gerar Relatório"}
            </button>
          </div>
        </div>
      </aside>

      {/* Resultado Relatório */}
      <main className="lg:col-span-8">
        {reportResult ? (
          <div className="bg-white rounded-[40px] shadow-sm border border-emerald-100 p-8 space-y-8">
            <div className="flex justify-between items-center print:hidden">
              <div>
                <h2 className="text-3xl font-black text-sefaz-dark uppercase tracking-tight">
                  Resultado da Consulta
                </h2>
                <p className="text-xs text-sefaz-accent font-bold uppercase tracking-widest opacity-60">
                  {reportResult.reportType === "analytical" ? "Analítico" : "Sintético"}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-sefaz-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all cursor-pointer flex items-center gap-2"
              >
                <Printer size={16} /> Imprimir
              </button>
            </div>

            {/* Stats Summary Panel */}
            <div className="grid grid-cols-4 gap-6 bg-emerald-50/30 p-8 rounded-[32px] border border-emerald-100/50 text-center">
              <div>
                <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
                  Total Senhas
                </p>
                <p className="text-3xl font-black text-sefaz-dark">
                  {reportResult.stats.total}
                </p>
              </div>
              <div className="border-x border-emerald-100/50">
                <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
                  Tempo Médio de Espera
                </p>
                <p className="text-3xl font-black text-sefaz-dark">
                  {reportResult.stats.avgWait}
                </p>
              </div>
              <div className="border-r border-emerald-100/50">
                <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
                  Tempo Médio de Atend.
                </p>
                <p className="text-3xl font-black text-sefaz-dark">
                  {reportResult.stats.avgService}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
                  Volume Concluído
                </p>
                <p className="text-3xl font-black text-emerald-600">
                  {reportResult.stats.efficiency}
                </p>
              </div>
            </div>

            {/* Visual Analytics Section */}
            {reportResult.selectedModels.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reportResult.selectedModels.map((modelId: string) => {
                  const model = ADVANCED_REPORTS.find((r) => r.id === modelId);
                  return (
                    <div key={modelId} className="space-y-4">
                      <h4 className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest">
                        {model?.label}
                      </h4>
                      <div className="h-[200px] w-full">{renderReportChart(modelId)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabela Analítica */}
            {reportResult.reportType === "analytical" && (
              <div className="rounded-[32px] border border-emerald-50 overflow-hidden mt-6">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-emerald-50/50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Senha</th>
                        <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Criado</th>
                        <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Iniciado</th>
                        <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Finalizado</th>
                        <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Guichê</th>
                        <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Servidor</th>
                        <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {reportResult.detailRows.map((row, i: number) => (
                        <tr key={i} className="hover:bg-emerald-50/30">
                          <td className="px-6 py-4 text-xs font-black text-sefaz-accent">
                            {row.ref}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                            {row.time}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                            {row.started}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                            {row.completed}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                            {row.desk}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                            {row.user}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${
                                row.status === "CONCLUÍDO" ? "bg-emerald-100 text-emerald-700"
                                : row.status === "NÃO COMPARECEU" ? "bg-red-100 text-red-700"
                                : row.status === "ENCAMINHADO" ? "bg-blue-100 text-blue-700"
                                : row.status === "EM ATENDIMENTO" ? "bg-amber-100 text-amber-700"
                                : row.status === "CHAMADO" ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/50 border-2 border-dashed border-emerald-100 rounded-[40px] h-full flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-emerald-100 mb-6 border border-emerald-50">
              <FileText size={48} />
            </div>
            <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight mb-2">
              Nenhum Relatório Gerado
            </h3>
            <p className="text-sefaz-accent font-bold opacity-40 max-w-xs mx-auto text-xs uppercase tracking-widest leading-relaxed">
              Utilize a barra lateral para selecionar os filtros e acione o botão para gerar
              as métricas.
            </p>
          </div>
        )}
      </main>
    </motion.div>
  );
}
