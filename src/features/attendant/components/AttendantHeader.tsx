import React from "react";
import NextLink from "next/link";
import { ArrowLeft, Users } from "lucide-react";
interface AttendantHeaderProps {
  availableTicketsCount: number;
  totalQueueCount: number;
}

export default function AttendantHeader({
  availableTicketsCount,
  totalQueueCount,
}: AttendantHeaderProps) {
  return (
    <header className="flex justify-between items-end">
      <div className="flex items-center gap-6">
        <NextLink
          href="/"
          className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-sefaz-accent shadow-sm hover:shadow-xl hover:scale-110 transition-all border border-emerald-100/50"
        >
          <ArrowLeft size={28} />
        </NextLink>
        <div>
          <h2 className="text-3xl font-black text-sefaz-dark flex items-center gap-4">
            CENTRAL DE CHAMADAS
          </h2>
          <p className="text-sefaz-accent font-medium">
            Gestão de fila em tempo real
          </p>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-sefaz-accent uppercase tracking-wider">
              Na Minha Fila
            </p>
            <p className="text-2xl font-black text-sefaz-dark">
              {availableTicketsCount}
            </p>
          </div>
          <Users size={32} className="text-sefaz-medium" />
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4 opacity-40">
          <div className="text-right">
            <p className="text-[10px] font-bold text-sefaz-accent uppercase tracking-wider">
              Total Geral
            </p>
            <p className="text-2xl font-black text-sefaz-dark">
              {totalQueueCount}
            </p>
          </div>
          <Users size={32} className="text-sefaz-accent/50" />
        </div>
      </div>
    </header>
  );
}
