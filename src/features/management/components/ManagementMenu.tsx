import React from "react";
import { motion } from "motion/react";
import { FileText, LayoutDashboard, Settings } from "lucide-react";
import { Session } from "next-auth";
import MenuCard from "./MenuCard";
import { ViewType } from "../types";

interface ManagementMenuProps {
  session: Session | null;
  setView: (view: ViewType) => void;
}

export default function ManagementMenu({ session, setView }: ManagementMenuProps) {
  return (
    <motion.div
      key="menu"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-8"
    >
      <MenuCard
        onClick={() => setView("reports")}
        title="Relatórios"
        description="Consulte o histórico completo de atendimentos, tempos de espera e produtividade."
        icon={<FileText size={32} />}
        color="bg-emerald-500"
      />

      <MenuCard
        onClick={() => setView("dashboard")}
        title="Dashboards"
        description="Visualize a inteligência logística e métricas preditivas de atendimento."
        icon={<LayoutDashboard size={32} />}
        color="bg-blue-600"
      />

      <MenuCard
        onClick={() => {
          if (session && session.user.role === "Admin") {
            setView("config_hub");
          } else {
            alert("Acesso restrito para administradores.");
          }
        }}
        title="Configurações"
        description="Ajuste fino do sistema de filas, parâmetros da TV e servidores de atendimento."
        icon={<Settings size={32} />}
        color="bg-slate-700"
        disabled={!session || session.user.role !== "Admin"}
      />
    </motion.div>
  );
}
