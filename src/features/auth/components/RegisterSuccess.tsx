import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

export function RegisterSuccess() {
  const router = useRouter();

  return (
    <div className="w-full max-w-md mx-auto p-12 bg-white rounded-[32px] shadow-xl shadow-emerald-900/5 border border-emerald-100/50 relative z-10 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 size={40} />
      </motion.div>
      <h3 className="text-3xl font-black text-sefaz-dark uppercase tracking-tighter mb-4">
        Cadastro Realizado!
      </h3>
      <p className="text-sefaz-accent font-medium leading-relaxed mb-8">
        Sua conta foi criada com sucesso, mas encontra-se <strong className="text-amber-500">Bloqueada</strong> aguardando liberação de um Administrador.
      </p>
      <button
        onClick={() => router.push("/login")}
        className="w-full py-4 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-sefaz-dark transition-all transform active:scale-95 cursor-pointer"
      >
        Voltar ao Login
      </button>
    </div>
  );
}
