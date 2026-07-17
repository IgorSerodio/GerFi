import React from "react";

interface ReportsKpiPanelProps {
  stats: {
    total: number | string;
    avgWait: string;
    avgService: string;
    efficiency: string;
  };
}

export default function ReportsKpiPanel({ stats }: ReportsKpiPanelProps) {
  return (
    <div className="grid grid-cols-4 gap-6 bg-emerald-50/30 p-8 rounded-[32px] border border-emerald-100/50 text-center">
      <div>
        <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
          Total Senhas
        </p>
        <p className="text-3xl font-black text-sefaz-dark">
          {stats.total}
        </p>
      </div>
      <div className="border-x border-emerald-100/50">
        <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
          Tempo Médio de Espera
        </p>
        <p className="text-3xl font-black text-sefaz-dark">
          {stats.avgWait}
        </p>
      </div>
      <div className="border-r border-emerald-100/50">
        <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
          Tempo Médio de Atend.
        </p>
        <p className="text-3xl font-black text-sefaz-dark">
          {stats.avgService}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest opacity-60">
          Volume Concluído
        </p>
        <p className="text-3xl font-black text-emerald-600">
          {stats.efficiency}
        </p>
      </div>
    </div>
  );
}
