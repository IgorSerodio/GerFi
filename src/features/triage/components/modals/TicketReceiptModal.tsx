import React from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Printer } from "lucide-react";
import { Ticket as TicketType } from "@/features/queue/types";;;

interface TicketReceiptModalProps {
  issuedTicket: TicketType | null;
  onClose: () => void;
}

export default function TicketReceiptModal({
  issuedTicket,
  onClose,
}: TicketReceiptModalProps) {
  return (
    <Modal 
      isOpen={!!issuedTicket} 
      onClose={onClose}
      zIndex="z-[70]"
      className="!bg-transparent !border-none !shadow-none !p-0 w-auto flex items-center justify-center"
    >
      {issuedTicket && (
        <div className="relative">
            {/* Thermal Receipt Visual */}
            <motion.div
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="bg-white text-gray-800 p-8 shadow-2xl w-[320px] relative overflow-hidden"
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* Torn edge effect top */}
              <div className="absolute top-0 left-0 w-full h-2 flex">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 bg-sefaz-dark rounded-full -mt-2"
                  />
                ))}
              </div>

              <div className="text-center font-bold text-xs border-b border-dashed border-gray-300 pb-4 mb-4">
                <p className="text-[10px] uppercase tracking-tight font-medium">
                  Município de Caruaru
                </p>
                <p className="text-[11px] uppercase tracking-tight font-black leading-tight">
                  Secretaria da Fazenda Municipal
                </p>
                <p className="text-[9px] opacity-60 mt-1">
                  CNPJ: 10.091.536/0001-13
                </p>
              </div>

              <div className="text-center py-6">
                <p className="text-4xl font-black uppercase tracking-tight mb-2 leading-none">
                  {issuedTicket.categoryName}
                </p>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                  {issuedTicket.priority === "Prioritário"
                    ? "PRIORITÁRIO"
                    : "GERAL"}
                </div>
                <h2 className="text-7xl font-black tracking-tighter mb-2">
                  {issuedTicket.ticketNumber}
                </h2>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-4 mb-6 space-y-1 text-[10px] font-bold">
                <div className="flex justify-between">
                  <span>DATA:</span>
                  <span>{new Date(issuedTicket.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>HORA:</span>
                  <span>{new Date(issuedTicket.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>POSTO:</span>
                  <span>TRIAGEM CENTRAL</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-[9px] font-bold leading-tight mb-4">
                  AGUARDE SER CHAMADO NO PAINEL PRINCIPAL
                  <br />
                  TEMPO MÉDIO DE ESPERA: 15 MIN
                </p>

                <div className="border border-dashed border-gray-400 p-2 mb-4 mx-4">
                  <p className="text-[8px] uppercase font-bold tracking-widest mb-1">
                    CÓDIGO DE INICIALIZAÇÃO
                  </p>
                  <p className="text-xl font-black tracking-[0.2em] leading-none">
                    {issuedTicket.securityCode}
                  </p>
                </div>

                {/* Fake barcode */}
                <div className="h-10 w-full bg-gray-200 flex justify-center items-center overflow-hidden mb-2">
                  {[...Array(40)].map((_, i) => (
                    <div
                      key={i}
                      className="h-full bg-black mx-[1px]"
                      style={{
                        width: i % 3 === 0 || i % 7 === 0 ? "2px" : "1px",
                      }}
                    />
                  ))}
                </div>
                <p className="text-[8px] font-bold tracking-[0.4em]">
                  {issuedTicket.ticketNumber}2024SFM
                </p>
              </div>

              {/* Torn edge effect bottom */}
              <div className="absolute bottom-0 left-0 w-full h-2 flex">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 bg-white rounded-full -mb-2"
                  />
                ))}
              </div>
            </motion.div>

            {/* Close Button UI */}
            <button
              onClick={onClose}
              className="absolute -top-6 -right-6 w-12 h-12 bg-white text-sefaz-dark rounded-full shadow-lg flex items-center justify-center font-black border-2 border-emerald-50 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Fechar"
            >
              ✕
            </button>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black tracking-widest shadow-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer size={18} /> IMPRIMIR & SAIR
              </button>
            </div>
          </div>
        )}
    </Modal>
  );
}
