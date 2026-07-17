import React from "react";
import { DetailRow } from "@/features/reports/actions";
import { getTicketStatusLabel, getTicketStatusColorClass } from "@/utils/ticketStatus";
import { formatTime, formatDate, formatDateTime } from "@/utils/dateFormatter";

interface AnalyticalTableProps {
  rows: DetailRow[];
}

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
              const origTime = formatTime(row.originalCreatedAt, { showSeconds: true });
              const origStarted = row.originalStartedAt ? formatTime(row.originalStartedAt, { showSeconds: true }) : null;
              const origCompleted = row.originalCompletedAt ? formatTime(row.originalCompletedAt, { showSeconds: true }) : null;

              const timeStr = row.isForwarded ? `${formatDateTime(row.createdAt, { showSeconds: true })} (Orig: ${origTime})` : formatDateTime(row.createdAt, { showSeconds: true });
              const startedStr = row.startedAt ? (row.isForwarded && origStarted ? `${formatDateTime(row.startedAt, { showSeconds: true })} (Orig: ${origStarted})` : formatDateTime(row.startedAt, { showSeconds: true })) : "-";
              const completedStr = row.completedAt ? (row.isForwarded && origCompleted ? `${formatDateTime(row.completedAt, { showSeconds: true })} (Orig: ${origCompleted})` : formatDateTime(row.completedAt, { showSeconds: true })) : "-";
              
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
                      className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${getTicketStatusColorClass(row.status)}`}
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
