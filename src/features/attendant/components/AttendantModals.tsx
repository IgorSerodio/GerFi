import React from "react";
import ForwardModal from "./modals/ForwardModal";
import FinishModal from "./modals/FinishModal";
import StartModal from "./modals/StartModal";
import GuicheModal from "./modals/GuicheModal";
import HistoryDetailModal from "./modals/HistoryDetailModal";

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
    attendants: { guiche: string; attendantName: string | undefined }[];
    currentAttendant: { name: string; guiche: string };
    showFinishModal: boolean;
    ticketToFinish: string | null;
    history: Ticket[];
    observation: string;
    selectedResolutions: string[];
    showGuicheModal: boolean;
    ticketWindows: { name: string }[];
    activeGuiches: { guiche: string; attendantName: string }[];
    selectedHistoryTicket: Ticket | null;
  };
  actions: {
    setShowStartModal: (v: boolean) => void;
    confirmStart: (code: string) => Promise<void>;
    setShowForwardModal: (v: boolean) => void;
    handleForward: (id: string, guiche: string) => Promise<void>;
    setObservation: (v: string) => void;
    setSelectedResolutions: (v: string[] | ((prev: string[]) => string[])) => void;
    setShowFinishModal: (v: boolean) => void;
    confirmFinish: () => Promise<void>;
    setShowGuicheModal: (v: boolean) => void;
    handleSaveGuiche: (guiche: string) => Promise<void>;
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
        currentGuiche={state.currentAttendant.guiche}
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
        currentGuiche={state.currentAttendant.guiche}
        ticketWindows={state.ticketWindows.map((tw) => tw.name)}
        activeGuiches={state.activeGuiches}
        onClose={() => actions.setShowGuicheModal(false)}
        onSelect={actions.handleSaveGuiche}
        onVacate={actions.handleVacateGuiche}
      />

      <HistoryDetailModal
        selectedHistoryTicket={state.selectedHistoryTicket}
        onClose={() => actions.setSelectedHistoryTicket(null)}
      />
    </>
  );
}
