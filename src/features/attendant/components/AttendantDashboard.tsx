"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import {
  getQueueStateAction,
  callTicketAction,
  recallTicketAction,
  startTicketAction,
  finishTicketAction,
  forwardTicketAction,
  noShowTicketAction,
  getActiveGuichesAction,
} from "@/features/queue/actions";
import {
  getMyProfileAction,
  updateMyGuicheAction,
} from "@/features/users/actions";
import { Ticket, DbCategory, DbTicketWindow, Location } from "@/features/queue/types";

import AttendantSidebar from "./AttendantSidebar";
import ServiceConfigOverlay from "./ServiceConfigOverlay";
import AttendantHeader from "./AttendantHeader";
import ActiveCallCard from "./ActiveCallCard";
import QueuePreview from "./QueuePreview";
import HistoryPanel from "./HistoryPanel";

import ForwardModal from "./modals/ForwardModal";
import FinishModal from "./modals/FinishModal";
import StartModal from "./modals/StartModal";
import GuicheModal from "./modals/GuicheModal";
import HistoryDetailModal from "./modals/HistoryDetailModal";


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
  const [currentAttendant, setCurrentAttendant] = useState({
    name: session?.user?.name || "Atendente",
    guiche: initialGuiche,
  });
  const [showGuicheModal, setShowGuicheModal] = useState(false);
  const [allowedServices, setAllowedServices] = useState<number[]>(initialServices);
  const [showServiceConfig, setShowServiceConfig] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [canCallNormal, setCanCallNormal] = useState<boolean>(true);
  const [canCallPriority, setCanCallPriority] = useState<boolean>(true);
  const [observation, setObservation] = useState("");
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>([]);
  const [ticketToFinish, setTicketToFinish] = useState<string | null>(null);
  const [selectedHistoryTicket, setSelectedHistoryTicket] =
    useState<Ticket | null>(null);
  const [queue, setQueue] = useState<Ticket[]>([]);
  const [history, setHistory] = useState<Ticket[]>([]);

  const [activeGuiches, setActiveGuiches] = useState<{ guiche: string; attendantName: string }[]>([]);
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  
  const [locationId, setLocationId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("attendant_locationId");
    if (stored) {
      setLocationId(Number(stored));
    } else {
      setLocationId(0);
      localStorage.setItem("attendant_locationId", "0");
    }
  }, []);

  const attendants = ticketWindows.map((tw) => {
    const active = activeGuiches.find((a) => a.guiche === tw.name);
    return {
      guiche: tw.name,
      attendantName: active?.attendantName,
    };
  });

  const categories = initialCategories.map((c) => ({
    id: String(c.id),
    name: c.name,
    expectedTimeNormal: c.expectedTimeNormal,
    expectedTimePriority: c.expectedTimePriority,
    resolutions: c.resolutions || [],
  }));





  const handleSaveGuiche = async (guicheName: string) => {
    const res = await updateMyGuicheAction(guicheName);
    if (res.success) {
      setCurrentAttendant((prev) => ({
        ...prev,
        guiche: guicheName,
      }));
      setShowGuicheModal(false);
    } else {
      alert(res.error || "Erro ao atualizar guichê");
    }
  };

  const handleVacateGuiche = async () => {
    const res = await updateMyGuicheAction(null);
    if (res.success) {
      setCurrentAttendant((prev) => ({
        ...prev,
        guiche: "",
      }));
      setShowGuicheModal(false);
    } else {
      alert(res.error || "Erro ao desocupar guichê");
    }
  };

  const refreshState = async () => {
    if (locationId === null) return;
    const res = await getQueueStateAction(locationId);
    if (res.success && res.data) {
      setQueue(res.data.tickets);
      setHistory(res.data.history);
    }
    const activeRes = await getActiveGuichesAction();
    if (activeRes.success && activeRes.data) {
      setActiveGuiches(activeRes.data);
    }
    // Fetch windows for this location
    import("@/features/queue/actions").then(m => {
      m.getTicketWindowsAction(locationId).then(wRes => {
        if (wRes.success && wRes.data) setTicketWindows(wRes.data as DbTicketWindow[]);
      });
    });

    const profileRes = await getMyProfileAction();
    if (profileRes.success && profileRes.data) {
      setAllowedServices(profileRes.data.services || []);
      setCanCallNormal(profileRes.data.canCallNormal ?? true);
      setCanCallPriority(profileRes.data.canCallPriority ?? true);
      
      // Update guiche locally just in case it was changed/cleared remotely
      if (currentAttendant.guiche !== profileRes.data.guiche) {
        setCurrentAttendant(prev => ({
          ...prev,
          guiche: profileRes.data.guiche || ""
        }));
      }
    }
  };

  useEffect(() => {
    if (locationId !== null) {
      setTimeout(() => {
        refreshState();
      }, 0);
    }
  }, [locationId]);

  useEffect(() => {
    const eventSource = new EventSource("/api/queue/stream");
    eventSource.addEventListener("update", () => {
      setTimeout(() => {
        refreshState();
      }, 0);
    });
    return () => {
      eventSource.close();
    };
  }, []);

  const handleCall = async (priorityType?: "Normal" | "Prioritário") => {
    if (locationId === null) return;
    const res = await callTicketAction(
      locationId,
      currentAttendant.name,
      currentAttendant.guiche,
      allowedServices,
      priorityType,
      false // isForwardedCall
    );
    if (!res.success) {
      alert(res.error || "Erro ao chamar senha");
    }
  };

  const handleCallForwarded = async () => {
    if (locationId === null) return;
    const res = await callTicketAction(
      locationId,
      currentAttendant.name,
      currentAttendant.guiche,
      allowedServices,
      undefined,
      true // isForwardedCall
    );
    if (!res.success) {
      alert(res.error || "Erro ao chamar senha encaminhada");
    }
  };

  const handleRecall = async (ticketId: string) => {
    const res = await recallTicketAction(ticketId);
    if (!res.success) {
      alert(res.error || "Erro ao rechamar senha");
    }
  };

  const handleNoShow = async (ticketId: string) => {
    const res = await noShowTicketAction(ticketId);
    if (!res.success) {
      alert(res.error || "Erro ao marcar senha como não comparecimento");
    }
  };

  const confirmStart = async (code: string) => {
    if (currentCall) {
      const res = await startTicketAction(currentCall.id, code);
      if (res.success) {
        setShowStartModal(false);
        // Will refresh state automatically via SSE or wait for the user action finish
      } else {
        alert(res.error || "Erro ao inicializar senha");
      }
    }
  };

  const handleFinish = (ticketId: string) => {
    setTicketToFinish(ticketId);
    setObservation("");
    setSelectedResolutions([]);
    setShowFinishModal(true);
  };

  const confirmFinish = async () => {
    if (ticketToFinish) {
      const res = await finishTicketAction(ticketToFinish, observation, selectedResolutions);
      if (res.success) {
        setShowFinishModal(false);
        setTicketToFinish(null);
        setObservation("");
        setSelectedResolutions([]);
      } else {
        alert(res.error || "Erro ao finalizar senha");
      }
    }
  };

  const handleForward = async (ticketId: string, targetGuiche: string) => {
    const res = await forwardTicketAction(
      ticketId,
      targetGuiche,
      currentAttendant.name
    );
    if (res.success) {
      setShowForwardModal(false);
    } else {
      alert(res.error || "Erro ao encaminhar senha");
    }
  };



  const availableTickets =
    allowedServices.length > 0
      ? queue.filter((t) => allowedServices.includes(t.categoryId))
      : queue;

  const availableNormal = availableTickets.filter((t) => t.priority === "Normal" && !t.forwardedTo);
  const availablePriority = availableTickets.filter((t) => t.priority === "Prioritário" && !t.forwardedTo);
  const forwardedCount = queue.filter((t) => t.status === "pending" && t.forwardedTo === currentAttendant.guiche).length;

  const currentCall = history.find(
    (h) => h.attendant === currentAttendant.name && (h.status === "calling" || h.status === "started")
  );

  return (
    <div className="min-h-[100dvh] w-full bg-sefaz-light flex p-2 md:p-4 font-sans">
      <div className="flex-1 flex overflow-hidden rounded-[32px] shadow-2xl border border-emerald-100 bg-white">
        <AttendantSidebar
          currentAttendant={currentAttendant}
          showServiceConfig={showServiceConfig}
          setShowServiceConfig={setShowServiceConfig}
          setShowGuicheModal={setShowGuicheModal}
          locations={initialLocations}
          locationId={locationId}
          onLocationChange={async (id) => {
            localStorage.setItem("attendant_locationId", String(id));
            setLocationId(id);
            await handleVacateGuiche();
          }}
        />

        <div className="flex-1 p-10 flex flex-col space-y-8 overflow-auto relative">
          {showServiceConfig && (
            <ServiceConfigOverlay
              categories={categories}
              allowedServices={allowedServices}
            />
          )}

          <AttendantHeader
            availableTicketsCount={availableTickets.length}
            totalQueueCount={queue.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8 min-w-0">
              {!currentAttendant.guiche ? (
                <div className="bg-white rounded-[40px] shadow-sm border-2 border-amber-100 p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="9"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
                  </div>
                  <h3 className="text-3xl font-black text-sefaz-dark mb-2">Você está sem Guichê</h3>
                  <p className="text-sefaz-accent/60 font-medium mb-8 max-w-md">Para começar a chamar as senhas e realizar atendimentos, você precisa informar em qual guichê você está operando.</p>
                  <button 
                    onClick={() => setShowGuicheModal(true)}
                    className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-3xl font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    SELECIONAR GUICHÊ AGORA
                  </button>
                </div>
              ) : (
                <>
                  <ActiveCallCard
                    currentCall={currentCall}
                  categories={categories}
                  allowedServicesCount={allowedServices.length}
                  availableNormalCount={availableNormal.length}
                  availablePriorityCount={availablePriority.length}
                  canCallNormal={canCallNormal}
                  canCallPriority={canCallPriority}
                  forwardedCount={forwardedCount}
                  handleCall={handleCall}
                  handleCallForwarded={handleCallForwarded}
                  handleRecall={handleRecall}
                  handleNoShow={handleNoShow}
                  setShowStartModal={setShowStartModal}
                  setShowForwardModal={setShowForwardModal}
                  handleFinish={handleFinish}
                />
                <QueuePreview availableTickets={availableTickets} categories={categories} />
              </>
              )}

              <StartModal
                show={showStartModal}
                currentCall={currentCall}
                onClose={() => setShowStartModal(false)}
                onConfirm={confirmStart}
              />

              <ForwardModal
                show={showForwardModal}
                currentCall={currentCall}
                attendants={attendants}
                currentGuiche={currentAttendant.guiche}
                onClose={() => setShowForwardModal(false)}
                onForward={handleForward}
              />

              <FinishModal
                show={showFinishModal}
                ticketToFinish={ticketToFinish}
                history={history}
                currentCall={currentCall}
                categories={categories}
                observation={observation}
                setObservation={setObservation}
                selectedResolutions={selectedResolutions}
                setSelectedResolutions={setSelectedResolutions}
                onClose={() => setShowFinishModal(false)}
                onConfirm={confirmFinish}
              />

              <GuicheModal
                show={showGuicheModal}
                currentGuiche={currentAttendant.guiche}
                ticketWindows={ticketWindows.map((tw) => tw.name)}
                activeGuiches={activeGuiches}
                onClose={() => setShowGuicheModal(false)}
                onSelect={handleSaveGuiche}
                onVacate={handleVacateGuiche}
              />

              <HistoryDetailModal
                selectedHistoryTicket={selectedHistoryTicket}
                onClose={() => setSelectedHistoryTicket(null)}
              />

            </div>

            <div className="space-y-8 min-w-0">
              <HistoryPanel
                history={history}
                attendantName={currentAttendant.name}
                setSelectedHistoryTicket={setSelectedHistoryTicket}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
