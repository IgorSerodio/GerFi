"use client";

import React from "react";
import { Session } from "next-auth";
import { DbCategory, Location } from "@/features/management/types";

import AttendantSidebar from "./AttendantSidebar";
import ServiceConfigOverlay from "./ServiceConfigOverlay";
import AttendantHeader from "./AttendantHeader";
import ActiveCallCard from "./ActiveCallCard";
import QueuePreview from "./QueuePreview";
import HistoryPanel from "./HistoryPanel";
import AttendantModals from "./AttendantModals";
import { useAttendantDashboard } from "../hooks/useAttendantDashboard";

interface AttendantDashboardProps {
  session: Session | null;
  initialCategories: DbCategory[];
  initialLocations: Location[];
  initialServices: number[];
  initialGuiche: string;
}

export default function AttendantDashboard({
  session,
  initialCategories,
  initialLocations,
  initialServices,
  initialGuiche,
}: AttendantDashboardProps) {
  const { state, actions } = useAttendantDashboard({
    session,
    initialServices,
    initialGuiche,
  });

  const categories = initialCategories.map((c) => ({
    id: String(c.id),
    name: c.name,
    expectedTimeNormal: c.expectedTimeNormal,
    expectedTimePriority: c.expectedTimePriority,
    resolutions: c.resolutions || [],
  }));

  const availableTickets =
    state.allowedServices.length > 0
      ? state.queue.filter((t) => state.allowedServices.includes(t.categoryId))
      : state.queue;

  const availableNormal = availableTickets.filter((t) => t.priority === "Normal" && !t.forwardedTo);
  const availablePriority = availableTickets.filter((t) => t.priority === "Prioritário" && !t.forwardedTo);
  const forwardedCount = state.queue.filter((t) => t.status === "pending" && t.forwardedTo === state.currentAttendant.guiche).length;

  return (
    <div className="min-h-[100dvh] w-full bg-sefaz-light flex p-2 md:p-4 font-sans">
      <div className="flex-1 flex overflow-hidden rounded-[32px] shadow-2xl border border-emerald-100 bg-white">
        <AttendantSidebar
          currentAttendant={state.currentAttendant}
          showServiceConfig={state.showServiceConfig}
          setShowServiceConfig={actions.setShowServiceConfig}
          setShowGuicheModal={actions.setShowGuicheModal}
          locations={initialLocations}
          locationId={state.locationId}
          onLocationChange={async (id) => {
            localStorage.setItem("attendant_locationId", String(id));
            actions.setLocationId(id);
            await actions.handleVacateGuiche();
          }}
        />

        <div className="flex-1 p-10 flex flex-col space-y-8 overflow-auto relative">
          {state.showServiceConfig && (
            <ServiceConfigOverlay
              categories={categories}
              allowedServices={state.allowedServices}
            />
          )}

          <AttendantHeader
            availableTicketsCount={availableTickets.length}
            totalQueueCount={state.queue.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8 min-w-0">
              {!state.currentAttendant.guiche ? (
                <div className="bg-white rounded-[40px] shadow-sm border-2 border-amber-100 p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="9"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
                  </div>
                  <h3 className="text-3xl font-black text-sefaz-dark mb-2">Você está sem Guichê</h3>
                  <p className="text-sefaz-accent/60 font-medium mb-8 max-w-md">Para começar a chamar as senhas e realizar atendimentos, você precisa informar em qual guichê você está operando.</p>
                  <button 
                    onClick={() => actions.setShowGuicheModal(true)}
                    className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-3xl font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    SELECIONAR GUICHÊ AGORA
                  </button>
                </div>
              ) : (
                <>
                  <ActiveCallCard
                    currentCall={state.currentCall}
                    categories={categories}
                    allowedServicesCount={state.allowedServices.length}
                    availableNormalCount={availableNormal.length}
                    availablePriorityCount={availablePriority.length}
                    canCallNormal={state.canCallNormal}
                    canCallPriority={state.canCallPriority}
                    forwardedCount={forwardedCount}
                    handleCall={actions.handleCall}
                    handleCallForwarded={actions.handleCallForwarded}
                    handleRecall={actions.handleRecall}
                    handleNoShow={actions.handleNoShow}
                    setShowStartModal={actions.setShowStartModal}
                    setShowForwardModal={actions.setShowForwardModal}
                    handleFinish={actions.handleFinish}
                  />
                  <QueuePreview availableTickets={availableTickets} categories={categories} />
                </>
              )}

              <AttendantModals state={state} actions={actions} categories={categories} />

            </div>

            <div className="space-y-8 min-w-0">
              <HistoryPanel
                history={state.history}
                attendantName={state.currentAttendant.name}
                setSelectedHistoryTicket={actions.setSelectedHistoryTicket}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
