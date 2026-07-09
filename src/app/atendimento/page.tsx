import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getCategoriesAction, getLocationsAction } from "@/features/queue/actions";
import { getUserById } from "@/features/users/queries";
import AttendantDashboard from "@/features/attendant/components/AttendantDashboard";
import { DbCategory, Location } from "@/features/queue/types";

export default async function AttendantPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const [catRes, locRes, userProfile] = await Promise.all([
    getCategoriesAction(),
    getLocationsAction(),
    getUserById(Number(session.user.id))
  ]);

  const initialCategories = catRes.success && catRes.data ? catRes.data : [];
  const initialLocations = locRes.success && locRes.data ? locRes.data : [];

  return (
    <AttendantDashboard
      session={session}
      initialCategories={initialCategories as DbCategory[]}
      initialLocations={initialLocations as Location[]}
      initialServices={userProfile?.services || []}
      initialGuiche={userProfile?.guiche || ""}
    />
  );
}
