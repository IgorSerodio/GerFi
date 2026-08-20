import { useState } from "react";
import { Ticket } from "@/features/queue/types";
import {
  callTicketAction,
  recallTicketAction,
  startTicketAction,
  finishTicketAction,
  forwardTicketAction,
  noShowTicketAction,
} from "@/features/queue/actions";

export function useTicketActions(
  locationId: number | null,
  currentAttendantId: number,
  currentAttendantTicketWindowId: number | null,
  allowedServices: number[],
  history: Ticket[]
) {
  const [showStartModal, setShowStartModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [observation, setObservation] = useState("");
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>([]);
  const [ticketToFinish, setTicketToFinish] = useState<string | null>(null);
  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState<Ticket | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  const currentCall = history.find(
    (h) => h.attendantId === currentAttendantId && (h.status === "calling" || h.status === "started")
  );

  const handleCall = async (priorityType?: "Normal" | "Prioritário") => {
    if (locationId === null || currentAttendantTicketWindowId === null || isCalling || currentCall) return;
    setIsCalling(true);
    const res = await callTicketAction(
      locationId,
      currentAttendantId,
      currentAttendantTicketWindowId,
      allowedServices,
      priorityType,
      false // isForwardedCall
    );
    setIsCalling(false);
    if (!res.success) {
      alert(res.error || "Erro ao chamar senha");
    }
  };

  const handleCallForwarded = async () => {
    if (locationId === null || currentAttendantTicketWindowId === null || isCalling || currentCall) return;
    setIsCalling(true);
    const res = await callTicketAction(
      locationId,
      currentAttendantId,
      currentAttendantTicketWindowId,
      allowedServices,
      undefined,
      true // isForwardedCall
    );
    setIsCalling(false);
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

  const handleForward = async (ticketId: string, targetValue: string | number, targetType: "single" | "group" = "single") => {
    const res = await forwardTicketAction(ticketId, targetValue, targetType);
    if (res.success) {
      setShowForwardModal(false);
    } else {
      alert(res.error || "Erro ao encaminhar senha");
    }
  };

  return {
    showStartModal,
    setShowStartModal,
    showForwardModal,
    setShowForwardModal,
    showFinishModal,
    setShowFinishModal,
    observation,
    setObservation,
    selectedResolutions,
    setSelectedResolutions,
    ticketToFinish,
    setTicketToFinish,
    selectedHistoryTicket,
    setSelectedHistoryTicket,
    currentCall,
    handleCall,
    handleCallForwarded,
    handleRecall,
    handleNoShow,
    confirmStart,
    handleFinish,
    confirmFinish,
    handleForward,
    isCalling,
  };
}
