import React from "react";
import { DetailRow } from "@/features/reports/actions";
import { getTicketStatusLabel } from "@/utils/ticketStatus";

interface AnalyticalTableProps {
  rows: DetailRow[];
}

const formatDate = (isoStr: string | null) => {
  if (!isoStr) return "-";
  return new Date(isoStr).toLocaleString("pt-BR");
};

const formatTime = (isoStr: string | null) => {
  if (!isoStr) return "-";
  return new Date(isoStr).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};



export default function AnalyticalTable({ rows }: AnalyticalTableProps) {
  return (
    <div className="rounded-[32px] border border-emerald-50 overflow-hidden mt-6">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-emerald-50/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Senha</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Criado</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Iniciado</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Finalizado</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Guichê</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Servidor</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {rows.map((row, i: number) => {
              const mappedStatus = getTicketStatusLabel(row.status).toUpperCase();
              const origTime = formatTime(row.originalCreatedAt);
              const origStarted = row.originalStartedAt ? formatTime(row.originalStartedAt) : null;
              const origCompleted = row.originalCompletedAt ? formatTime(row.originalCompletedAt) : null;

              const timeStr = row.isForwarded ? `${formatDate(row.createdAt)} (Orig: ${origTime})` : formatDate(row.createdAt);
              const startedStr = row.startedAt ? (row.isForwarded && origStarted ? `${formatDate(row.startedAt)} (Orig: ${origStarted})` : formatDate(row.startedAt)) : "-";
              const completedStr = row.completedAt ? (row.isForwarded && origCompleted ? `${formatDate(row.completedAt)} (Orig: ${origCompleted})` : formatDate(row.completedAt)) : "-";
              
              const deskStr = row.desk ? row.desk.replace("Guichê ", "") : "-";
              const refStr = row.isForwarded ? `ENCAM. DE ${row.ticketNumber}` : row.ticketNumber;
              const userStr = row.user || "-";

              return (
                <tr key={i} className="hover:bg-emerald-50/30">
                  <td className="px-6 py-4 text-xs font-black text-sefaz-accent">
                    {refStr}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                    {timeStr}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                    {startedStr}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                    {completedStr}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                    {deskStr}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                    {userStr}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${
                        mappedStatus === "CONCLUÍDO" ? "bg-emerald-100 text-emerald-700"
                        : mappedStatus === "NÃO COMPARECEU" ? "bg-red-100 text-red-700"
                        : mappedStatus === "ENCAMINHADO" ? "bg-blue-100 text-blue-700"
                        : mappedStatus === "EM ATENDIMENTO" ? "bg-amber-100 text-amber-700"
                        : mappedStatus === "CHAMADO" ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {mappedStatus}
                    </span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
