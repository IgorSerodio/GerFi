import React from "react";
import ForwardModal from "./modals/ForwardModal";
import FinishModal from "./modals/FinishModal";
import StartModal from "./modals/StartModal";
import GuicheModal from "./modals/GuicheModal";
import TicketDetailModal from "@/components/modals/TicketDetailModal";

import { Ticket } from "@/features/queue/types";

interface Category {
  id: string;
  name: string;
  expectedTimeNormal: number | null;
  expectedTimePriority: number | null;
  resolutions: string[];
}

interface AttendantModalsProps {
  state: {
    showStartModal: boolean;
    currentCall: Ticket | undefined;
    showForwardModal: boolean;
    attendants: { ticketWindowId: number; guiche: string; alias?: string | null; groupName?: string | null; attendantName: string | undefined }[];
    currentAttendant: { name: string; ticketWindowId: number | null; guicheName: string };
    showFinishModal: boolean;
    ticketToFinish: string | null;
    history: Ticket[];
    observation: string;
    selectedResolutions: string[];
    showGuicheModal: boolean;
    ticketWindows: { id: number; name: string; alias?: string | null }[];
    activeGuiches: { ticketWindowId: number; guicheName: string; attendantName: string }[];
    selectedHistoryTicket: Ticket | null;
  };
  actions: {
    setShowStartModal: (v: boolean) => void;
    confirmStart: (code: string) => Promise<void>;
    setShowForwardModal: (v: boolean) => void;
    handleForward: (id: string, targetValue: string | number, type?: "single" | "group") => Promise<void>;
    setObservation: (v: string) => void;
    setSelectedResolutions: (v: string[] | ((prev: string[]) => string[])) => void;
    setShowFinishModal: (v: boolean) => void;
    confirmFinish: () => Promise<void>;
    setShowGuicheModal: (v: boolean) => void;
    handleSaveGuiche: (ticketWindowId: number, guicheName: string) => Promise<void>;
    handleVacateGuiche: () => Promise<void>;
    setSelectedHistoryTicket: (t: Ticket | null) => void;
  };
  categories: Category[];
}

export default function AttendantModals({
  state,
  actions,
  categories,
}: AttendantModalsProps) {
  return (
    <>
      <StartModal
        show={state.showStartModal}
        currentCall={state.currentCall}
        onClose={() => actions.setShowStartModal(false)}
        onConfirm={actions.confirmStart}
      />

      <ForwardModal
        show={state.showForwardModal}
        currentCall={state.currentCall}
        attendants={state.attendants}
        currentTicketWindowId={state.currentAttendant.ticketWindowId}
        onClose={() => actions.setShowForwardModal(false)}
        onForward={actions.handleForward}
      />

      <FinishModal
        show={state.showFinishModal}
        ticketToFinish={state.ticketToFinish}
        history={state.history}
        currentCall={state.currentCall}
        categories={categories}
        observation={state.observation}
        setObservation={actions.setObservation}
        selectedResolutions={state.selectedResolutions}
        setSelectedResolutions={actions.setSelectedResolutions}
        onClose={() => actions.setShowFinishModal(false)}
        onConfirm={actions.confirmFinish}
      />

      <GuicheModal
        show={state.showGuicheModal}
        currentTicketWindowId={state.currentAttendant.ticketWindowId}
        ticketWindows={state.ticketWindows}
        activeGuiches={state.activeGuiches}
        onClose={() => actions.setShowGuicheModal(false)}
        onSelect={actions.handleSaveGuiche}
        onVacate={actions.handleVacateGuiche}
      />

      <TicketDetailModal
        selectedHistoryTicket={state.selectedHistoryTicket}
        onClose={() => actions.setSelectedHistoryTicket(null)}
      />
    </>
  );
}
