import React from "react";
import { Trash2 } from "lucide-react";
import { DbTicketWindow } from "@/features/management/types";;

interface TicketWindowsListProps {
  ticketWindows: DbTicketWindow[];
  selectedLocationId: number | null;
  onCreateTicketWindow: () => void;
  onDeleteTicketWindow: (id: number) => void;
}

export function TicketWindowsList({
  ticketWindows,
  selectedLocationId,
  onCreateTicketWindow,
  onDeleteTicketWindow,
}: TicketWindowsListProps) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm flex flex-col h-[600px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
          Guichês
        </h3>
        {selectedLocationId !== null && (
          <button
            onClick={onCreateTicketWindow}
            className="px-4 py-2 bg-sefaz-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all cursor-pointer"
          >
            + Guichê
          </button>
        )}
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 border border-emerald-50 rounded-2xl p-2 bg-emerald-50/20">
        {selectedLocationId === null ? (
          <div className="h-full flex items-center justify-center text-sm font-bold text-emerald-600/50">
            Selecione um local ao lado.
          </div>
        ) : ticketWindows.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-bold text-emerald-600/50">
            Nenhum guichê neste local.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-emerald-50/50 sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase">ID</th>
                <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase">Nome</th>
                <th className="px-4 py-3 text-[10px] font-black text-sefaz-accent uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {ticketWindows.map((tw) => (
                <tr key={tw.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-sefaz-accent">#{tw.id}</td>
                  <td className="px-4 py-3 text-xs font-black text-sefaz-dark">{tw.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onDeleteTicketWindow(tw.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
