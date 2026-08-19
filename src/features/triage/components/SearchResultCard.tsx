import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Info, Printer } from "lucide-react";
import { SearchResult } from "./types";
import { Ticket as TicketType } from "@/features/queue/types";

interface SearchResultCardProps {
  searchResult: SearchResult | null;
  setSearchResult: (result: SearchResult | null) => void;
  setIssuedTicket: (ticket: TicketType) => void;
  setSelectedDetailTicket?: (ticket: TicketType | null) => void;
}

export default function SearchResultCard({
  searchResult,
  setSearchResult,
  setIssuedTicket,
  setSelectedDetailTicket,
}: SearchResultCardProps) {
  return (
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
              searchResult.status === "started") && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400">
                  <Info size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Em Atendimento
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight">
                  Dirija-se ao{" "}
                  <span className="text-amber-400">
                    {searchResult.guicheAlias || searchResult.guiche}
                  </span>
                </p>
              </div>
            )}

            {searchResult.status === "completed" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Info size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Finalizado
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight">
                  Atendimento concluído no{" "}
                  <span className="text-emerald-400">
                    {searchResult.guicheAlias || searchResult.guiche}
                  </span>
                </p>
              </div>
            )}

            {searchResult.status === "no_show" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-400">
                  <Info size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Não Compareceu
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight">
                  Chamada encerrada no{" "}
                  <span className="text-red-400">
                    {searchResult.guicheAlias || searchResult.guiche}
                  </span>
                </p>
              </div>
            )}

            {searchResult.status === "forwarded" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-400">
                  <Info size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Encaminhada
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight">
                  Senha foi encaminhada pelo{" "}
                  <span className="text-blue-400">
                    {searchResult.guicheAlias || searchResult.guiche}
                  </span>
                </p>
              </div>
            )}

            {searchResult.status === "not_found" && (
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                Senha não encontrada
              </p>
            )}

            {searchResult.status !== "not_found" && searchResult.ticket && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setSelectedDetailTicket && setSelectedDetailTicket(searchResult.ticket!)}
                  className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors uppercase tracking-widest text-center"
                >
                  Detalhes
                </button>
                <button
                  onClick={() => setIssuedTicket(searchResult.ticket!)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                  title="Imprimir novamente"
                >
                  <Printer size={16} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
