import { redirect } from "next/navigation";
import { requirePermission } from "@/features/auth/actions";
import { getCategoriesAction, getLocationsAction } from "@/features/management/actions";;
import TriageDashboard from "@/features/triage/components/TriageDashboard";
import { DbCategory, Location } from "@/features/management/types";;

export default async function TriagePage() {
  let session;
  try {
    session = await requirePermission("ACCESS_TRIAGE");
  } catch (error) {
    redirect("/");
  }

  const [locRes, catRes] = await Promise.all([
    getLocationsAction(),
    getCategoriesAction()
  ]);
  
  const initialLocations = locRes.success && locRes.data ? locRes.data : [];
  const initialCategories = catRes.success && catRes.data ? catRes.data : [];

  return (
    <TriageDashboard
      session={session}
      initialLocations={initialLocations as Location[]}
      initialCategories={initialCategories as DbCategory[]}
    />
  );
}
