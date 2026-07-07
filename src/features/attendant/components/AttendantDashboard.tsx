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
} from "@/features/queue/actions";
import {
  getMyProfileAction,
  updateMyGuicheAction,
} from "@/features/users/actions";
import { Ticket, DbCategory, DbTicketWindow } from "@/features/queue/types";

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
  initialQueue: Ticket[];
  initialHistory: Ticket[];
  initialCategories: DbCategory[];
  initialTicketWindows: DbTicketWindow[];
  initialServices: number[];
  initialGuiche: string;
}

export default function AttendantDashboard({
  session,
  initialQueue,
  initialHistory,
  initialCategories,
  initialTicketWindows,
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
  const [queue, setQueue] = useState<Ticket[]>(initialQueue);
  const [history, setHistory] = useState<Ticket[]>(initialHistory);

  const attendants = initialTicketWindows.map((tw) => tw.name);

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

  const refreshState = async () => {
    const res = await getQueueStateAction();
    if (res.success && res.data) {
      setQueue(res.data.tickets);
      setHistory(res.data.history);
    }
    const profileRes = await getMyProfileAction();
    if (profileRes.success && profileRes.data) {
      setAllowedServices(profileRes.data.services || []);
      setCanCallNormal(profileRes.data.canCallNormal ?? true);
      setCanCallPriority(profileRes.data.canCallPriority ?? true);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      refreshState();
    }, 0);
  }, []);

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
    const res = await callTicketAction(
      currentAttendant.name,
      currentAttendant.guiche,
      allowedServices,
      priorityType
    );
    if (!res.success) {
      alert(res.error || "Erro ao chamar senha");
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

  const availableNormal = availableTickets.filter((t) => t.priority === "Normal");
  const availablePriority = availableTickets.filter((t) => t.priority === "Prioritário");

  const currentCall = history.find(
    (h) => h.attendant === currentAttendant.name && h.status === "calling"
  );

  return (
    <div className="min-h-[100dvh] w-full bg-sefaz-light flex p-2 md:p-4 font-sans">
      <div className="flex-1 flex overflow-hidden rounded-[32px] shadow-2xl border border-emerald-100 bg-white">
        <AttendantSidebar
          currentAttendant={currentAttendant}
          showServiceConfig={showServiceConfig}
          setShowServiceConfig={setShowServiceConfig}
          setShowGuicheModal={setShowGuicheModal}
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
            <div className="lg:col-span-2 space-y-8">
              <ActiveCallCard
                currentCall={currentCall}
                categories={categories}
                allowedServicesCount={allowedServices.length}
                availableNormalCount={availableNormal.length}
                availablePriorityCount={availablePriority.length}
                canCallNormal={canCallNormal}
                canCallPriority={canCallPriority}
                handleCall={handleCall}
                handleRecall={handleRecall}
                handleNoShow={handleNoShow}
                setShowStartModal={setShowStartModal}
                setShowForwardModal={setShowForwardModal}
                handleFinish={handleFinish}
              />

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
                onClose={() => setShowGuicheModal(false)}
                onSelect={handleSaveGuiche}
              />

              <HistoryDetailModal
                selectedHistoryTicket={selectedHistoryTicket}
                onClose={() => setSelectedHistoryTicket(null)}
              />

              <QueuePreview availableTickets={availableTickets} categories={categories} />
            </div>

            <div className="space-y-8">
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
