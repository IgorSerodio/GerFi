import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { PrinterConfig } from "@/features/printer/types";
import { Save } from "lucide-react";

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: PrinterConfig = {
  paperSize: "58mm",
  printBarcode: true,
  autocut: true,
  soundAlert: true,
};

export default function PrinterConfigModal({ isOpen, onClose }: PrinterConfigModalProps) {
  const [config, setConfig] = useState<PrinterConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem("printerConfig");
        if (stored) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(stored) });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("printerConfig", JSON.stringify(config));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6 mt-4">
        <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight">
          Configurações de Impressão
        </h3>
        
        {/* Largura da Bobina */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-sefaz-dark">Tamanho da Bobina</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="paperSize" 
                value="58mm"
                checked={config.paperSize === "58mm"}
                onChange={() => setConfig({ ...config, paperSize: "58mm" })}
                className="accent-sefaz-accent w-4 h-4"
              />
              <span className="text-sm text-sefaz-dark">58mm (Padrão)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="paperSize" 
                value="80mm"
                checked={config.paperSize === "80mm"}
                onChange={() => setConfig({ ...config, paperSize: "80mm" })}
                className="accent-sefaz-accent w-4 h-4"
              />
              <span className="text-sm text-sefaz-dark">80mm</span>
            </label>
          </div>
        </div>

        <hr className="border-emerald-100" />

        {/* Checkboxes */}
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-bold text-sefaz-dark group-hover:text-sefaz-accent transition-colors">
              Imprimir Código de Barras
            </span>
            <input 
              type="checkbox" 
              checked={config.printBarcode}
              onChange={(e) => setConfig({ ...config, printBarcode: e.target.checked })}
              className="accent-sefaz-accent w-5 h-5 rounded-md cursor-pointer"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-bold text-sefaz-dark group-hover:text-sefaz-accent transition-colors">
              Corte Automático (Autocut)
            </span>
            <input 
              type="checkbox" 
              checked={config.autocut}
              onChange={(e) => setConfig({ ...config, autocut: e.target.checked })}
              className="accent-sefaz-accent w-5 h-5 rounded-md cursor-pointer"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group opacity-50" title="Em breve">
            <span className="text-sm font-bold text-sefaz-dark">
              Emitir Bipes de Alerta
            </span>
            <input 
              type="checkbox" 
              disabled
              checked={config.soundAlert}
              onChange={(e) => setConfig({ ...config, soundAlert: e.target.checked })}
              className="accent-sefaz-accent w-5 h-5 rounded-md cursor-pointer"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 mt-4 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-sefaz-dark transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save size={18} /> Salvar Parâmetros
        </button>
      </div>
    </Modal>
  );
}
