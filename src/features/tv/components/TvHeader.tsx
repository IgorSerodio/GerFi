import React from "react";
import Image from "next/image";
import { formatTime } from "@/utils/dateFormatter";

interface TvHeaderProps {
  time: Date;
}

export default function TvHeader({ time }: TvHeaderProps) {
  return (
    <header className="flex justify-between items-stretch bg-white rounded-[2vw] pl-[2vw] pr-0 shadow-xl border border-emerald-50/50 h-[12vh] shrink-0">
      <div className="flex items-center gap-[1vw]">
        <div className="flex items-center justify-center mr-[1vw]">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/0/09/Caruaru_brasao.svg"
            alt="Brasão de Caruaru"
            width={80}
            height={80}
            className="w-[8vh] h-[8vh] object-contain drop-shadow-sm"
          />
        </div>
        <div>
          <h1 className="text-[6vh] font-black text-emerald-900 tracking-tighter leading-none mb-[0.5vh] uppercase">
            Prefeitura de Caruaru
          </h1>
          <p className="text-[1.8vh] font-black uppercase tracking-widest text-emerald-500 opacity-70">
            Secretaria da Fazenda Municipal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-[2vw] h-full">
        <div className="text-right py-[1.5vh]">
          <div className="text-[6vh] font-black text-emerald-900 tracking-tighter tabular-nums leading-none">
            {time
              ? formatTime(time, { showSeconds: true })
              : "--:--:--"}
          </div>
          <div className="text-emerald-500 font-black uppercase tracking-widest text-[1.8vh] mt-[0.5vh] pr-1">
            {time
              ? time.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "..."}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 px-[2vw] flex items-center justify-center text-white relative overflow-hidden group border-l border-emerald-800/20 h-full rounded-r-[2vw] rounded-l-none shrink-0">
          <div className="absolute top-0 right-0 w-[15vh] h-[15vh] bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-[5vw] -mt-[5vw]" />
          <div className="relative z-10 flex items-center gap-[1vw]">
            <div className="bg-white p-[0.5vh] rounded-[0.5vw] shadow-glow-sm transform group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://sefaz.caruaru.pe.gov.br"
                alt="QR Code"
                width={48}
                height={48}
                className="w-[6vh] h-[6vh]"
              />
            </div>
            <div className="shrink-0 text-left">
              <p className="text-[1.5vh] uppercase font-black tracking-[0.2em] text-emerald-400 leading-none">
                ATENDIMENTO
              </p>
              <p className="text-[1.5vh] uppercase font-black tracking-[0.2em] text-white leading-none mt-[0.5vh]">
                VIRTUAL
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
