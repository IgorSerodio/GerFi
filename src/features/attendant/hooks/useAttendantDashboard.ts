import { useState, useEffect, useRef, useCallback } from "react";
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
import { getActiveGuichesAction } from "@/features/management/actions";
import {
  getMyProfileAction,
  updateMyGuicheAction,
} from "@/features/users/actions";
import { Ticket } from "@/features/queue/types";
import { DbTicketWindow } from "@/features/management/types";
import { useQueueStream } from "@/features/queue/hooks/useQueueStream";

interface UseAttendantDashboardProps {
  session: Session | null;
  initialServices: number[];
  initialGuiche: string;
}

export function useAttendantDashboard({
  session,
  initialServices,
  initialGuiche,
}: UseAttendantDashboardProps) {
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
  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState<Ticket | null>(null);
  const [queue, setQueue] = useState<Ticket[]>([]);
  const [history, setHistory] = useState<Ticket[]>([]);

  const [activeGuiches, setActiveGuiches] = useState<{ guiche: string; attendantName: string }[]>([]);
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  
  const [locationId, setLocationId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("attendant_locationId");
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationId(Number(stored));
    } else {
      setLocationId(1);
      localStorage.setItem("attendant_locationId", "1");
    }
  }, []);

  const attendants = ticketWindows.map((tw) => {
    const active = activeGuiches.find((a) => a.guiche === tw.name);
    return {
      guiche: tw.name,
      attendantName: active?.attendantName,
    };
  });

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

  const refreshState = useCallback(async () => {
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

    import("@/features/management/actions").then(m => {
      m.getTicketWindowsAction(locationId).then((wRes) => {
        if (wRes.success && wRes.data) setTicketWindows(wRes.data as DbTicketWindow[]);
      });
    });

    const profileRes = await getMyProfileAction();
    if (profileRes.success && profileRes.data) {
      setAllowedServices(profileRes.data.services || []);
      setCanCallNormal(profileRes.data.canCallNormal ?? true);
      setCanCallPriority(profileRes.data.canCallPriority ?? true);
      
      if (currentAttendant.guiche !== profileRes.data.guiche) {
        setCurrentAttendant(prev => ({
          ...prev,
          guiche: profileRes.data.guiche || ""
        }));
      }
    }
  }, [locationId, currentAttendant.guiche]);

  const refreshStateRef = useRef(refreshState);
  useEffect(() => {
    refreshStateRef.current = refreshState;
  }, [refreshState]);

  useEffect(() => {
    if (locationId !== null) {
      setTimeout(() => {
        refreshStateRef.current();
      }, 0);
    }
  }, [locationId]);

  useQueueStream(() => refreshStateRef.current());

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

  const currentCall = history.find(
    (h) => h.attendant === currentAttendant.name && (h.status === "calling" || h.status === "started")
  );

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

  const handleForward = async (ticketId: string, targetGuiche: string) => {
    const res = await forwardTicketAction(
      ticketId,
      targetGuiche
    );
    if (res.success) {
      setShowForwardModal(false);
    } else {
      alert(res.error || "Erro ao encaminhar senha");
    }
  };

  return {
    state: {
      currentAttendant,
      showGuicheModal,
      allowedServices,
      showServiceConfig,
      showStartModal,
      showForwardModal,
      showFinishModal,
      canCallNormal,
      canCallPriority,
      observation,
      selectedResolutions,
      ticketToFinish,
      selectedHistoryTicket,
      queue,
      history,
      locationId,
      ticketWindows,
      activeGuiches,
      attendants,
      currentCall,
    },
    actions: {
      setCurrentAttendant,
      setShowGuicheModal,
      setAllowedServices,
      setShowServiceConfig,
      setShowStartModal,
      setShowForwardModal,
      setShowFinishModal,
      setObservation,
      setSelectedResolutions,
      setTicketToFinish,
      setSelectedHistoryTicket,
      setLocationId,
      handleSaveGuiche,
      handleVacateGuiche,
      handleCall,
      handleCallForwarded,
      handleRecall,
      handleNoShow,
      confirmStart,
      handleFinish,
      confirmFinish,
      handleForward,
    }
  };
}
