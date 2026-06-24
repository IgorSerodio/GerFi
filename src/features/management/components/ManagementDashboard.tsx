"use client";

import React, { useState } from "react";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Activity } from "lucide-react";
import LogisticsDashboard from "@/features/reports/components/LogisticsDashboard";
import { TvSettings } from "@/features/queue/types";

// Components
import ManagementMenu from "./ManagementMenu";
import ConfigHubMenu from "./ConfigHubMenu";
import ServicesConfigView from "./ServicesConfigView";
import UsersConfigView from "./UsersConfigView";
import TvConfigView from "./TvConfigView";
import PrinterConfigView from "./PrinterConfigView";
import ReportsView from "@/features/reports/components/ReportsView";

import { ViewType } from "../types";

interface ManagementDashboardProps {
  session: Session | null;
}

export default function ManagementDashboard({ session }: ManagementDashboardProps) {
  const [view, setView] = useState<ViewType>("menu");

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-sefaz-light p-6 md:p-12 overflow-y-auto font-sans relative">
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-emerald-500 z-50 font-black text-sm uppercase tracking-widest flex items-center gap-3"
          >
            <Activity className="animate-pulse" /> {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center gap-8 print:hidden">
          <button
            onClick={() => {
              if (view === "menu") {
                window.location.href = "/";
              } else if (view.startsWith("config_") && view !== "config_hub") {
                setView("config_hub");
              } else if (view === "config_hub" || view === "dashboard" || view === "reports") {
                setView("menu");
              }
            }}
            className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-sefaz-accent shadow-sm hover:shadow-xl hover:scale-110 transition-all cursor-pointer border border-emerald-100/50"
          >
            <ArrowLeft size={32} />
          </button>
          <div>
            <h1 className="text-5xl font-black text-sefaz-dark tracking-tighter uppercase leading-none">
              {view === "menu"
                ? "Gerenciamento"
                : view === "dashboard"
                ? "Dashboards"
                : view === "reports"
                ? "Relatórios"
                : "Configurações"}
            </h1>
            <p className="text-sefaz-accent font-bold opacity-60 uppercase tracking-widest text-sm mt-2">
              Secretaria da Fazenda Municipal - Caruaru
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {view === "menu" && <ManagementMenu session={session} setView={setView} />}
          {view === "config_hub" && <ConfigHubMenu setView={setView} />}
          {view === "reports" && <ReportsView />}
          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <LogisticsDashboard showHeader />
            </motion.div>
          )}
          {view === "config_services" && <ServicesConfigView triggerSuccess={triggerSuccess} />}
          {view === "config_users" && <UsersConfigView triggerSuccess={triggerSuccess} />}
          {view === "config_tv" && <TvConfigView triggerSuccess={triggerSuccess} />}
          {view === "config_printer" && <PrinterConfigView triggerSuccess={triggerSuccess} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
