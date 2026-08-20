import { useState, useCallback } from "react";
import { Session } from "next-auth";
import { getMyProfileAction, updateMyGuicheAction } from "@/features/users/actions";

export interface AttendantState {
  id: number;
  name: string;
  ticketWindowId: number | null;
  guicheName: string;
}

export function useAttendantSession(session: Session | null, initialServices: number[], initialTicketWindowId: number | null, initialGuicheName: string) {
  const [currentAttendant, setCurrentAttendant] = useState<AttendantState>({
    id: Number(session?.user?.id) || 0,
    name: session?.user?.name || "Atendente",
    ticketWindowId: initialTicketWindowId,
    guicheName: initialGuicheName,
  });
  const [showGuicheModal, setShowGuicheModal] = useState(false);
  const [allowedServices, setAllowedServices] = useState<number[]>(initialServices);
  const [showServiceConfig, setShowServiceConfig] = useState(false);
  const [canCallNormal, setCanCallNormal] = useState<boolean>(true);
  const [canCallPriority, setCanCallPriority] = useState<boolean>(true);

  const handleSaveGuiche = async (ticketWindowId: number, guicheName: string) => {
    const res = await updateMyGuicheAction(ticketWindowId);
    if (res.success) {
      setCurrentAttendant((prev) => ({
        ...prev,
        ticketWindowId,
        guicheName,
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
        ticketWindowId: null,
        guicheName: "",
      }));
      setShowGuicheModal(false);
    } else {
      alert(res.error || "Erro ao desocupar guichê");
    }
  };

  const refreshProfile = useCallback(async () => {
    const profileRes = await getMyProfileAction();
    if (profileRes.success && profileRes.data) {
      setAllowedServices(profileRes.data.services || []);
      setCanCallNormal(profileRes.data.canCallNormal ?? true);
      setCanCallPriority(profileRes.data.canCallPriority ?? true);
      
      if (currentAttendant.ticketWindowId !== profileRes.data.ticketWindowId) {
        setCurrentAttendant(prev => ({
          ...prev,
          ticketWindowId: profileRes.data.ticketWindowId || null,
          guicheName: profileRes.data.guicheName || ""
        }));
      }
    }
  }, [currentAttendant.ticketWindowId]);

  return {
    currentAttendant,
    setCurrentAttendant,
    showGuicheModal,
    setShowGuicheModal,
    allowedServices,
    setAllowedServices,
    showServiceConfig,
    setShowServiceConfig,
    canCallNormal,
    canCallPriority,
    handleSaveGuiche,
    handleVacateGuiche,
    refreshProfile
  };
}
