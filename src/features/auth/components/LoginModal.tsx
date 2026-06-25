"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, User as UserIcon, Eye, EyeOff, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { useLoginModal } from "../contexts/LoginModalContext";

export default function LoginModal() {
  const router = useRouter();
  const { isOpen, closeModal, pendingPath, clearPendingPath } = useLoginModal();

  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username: credentials.username,
      password: credentials.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Usuário ou senha incorretos.");
      setTimeout(() => setError(""), 3000);
    } else {
      closeModal();
      setCredentials({ username: "", password: "" });
      if (pendingPath) {
        router.push(pendingPath);
        clearPendingPath();
      } else {
        router.refresh();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} zIndex="z-50">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-sefaz-accent/10 text-sefaz-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={32} />
        </div>
        <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tighter">
          ACESSO RESTRITO
        </h3>
        <p className="text-sefaz-accent font-bold opacity-60 text-sm">
          Autenticação obrigatória para este módulo
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="relative">
          <UserIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40"
            size={20}
          />
          <input
            type="text"
            required
            placeholder="Nome de Usuário"
            className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />
        </div>

        <div className="relative">
          <Lock
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40"
            size={20}
          />
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Senha"
            className="w-full pl-12 pr-12 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40 hover:text-sefaz-accent cursor-pointer"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-red-500 text-xs font-black text-center uppercase tracking-widest"
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-sefaz-dark transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar no Sistema"} <ChevronRight size={20} />
        </button>

        <button
          type="button"
          onClick={closeModal}
          className="w-full py-4 text-sefaz-accent font-bold text-xs uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
        >
          Cancelar Acesso
        </button>
      </form>
    </Modal>
  );
}
