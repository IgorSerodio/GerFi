import { useEffect } from "react";
import { Session } from "next-auth";
import { useAttendantSession } from "./useAttendantSession";
import { useQueueData } from "./useQueueData";
import { useTicketActions } from "./useTicketActions";

interface UseAttendantDashboardProps {
  session: Session | null;
  initialServices: number[];
  initialTicketWindowId: number | null;
  initialGuicheName: string;
}

export function useAttendantDashboard({
  session,
  initialServices,
  initialTicketWindowId,
  initialGuicheName,
}: UseAttendantDashboardProps) {
  const sessionData = useAttendantSession(session, initialServices, initialTicketWindowId, initialGuicheName);
  const queueData = useQueueData();
  const ticketActions = useTicketActions(
    queueData.locationId,
    sessionData.currentAttendant.id,
    sessionData.currentAttendant.ticketWindowId,
    sessionData.allowedServices,
    queueData.history
  );

  const { refreshProfile, currentAttendant } = sessionData;

  // Sync profile when guiche changes
  useEffect(() => {
    refreshProfile();
  }, [currentAttendant.ticketWindowId, refreshProfile]);

  return {
    state: {
      currentAttendant: sessionData.currentAttendant,
      showGuicheModal: sessionData.showGuicheModal,
      allowedServices: sessionData.allowedServices,
      showServiceConfig: sessionData.showServiceConfig,
      canCallNormal: sessionData.canCallNormal,
      canCallPriority: sessionData.canCallPriority,
      
      locationId: queueData.locationId,
      queue: queueData.queue,
      history: queueData.history,
      activeGuiches: queueData.activeGuiches,
      ticketWindows: queueData.ticketWindows,
      attendants: queueData.attendants,

      showStartModal: ticketActions.showStartModal,
      showForwardModal: ticketActions.showForwardModal,
      showFinishModal: ticketActions.showFinishModal,
      observation: ticketActions.observation,
      selectedResolutions: ticketActions.selectedResolutions,
      ticketToFinish: ticketActions.ticketToFinish,
      selectedHistoryTicket: ticketActions.selectedHistoryTicket,
      currentCall: ticketActions.currentCall,
      isCalling: ticketActions.isCalling,
    },
    actions: {
      setCurrentAttendant: sessionData.setCurrentAttendant,
      setShowGuicheModal: sessionData.setShowGuicheModal,
      setAllowedServices: sessionData.setAllowedServices,
      setShowServiceConfig: sessionData.setShowServiceConfig,
      handleSaveGuiche: (ticketWindowId: number, guicheName: string) => {
        return sessionData.handleSaveGuiche(ticketWindowId, guicheName);
      },
      handleVacateGuiche: sessionData.handleVacateGuiche,

      setLocationId: queueData.setLocationId,

      setShowStartModal: ticketActions.setShowStartModal,
      setShowForwardModal: ticketActions.setShowForwardModal,
      setShowFinishModal: ticketActions.setShowFinishModal,
      setObservation: ticketActions.setObservation,
      setSelectedResolutions: ticketActions.setSelectedResolutions,
      setTicketToFinish: ticketActions.setTicketToFinish,
      setSelectedHistoryTicket: ticketActions.setSelectedHistoryTicket,
      handleCall: ticketActions.handleCall,
      handleCallForwarded: ticketActions.handleCallForwarded,
      handleRecall: ticketActions.handleRecall,
      handleNoShow: ticketActions.handleNoShow,
      confirmStart: ticketActions.confirmStart,
      handleFinish: ticketActions.handleFinish,
      confirmFinish: ticketActions.confirmFinish,
      handleForward: ticketActions.handleForward,
    }
  };
}
