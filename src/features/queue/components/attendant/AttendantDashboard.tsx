"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import {
  getQueueStateAction,
  callTicketAction,
  recallTicketAction,
  finishTicketAction,
  forwardTicketAction,
} from "@/features/queue/actions";
import { Ticket } from "@/features/queue/types";

import AttendantSidebar from "./AttendantSidebar";
import ServiceConfigOverlay from "./ServiceConfigOverlay";
import AttendantHeader from "./AttendantHeader";
import ActiveCallCard from "./ActiveCallCard";
import QueuePreview from "./QueuePreview";
import HistoryPanel from "./HistoryPanel";

import ForwardModal from "./modals/ForwardModal";
import FinishModal from "./modals/FinishModal";
import GuicheModal from "./modals/GuicheModal";
import HistoryDetailModal from "./modals/HistoryDetailModal";

interface AttendantDashboardProps {
  session: Session | null;
  initialQueue: Ticket[];
  initialHistory: Ticket[];
}

export default function AttendantDashboard({
  session,
  initialQueue,
  initialHistory,
}: AttendantDashboardProps) {
  const [currentAttendant, setCurrentAttendant] = useState({
    name: session?.user?.name || "Atendente",
    guiche: session?.user?.guiche || "Guichê 01",
  });
  const [showGuicheModal, setShowGuicheModal] = useState(false);
  const [allowedServices, setAllowedServices] = useState<string[]>(
    session?.user?.services || []
  );
  const [showServiceConfig, setShowServiceConfig] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [observation, setObservation] = useState("");
  const [ticketToFinish, setTicketToFinish] = useState<string | null>(null);
  const [selectedHistoryTicket, setSelectedHistoryTicket] =
    useState<Ticket | null>(null);
  const [queue, setQueue] = useState<Ticket[]>(initialQueue);
  const [history, setHistory] = useState<Ticket[]>(initialHistory);

  const attendants = [
    "Guichê 01",
    "Guichê 02",
    "Guichê 03",
    "Guichê 04",
    "Guichê 05",
  ];

  const categories = [
    { id: "IPTU", name: "IPTU" },
    { id: "ITBI", name: "ITBI" },
    { id: "SJOA", name: "SÃO JOÃO" },
    { id: "TRAN", name: "TRANSPORTE" },
    { id: "MFIS", name: "MALHA FISCAL" },
    { id: "SSAN", name: "SEMANA SANTA" },
    { id: "FEIR", name: "FEIRA" },
    { id: "PLUS", name: "+80" },
    { id: "AMBU", name: "AMBULANTE" },
    { id: "RECA", name: "RECADASTRAMENTO" },
    { id: "2VIA", name: "2ª VIA" },
    { id: "TAXI", name: "TAXI" },
    { id: "NFIS", name: "NOTA FISCAL" },
    { id: "PAGM", name: "PAGAMENTO" },
    { id: "ATEN", name: "ATENDIMENTO" },
    { id: "DIVE", name: "DIVERSOS" },
  ];

  useEffect(() => {
    if (session?.user) {
      setTimeout(() => {
        setCurrentAttendant({
          name: session.user.name || "Atendente",
          guiche: session.user.guiche || "Guichê 01",
        });
        setAllowedServices(session.user.services || []);
      }, 0);
    }
  }, [session]);

  const refreshState = async () => {
    const res = await getQueueStateAction();
    if (res.success && res.data) {
      setQueue(res.data.tickets);
      setHistory(res.data.history);
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

  const handleCall = async () => {
    const res = await callTicketAction(
      currentAttendant.name,
      currentAttendant.guiche,
      allowedServices
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

  const handleFinish = (ticketId: string) => {
    setTicketToFinish(ticketId);
    setObservation("");
    setShowFinishModal(true);
  };

  const confirmFinish = async () => {
    if (ticketToFinish) {
      const res = await finishTicketAction(ticketToFinish, observation);
      if (res.success) {
        setShowFinishModal(false);
        setTicketToFinish(null);
        setObservation("");
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

  const toggleService = (id: string) => {
    setAllowedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const availableTickets =
    allowedServices.length > 0
      ? queue.filter((t) => allowedServices.includes(t.type))
      : queue;

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
              toggleService={toggleService}
              setShowServiceConfig={setShowServiceConfig}
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
                allowedServicesCount={allowedServices.length}
                availableTicketsCount={availableTickets.length}
                handleCall={handleCall}
                handleRecall={handleRecall}
                setShowForwardModal={setShowForwardModal}
                handleFinish={handleFinish}
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
                observation={observation}
                setObservation={setObservation}
                onClose={() => setShowFinishModal(false)}
                onConfirm={confirmFinish}
              />

              <GuicheModal
                show={showGuicheModal}
                currentGuiche={currentAttendant.guiche}
                onClose={() => setShowGuicheModal(false)}
                onSelect={(guicheName) => {
                  setCurrentAttendant((prev) => ({
                    ...prev,
                    guiche: guicheName,
                  }));
                  setShowGuicheModal(false);
                }}
              />

              <HistoryDetailModal
                selectedHistoryTicket={selectedHistoryTicket}
                onClose={() => setSelectedHistoryTicket(null)}
              />

              <QueuePreview availableTickets={availableTickets} />
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
