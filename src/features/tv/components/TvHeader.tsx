import React from "react";
import NextLink from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatTime } from "@/utils/dateFormatter";

interface TvHeaderProps {
  time: Date;
}

export default function TvHeader({ time }: TvHeaderProps) {
  return (
    <header className="flex justify-between items-stretch bg-white rounded-[30px] pl-6 pr-0 shadow-xl border border-emerald-50/50 h-20 shrink-0">
      <div className="flex items-center gap-4">
        <NextLink
          href="/"
          className="w-12 h-12 bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent rounded-2xl flex items-center justify-center p-2.5 shadow-inner hover:scale-105 transition-transform"
        >
          <ArrowLeft size={20} />
        </NextLink>
        <div>
          <h1 className="text-2xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-0.5">
            Prefeitura de Caruaru
          </h1>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[8px] opacity-70">
            Secretaria da Fazenda Municipal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 h-full">
        <div className="text-right py-4">
          <div className="text-4xl font-black text-emerald-900 tracking-tighter tabular-nums leading-none">
            {time
              ? formatTime(time, { showSeconds: true })
              : "--:--:--"}
          </div>
          <div className="text-emerald-500 font-black uppercase tracking-widest text-[8px] mt-0.5 pr-1">
            {time
              ? time.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "..."}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 px-6 flex items-center justify-center text-white relative overflow-hidden group border-l border-emerald-800/20 h-full rounded-r-[30px] rounded-l-none shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg shadow-glow-sm transform group-hover:scale-105 transition-transform shrink-0">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://sefaz.caruaru.pe.gov.br"
                alt="QR Code"
                className="w-12 h-12"
              />
            </div>
            <div className="shrink-0 text-left">
              <p className="text-[8px] uppercase font-black tracking-[0.2em] text-emerald-400 leading-none">
                ATENDIMENTO
              </p>
              <p className="text-[8px] uppercase font-black tracking-[0.2em] text-white leading-none mt-1">
                VIRTUAL
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
