"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User as UserIcon, Eye, EyeOff, ChevronRight, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // Definir mensagem de erro customizada baseada nos parâmetros
    if (urlError === "unauthorized") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Você precisa fazer login para acessar o módulo selecionado.");
    } else if (urlError === "forbidden") {
      setError("Acesso negado. Suas credenciais não têm permissão para acessar o módulo selecionado.");
    } else if (urlError === "CredentialsSignin") {
      setError("Usuário ou senha incorretos.");
    }

    // Se houver um erro de permissão (forbidden) E o usuário estiver logado com uma sessão inválida
    // Nós o deslogamos para que possa entrar com credenciais válidas.
    if (urlError === "forbidden" && session) {
      signOut({ redirect: false });
    }
  }, [urlError, session]);

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
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[32px] shadow-xl shadow-emerald-900/5 border border-emerald-100/50 relative z-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-sefaz-accent/10 text-sefaz-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={32} />
        </div>
        <h3 className="text-3xl font-black text-sefaz-dark uppercase tracking-tighter">
          Entrar
        </h3>
        <p className="text-sefaz-accent font-bold opacity-60 text-sm mt-2">
          Insira suas credenciais para continuar
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
          >
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-red-600 text-xs font-bold uppercase tracking-wide leading-relaxed">
              {error}
            </p>
          </motion.div>
        )}

        <div className="relative">
          <UserIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40"
            size={20}
          />
          <input
            type="text"
            required
            placeholder="Nome de Usuário"
            className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
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
            className="w-full pl-12 pr-12 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40 hover:text-sefaz-accent cursor-pointer transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-5 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-sefaz-dark transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? "Autenticando..." : "Entrar no Sistema"} <ChevronRight size={20} />
        </button>

        <div className="flex flex-col gap-2 pt-2 border-t border-emerald-50">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="w-full py-3 text-sefaz-accent font-bold text-xs uppercase tracking-widest opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
          >
            Não possui conta? Cadastre-se
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-3 text-sefaz-accent font-bold text-xs uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
          >
            Voltar ao Início
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      
      <Suspense fallback={
        <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[32px] shadow-xl border border-emerald-100/50 flex items-center justify-center h-[500px]">
          <div className="animate-spin w-8 h-8 border-4 border-sefaz-accent border-t-transparent rounded-full"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
