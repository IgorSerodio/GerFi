import { useEffect } from "react";
import { Session } from "next-auth";
import { useAttendantSession } from "./useAttendantSession";
import { useQueueData } from "./useQueueData";
import { useTicketActions } from "./useTicketActions";

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
  const sessionData = useAttendantSession(session, initialServices, initialGuiche);
  const queueData = useQueueData();
  const ticketActions = useTicketActions(
    queueData.locationId,
    sessionData.currentAttendant.name,
    sessionData.currentAttendant.guiche,
    sessionData.allowedServices,
    queueData.history
  );

  const { refreshProfile, currentAttendant } = sessionData;

  // Sync profile when guiche changes
  useEffect(() => {
    refreshProfile();
  }, [currentAttendant.guiche, refreshProfile]);

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
    },
    actions: {
      setCurrentAttendant: sessionData.setCurrentAttendant,
      setShowGuicheModal: sessionData.setShowGuicheModal,
      setAllowedServices: sessionData.setAllowedServices,
      setShowServiceConfig: sessionData.setShowServiceConfig,
      handleSaveGuiche: sessionData.handleSaveGuiche,
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
