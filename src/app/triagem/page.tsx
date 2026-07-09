import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getCategoriesAction, getLocationsAction } from "@/features/queue/actions";
import TriageDashboard from "@/features/triage/components/TriageDashboard";
import { DbCategory, Location } from "@/features/queue/types";

export default async function TriagePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
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
