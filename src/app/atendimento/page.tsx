"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Monitor,
  Hash,
  PhoneForwarded,
  CheckCircle2,
  Users,
  Send,
  X,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getQueueStateAction,
  callTicketAction,
  recallTicketAction,
  finishTicketAction,
  forwardTicketAction,
} from "@/features/queue/actions";
import { Ticket } from "@/features/queue/types";

export default function Attendant() {
  const { data: session } = useSession();
  const [currentAttendant, setCurrentAttendant] = useState({
    name: "Carlos Andrade",
    guiche: "Guichê 03",
  });
  
  // Sincronizar o atendente com a sessão logada do NextAuth
  useEffect(() => {
    if (session?.user) {
      setCurrentAttendant({
        name: session.user.name || "Atendente",
        guiche: (session.user as any).guiche || "Guichê 01",
      });
      // Inicialmente permite todos os serviços do usuário
      setAllowedServices((session.user as any).services || []);
    }
  }, [session]);

  const [showGuicheModal, setShowGuicheModal] = useState(false);
  const [allowedServices, setAllowedServices] = useState<string[]>([]);
  const [showServiceConfig, setShowServiceConfig] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [observation, setObservation] = useState("");
  const [ticketToFinish, setTicketToFinish] = useState<string | null>(null);
  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState<any>(null);
  const [queue, setQueue] = useState<Ticket[]>([]);
  const [history, setHistory] = useState<Ticket[]>([]);
  const [attendants, setAttendants] = useState<string[]>([
    "Guichê 01",
    "Guichê 02",
    "Guichê 03",
    "Guichê 04",
    "Guichê 05",
  ]);

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

  const refreshState = async () => {
    const res = await getQueueStateAction();
    if (res.success && res.data) {
      setQueue(res.data.tickets);
      setHistory(res.data.history);
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  // SSE updates subscription
  useEffect(() => {
    const eventSource = new EventSource("/api/queue/stream");

    eventSource.addEventListener("update", () => {
      refreshState();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleCall = async () => {
    const res = await callTicketAction(
      currentAttendant.name,
      currentAttendant.guiche,
      allowedServices
    );
    if (!res.success) {
      alert(res.error || "Erro ao chamar senha");
    }
  };

  const handleRecall = async (ticketId: string) => {
    const res = await recallTicketAction(ticketId);
    if (!res.success) {
      alert(res.error || "Erro ao rechamar senha");
    }
  };

  const handleFinish = (ticketId: string) => {
    setTicketToFinish(ticketId);
    setObservation("");
    setShowFinishModal(true);
  };

  const confirmFinish = async () => {
    if (ticketToFinish) {
      const res = await finishTicketAction(ticketToFinish, observation);
      if (res.success) {
        setShowFinishModal(false);
        setTicketToFinish(null);
        setObservation("");
      } else {
        alert(res.error || "Erro ao finalizar senha");
      }
    }
  };

  const handleForward = async (ticketId: string, targetGuiche: string) => {
    const res = await forwardTicketAction(ticketId, targetGuiche, currentAttendant.name);
    if (res.success) {
      setShowForwardModal(false);
    } else {
      alert(res.error || "Erro ao encaminhar senha");
    }
  };

  const toggleService = (id: string) => {
    setAllowedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const availableTickets = allowedServices.length > 0
    ? queue.filter((t) => allowedServices.includes(t.type))
    : queue;

  const currentCall = history.find(
    (h) => h.attendant === currentAttendant.name && h.status === "calling"
  );

  return (
    <div className="min-h-[100dvh] w-full bg-sefaz-light flex p-2 md:p-4 font-sans">
      <div className="flex-1 flex overflow-hidden rounded-[32px] shadow-2xl border border-emerald-100 bg-white">
        {/* Sidebar Navigation */}
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
            <div className="p-4 rounded-2xl flex items-center gap-4 bg-white text-sefaz-dark shadow-lg cursor-pointer">
              <Monitor size={20} />
              <span className="font-bold text-sm tracking-tight">Painel Principal</span>
            </div>
            <button
              onClick={() => setShowServiceConfig(true)}
              className="w-full text-left p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 cursor-pointer text-emerald-100"
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

        {/* Main Content */}
        <div className="flex-1 p-10 flex flex-col space-y-8 overflow-auto relative">
          {/* Service Config Overlay */}
          {showServiceConfig && (
            <div className="absolute inset-0 z-50 bg-sefaz-light/95 backdrop-blur-md p-10">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-sefaz-dark">MEUS SERVIÇOS</h2>
                    <p className="text-sefaz-accent font-medium uppercase text-xs tracking-widest opacity-60">
                      Selecione quais senhas você pode chamar
                    </p>
                  </div>
                  <button
                    onClick={() => setShowServiceConfig(false)}
                    className="px-6 py-3 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleService(cat.id)}
                      className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                        allowedServices.includes(cat.id)
                          ? "border-sefaz-accent bg-emerald-50 shadow-md"
                          : "border-emerald-100 bg-white opacity-40 hover:opacity-100"
                      }`}
                    >
                      <p
                        className={`text-xs font-black uppercase tracking-tight ${
                          allowedServices.includes(cat.id)
                            ? "text-sefaz-accent"
                            : "text-sefaz-dark"
                        }`}
                      >
                        {cat.name}
                      </p>
                      <div
                        className={`mt-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          allowedServices.includes(cat.id)
                            ? "bg-sefaz-accent border-sefaz-accent"
                            : "border-emerald-200"
                        }`}
                      >
                        {allowedServices.includes(cat.id) && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <header className="flex justify-between items-end">
            <div className="flex items-center gap-6">
              <NextLink
                href="/"
                className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-sefaz-accent shadow-sm hover:shadow-xl hover:scale-110 transition-all border border-emerald-100/50"
              >
                <ArrowLeft size={28} />
              </NextLink>
              <div>
                <h2 className="text-3xl font-black text-sefaz-dark">CENTRAL DE CHAMADAS</h2>
                <p className="text-sefaz-accent font-medium">Gestão de fila em tempo real</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-sefaz-accent uppercase tracking-wider">
                    Na Minha Fila
                  </p>
                  <p className="text-2xl font-black text-sefaz-dark">{availableTickets.length}</p>
                </div>
                <Users size={32} className="text-sefaz-medium" />
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4 opacity-40">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-sefaz-accent uppercase tracking-wider">
                    Total Geral
                  </p>
                  <p className="text-2xl font-black text-sefaz-dark">{queue.length}</p>
                </div>
                <Users size={32} className="text-sefaz-accent/50" />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Action Card */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] shadow-sm border-2 border-emerald-50 p-10 flex flex-col items-center min-h-[400px] justify-center shadow-glow">
                {currentCall ? (
                  <div className="w-full text-center space-y-6 animate-fade-in">
                    <div className="inline-block px-4 py-1.5 bg-emerald-50 text-sefaz-accent rounded-full font-black text-xs tracking-widest mb-4 border border-emerald-100 uppercase">
                      Em Atendimento
                    </div>
                    <h3 className="text-[10rem] font-black leading-none text-sefaz-accent drop-shadow-sm mb-4">
                      {currentCall.id}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
                      <button
                        onClick={() => handleRecall(currentCall.id)}
                        className="min-w-[160px] flex-1 py-6 bg-white text-emerald-700 border-2 border-emerald-100 rounded-3xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <PhoneForwarded size={24} /> RECHAMAR
                      </button>
                      <button
                        onClick={() => setShowForwardModal(true)}
                        className="min-w-[160px] flex-1 py-6 bg-white text-amber-600 border-2 border-amber-100 rounded-3xl font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Send size={24} /> ENCAMINHAR
                      </button>
                      <button
                        onClick={() => handleFinish(currentCall.id)}
                        className="min-w-[160px] flex-1 py-6 bg-sefaz-accent text-white rounded-3xl font-bold hover:bg-sefaz-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
                      >
                        <CheckCircle2 size={24} /> FINALIZAR
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-8 py-10">
                    <div className="w-24 h-24 bg-sefaz-light rounded-full flex items-center justify-center mx-auto text-sefaz-accent animate-pulse">
                      <Users size={48} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-sefaz-dark">Ninguém sendo atendido</h3>
                      <p className="text-sefaz-accent/60 font-medium">
                        Clique no botão abaixo para chamar o próximo da fila
                      </p>
                      {allowedServices.length > 0 && (
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">
                          Filtrando por {allowedServices.length} serviços selecionados
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleCall}
                      disabled={availableTickets.length === 0}
                      className="px-12 py-6 bg-sefaz-accent text-white rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-950/30 disabled:grayscale disabled:opacity-50 cursor-pointer"
                    >
                      CHAMAR PRÓXIMO
                    </button>
                  </div>
                )}
              </div>

              {/* Forward Modal */}
              <AnimatePresence>
                {showForwardModal && currentCall && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowForwardModal(false)}
                      className="absolute inset-0 bg-sefaz-dark/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden"
                    >
                      <div className="p-8 border-b border-emerald-50 flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                            Encaminhar Senha: {currentCall.id}
                          </h3>
                          <p className="text-sm font-medium text-sefaz-accent/60">
                            Selecione o guichê de destino
                          </p>
                        </div>
                        <button
                          onClick={() => setShowForwardModal(false)}
                          className="p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors cursor-pointer"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <div className="p-8 grid grid-cols-2 gap-4">
                        {attendants
                          .filter((g) => g !== currentAttendant.guiche)
                          .map((guiche) => (
                            <button
                              key={guiche}
                              onClick={() => handleForward(currentCall.id, guiche)}
                              className="p-6 bg-emerald-50/50 hover:bg-emerald-100/50 border-2 border-emerald-100 rounded-3xl text-left transition-all group cursor-pointer"
                            >
                              <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest mb-1">
                                Destino
                              </p>
                              <p className="text-lg font-black text-sefaz-dark group-hover:text-sefaz-accent transition-colors">
                                {guiche}
                              </p>
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Finish Modal with Observation */}
              <AnimatePresence>
                {showFinishModal && ticketToFinish && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowFinishModal(false)}
                      className="absolute inset-0 bg-sefaz-dark/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden"
                    >
                      <div className="p-8 border-b border-emerald-50 flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                            Finalizar Atendimento: {ticketToFinish}
                          </h3>
                          <p className="text-sm font-medium text-sefaz-accent/60">
                            Deseja adicionar alguma observação?
                          </p>
                        </div>
                        <button
                          onClick={() => setShowFinishModal(false)}
                          className="p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors cursor-pointer"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <div className="p-8 space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest">
                              Observações (Opcional)
                            </label>
                            <span
                              className={`text-[10px] font-bold ${
                                observation.length > 280 ? "text-red-500" : "text-sefaz-accent/40"
                              }`}
                            >
                              {observation.length}/300
                            </span>
                          </div>
                          <textarea
                            value={observation}
                            onChange={(e) => setObservation(e.target.value.slice(0, 300))}
                            placeholder="Digite aqui detalhes sobre o atendimento..."
                            className="w-full h-32 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-sefaz-accent transition-colors resize-none"
                          />
                        </div>

                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setShowFinishModal(false)}
                            className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer"
                          >
                            VOLTAR
                          </button>
                          <button
                            type="button"
                            onClick={confirmFinish}
                            className="flex-1 py-4 bg-sefaz-accent text-white rounded-2xl font-bold hover:bg-sefaz-dark transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
                          >
                            FINALIZAR AGORA
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Guichê Selection Modal */}
              <AnimatePresence>
                {showGuicheModal && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowGuicheModal(false)}
                      className="absolute inset-0 bg-sefaz-dark/80 backdrop-blur-md"
                    />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden"
                    >
                      <div className="p-8 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/30">
                        <div>
                          <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                            Alterar Guichê
                          </h3>
                          <p className="text-xs font-bold text-sefaz-accent/60 uppercase tracking-widest">
                            Selecione o seu local de atendimento
                          </p>
                        </div>
                        <button
                          onClick={() => setShowGuicheModal(false)}
                          className="p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors cursor-pointer"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <div className="p-8">
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                          {Array.from({ length: 20 }, (_, i) => {
                            const guicheNum = (i + 1).toString().padStart(2, "0");
                            const guicheName = `Guichê ${guicheNum}`;
                            const isCurrent = currentAttendant.guiche === guicheName;

                            return (
                              <button
                                key={guicheNum}
                                onClick={() => {
                                  setCurrentAttendant((prev) => ({
                                    ...prev,
                                    guiche: guicheName,
                                  }));
                                  setShowGuicheModal(false);
                                }}
                                className={`p-4 rounded-2xl font-black text-lg transition-all border-2 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                  isCurrent
                                    ? "bg-sefaz-accent border-sefaz-accent text-white shadow-lg"
                                    : "bg-emerald-50/50 border-emerald-50 text-sefaz-dark hover:border-emerald-200 hover:bg-emerald-100/50"
                                }`}
                              >
                                <span className="text-[10px] opacity-40 uppercase tracking-widest">
                                  No
                                </span>
                                {guicheNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* History Detail Modal */}
              <AnimatePresence>
                {selectedHistoryTicket && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedHistoryTicket(null)}
                      className="absolute inset-0 bg-sefaz-dark/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden"
                    >
                      <div className="p-8 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/30">
                        <div>
                          <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                            CUPOM: {selectedHistoryTicket.id}
                          </h3>
                          <p className="text-xs font-bold text-sefaz-accent/60 uppercase tracking-widest">
                            Detalhes do Atendimento
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedHistoryTicket(null)}
                          className="p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors cursor-pointer"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                              Chamado às
                            </p>
                            <p className="text-lg font-black text-sefaz-dark">
                              {new Date(selectedHistoryTicket.calledAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                              Atendente
                            </p>
                            <p className="text-lg font-black text-sefaz-dark">
                              {selectedHistoryTicket.attendant}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                              Guichê
                            </p>
                            <p className="text-lg font-black text-sefaz-dark">
                              {selectedHistoryTicket.guiche}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                              Status
                            </p>
                            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                              Finalizado
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                          <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                            Observações Registradas
                          </p>
                          <p className="text-sm font-medium text-sefaz-dark leading-relaxed italic">
                            {selectedHistoryTicket.observation ||
                              "Nenhuma observação registrada para este atendimento."}
                          </p>
                        </div>

                        <button
                          onClick={() => setSelectedHistoryTicket(null)}
                          className="w-full py-4 bg-sefaz-accent text-white rounded-2xl font-bold hover:bg-sefaz-dark transition-all cursor-pointer"
                        >
                          FECHAR DETALHES
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Queue Preview */}
              <div className="bg-white rounded-[40px] shadow-sm border border-emerald-100 p-10">
                <h4 className="text-xl font-black text-sefaz-dark mb-6 tracking-tighter uppercase">
                  Minha Fila de Espera
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {availableTickets.slice(0, 8).map((t) => (
                    <div
                      key={t.id}
                      className={`p-6 rounded-2xl border-2 text-center transition-colors ${
                        t.priority === "Prioritário"
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-emerald-50 bg-white"
                      }`}
                    >
                      <p
                        className={`text-2xl font-black ${
                          t.priority === "Prioritário" ? "text-emerald-700" : "text-sefaz-accent"
                        }`}
                      >
                        {t.id}
                      </p>
                      <p className="text-[10px] font-bold text-sefaz-accent/50 uppercase tracking-widest">
                        {t.priority === "Prioritário" ? "Prioridade" : "Normal"}
                      </p>
                    </div>
                  ))}
                  {availableTickets.length === 0 && (
                    <div className="col-span-4 py-12 text-center text-emerald-200 font-medium italic">
                      Sem tickets compatíveis aguardando...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side Info */}
            <div className="space-y-8">
              <div className="bg-white rounded-[40px] shadow-sm border border-emerald-100 p-8 min-h-[400px]">
                <h4 className="text-xl font-black text-sefaz-dark mb-6 uppercase tracking-tighter">
                  Histórico Pessoal
                </h4>
                <div className="space-y-4">
                  {history
                    .filter(
                      (h) => h.attendant === currentAttendant.name && h.status !== "calling"
                    )
                    .slice(0, 5)
                    .map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedHistoryTicket(h)}
                        className="w-full text-left flex justify-between items-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50 hover:border-emerald-200 hover:bg-emerald-100/30 transition-all group cursor-pointer"
                      >
                        <div>
                          <p className="font-black text-lg text-sefaz-accent group-hover:text-sefaz-dark transition-colors">
                            {h.id}
                          </p>
                          <p className="text-[10px] text-sefaz-accent/40 font-bold uppercase tracking-widest">
                            {new Date(h.calledAt || "").toLocaleTimeString()}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          Ver Detalhes
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
