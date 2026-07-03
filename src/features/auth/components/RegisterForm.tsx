"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UserPlus, 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  Mail, 
  CreditCard, 
  BadgeInfo, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import { registerUserAction } from "@/features/auth/actions";
import { UserRole } from "@/features/users/types";
import { formatCpf, formatMatricula, removeNonDigits } from "@/lib/formatters";
import { isValidEmail } from "@/lib/validators";

export function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    matricula: "",
    username: "",
    password: "",
    role: UserRole.Atendente,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name || !formData.email || !formData.cpf || !formData.username || !formData.password || !formData.matricula) {
      setError("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("O formato do e-mail é inválido.");
      setLoading(false);
      return;
    }

    const rawCpf = removeNonDigits(formData.cpf);
    if (rawCpf.length !== 11) {
      setError("O CPF deve conter exatamente 11 dígitos.");
      setLoading(false);
      return;
    }

    if (formData.matricula.length !== 6) {
      setError("A matrícula deve conter exatamente 6 dígitos.");
      setLoading(false);
      return;
    }

    const res = await registerUserAction({
      name: formData.name,
      email: formData.email,
      cpf: rawCpf,
      matricula: formData.matricula,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      guiche: null,
      services: [],
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Ocorreu um erro ao realizar o cadastro.");
    } else {
      setSuccess(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    const name = e.target.name;

    if (name === "cpf") {
      value = formatCpf(value);
    } else if (name === "matricula") {
      value = formatMatricula(value);
    }

    setFormData({ ...formData, [name]: value });
  };

  if (success) {
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

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-[32px] shadow-xl shadow-emerald-900/5 border border-emerald-100/50 relative z-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-sefaz-accent/10 text-sefaz-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserPlus size={32} />
        </div>
        <h3 className="text-3xl font-black text-sefaz-dark uppercase tracking-tighter">
          Criar Conta
        </h3>
        <p className="text-sefaz-accent font-bold opacity-60 text-sm mt-2">
          Preencha os dados abaixo para se cadastrar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
            <input
              type="text"
              name="name"
              required
              placeholder="Nome Completo"
              className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
            <input
              type="email"
              name="email"
              required
              placeholder="E-mail"
              className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* CPF */}
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
            <input
              type="text"
              name="cpf"
              required
              maxLength={14}
              placeholder="CPF"
              className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
              value={formData.cpf}
              onChange={handleChange}
            />
          </div>

          {/* Matrícula */}
          <div className="relative">
            <BadgeInfo className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
            <input
              type="text"
              name="matricula"
              required
              maxLength={6}
              placeholder="Matrícula"
              className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
              value={formData.matricula}
              onChange={handleChange}
            />
          </div>

          {/* Nome de Usuário */}
          <div className="relative md:col-span-2">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
            <input
              type="text"
              name="username"
              required
              placeholder="Nome de Usuário (Login)"
              className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              placeholder="Senha"
              className="w-full pl-12 pr-12 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold placeholder:text-sefaz-accent/30 text-sefaz-dark"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40 hover:text-sefaz-accent cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Role (Papel) - Sem opção Admin */}
          <div className="relative">
            <BadgeInfo className="absolute left-4 top-1/2 -translate-y-1/2 text-sefaz-accent/40 z-10" size={20} />
            <select
              name="role"
              required
              className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-bold text-sefaz-dark appearance-none cursor-pointer"
              value={formData.role}
              onChange={handleChange}
            >
              <option value={UserRole.Atendente}>Atendente</option>
              <option value={UserRole.Triador}>Triador</option>
              <option value={UserRole.Gerente}>Gerente</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-5 bg-sefaz-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-sefaz-dark transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? "Cadastrando..." : "Finalizar Cadastro"} <ChevronRight size={20} />
        </button>

        <div className="flex flex-col gap-2 pt-2 border-t border-emerald-50">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full py-3 text-sefaz-accent font-bold text-xs uppercase tracking-widest opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
          >
            Já possui conta? Faça Login
          </button>
        </div>
      </form>
    </div>
  );
}
