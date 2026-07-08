import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Clock, Info, History, Printer, X } from "lucide-react";
import { SearchResult } from "./types";
import { Ticket as TicketType } from "@/features/queue/types";
import { Session } from "next-auth";

interface TriageSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  searchResult: SearchResult | null;
  setSearchResult: (result: SearchResult | null) => void;
  recentIssues: TicketType[];
  setIssuedTicket: (ticket: TicketType) => void;
  session: Session | null;
}

export default function TriageSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  searchQuery,
  setSearchQuery,
  handleSearch,
  searchResult,
  setSearchResult,
  recentIssues,
  setIssuedTicket,
  session,
}: TriageSidebarProps) {
  return (
    <>
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

      <aside
        className={`absolute lg:relative z-50 h-full lg:h-auto w-80 bg-white border-r border-emerald-50 flex flex-col p-6 overflow-hidden transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors"
        >
          <X size={24} />
        </button>

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
                      {searchResult.status !== "not_found"
                        ? searchResult.ticket.categoryName
                        : "Senha não encontrada"}
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
                      {searchResult.ahead > 0 && (
                        <p className="text-[10px] text-emerald-400 opacity-80 mt-1">
                          ({searchResult.priorityAhead} prioritárias, {searchResult.normalAhead} normais)
                        </p>
                      )}
                    </div>
                  )}

                  {(searchResult.status === "calling" ||
                    searchResult.status === "started" ||
                    searchResult.status === "completed") && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Info size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Já Chamada
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-tight">
                        Dirija-se ao{" "}
                        <span className="text-amber-400">
                          {searchResult.guiche}
                        </span>
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
            <p className="text-[10px] text-sefaz-accent font-bold mt-1">
              Últimas 10 senhas
            </p>
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
                <span className={`text-xl font-black ${ticket.priority === "Prioritário" ? "text-red-600" : "text-sefaz-dark"}`}>
                  {ticket.ticketNumber}
                </span>
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
            <p className="text-[10px] font-black uppercase mb-1 opacity-60">
              Operador Logado
            </p>
            <p className="text-sm font-bold">
              {session?.user?.name || "Operador de Triagem"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
