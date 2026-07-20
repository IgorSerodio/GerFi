import { useState, useCallback } from "react";
import { Session } from "next-auth";
import { getMyProfileAction, updateMyGuicheAction } from "@/features/users/actions";

export interface AttendantState {
  name: string;
  guiche: string;
}

export function useAttendantSession(session: Session | null, initialServices: number[], initialGuiche: string) {
  const [currentAttendant, setCurrentAttendant] = useState<AttendantState>({
    name: session?.user?.name || "Atendente",
    guiche: initialGuiche,
  });
  const [showGuicheModal, setShowGuicheModal] = useState(false);
  const [allowedServices, setAllowedServices] = useState<number[]>(initialServices);
  const [showServiceConfig, setShowServiceConfig] = useState(false);
  const [canCallNormal, setCanCallNormal] = useState<boolean>(true);
  const [canCallPriority, setCanCallPriority] = useState<boolean>(true);

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

  const refreshProfile = useCallback(async () => {
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
  }, [currentAttendant.guiche]);

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
