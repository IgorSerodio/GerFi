import React from "react";

export interface DetailRow {
  time: string;
  started: string;
  completed: string;
  ref: string;
  desk: string;
  user: string;
  status: string;
}

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
            {rows.map((row, i: number) => (
              <tr key={i} className="hover:bg-emerald-50/30">
                <td className="px-6 py-4 text-xs font-black text-sefaz-accent">
                  {row.ref}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                  {row.time}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                  {row.started}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                  {row.completed}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                  {row.desk}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-sefaz-accent">
                  {row.user}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${
                      row.status === "CONCLUÍDO" ? "bg-emerald-100 text-emerald-700"
                      : row.status === "NÃO COMPARECEU" ? "bg-red-100 text-red-700"
                      : row.status === "ENCAMINHADO" ? "bg-blue-100 text-blue-700"
                      : row.status === "EM ATENDIMENTO" ? "bg-amber-100 text-amber-700"
                      : row.status === "CHAMADO" ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
