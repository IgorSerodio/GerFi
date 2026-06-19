import React from "react";

export default function TvFooter() {
  return (
    <footer className="bg-emerald-950 text-white h-14 rounded-2xl flex items-center overflow-hidden shrink-0 border-t border-white/5 shadow-2xl px-6">
      <div className="flex-1 overflow-hidden relative z-10 h-full flex items-center">
        <div className="animate-marquee whitespace-nowrap text-2xl font-bold opacity-90 uppercase tracking-tight inline-flex flex-row flex-nowrap shrink-0 items-center gap-20 w-max">
          <div className="inline-flex items-center gap-4 text-emerald-400 shrink-0 whitespace-nowrap">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />{" "}
            {'USE O PORTAL "FAZENDA MUNICIPAL" PARA CONSULTAS RÁPIDAS'}
          </div>
          <div className="inline-flex items-center gap-4 text-emerald-100 shrink-0 whitespace-nowrap">
            <div className="w-2 h-2 bg-white rounded-full" /> HORÁRIO DE
            ATENDIMENTO PRESENCIAL: 08H ÀS 14H
          </div>
          <div className="inline-flex items-center gap-4 text-emerald-400 shrink-0 whitespace-nowrap">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" /> ATENÇÃO:
            Contribuintes com parcelamento em atraso podem regularizar seus
            débitos
          </div>
          <div className="inline-flex items-center gap-4 text-emerald-100 shrink-0 whitespace-nowrap">
            <div className="w-2 h-2 bg-white rounded-full" /> EMISSÃO DE NOTA
            FISCAL ELETRÔNICA DISPONÍVEL 24H
          </div>
        </div>
      </div>
    </footer>
  );
}
