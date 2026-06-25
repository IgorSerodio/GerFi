import { useSession } from "next-auth/react";
import { hasPermission as checkPermission, ActionName } from "../permissions";

export function usePermissions() {
  const { data: session } = useSession();
  
  const hasPermission = (action: ActionName) => {
    return checkPermission(action, session?.user?.role);
  };

  return { hasPermission };
}
