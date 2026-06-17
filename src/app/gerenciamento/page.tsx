"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Filter,
  Users as UsersIcon,
  Download,
  Printer,
  BarChart3,
  PieChart as PieIcon,
  Info,
  Search,
  Clock,
  CalendarDays,
  Timer,
  TrendingUp,
  Activity,
  UserCheck,
  Trash2,
  ShieldCheck,
  UserCog,
  Trophy,
  Heart,
  Star,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Settings,
  Tv,
  Save,
  Pen,
  Ban,
  X,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import LogisticsDashboard from "@/components/LogisticsDashboard";
import {
  getUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  toggleBlockUserAction,
  getTvSettingsAction,
  updateTvSettingsAction,
} from "@/features/queue/actions";
import { getReportsDataAction } from "@/features/reports/actions";

type ViewType = "menu" | "dashboard" | "reports" | "config_hub" | "config_users" | "config_tv" | "config_printer";

const ADVANCED_REPORTS = [
  { id: "peak_hours", label: "Horário de Pico", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "busy_days", label: "Dias mais Movimentados", icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "wait_time", label: "Tempo de Espera", icon: Timer, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "evolution", label: "Evolução do Fluxo", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "avg_duration", label: "Duração Média", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "performance_ranking", label: "Ranking de Desempenho", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
];

export default function ManagementPage() {
  const { data: session } = useSession();
  const [view, setView] = useState<ViewType>("menu");
  
  // States for Config - Users
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    role: "Atendente",
    guiche: "Guichê 01",
    matricula: "",
    cpf: "",
    email: "",
    username: "",
    password: "",
    services: [] as string[],
  });

  // States for Config - TV Settings
  const [tvSettings, setTvSettings] = useState({
    mode: "live" as "live" | "files",
    liveUrl: "",
    uploadedFiles: [] as string[],
  });

  // States for Reports
  const [reportType, setReportType] = useState<"analytical" | "synthetic">("analytical");
  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    service: "all",
    attendant: "all",
  });
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);

  // Success modals
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const categories = [
    { id: "IPTU", name: "IPTU" },
    { id: "ITBI", name: "ITBI" },
    { id: "SJOA", name: "SÃO JOÃO" },
    { id: "TRAN", name: "TRANSPORTE" },
    { id: "MFIS", name: "MALHA FISCAL" },
    { id: "SSAN", name: "SEMANA SANTA" },
    { id: "FEIR", name: "FEIRA" },
    { id: "PLUS", name: "+80" },
    { id: "AMBU", name: "AMBULANTE" },
    { id: "RECA", name: "RECADASTRAMENTO" },
    { id: "2VIA", name: "2ª VIA" },
    { id: "TAXI", name: "TAXI" },
    { id: "NFIS", name: "NOTA FISCAL" },
    { id: "PAGM", name: "PAGAMENTO" },
    { id: "ATEN", name: "ATENDIMENTO" },
    { id: "DIVE", name: "DIVERSOS" },
  ];

  // Fetch initial configs
  const loadConfigData = async () => {
    if (view === "config_users") {
      const res = await getUsersAction();
      if (res.success && res.data) setUsers(res.data);
    } else if (view === "config_tv") {
      const res = await getTvSettingsAction();
      if (res.success && res.data) {
        setTvSettings(res.data as any);
      }
    }
  };

  useEffect(() => {
    loadConfigData();
  }, [view]);

  // User Actions
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingUser && editingUserId !== null) {
      const res = await updateUserAction(editingUserId, newUser);
      if (res.success) {
        triggerSuccess("Servidor atualizado com sucesso!");
        setShowUserModal(false);
        loadConfigData();
      } else {
        alert(res.error || "Erro ao atualizar");
      }
    } else {
      const res = await createUserAction(newUser);
      if (res.success) {
        triggerSuccess("Servidor cadastrado com sucesso!");
        setShowUserModal(false);
        loadConfigData();
      } else {
        alert(res.error || "Erro ao cadastrar");
      }
    }
  };

  const handleEditUser = (user: any) => {
    setNewUser({
      name: user.name,
      role: user.role,
      guiche: user.guiche,
      matricula: user.matricula,
      cpf: user.cpf,
      email: user.email,
      username: user.username,
      password: "",
      services: user.services || [],
    });
    setEditingUserId(user.id);
    setIsEditingUser(true);
    setShowUserModal(true);
  };

  const handleDeleteUserClick = (user: any) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      const res = await deleteUserAction(userToDelete.id);
      if (res.success) {
        triggerSuccess("Servidor excluído!");
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        loadConfigData();
      } else {
        alert("Erro ao excluir");
      }
    }
  };

  const handleToggleBlock = async (id: number) => {
    const res = await toggleBlockUserAction(id);
    if (res.success) {
      triggerSuccess("Status de bloqueio alterado!");
      loadConfigData();
    }
  };

  // TV Settings Save
  const handleSaveTvSettings = async () => {
    const res = await updateTvSettingsAction(tvSettings);
    if (res.success) {
      triggerSuccess("Configurações da TV salvas!");
    } else {
      alert("Erro ao salvar configurações da TV");
    }
  };

  // Generate Report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const res = await getReportsDataAction({
      reportType,
      startDate: reportFilters.startDate,
      endDate: reportFilters.endDate,
      service: reportFilters.service,
      attendant: reportFilters.attendant,
      selectedModels,
    });
    if (res.success && res.data) {
      setReportResult(res.data);
    } else {
      alert("Erro ao gerar relatório");
    }
    setIsGeneratingReport(false);
  };

  // Helper rendering charts inside reports
  const renderReportChart = (modelId: string) => {
    if (!reportResult) return null;

    const evolutionData = [
      { time: "08:00", total: 12, avg: 8, wait: 5 },
      { time: "10:00", total: 45, avg: 15, wait: 22 },
      { time: "12:00", total: 30, avg: 22, wait: 14 },
      { time: "14:00", total: 65, avg: 18, wait: 35 },
      { time: "16:00", total: 40, avg: 12, wait: 10 },
    ];

    const weeklyData = [
      { name: "Seg", value: 240 },
      { name: "Ter", value: 310 },
      { name: "Qua", value: 280 },
      { name: "Qui", value: 350 },
      { name: "Sex", value: 420 },
    ];

    switch (modelId) {
      case "peak_hours":
      case "evolution":
        return (
          <AreaChart data={evolutionData}>
            <defs>
              <linearGradient id={`colorTotal-${modelId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
            <Tooltip />
            <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fill={`url(#colorTotal-${modelId})`} />
          </AreaChart>
        );
      case "busy_days":
        return (
          <ReBarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </ReBarChart>
        );
      case "wait_time":
        return (
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
            <Tooltip />
            <Line type="monotone" dataKey="wait" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        );
      case "avg_duration":
        return (
          <ReBarChart data={reportResult.categoryAggregation}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#f43f5e" radius={[6, 6, 0, 0]} />
          </ReBarChart>
        );
      case "performance_ranking":
        return (
          <ReBarChart data={reportResult.attendantRanking}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#065f46", fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </ReBarChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-sefaz-light p-6 md:p-12 overflow-y-auto font-sans relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-emerald-500 z-50 font-black text-sm uppercase tracking-widest flex items-center gap-3"
          >
            <Activity className="animate-pulse" /> {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center gap-8 print:hidden">
          <button
            onClick={() => {
              if (view === "menu") {
                window.location.href = "/";
              } else if (view.startsWith("config_") && view !== "config_hub") {
                setView("config_hub");
              } else if (view === "config_hub" || view === "dashboard" || view === "reports") {
                setView("menu");
              }
            }}
            className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-sefaz-accent shadow-sm hover:shadow-xl hover:scale-110 transition-all cursor-pointer border border-emerald-100/50"
          >
            <ArrowLeft size={32} />
          </button>
          <div>
            <h1 className="text-5xl font-black text-sefaz-dark tracking-tighter uppercase leading-none">
              {view === "menu"
                ? "Gerenciamento"
                : view === "dashboard"
                ? "Dashboards"
                : view === "reports"
                ? "Relatórios"
                : "Configurações"}
            </h1>
            <p className="text-sefaz-accent font-bold opacity-60 uppercase tracking-widest text-sm mt-2">
              Secretaria da Fazenda Municipal - Caruaru
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* Menu Principal */}
          {view === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <MenuCard
                onClick={() => setView("reports")}
                title="Relatórios"
                description="Consulte o histórico completo de atendimentos, tempos de espera e produtividade."
                icon={<FileText size={32} />}
                color="bg-emerald-500"
              />

              <MenuCard
                onClick={() => setView("dashboard")}
                title="Dashboards"
                description="Visualize a inteligência logística e métricas preditivas de atendimento."
                icon={<LayoutDashboard size={32} />}
                color="bg-blue-600"
              />

              <MenuCard
                onClick={() => {
                  if (session && (session.user as any).role === "Admin") {
                    setView("config_hub");
                  } else {
                    alert("Acesso restrito para administradores.");
                  }
                }}
                title="Configurações"
                description="Ajuste fino do sistema de filas, parâmetros da TV e servidores de atendimento."
                icon={<Settings size={32} />}
                color="bg-slate-700"
                disabled={!session || (session.user as any).role !== "Admin"}
              />
            </motion.div>
          )}

          {/* Dashboards */}
          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <LogisticsDashboard showHeader />
            </motion.div>
          )}

          {/* Relatórios */}
          {view === "reports" && (
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
                    <div className="grid grid-cols-3 gap-6 bg-emerald-50/30 p-8 rounded-[32px] border border-emerald-100/50 text-center">
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
                          Tempo Médio
                        </p>
                        <p className="text-3xl font-black text-sefaz-dark">
                          {reportResult.stats.avgWait}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
                          Volume Finalizado
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
                        <table className="w-full text-left">
                          <thead className="bg-emerald-50/50">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                                Data/Hora
                              </th>
                              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                                Senha
                              </th>
                              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                                Guichê
                              </th>
                              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                                Servidor
                              </th>
                              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50">
                            {reportResult.detailRows.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-emerald-50/30">
                                <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                                  {row.time}
                                </td>
                                <td className="px-6 py-4 text-xs font-black text-sefaz-accent">
                                  {row.ref}
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
                                      row.status === "CONCLUÍDO"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
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
          )}

          {/* Hub de Configurações */}
          {view === "config_hub" && (
            <motion.div
              key="config_hub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MenuCard
                  onClick={() => setView("config_users")}
                  title="Servidores"
                  description="Adicione, edite ou gerencie acessos e guichês dos atendentes."
                  icon={<UsersIcon size={32} />}
                  color="bg-emerald-500"
                />
                <MenuCard
                  onClick={() => setView("config_tv")}
                  title="Personalizar TV"
                  description="Modifique a exibição de painéis, vídeos de fundo e chamadas de senhas."
                  icon={<Tv size={32} />}
                  color="bg-slate-700"
                />
                <MenuCard
                  onClick={() => setView("config_printer")}
                  title="Triagem & Impressora"
                  description="Status do terminal térmico, alertas e layout do cupom de senhas."
                  icon={<Printer size={32} />}
                  color="bg-blue-500"
                />
              </div>
            </motion.div>
          )}

          {/* Config - TV */}
          {view === "config_tv" && (
            <motion.div
              key="config_tv"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-xl mx-auto bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm space-y-8"
            >
              <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                Configurações do Painel TV
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                    Modo de Exibição
                  </label>
                  <select
                    value={tvSettings.mode}
                    onChange={(e) =>
                      setTvSettings({ ...tvSettings, mode: e.target.value as any })
                    }
                    className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold"
                  >
                    <option value="live">Transmissão ao Vivo (YouTube)</option>
                    <option value="files">Slides e Avisos Institucionais</option>
                  </select>
                </div>

                {tvSettings.mode === "live" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      URL do Stream (YouTube)
                    </label>
                    <input
                      type="text"
                      value={tvSettings.liveUrl}
                      onChange={(e) => setTvSettings({ ...tvSettings, liveUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold"
                    />
                  </div>
                )}

                <button
                  onClick={handleSaveTvSettings}
                  className="w-full py-5 bg-sefaz-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-sefaz-dark transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar Configurações
                </button>
              </div>
            </motion.div>
          )}

          {/* Config - Servidores */}
          {view === "config_users" && (
            <motion.div
              key="config_users"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              <header className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-emerald-50 shadow-sm">
                <div>
                  <h2 className="text-3xl font-black text-sefaz-dark uppercase tracking-tight">
                    Gerenciar Servidores
                  </h2>
                  <p className="text-xs font-bold text-sefaz-accent opacity-60 uppercase tracking-widest">
                    Controle de acessos, perfis e guichês de trabalho
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewUser({
                      name: "",
                      role: "Atendente",
                      guiche: "Guichê 01",
                      matricula: "",
                      cpf: "",
                      email: "",
                      username: "",
                      password: "",
                      services: [],
                    });
                    setIsEditingUser(false);
                    setShowUserModal(true);
                  }}
                  className="px-8 py-4 bg-sefaz-accent hover:bg-sefaz-dark text-white rounded-[24px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest cursor-pointer"
                >
                  + Novo Servidor
                </button>
              </header>

              <div className="bg-white rounded-[40px] border border-emerald-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-emerald-50/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Nome
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Usuário
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Matrícula
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Função
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Guichê
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-emerald-50/20">
                        <td className="px-6 py-4 text-sm font-bold text-sefaz-dark">{u.name}</td>
                        <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                          {u.username}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                          {u.matricula}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">{u.role}</td>
                        <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                          {u.guiche}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-black rounded ${
                              u.blocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {u.blocked ? "BLOQUEADO" : "ATIVO"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleBlock(u.id)}
                            className={`p-2 rounded-lg cursor-pointer ${
                              u.blocked ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"
                            }`}
                            title={u.blocked ? "Desbloquear" : "Bloquear"}
                          >
                            <Ban size={14} />
                          </button>
                          <button
                            onClick={() => handleEditUser(u)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Editar"
                          >
                            <Pen size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUserClick(u)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sefaz-dark/80 backdrop-blur-sm"
              onClick={() => setShowUserModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-sefaz-dark uppercase tracking-tighter">
                    {isEditingUser ? "EDITAR SERVIDOR" : "CADASTRO DE SERVIDOR"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-sefaz-accent hover:text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Matrícula
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.matricula}
                      onChange={(e) => setNewUser({ ...newUser, matricula: e.target.value })}
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      CPF
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.cpf}
                      onChange={(e) => setNewUser({ ...newUser, cpf: e.target.value })}
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Nome de Usuário
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Senha do Sistema {isEditingUser && "(Deixe em branco para manter)"}
                    </label>
                    <input
                      type="password"
                      required={!isEditingUser}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Função
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none"
                    >
                      <option value="Atendente">Atendente</option>
                      <option value="Gerente">Gerente</option>
                      <option value="Triador">Triador</option>
                      <option value="Admin">Administrador</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Guichê Preferencial
                    </label>
                    <select
                      value={newUser.guiche}
                      onChange={(e) => setNewUser({ ...newUser, guiche: e.target.value })}
                      className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none"
                    >
                      <option value="Guichê 01">Guichê 01</option>
                      <option value="Guichê 02">Guichê 02</option>
                      <option value="Guichê 03">Guichê 03</option>
                      <option value="Guichê 04">Guichê 04</option>
                      <option value="Guichê 05">Guichê 05</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-sefaz-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-sefaz-dark transition-all cursor-pointer"
                >
                  Salvar Servidor
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sefaz-dark/60 backdrop-blur-md"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[48px] p-12 text-center border border-red-100"
            >
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <ShieldAlert size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 uppercase mb-4">EXCLUIR USUÁRIO?</h3>
              <p className="text-slate-500 font-bold text-sm mb-8">
                Tem certeza que deseja remover o acesso do servidor{" "}
                <span className="text-red-500 font-black">{userToDelete?.name}</span>?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteUser}
                  className="w-full py-5 bg-red-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuCard({
  onClick,
  title,
  description,
  icon,
  color,
  disabled = false,
}: {
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-start p-10 bg-white rounded-[40px] border border-emerald-100/50 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-500 overflow-hidden text-left w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div
        className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500 mb-8`}
      >
        {icon}
      </div>

      <h3 className="text-2xl font-black text-sefaz-dark tracking-tighter leading-none mb-4 group-hover:text-emerald-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-sefaz-accent font-medium opacity-60 leading-relaxed">
        {description}
      </p>

      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <ChevronRight className="h-6 w-6 text-emerald-500" />
      </div>
    </button>
  );
}
