"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  FileText,
  Clock,
  CalendarDays,
  Timer,
  TrendingUp,
  Activity,
  Trash2,
  Tv,
  Save,
  Pen,
  Ban,
  X,
  LayoutDashboard,
  Settings,
  Users as UsersIcon,
  Printer,
  Trophy,
  Briefcase,
  Heart,
  Shield,
  Star,
  Zap,
  Car,
  Smartphone,
  Home,
  Gavel,
  Landmark,
  Building,
  GraduationCap,
  Banknote,
  Search,
} from "lucide-react";
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
  getCategoriesAction,
  getTicketWindowsAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createNextTicketWindowAction,
  deleteTicketWindowAction,
} from "@/features/queue/actions";
import { getReportsDataAction } from "@/features/reports/actions";
import { User, TvSettings, DbCategory, DbTicketWindow } from "@/features/queue/types";

type ViewType = "menu" | "dashboard" | "reports" | "config_hub" | "config_users" | "config_tv" | "config_printer" | "config_services";

interface ReportResultData {
  stats: {
    total: number;
    avgWait: string;
    efficiency: string;
  };
  categoryAggregation: Array<{ name: string; count: number; value: number }>;
  attendantRanking: Array<{ name: string; count: number; avgDuration: number; rating: number }>;
  detailRows: Array<{
    time: string;
    ref: string;
    desk: string;
    user: string;
    status: string;
  }>;
  reportType: "analytical" | "synthetic";
  selectedModels: string[];
}

const ADVANCED_REPORTS = [
  { id: "peak_hours", label: "Horário de Pico", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "busy_days", label: "Dias mais Movimentados", icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "wait_time", label: "Tempo de Espera", icon: Timer, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "evolution", label: "Evolução do Fluxo", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "avg_duration", label: "Duração Média", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "performance_ranking", label: "Ranking de Desempenho", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
];

const AVAILABLE_ICONS = [
  { name: "FileText", icon: FileText },
  { name: "Users", icon: UsersIcon },
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

interface ManagementDashboardProps {
  session: Session | null;
  initialTvSettings: TvSettings;
}

export default function ManagementDashboard({ session, initialTvSettings }: ManagementDashboardProps) {
  const [view, setView] = useState<ViewType>("menu");
  
  // States for Config - Users
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    role: "Atendente",
    guiche: "Guichê 01",
    matricula: "",
    cpf: "",
    email: "",
    username: "",
    password: "",
    services: [] as number[],
  });

  // States for Config - TV Settings
  const [tvSettings, setTvSettings] = useState<TvSettings>(initialTvSettings);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);

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
  const [reportResult, setReportResult] = useState<ReportResultData | null>(null);

  // Success modals
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const [categories, setCategories] = useState<DbCategory[]>([]);
  
  // States for Config - Services and Ticket Windows
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState<Omit<DbCategory, "id">>({
    ticketChar: "A",
    name: "",
    description: "",
    icon: "FileText",
    color: "#10b981",
  });

  const loadCategories = React.useCallback(async () => {
    const res = await getCategoriesAction();
    if (res.success && res.data) {
      setCategories(res.data as DbCategory[]);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      loadCategories();
    }, 0);
  }, [loadCategories]);

  // Fetch initial configs
  const loadConfigData = React.useCallback(async () => {
    if (view === "config_users") {
      const res = await getUsersAction();
      if (res.success && res.data) setUsers(res.data as User[]);
      const resWindows = await getTicketWindowsAction();
      if (resWindows.success && resWindows.data) {
        setTicketWindows(resWindows.data as DbTicketWindow[]);
      }
    } else if (view === "config_tv") {
      const res = await getTvSettingsAction();
      if (res.success && res.data) {
        setTvSettings(res.data as TvSettings);
      }
    } else if (view === "config_services") {
      loadCategories();
      const resWindows = await getTicketWindowsAction();
      if (resWindows.success && resWindows.data) {
        setTicketWindows(resWindows.data as DbTicketWindow[]);
      }
    }
  }, [view, loadCategories]);

  useEffect(() => {
    setTimeout(() => {
      loadConfigData();
    }, 0);
  }, [loadConfigData]);

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

  const handleEditUser = (user: User) => {
    setNewUser({
      name: user.name,
      role: user.role,
      guiche: user.guiche || "Guichê 01",
      matricula: user.matricula,
      cpf: user.cpf,
      email: user.email,
      username: user.username,
      password: "",
      services: user.services || [],
    });
    setEditingUserId(user.id || null);
    setIsEditingUser(true);
    setShowUserModal(true);
  };

  const handleDeleteUserClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete && userToDelete.id !== undefined) {
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

  // Config - Services & Ticket Windows Handlers
  const handleCreateTicketWindow = async () => {
    const res = await createNextTicketWindowAction();
    if (res.success) {
      triggerSuccess("Guichê criado com sucesso!");
      loadConfigData();
    } else {
      alert(res.error || "Erro ao criar guichê");
    }
  };

  const handleDeleteTicketWindow = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este guichê?")) {
      const res = await deleteTicketWindowAction(id);
      if (res.success) {
        triggerSuccess("Guichê excluído!");
        loadConfigData();
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
        loadConfigData();
      } else {
        alert(res.error || "Erro ao atualizar");
      }
    } else {
      const res = await createCategoryAction(newCategory);
      if (res.success) {
        triggerSuccess("Serviço cadastrado com sucesso!");
        setShowCategoryModal(false);
        loadConfigData();
      } else {
        alert(res.error || "Erro ao cadastrar");
      }
    }
  };

  const handleEditCategory = (cat: DbCategory) => {
    setNewCategory({
      ticketChar: cat.ticketChar || "A",
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "FileText",
      color: cat.color || "#10b981",
    });
    setEditingCategoryId(cat.id);
    setIsEditingCategory(true);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este serviço?")) {
      const res = await deleteCategoryAction(id);
      if (res.success) {
        triggerSuccess("Serviço excluído!");
        loadConfigData();
      } else {
        alert(res.error || "Erro ao excluir serviço");
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

  const handleAddVideo = async () => {
    if (!newVideoUrl) return;
    setIsAddingVideo(true);
    
    try {
      const videoIdMatch = newVideoUrl.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      if (!videoId) {
        alert("URL do YouTube inválida.");
        setIsAddingVideo(false);
        return;
      }

      let title = "Vídeo do YouTube";
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = data.title;
        }
      } catch (e) {
        console.error("Erro ao buscar título do vídeo", e);
      }

      setTvSettings(prev => ({
        ...prev,
        videoUrl: [...(prev.videoUrl || []), { url: newVideoUrl, videoId, title }]
      }));
      setNewVideoUrl("");
      triggerSuccess("Vídeo adicionado à playlist!");
    } catch {
      alert("Erro ao adicionar vídeo.");
    } finally {
      setIsAddingVideo(false);
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

  const handleTvUpload = () => {
    // Simular upload de arquivo
    const simulatedFiles = [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
    ];
    setTvSettings((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...simulatedFiles],
    }));
    triggerSuccess("Simulado upload de mídias institucionais!");
  };

  const toggleTvService = (id: number) => {
    setNewUser((prev) => {
      const services = prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id];
      return { ...prev, services };
    });
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
                  if (session && session.user.role === "Admin") {
                    setView("config_hub");
                  } else {
                    alert("Acesso restrito para administradores.");
                  }
                }}
                title="Configurações"
                description="Ajuste fino do sistema de filas, parâmetros da TV e servidores de atendimento."
                icon={<Settings size={32} />}
                color="bg-slate-700"
                disabled={!session || session.user.role !== "Admin"}
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
                            {reportResult.detailRows.map((row, i: number) => (
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
                <MenuCard
                  onClick={() => setView("config_services")}
                  title="Guichês & Serviços"
                  description="Crie novos guichês ou ajuste serviços e categorias."
                  icon={<Settings size={32} />}
                  color="bg-purple-600"
                />
              </div>
            </motion.div>
          )}

          {/* Config - Services & Ticket Windows */}
          {view === "config_services" && (
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
                        setNewCategory({ ticketChar: "A", name: "", description: "", icon: "FileText", color: "#10b981" });
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
                          <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase">Letra</th>
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
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                  Servidores Cadastrados
                </h3>
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
                  className="px-6 py-3 bg-sefaz-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Novo Servidor
                </button>
              </div>

              <div className="bg-white rounded-[40px] border border-emerald-50 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-emerald-50/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Nome
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Matrícula / CPF
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">
                        Perfil
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
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-emerald-50/30">
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-sefaz-dark">{user.name}</p>
                          <p className="text-[10px] text-sefaz-accent font-medium">{user.email}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-sefaz-accent">
                          {user.matricula} <span className="opacity-50">/</span> {user.cpf}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${
                              user.role === "Admin"
                                ? "bg-red-100 text-red-700"
                                : user.role === "Gerente"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                          {user.guiche}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${
                              user.blocked
                                ? "bg-red-50 text-red-500 border border-red-200"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            }`}
                          >
                            {user.blocked ? "Bloqueado" : "Ativo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleBlock(user.id!)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                            title={user.blocked ? "Desbloquear" : "Bloquear"}
                          >
                            <Ban size={16} />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-sefaz-accent hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                            title="Editar"
                          >
                            <Pen size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUserClick(user)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <div className="grid grid-cols-2 gap-2 bg-emerald-50/50 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setTvSettings({ ...tvSettings, mode: "live" })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                        tvSettings.mode === "live"
                          ? "bg-sefaz-accent text-white shadow-md"
                          : "text-sefaz-accent opacity-60"
                      }`}
                    >
                      Transmissão Ao Vivo
                    </button>
                    <button
                      onClick={() => setTvSettings({ ...tvSettings, mode: "files" })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                        tvSettings.mode === "files"
                          ? "bg-sefaz-accent text-white shadow-md"
                          : "text-sefaz-accent opacity-60"
                      }`}
                    >
                      Mídias da Cidade
                    </button>
                  </div>
                </div>

                {tvSettings.mode === "live" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                        Adicionar Vídeo (YouTube)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          placeholder="Ex: https://www.youtube.com/watch?v=..."
                          className="flex-1 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-medium text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddVideo();
                          }}
                        />
                        <button
                          onClick={handleAddVideo}
                          disabled={isAddingVideo || !newVideoUrl}
                          className="px-6 py-4 bg-sefaz-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isAddingVideo ? "..." : "Adicionar"}
                        </button>
                      </div>
                    </div>
                    
                    {tvSettings.videoUrl && tvSettings.videoUrl.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                          Playlist
                        </label>
                        <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {tvSettings.videoUrl.map((video, idx) => (
                            <div key={idx} className="bg-emerald-50/30 rounded-2xl border border-emerald-100 p-3 flex gap-4 items-center relative group">
                              <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                                <img src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-sefaz-dark line-clamp-2">{video.title}</p>
                              </div>
                              <button
                                onClick={() => {
                                  const newList = [...tvSettings.videoUrl];
                                  newList.splice(idx, 1);
                                  setTvSettings({...tvSettings, videoUrl: newList});
                                }}
                                className="w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center border border-red-100 shrink-0 transition-colors shadow-sm cursor-pointer"
                                title="Remover vídeo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 border border-emerald-50 p-6 rounded-3xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-sefaz-dark uppercase">Slides de Mídia</p>
                        <p className="text-[9px] text-sefaz-accent font-bold uppercase opacity-60">
                          Upload de mídias institucionais (.jpg, .png)
                        </p>
                      </div>
                      <button
                        onClick={handleTvUpload}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                      >
                        Carregar
                      </button>
                    </div>

                    {tvSettings.uploadedFiles.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {tvSettings.uploadedFiles.map((file, i) => (
                          <div key={i} className="relative rounded-lg overflow-hidden border border-emerald-100 aspect-video bg-slate-50">
                            <img src={file} className="w-full h-full object-cover" alt="Slide" />
                            <button
                              onClick={() => {
                                const list = tvSettings.uploadedFiles.filter((_, idx) => idx !== i);
                                setTvSettings({ ...tvSettings, uploadedFiles: list });
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleSaveTvSettings}
                  className="w-full py-5 bg-sefaz-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-sefaz-dark transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar Parâmetros TV
                </button>
              </div>
            </motion.div>
          )}

          {/* Config - Triagem/Impressora */}
          {view === "config_printer" && (
            <motion.div
              key="config_printer"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-xl mx-auto bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm space-y-8"
            >
              <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                Triagem & Parâmetros Térmicos
              </h3>

              <div className="space-y-6">
                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-sefaz-dark uppercase">Conexão da Impressora</p>
                    <p className="text-[9px] text-sefaz-accent font-bold uppercase opacity-60">
                      Dispositivo local: USB Thermal Printer PRN-58
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-black text-[9px] uppercase rounded-md">
                    Online
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-sefaz-dark">Corte Automático do Papel (Autocut)</p>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-sefaz-accent" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-sefaz-dark">Imprimir Código de Barras (Barcode)</p>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-sefaz-accent" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-sefaz-dark">Alertas Sonoros na Emissão</p>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-sefaz-accent" />
                  </div>
                </div>

                <button
                  onClick={() => triggerSuccess("Configurações da impressora salvas!")}
                  className="w-full py-5 bg-sefaz-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-sefaz-dark transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar Parâmetros Impressora
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Edit Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="absolute inset-0 bg-sefaz-dark/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl border border-emerald-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
                {isEditingUser ? "Editar Servidor" : "Cadastrar Servidor"}
              </h3>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Matrícula
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.matricula}
                      onChange={(e) => setNewUser({ ...newUser, matricula: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      CPF
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.cpf}
                      onChange={(e) => setNewUser({ ...newUser, cpf: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Senha {isEditingUser && "(Vazio para não alterar)"}
                    </label>
                    <input
                      type="password"
                      required={!isEditingUser}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Cargo / Perfil
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    >
                      <option value="Atendente">Atendente</option>
                      <option value="Gerente">Gerente</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Guichê
                    </label>
                    <select
                      value={newUser.guiche}
                      onChange={(e) => setNewUser({ ...newUser, guiche: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    >
                      {ticketWindows.map((tw) => (
                        <option key={tw.id} value={tw.name}>
                          {tw.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Serviços Autorizados */}
                <div className="space-y-2 pt-2">
                  <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2 block">
                    Serviços Autorizados
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-[120px] overflow-y-auto p-2 border border-emerald-50 rounded-2xl bg-emerald-50/30 custom-scrollbar">
                    {categories.map((cat) => {
                      const isAuth = newUser.services.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleTvService(cat.id)}
                          className={`p-2 rounded-xl text-[9px] font-black uppercase text-center border transition-all cursor-pointer ${
                            isAuth
                              ? "bg-sefaz-accent text-white border-sefaz-accent"
                              : "bg-white border-emerald-100 text-sefaz-dark"
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer text-xs uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-sefaz-accent text-white rounded-2xl font-bold hover:bg-sefaz-dark transition-all shadow-lg shadow-emerald-900/20 cursor-pointer text-xs uppercase"
                  >
                    {isEditingUser ? "Salvar Alterações" : "Cadastrar Servidor"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-sefaz-dark/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl border border-emerald-100 text-center relative"
            >
              <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight mb-2">
                Excluir Servidor
              </h3>
              <p className="text-xs text-sefaz-accent font-medium mb-6">
                Tem certeza de que deseja remover permanentemente o servidor{" "}
                <strong className="text-sefaz-dark">{userToDelete.name}</strong>? Esta ação não
                pode ser desfeita.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-900/20 cursor-pointer text-xs uppercase"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Category Edit Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryModal(false)}
              className="absolute inset-0 bg-sefaz-dark/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl border border-emerald-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
                {isEditingCategory ? "Editar Serviço" : "Cadastrar Serviço"}
              </h3>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Letra
                    </label>
                    <input
                      type="text"
                      maxLength={1}
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuCardProps {
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
}

function MenuCard({ onClick, title, description, icon, color, disabled }: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col p-8 bg-white rounded-[40px] shadow-sm border border-emerald-100/50 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-500 overflow-hidden text-left w-full cursor-pointer disabled:opacity-40 disabled:pointer-events-none`}
    >
      <div
        className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500 mb-6`}
      >
        {icon}
      </div>

      <h3 className="text-2xl font-black text-sefaz-dark tracking-tighter leading-none mb-3 group-hover:text-emerald-600 transition-colors uppercase">
        {title}
      </h3>
      <p className="text-xs text-sefaz-accent font-medium opacity-60 leading-relaxed">
        {description}
      </p>

      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
        <ArrowLeft className="h-6 w-6 text-emerald-500 rotate-180" />
      </div>
    </button>
  );
}
