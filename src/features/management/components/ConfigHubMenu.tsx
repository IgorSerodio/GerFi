import React from "react";
import { motion } from "motion/react";
import { Tv, Settings, Users as UsersIcon, Printer } from "lucide-react";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { ViewType } from "../types";

interface ConfigHubMenuProps {
  setView: (view: ViewType) => void;
}

export default function ConfigHubMenu({ setView }: ConfigHubMenuProps) {
  return (
    <motion.div
      key="config_hub"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          layout="vertical"
          onClick={() => setView("config_users")}
          title="Servidores"
          description="Adicione, edite ou gerencie acessos e guichês dos atendentes."
          icon={<UsersIcon size={32} />}
          color="bg-emerald-500"
        />
        <FeatureCard
          layout="vertical"
          onClick={() => setView("config_tv")}
          title="Personalizar TV"
          description="Modifique a exibição de painéis, vídeos de fundo e chamadas de senhas."
          icon={<Tv size={32} />}
          color="bg-slate-700"
        />
        <FeatureCard
          layout="vertical"
          onClick={() => setView("config_printer")}
          title="Triagem & Impressora"
          description="Status do terminal térmico, alertas e layout do cupom de senhas."
          icon={<Printer size={32} />}
          color="bg-blue-500"
        />
        <FeatureCard
          layout="vertical"
          onClick={() => setView("config_services")}
          title="Guichês & Serviços"
          description="Crie novos guichês ou ajuste serviços e categorias."
          icon={<Settings size={32} />}
          color="bg-purple-600"
        />
      </div>
    </motion.div>
  );
}
