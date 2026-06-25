import React from "react";
import { motion } from "motion/react";
import { FileText, LayoutDashboard, Settings } from "lucide-react";
import { Session } from "next-auth";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { ViewType } from "../types";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

interface ManagementMenuProps {
  session: Session | null;
  setView: (view: ViewType) => void;
}

export default function ManagementMenu({ session, setView }: ManagementMenuProps) {
  const { hasPermission } = usePermissions();

  return (
    <motion.div
      key="menu"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-8"
    >
      <FeatureCard
        layout="vertical"
        onClick={() => setView("reports")}
        title="Relatórios"
        description="Consulte o histórico completo de atendimentos, tempos de espera e produtividade."
        icon={<FileText size={32} />}
        color="bg-emerald-500"
      />

      <FeatureCard
        layout="vertical"
        onClick={() => setView("dashboard")}
        title="Dashboards"
        description="Visualize a inteligência logística e métricas preditivas de atendimento."
        icon={<LayoutDashboard size={32} />}
        color="bg-blue-600"
      />

      <FeatureCard
        layout="vertical"
        onClick={() => {
          if (hasPermission("MANAGE_CONFIGS")) {
            setView("config_hub");
          } else {
            alert("Acesso restrito para administradores.");
          }
        }}
        title="Configurações"
        description="Ajuste fino do sistema de filas, parâmetros da TV e servidores de atendimento."
        icon={<Settings size={32} />}
        color="bg-slate-800"
        disabled={!hasPermission("MANAGE_CONFIGS")}
      />
    </motion.div>
  );
}
