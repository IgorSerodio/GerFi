import React from "react";
import { PerformanceRow } from "@/features/reports/queries/performance";

interface PerformanceTableProps {
  rows: PerformanceRow[];
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

export default function PerformanceTable({ rows }: PerformanceTableProps) {
  return (
    <div className="rounded-[32px] border border-emerald-50 overflow-hidden mt-6">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-emerald-50/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Servidor</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Tickets Atendidos</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">T.M. Espera</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">T.M. Chamada</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">T.M. Atendimento</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Tempo Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {rows.map((row, i: number) => {
              return (
                <tr key={i} className="hover:bg-emerald-50/30">
                  <td className="px-6 py-4 text-xs font-black text-sefaz-accent">
                    {row.attendant}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                    {row.ticketsAnswered}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-amber-600">
                    {formatDuration(row.avgWaitSeconds)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-blue-600">
                    {formatDuration(row.avgCallSeconds)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-emerald-600">
                    {formatDuration(row.avgServiceSeconds)}
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-purple-600">
                    {formatDuration(row.totalAvgSeconds)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-xs font-medium text-sefaz-accent opacity-60 uppercase tracking-widest">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
