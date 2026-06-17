"use client";

import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Tv,
  Ticket,
  Users,
  LayoutDashboard,
  ChevronRight,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function HomeMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccess = (href: string, needsAuth: boolean) => {
    if (needsAuth && !session) {
      setPendingPath(href);
      setShowLogin(true);
    } else {
      router.push(href);
    }
  };

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
      setShowLogin(false);
      setCredentials({ username: "", password: "" });
      if (pendingPath) {
        router.push(pendingPath);
        setPendingPath(null);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)]">
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sefaz-dark/80 backdrop-blur-md"
              onClick={() => setShowLogin(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-emerald-100"
            >
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40 hover:text-sefaz-accent"
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
                  className="w-full py-5 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-sefaz-dark transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Entrando..." : "Entrar no Sistema"} <ChevronRight size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="w-full py-4 text-sefaz-accent font-bold text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                >
                  Cancelar Acesso
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logged User Indicator */}
      {session && (
        <div className="absolute top-4 right-4 flex items-center gap-4 bg-white px-5 py-3 rounded-full border border-emerald-100 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-black text-sefaz-dark">{session.user?.name}</p>
            <p className="text-[9px] font-bold text-sefaz-accent uppercase tracking-wider">
              {(session.user as any).role} - {(session.user as any).guiche}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Sair do Sistema"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}

      <div className="text-center mb-16 flex flex-col items-center">
        <div className="mb-8 p-4 bg-white rounded-[40px] shadow-sm border border-emerald-100/50">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/09/Caruaru_brasao.svg"
            alt="Brasão de Caruaru"
            className="w-28 h-28 object-contain"
          />
        </div>
        <h1 className="text-5xl font-light text-sefaz-dark uppercase tracking-tighter leading-none mb-2">
          Secretaria da Fazenda Municipal
        </h1>
        <p className="text-sefaz-accent font-bold uppercase tracking-[0.3em] text-sm opacity-60">
          Sistema de Gestão de Fila
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <MenuButton
          onClick={() => handleAccess("/tv", false)}
          title="Painel de TV"
          icon={<Tv className="h-8 w-8" />}
          description="Exibição de senhas para o público"
          color="bg-emerald-500"
        />
        <MenuButton
          onClick={() => handleAccess("/triagem", true)}
          title="Triagem"
          icon={<Ticket className="h-8 w-8" />}
          description="Emissão de senhas e tickets"
          color="bg-blue-500"
          needsLock={!session}
        />
        <MenuButton
          onClick={() => handleAccess("/atendimento", true)}
          title="Atendimento"
          icon={<Users className="h-8 w-8" />}
          description="Painel para atendentes"
          color="bg-indigo-500"
          needsLock={!session}
        />
        <MenuButton
          onClick={() => handleAccess("/gerenciamento", true)}
          title="Gerenciamento"
          icon={<LayoutDashboard className="h-8 w-8" />}
          description="Relatórios, estatísticas e configurações"
          color="bg-amber-500"
          needsLock={!session}
        />
      </div>

      <footer className="mt-20 text-sefaz-accent/40 font-bold uppercase tracking-widest text-[10px]">
        @Município de Caruaru - V1.0 - 2026
      </footer>
    </div>
  );
}

function MenuButton({
  onClick,
  title,
  icon,
  description,
  color,
  needsLock,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  needsLock?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center p-8 bg-white rounded-[32px] shadow-sm border border-emerald-100/50 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-500 overflow-hidden text-left w-full cursor-pointer"
    >
      <div
        className={`flex-shrink-0 w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}
      >
        {icon}
      </div>

      <div className="ml-6 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-black text-sefaz-dark tracking-tighter leading-none mb-1 group-hover:text-emerald-600 transition-colors">
            {title}
          </h3>
          {needsLock && <Lock size={12} className="text-sefaz-accent/30" />}
        </div>
        <p className="text-sm text-sefaz-accent font-medium opacity-60 line-clamp-1">
          {description}
        </p>
      </div>

      <div className="ml-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
        <ChevronRight className="h-6 w-6 text-emerald-500" />
      </div>
    </button>
  );
}
