"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Lock, EyeOff, Eye, ChevronRight, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { requestPasswordResetAction, resetPasswordWithPinAction } from "@/features/auth/actions";

export default function RecoverPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await requestPasswordResetAction(email);
    setLoading(false);

    if (res.success) {
      setSuccess(res.message as string);
      setStep(2);
    } else {
      setError((res as { error?: string }).error || "Erro desconhecido.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    const res = await resetPasswordWithPinAction(email, pin, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess("Senha redefinida com sucesso! Você já pode fazer login.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } else {
      setError((res as { error?: string }).error || "Erro desconhecido.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[32px] shadow-xl shadow-emerald-900/5 border border-emerald-100/50 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sefaz-accent/10 text-sefaz-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} />
          </div>
          <h3 className="text-3xl font-black text-sefaz-dark uppercase tracking-tighter">
            Recuperar Senha
          </h3>
          <p className="text-sefaz-accent font-bold opacity-60 text-sm mt-2">
            {step === 1 ? "Enviaremos um PIN para o seu e-mail" : "Insira o PIN e sua nova senha"}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 mb-6"
          >
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-red-600 text-xs font-bold uppercase tracking-wide leading-relaxed">
              {error}
            </p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 mb-6"
          >
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <p className="text-emerald-700 text-xs font-bold uppercase tracking-wide leading-relaxed">
              {success}
            </p>
          </motion.div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestPin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
              <input
                type="email"
                required
                placeholder="Seu E-mail"
                className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-5 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-sefaz-dark transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Processando..." : "Enviar PIN"} <ChevronRight size={20} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
              <input
                type="text"
                required
                placeholder="PIN de 6 dígitos"
                maxLength={6}
                className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark tracking-widest"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Nova Senha"
                className="w-full pl-12 pr-12 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40 hover:text-sefaz-accent cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirmar Nova Senha"
                className="w-full pl-12 pr-12 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40 hover:text-sefaz-accent cursor-pointer transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-5 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-sefaz-dark transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Redefinindo..." : "Redefinir Senha"} <CheckCircle2 size={20} />
            </button>
          </form>
        )}

        <div className="flex flex-col gap-2 pt-6 mt-4 border-t border-emerald-50">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full py-3 text-sefaz-accent font-bold text-xs uppercase tracking-widest opacity-80 hover:opacity-100 cursor-pointer transition-opacity flex justify-center items-center gap-2"
          >
            <ArrowLeft size={16} /> Voltar para o Login
          </button>
        </div>
      </div>
    </div>
  );
}
