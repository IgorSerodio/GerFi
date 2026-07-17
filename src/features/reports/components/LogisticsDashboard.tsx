"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Activity,
  PieChart as PieIcon,
  LineChart as LineIcon,
  BarChart as BarIcon,
} from "lucide-react";
import TimelineView from "./timeline/TimelineView";
import { useReportFilters } from "@/features/reports/hooks/useReportFilters";
import { useLogisticsData, DateRange, MetricType } from "@/features/reports/hooks/useLogisticsData";

import { LogisticsFilterBar } from "./LogisticsFilterBar";
import { LogisticsChartRenderer } from "./LogisticsChartRenderer";
import { LogisticsKpiGrid } from "./LogisticsKpiGrid";

type ChartType = "bar" | "line" | "area" | "pie";
const COLORS = ["bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500"];

export default function LogisticsDashboard({ showHeader = false }: { showHeader?: boolean }) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [metric, setMetric] = useState<MetricType>("tickets");
  const [range, setRange] = useState<DateRange>("today");
  const [locationId, setLocationId] = useState<number | "all">("all");
  const [attendants, setAttendants] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<"charts" | "timeline">("timeline");
  const [timelineDate, setTimelineDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { locations, users } = useReportFilters();
  const { data, isLoading, refetch } = useLogisticsData(
    range,
    metric,
    locationId,
    attendants,
    activeView,
    timelineDate
  );

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-8">
      {showHeader && (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-sefaz-dark tracking-tighter uppercase leading-none">
              Inteligência Logística
            </h1>
            <p className="text-sefaz-accent font-bold opacity-60 uppercase tracking-widest text-[10px] mt-1">
              Gestão de Fluxo e Atendimento
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 bg-sefaz-accent text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/20 flex items-center gap-2 hover:bg-sefaz-dark transition-all active:scale-95 cursor-pointer"
            >
              <Activity size={16} className={isLoading ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
        </header>
      )}

      <LogisticsFilterBar
        activeView={activeView}
        range={range}
        setRange={setRange}
        timelineDate={timelineDate}
        setTimelineDate={setTimelineDate}
        locationId={locationId}
        setLocationId={setLocationId}
        locations={locations}
        attendants={attendants}
        setAttendants={setAttendants}
        users={users}
      />

      <LogisticsKpiGrid data={data} />

      {/* View Toggle */}
      <div className="flex bg-emerald-50/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveView("timeline")}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all cursor-pointer ${activeView === "timeline"
              ? "bg-sefaz-accent text-white shadow-md"
              : "text-sefaz-accent opacity-60 hover:opacity-100"
            }`}
        >
          Linha do Tempo
        </button>
        <button
          onClick={() => setActiveView("charts")}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all cursor-pointer ${activeView === "charts"
              ? "bg-sefaz-accent text-white shadow-md"
              : "text-sefaz-accent opacity-60 hover:opacity-100"
            }`}
        >
          Visão Geral
        </button>
      </div>



      {activeView === "timeline" ? (
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-emerald-100 relative min-h-[450px]">
          <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
            Linha do Tempo de Atendimentos
          </h3>
          <TimelineView locationId={locationId} attendants={attendants} users={users} dateStr={timelineDate} />
        </div>
      ) : (
        <>
          {/* Main Visualization Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <motion.div
              layout
              className="xl:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-emerald-100 relative min-h-[450px]"
            >
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-4">
                <div>
                  <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight">
                    Evolução do Atendimento
                  </h3>
                  <p className="text-[10px] font-bold text-sefaz-accent opacity-50 uppercase tracking-widest">
                    Baseado nos filtros selecionados
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex bg-emerald-50/50 p-1 rounded-xl">
                    {(["tickets", "wait_time", "atendimentos"] as MetricType[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMetric(m)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${metric === m
                            ? "bg-sefaz-accent text-white shadow-md"
                            : "text-sefaz-accent opacity-60 hover:opacity-100"
                          }`}
                      >
                        {m === "tickets" ? "Senhas" : m === "wait_time" ? "T. Espera" : "Concluídos"}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <ChartTypeBtn
                      active={chartType === "bar"}
                      onClick={() => setChartType("bar")}
                      icon={<BarIcon size={16} />}
                      title="Barras"
                    />
                    <ChartTypeBtn
                      active={chartType === "line"}
                      onClick={() => setChartType("line")}
                      icon={<LineIcon size={16} />}
                      title="Linha"
                    />
                    <ChartTypeBtn
                      active={chartType === "area"}
                      onClick={() => setChartType("area")}
                      icon={<TrendingUp size={16} />}
                      title="Área"
                    />
                    <ChartTypeBtn
                      active={chartType === "pie"}
                      onClick={() => setChartType("pie")}
                      icon={<PieIcon size={16} />}
                      title="Pizza"
                    />
                  </div>
                </div>
              </div>

              <div
                className={`h-[350px] w-full transition-opacity duration-300 ${isLoading ? "opacity-20" : "opacity-100"
                  }`}
              >
                <LogisticsChartRenderer data={data} chartType={chartType} />
              </div>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-emerald-100 border-t-sefaz-accent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>

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
          </div>
        </>
      )}
    </div>
  );
}

function ChartTypeBtn({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${active
          ? "bg-sefaz-accent text-white shadow-md scale-110"
          : "bg-white text-sefaz-accent border border-emerald-100 hover:bg-emerald-50"
        }`}
    >
      {icon}
    </button>
  );
}
