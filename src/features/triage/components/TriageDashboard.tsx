"use client";

import React from "react";
import NextLink from "next/link";
import { ArrowLeft, Menu, Printer, Landmark, History, Gavel, Accessibility, UserPlus, FileText, Info } from "lucide-react";
import { DbCategory } from "@/features/management/types";
import { Session } from "next-auth";

import { Category } from "./types";
import TriageSidebar from "./TriageSidebar";
import CategoryGrid from "./CategoryGrid";
import { formatTime, formatDate } from "@/utils/dateFormatter";
import TriageModals from "./TriageModals";

import { Location } from "@/features/management/types";
import LocationSelector from "@/components/ui/LocationSelector";
import { useTriageDashboard } from "../hooks/useTriageDashboard";

interface TriageDashboardProps {
  session: Session | null;
  initialLocations: Location[];
  initialCategories: DbCategory[];
}

export default function TriageDashboard({
  session,
  initialLocations,
  initialCategories,
}: TriageDashboardProps) {
  const { state, actions } = useTriageDashboard();

  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Landmark, History, Gavel, Accessibility, UserPlus, FileText, Info
  };

  const categories: Category[] = initialCategories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: iconMap[c.icon] || Info,
    color: c.color,
  }));

  return (
    <div className="min-h-[100dvh] w-full bg-sefaz-light flex overflow-hidden font-display p-2 md:p-4">
      <div className="flex-1 flex overflow-hidden rounded-[32px] shadow-2xl border border-emerald-100 bg-white relative">
        <TriageSidebar
          isSidebarOpen={state.isSidebarOpen}
          setIsSidebarOpen={actions.setIsSidebarOpen}
          searchQuery={state.searchQuery}
          setSearchQuery={actions.setSearchQuery}
          handleSearch={actions.handleSearch}
          searchResult={state.searchResult}
          setSearchResult={actions.setSearchResult}
          recentIssues={state.recentIssues}
          setIssuedTicket={actions.setIssuedTicket}
          session={session}
        />

        {/* Main Area: Categories */}
        <main className="flex-1 p-4 lg:p-6 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => actions.setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-sefaz-accent shadow-sm border border-emerald-100/50 hover:bg-emerald-50 transition-colors"
              >
                <Menu size={20} className="md:w-6 md:h-6" />
              </button>
              <NextLink
                href="/"
                className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl items-center justify-center text-sefaz-accent shadow-sm hover:shadow-xl hover:scale-110 transition-all border border-emerald-100/50"
              >
                <ArrowLeft size={20} className="md:w-6 md:h-6" />
              </NextLink>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-sefaz-dark tracking-tight leading-none">
                  POSTO DE TRIAGEM
                </h1>
                <p className="text-sefaz-accent font-bold text-[8px] md:text-[10px] uppercase tracking-widest opacity-60">
                  Selecione o serviço para emitir a senha
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <LocationSelector
                locations={initialLocations}
                value={state.locationId ?? 0}
                onChange={(newLocId) => {
                  actions.setLocationId(newLocId);
                  localStorage.setItem("triage_locationId", String(newLocId));
                }}
                heightClass="h-10"
                textSizeClass="text-[10px]"
                className="rounded-xl"
              />
              <button
                onClick={actions.handleTestPrinter}
                className="bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent px-4 h-10 rounded-xl border border-emerald-200 flex items-center gap-2 transition-all active:scale-95 group cursor-pointer"
              >
                <Printer
                  size={18}
                  className="group-hover:rotate-12 transition-transform"
                />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  Testar Impressora
                </span>
              </button>

              <div className="text-right relative">
                <button
                  onClick={() => actions.setShowCalendar(!state.showCalendar)}
                  className="hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="text-lg font-black text-sefaz-dark leading-none">
                    {formatTime(new Date())}
                  </div>
                  <div className="text-[10px] font-bold text-sefaz-accent opacity-50 uppercase tracking-widest">
                    {formatDate(new Date())}
                  </div>
                </button>
              </div>
            </div>
          </header>

          <CategoryGrid
            categories={categories}
            selectService={actions.selectService}
            printing={state.printing}
          />
        </main>
      </div>

      <TriageModals state={state} actions={actions} />

      {/* Loading State */}
      {state.printing && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-[200]">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-emerald-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sefaz-medium" />
            <p className="font-black text-sefaz-dark tracking-widest text-xs uppercase animate-pulse">
              Gerando Senha...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
