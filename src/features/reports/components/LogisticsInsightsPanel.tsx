import React from "react";
import { motion } from "motion/react";
import { Activity } from "lucide-react";
import { DashboardData } from "@/features/reports/hooks/useLogisticsData";

const COLORS = ["bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500"];

interface LogisticsInsightsPanelProps {
  data: DashboardData | null;
}

export function LogisticsInsightsPanel({ data }: LogisticsInsightsPanelProps) {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-emerald-100 h-full">
      <h3 className="text-xl font-black text-sefaz-dark mb-6 uppercase tracking-tight">
        Ranking de Serviços
      </h3>
      <div className="space-y-4">
        {data?.categoryAggregation.map((item, i) => (
          <div key={item.name} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-black text-sefaz-accent uppercase tracking-widest">
              <span>{item.name}</span>
              <span>{item.value}%</span>
            </div>
            <div className="h-3 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                className={`h-full ${COLORS[i % COLORS.length]} rounded-full`}
              />
            </div>
          </div>
        ))}
        {(!data || data.categoryAggregation.length === 0) && (
          <div className="py-12 text-center text-[10px] font-black text-sefaz-accent opacity-20 uppercase tracking-widest">
            Aguardando Dados...
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
        <h4 className="text-[10px] font-black text-sefaz-dark uppercase tracking-widest mb-2 flex items-center gap-2">
          <Activity size={12} className="text-sefaz-accent" /> Insights do Dia
        </h4>
        <p className="text-[11px] text-sefaz-accent font-medium leading-relaxed">
          {data && data.categoryAggregation.length > 0 ? (
            <>
              O serviço de{" "}
              <strong className="text-sefaz-dark">
                {data.categoryAggregation[0].name}
              </strong>{" "}
              representa a maior demanda atual ({data.categoryAggregation[0].value}%).
              {parseInt(data.stats.avgWait.replace("min", "")) > 15 ? (
                <span className="text-amber-700">
                  {" "}
                  Recomendamos reforçar os guichês devido ao alto tempo de espera.
                </span>
              ) : (
                <span> O fluxo está sendo processado com eficiência satisfatória.</span>
              )}
            </>
          ) : (
            "O sistema está aguardando os primeiros atendimentos do dia para gerar insights automáticos."
          )}
        </p>
      </div>
    </div>
  );
}
