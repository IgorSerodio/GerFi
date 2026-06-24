import React from "react";
import { motion } from "motion/react";
import { Save } from "lucide-react";

interface PrinterConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function PrinterConfigView({ triggerSuccess }: PrinterConfigViewProps) {
  return (
    <motion.div
      key="config_printer"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-xl mx-auto bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm space-y-8"
    >
      <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
        Triagem & Parâmetros Térmicos
      </h3>

      <div className="space-y-6">
        <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-sefaz-dark uppercase">Conexão da Impressora</p>
            <p className="text-[9px] text-sefaz-accent font-bold uppercase opacity-60">
              Dispositivo local: USB Thermal Printer PRN-58
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-black text-[9px] uppercase rounded-md">
            Online
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-sefaz-dark">Corte Automático do Papel (Autocut)</p>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-sefaz-accent" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-sefaz-dark">Imprimir Código de Barras (Barcode)</p>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-sefaz-accent" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-sefaz-dark">Alertas Sonoros na Emissão</p>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-sefaz-accent" />
          </div>
        </div>

        <button
          onClick={() => triggerSuccess("Configurações da impressora salvas!")}
          className="w-full py-5 bg-sefaz-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-sefaz-dark transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Save size={18} /> Salvar Parâmetros Impressora
        </button>
      </div>
    </motion.div>
  );
}
