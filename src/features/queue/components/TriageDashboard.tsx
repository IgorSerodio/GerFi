"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Clock,
  Printer,
  FileText,
  History,
  Accessibility,
  Gavel,
  Landmark,
  UserPlus,
  Info,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { getQueueStateAction, issueTicketAction } from "@/features/queue/actions";
import { Ticket as TicketType } from "@/features/queue/types";
import { Session } from "next-auth";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

type SearchResult =
  | {
      id: string;
      status: "pending";
      ahead: number;
      ticket: TicketType;
    }
  | {
      id: string;
      status: "calling" | "completed";
      guiche?: string;
      attendant?: string;
      ticket: TicketType;
    }
  | {
      id: string;
      status: "not_found";
    };

interface TriageDashboardProps {
  session: Session | null;
  initialQueue: TicketType[];
  initialHistory: TicketType[];
}

export default function TriageDashboard({ session, initialQueue, initialHistory }: TriageDashboardProps) {
  const [issuedTicket, setIssuedTicket] = useState<TicketType | null>(null);
  const [printing, setPrinting] = useState(false);
  const [recentIssues, setRecentIssues] = useState<TicketType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [queue, setQueue] = useState<TicketType[]>(initialQueue);
  const [history, setHistory] = useState<TicketType[]>(initialHistory);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPrinterTest, setShowPrinterTest] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const categories = [
    { id: "IPTU", name: "IPTU", description: "Imposto Predial e Territorial Urbano", icon: Landmark, color: "bg-emerald-600" },
    { id: "ITBI", name: "ITBI", description: "Imposto sobre Transmissão de Bens Imóveis", icon: Landmark, color: "bg-emerald-600" },
    { id: "SJOA", name: "SÃO JOÃO", description: "Eventos e Autorizações", icon: Landmark, color: "bg-blue-500" }, // note: Landmark icon used for standardizing size
    { id: "TRAN", name: "TRANSPORTE", description: "Mobilidade Urbana", icon: History, color: "bg-slate-600" },
    { id: "MFIS", name: "MALHA FISCAL", description: "Regularização de Pendências", icon: Gavel, color: "bg-amber-600" },
    { id: "SSAN", name: "SEMANA SANTA", description: "Eventos e Autorizações", icon: Landmark, color: "bg-emerald-500" },
    { id: "FEIR", name: "FEIRA", description: "Taxas e Licenciamento", icon: Landmark, color: "bg-emerald-500" },
    { id: "PLUS", name: "+80", description: "Atendimento Super Prioritário", icon: Accessibility, color: "bg-emerald-700" },
    { id: "AMBU", name: "AMBULANTE", description: "Licenciamento de Comércio", icon: UserPlus, color: "bg-emerald-500" },
    { id: "RECA", name: "RECADASTRAMENTO", description: "Atualização Cadastral", icon: UserPlus, color: "bg-indigo-600" },
    { id: "2VIA", name: "2ª VIA", description: "Emissão de Documentos", icon: FileText, color: "bg-slate-500" },
    { id: "TAXI", name: "TAXI", description: "Alvarás e Taxas", icon: History, color: "bg-slate-600" },
    { id: "NFIS", name: "NOTA FISCAL", description: "Serviços e Consultas", icon: FileText, color: "bg-emerald-600" },
    { id: "PAGM", name: "PAGAMENTO", description: "Quitação de Débitos", icon: Landmark, color: "bg-blue-600" },
    { id: "ATEN", name: "ATENDIMENTO", description: "Informações Gerais", icon: Info, color: "bg-emerald-500" },
    { id: "DIVE", name: "DIVERSOS", description: "Outros Assuntos", icon: Info, color: "bg-emerald-500" },
  ];

  const refreshState = async () => {
    const res = await getQueueStateAction();
    if (res.success && res.data) {
      setQueue(res.data.tickets);
      setHistory(res.data.history);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      refreshState();
    }, 0);
  }, []);

  // Sincronização em tempo real via SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/queue/stream");

    eventSource.addEventListener("update", () => {
      setTimeout(() => {
        refreshState();
      }, 0);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const selectService = (cat: Category) => {
    setSelectedCategory(cat);
  };

  const handleIssue = async (priority: "Normal" | "Prioritário") => {
    if (!selectedCategory) return;
    setPrinting(true);

    const res = await issueTicketAction({
      type: selectedCategory.id,
      categoryName: selectedCategory.name,
      priority,
    });

    if (res.success && res.data) {
      setIssuedTicket(res.data);
      setRecentIssues((prev) => [res.data as TicketType, ...prev.slice(0, 9)]);
    } else {
      alert(res.error || "Erro ao emitir senha");
    }

    setPrinting(false);
    setSelectedCategory(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toUpperCase().trim();
    if (!query) {
      setSearchResult(null);
      return;
    }

    const queuePos = queue.findIndex((t) => t.ticketNumber === query);
    if (queuePos !== -1) {
      setSearchResult({
        id: query,
        status: "pending",
        ahead: queuePos,
        ticket: queue[queuePos],
      });
      return;
    }

    const historyItem = history.find((t) => t.ticketNumber === query);
    if (historyItem) {
      setSearchResult({
        id: query,
        status: historyItem.status as "calling" | "completed",
        guiche: historyItem.guiche,
        attendant: historyItem.attendant,
        ticket: historyItem,
      });
      return;
    }

    setSearchResult({ id: query, status: "not_found" });
  };

  const handleTestPrinter = () => {
    setPrinterStatus("testing");
    setShowPrinterTest(true);

    setTimeout(() => {
      setPrinterStatus("success");
    }, 2000);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-sefaz-light flex overflow-hidden font-display p-2 md:p-4">
      <div className="flex-1 flex overflow-hidden rounded-[32px] shadow-2xl border border-emerald-100 bg-white relative">
        {/* Overlay for mobile */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-sefaz-dark/60 backdrop-blur-sm z-40 lg:hidden rounded-[32px]"
            />
          )}
        </AnimatePresence>

        {/* Left Sidebar: Search and Recent Tickets */}
        <aside
          className={`absolute lg:relative z-50 h-full lg:h-auto w-80 bg-white border-r border-emerald-50 flex flex-col p-6 overflow-hidden transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Close Sidebar Button (Mobile Only) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors"
          >
            <X size={24} />
          </button>

          {/* Search Field */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="PESQUISAR SENHA..."
                className="w-full bg-emerald-50 rounded-xl px-4 py-3 text-xs font-black text-sefaz-dark border-2 border-transparent focus:border-sefaz-accent outline-none placeholder:text-sefaz-accent/30 tracking-widest uppercase transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-sefaz-accent hover:bg-white rounded-lg transition-colors"
              >
                <Users size={16} />
              </button>
            </form>

            <AnimatePresence>
              {searchResult && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="p-4 bg-sefaz-dark rounded-2xl text-white relative">
                    <button
                      onClick={() => setSearchResult(null)}
                      className="absolute top-2 right-2 text-white/40 hover:text-white"
                    >
                      ✕
                    </button>
                    <div className="mb-2">
                      <span className="text-2xl font-black">{searchResult.id}</span>
                      <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">
                        {searchResult.status !== "not_found" ? searchResult.ticket.categoryName : "Senha não encontrada"}
                      </p>
                    </div>

                    {searchResult.status === "pending" && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Clock size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Aguardando
                          </span>
                        </div>
                        <p className="text-xs font-bold">
                          {searchResult.ahead === 0
                            ? "Você é o próximo!"
                            : `Existem ${searchResult.ahead} senhas na sua frente.`}
                        </p>
                      </div>
                    )}

                    {(searchResult.status === "calling" || searchResult.status === "completed") && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-400">
                          <Info size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Já Chamada
                          </span>
                        </div>
                        <p className="text-xs font-bold leading-tight">
                          Dirija-se ao{" "}
                          <span className="text-amber-400">{searchResult.guiche}</span>
                        </p>
                      </div>
                    )}

                    {searchResult.status === "not_found" && (
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                        Senha não encontrada
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-100 text-sefaz-dark rounded-xl">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-sefaz-dark uppercase tracking-widest leading-none">
                Recém Emitidos
              </h2>
              <p className="text-[10px] text-sefaz-accent font-bold mt-1">Últimas 10 senhas</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {recentIssues.map((ticket) => (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={ticket.id}
                className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex justify-between items-center group cursor-default animate-fade-in"
              >
                <div>
                  <span className="text-xl font-black text-sefaz-dark">{ticket.ticketNumber}</span>
                  <p className="text-[10px] font-bold text-sefaz-accent uppercase tracking-tighter">
                    {ticket.categoryName}
                  </p>
                </div>
                <button
                  onClick={() => setIssuedTicket(ticket)}
                  className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-sefaz-accent hover:bg-white rounded-lg cursor-pointer"
                >
                  <Printer size={16} />
                </button>
              </motion.div>
            ))}
            {recentIssues.length === 0 && (
              <div className="text-center py-12 text-emerald-200 italic text-sm">
                Nenhuma senha emitida nesta sessão.
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-emerald-50">
            <div className="bg-sefaz-dark rounded-2xl p-4 text-white">
              <p className="text-[10px] font-black uppercase mb-1 opacity-60">Operador Logado</p>
              <p className="text-sm font-bold">{session?.user?.name || "Operador de Triagem"}</p>
            </div>
          </div>
        </aside>

        {/* Main Area: Categories */}
        <main className="flex-1 p-4 lg:p-6 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-sefaz-accent shadow-sm border border-emerald-100/50 hover:bg-emerald-50 transition-colors"
              >
                <Menu size={20} className="md:w-6 md:h-6" />
              </button>
              <NextLink
                href="/"
                className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl items-center justify-center text-sefaz-accent shadow-sm hover:shadow-xl hover:scale-110 transition-all border border-emerald-100/50"
              >
                <ArrowLeft size={20} className="md:w-6 md:h-6" />
              </NextLink>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-sefaz-dark tracking-tight leading-none">
                  POSTO DE TRIAGEM
                </h1>
                <p className="text-sefaz-accent font-bold text-[8px] md:text-[10px] uppercase tracking-widest opacity-60">
                  Selecione o serviço para emitir a senha
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleTestPrinter}
                className="bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 transition-all active:scale-95 group cursor-pointer"
              >
                <Printer size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  Testar Impressora
                </span>
              </button>

              <div className="text-right relative">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="text-lg font-black text-sefaz-dark leading-none">
                    {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-[10px] font-bold text-sefaz-accent opacity-50 uppercase tracking-widest">
                    {new Date().toLocaleDateString("pt-BR")}
                  </div>
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 overflow-y-auto pr-2 pb-6 custom-scrollbar p-1">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => selectService(cat)}
                disabled={printing}
                whileHover={{
                  scale: 1.1,
                  zIndex: 40,
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative group bg-white rounded-[20px] p-3 shadow-sm border border-emerald-100/50 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center text-center overflow-hidden active:scale-95 disabled:grayscale aspect-square cursor-pointer"
              >
                <div
                  className={`w-8 h-8 ${cat.color} text-white rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <cat.icon size={16} />
                </div>

                <div className="flex flex-col items-center justify-center w-full px-1">
                  <h3 className="text-[9px] font-black text-sefaz-dark leading-[1.1] uppercase break-words line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </motion.button>
            ))}
          </div>
        </main>
      </div>

      {/* Type Selection Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl border border-emerald-100"
            >
              <div className="text-center mb-6">
                <div
                  className={`w-12 h-12 ${selectedCategory.color} text-white rounded-xl flex items-center justify-center mx-auto mb-3`}
                >
                  <selectedCategory.icon size={24} />
                </div>
                <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight">
                  {selectedCategory.name}
                </h3>
                <p className="text-xs text-sefaz-accent font-bold opacity-60">
                  Selecione a prioridade do atendimento
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleIssue("Normal")}
                  className="group relative flex items-center p-6 bg-emerald-50 rounded-2xl border-2 border-transparent hover:border-emerald-500 hover:bg-emerald-100/50 transition-all text-left cursor-pointer"
                >
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-sefaz-dark leading-none">
                      NORMAL
                    </span>
                    <span className="text-[10px] text-sefaz-accent font-bold opacity-60">
                      Atendimento Regular
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleIssue("Prioritário")}
                  className="group relative flex items-center p-6 bg-amber-50 rounded-2xl border-2 border-transparent hover:border-amber-500 hover:bg-amber-100/50 transition-all text-left cursor-pointer"
                >
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Accessibility size={20} />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-sefaz-dark leading-none">
                      PRIORITÁRIO
                    </span>
                    <span className="text-[10px] text-sefaz-accent font-bold opacity-60">
                      Idosos, PCD, Gestantes
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mt-2 py-3 text-sefaz-accent font-bold text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Printer Test Modal */}
      <AnimatePresence>
        {showPrinterTest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl border border-emerald-100 relative overflow-hidden"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Printer size={32} />
                </div>
                <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                  Status da Impressora
                </h3>
                <p className="text-xs text-sefaz-accent font-bold opacity-60">
                  Verificando comunicação com o hardware...
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-2xl border-2 border-emerald-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        printerStatus === "testing" ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-sm font-black text-sefaz-dark uppercase tracking-widest">
                      {printerStatus === "testing" ? "Comunicando..." : "Terminal Online"}
                    </span>
                  </div>
                  {printerStatus === "success" && (
                    <div className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-lg">
                      Pronto
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-2xl border-2 border-emerald-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        printerStatus === "testing" ? "bg-slate-200" : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-sm font-black text-sefaz-dark uppercase tracking-widest">
                      Bobina de Papel
                    </span>
                  </div>
                  {printerStatus === "success" && (
                    <div className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-lg">
                      OK
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-emerald-50 space-y-3">
                {printerStatus === "success" ? (
                  <>
                    <button
                      onClick={() => setShowPrinterTest(false)}
                      className="w-full py-4 bg-sefaz-dark text-white rounded-2xl font-black tracking-widest hover:bg-black transition-all text-xs uppercase cursor-pointer"
                    >
                      Imprimir Ticket de Teste
                    </button>
                    <button
                      onClick={() => setShowPrinterTest(false)}
                      className="w-full py-2 text-sefaz-accent font-bold text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Fechar Diagnóstico
                    </button>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest animate-pulse">
                      Aguardando resposta...
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Preview Overlay (Thermal Printer Style) */}
      <AnimatePresence>
        {issuedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-sefaz-dark/60 backdrop-blur-sm p-4"
          >
            <div className="relative">
              {/* Thermal Receipt Visual */}
              <motion.div
                initial={{ y: 100, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 200, opacity: 0 }}
                className="bg-white text-gray-800 p-8 shadow-2xl w-[320px] relative overflow-hidden"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Torn edge effect top */}
                <div className="absolute top-0 left-0 w-full h-2 flex">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-sefaz-dark rounded-full -mt-2" />
                  ))}
                </div>

                <div className="text-center font-bold text-xs border-b border-dashed border-gray-300 pb-4 mb-4">
                  <p className="text-[10px] uppercase tracking-tight font-medium">
                    Município de Caruaru
                  </p>
                  <p className="text-[11px] uppercase tracking-tight font-black leading-tight">
                    Secretaria da Fazenda Municipal
                  </p>
                  <p className="text-[9px] opacity-60 mt-1">CNPJ: 10.091.536/0001-13</p>
                </div>

                <div className="text-center py-6">
                  <p className="text-4xl font-black uppercase tracking-tight mb-2 leading-none">
                    {issuedTicket.categoryName}
                  </p>
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                    {issuedTicket.priority === "Prioritário" ? "PRIORITÁRIO" : "GERAL"}
                  </div>
                  <h2 className="text-7xl font-black tracking-tighter mb-2">{issuedTicket.ticketNumber}</h2>
                </div>

                <div className="border-t border-b border-dashed border-gray-300 py-4 mb-6 space-y-1 text-[10px] font-bold">
                  <div className="flex justify-between">
                    <span>DATA:</span>
                    <span>{new Date(issuedTicket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HORA:</span>
                    <span>{new Date(issuedTicket.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>POSTO:</span>
                    <span>TRIAGEM CENTRAL</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[9px] font-bold leading-tight mb-4">
                    AGUARDE SER CHAMADO NO PAINEL PRINCIPAL
                    <br />
                    TEMPO MÉDIO DE ESPERA: 15 MIN
                  </p>

                  {/* Fake barcode */}
                  <div className="h-10 w-full bg-gray-200 flex justify-center items-center overflow-hidden mb-2">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className="h-full bg-black mx-[1px]"
                        style={{ width: (i % 3 === 0 || i % 7 === 0) ? "2px" : "1px" }}
                      />
                    ))}
                  </div>
                  <p className="text-[8px] font-bold tracking-[0.4em]">{issuedTicket.ticketNumber}2024SFM</p>
                </div>

                {/* Torn edge effect bottom */}
                <div className="absolute bottom-0 left-0 w-full h-2 flex">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-white rounded-full -mb-2" />
                  ))}
                </div>
              </motion.div>

              {/* Close Button UI */}
              <button
                onClick={() => setIssuedTicket(null)}
                className="absolute -top-6 -right-6 w-12 h-12 bg-white text-sefaz-dark rounded-full shadow-lg flex items-center justify-center font-black border-2 border-emerald-50 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Fechar"
              >
                ✕
              </button>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => setIssuedTicket(null)}
                  className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black tracking-widest shadow-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={18} /> IMPRIMIR & SAIR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {printing && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-40">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-emerald-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sefaz-medium" />
            <p className="font-black text-sefaz-dark tracking-widest text-xs uppercase animate-pulse">
              Gerando Senha...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
