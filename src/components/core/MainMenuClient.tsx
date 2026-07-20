"use client";

import {
  Tv,
  Ticket,
  Users,
  LayoutDashboard,
} from "lucide-react";
import React from "react";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Session } from "next-auth";

interface MainMenuClientProps {
  session: Session | null;
}

export default function MainMenuClient({ session }: MainMenuClientProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)]">
      <div className="text-center mb-16 flex flex-col items-center">
        <div className="mb-8 p-4 bg-white rounded-[40px] shadow-sm border border-emerald-100/50">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/0/09/Caruaru_brasao.svg"
            alt="Brasão de Caruaru"
            width={112}
            height={112}
            className="w-28 h-28 object-contain"
          />
        </div>
        <h1 className="text-5xl font-light text-sefaz-dark uppercase tracking-tighter leading-none mb-2">
          Secretaria da Fazenda Municipal
        </h1>
        <p className="text-sefaz-accent font-bold uppercase tracking-[0.3em] text-sm opacity-60">
          GerFi - Sistema de Gerenciamento de Filas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <FeatureCard
          onClick={() => router.push("/tv")}
          title="Painel de TV"
          icon={<Tv className="h-8 w-8" />}
          description="Exibição de senhas para o público"
          color="bg-emerald-500"
        />
        <FeatureCard
          onClick={() => router.push("/triagem")}
          title="Triagem"
          icon={<Ticket className="h-8 w-8" />}
          description="Emissão de senhas e tickets"
          color="bg-blue-500"
          disabled={!session || !hasPermission("ACCESS_TRIAGE")}
        />
        <FeatureCard
          onClick={() => router.push("/atendimento")}
          title="Atendimento"
          icon={<Users className="h-8 w-8" />}
          description="Painel para atendentes"
          color="bg-indigo-500"
          disabled={!session || !hasPermission("ACCESS_ATTENDANCE")}
        />
        <FeatureCard
          onClick={() => router.push("/gerenciamento")}
          title="Gerenciamento"
          icon={<LayoutDashboard className="h-8 w-8" />}
          description="Relatórios, estatísticas e configurações"
          color="bg-amber-500"
          disabled={!session || !hasPermission("ACCESS_MANAGEMENT")}
        />
      </div>

      <footer className="mt-20 text-sefaz-accent/40 font-bold uppercase tracking-widest text-[10px]">
        @Município de Caruaru - V1.0 - 2026
      </footer>
    </div>
  );
}

