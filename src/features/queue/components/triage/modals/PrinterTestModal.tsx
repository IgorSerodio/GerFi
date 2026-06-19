import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Printer } from "lucide-react";

interface PrinterTestModalProps {
  show: boolean;
  onClose: () => void;
  printerStatus: "idle" | "testing" | "success" | "error";
}

export default function PrinterTestModal({
  show,
  onClose,
  printerStatus,
}: PrinterTestModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl border border-emerald-100 relative overflow-hidden"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Printer size={32} />
              </div>
              <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                Status da Impressora
              </h3>
              <p className="text-xs text-sefaz-accent font-bold opacity-60">
                Verificando comunicação com o hardware...
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-2xl border-2 border-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      printerStatus === "testing"
                        ? "bg-amber-400 animate-pulse"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-sm font-black text-sefaz-dark uppercase tracking-widest">
                    {printerStatus === "testing"
                      ? "Comunicando..."
                      : "Terminal Online"}
                  </span>
                </div>
                {printerStatus === "success" && (
                  <div className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-lg">
                    Pronto
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl border-2 border-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      printerStatus === "testing"
                        ? "bg-slate-200"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-sm font-black text-sefaz-dark uppercase tracking-widest">
                    Bobina de Papel
                  </span>
                </div>
                {printerStatus === "success" && (
                  <div className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-lg">
                    OK
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-emerald-50 space-y-3">
              {printerStatus === "success" ? (
                <>
                  <button
                    onClick={onClose}
                    className="w-full py-4 bg-sefaz-dark text-white rounded-2xl font-black tracking-widest hover:bg-black transition-all text-xs uppercase cursor-pointer"
                  >
                    Imprimir Ticket de Teste
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-sefaz-accent font-bold text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    Fechar Diagnóstico
                  </button>
                </>
              ) : (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest animate-pulse">
                    Aguardando resposta...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
