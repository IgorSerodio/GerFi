import React from "react";
import { Ticket } from "@/features/queue/types";
import { ActiveTicketPanel } from "./ActiveTicketPanel";
import { NextCallSelector } from "./NextCallSelector";

interface ActiveCallCardProps {
  currentCall?: Ticket;
  allowedServicesCount: number;
  availableNormalCount: number;
  availablePriorityCount: number;
  canCallNormal: boolean;
  canCallPriority: boolean;
  forwardedCount: number;
  handleCall: (priorityType?: "Normal" | "Prioritário") => void;
  handleCallForwarded: () => void;
  handleRecall: (ticketId: string) => void;
  handleNoShow: (ticketId: string) => void;
  setShowForwardModal: (show: boolean) => void;
  setShowStartModal: (show: boolean) => void;
  handleFinish: (ticketId: string) => void;
  categories: { id: string; name: string; expectedTimeNormal: number; expectedTimePriority: number }[];
}

export default function ActiveCallCard(props: ActiveCallCardProps) {
  return (
    <div className="bg-white rounded-[40px] shadow-sm border-2 border-emerald-50 p-[clamp(1rem,3vw,3rem)] flex flex-col items-center min-h-[400px] flex-1 w-full h-full justify-center shadow-glow">
      {props.currentCall ? (
        <ActiveTicketPanel 
          currentCall={props.currentCall}
          categories={props.categories}
          handleRecall={props.handleRecall}
          handleNoShow={props.handleNoShow}
          setShowStartModal={props.setShowStartModal}
          setShowForwardModal={props.setShowForwardModal}
          handleFinish={props.handleFinish}
        />
      ) : (
        <NextCallSelector 
          allowedServicesCount={props.allowedServicesCount}
          availableNormalCount={props.availableNormalCount}
          availablePriorityCount={props.availablePriorityCount}
          canCallNormal={props.canCallNormal}
          canCallPriority={props.canCallPriority}
          forwardedCount={props.forwardedCount}
          handleCall={props.handleCall}
          handleCallForwarded={props.handleCallForwarded}
        />
      )}
    </div>
  );
}
