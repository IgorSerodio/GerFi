import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getQueueStateAction, getCategoriesAction } from "@/features/queue/actions";
import TriageDashboard from "@/features/triage/components/TriageDashboard";
import { DbCategory } from "@/features/queue/types";

export default async function TriagePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const [res, catRes] = await Promise.all([
    getQueueStateAction(),
    getCategoriesAction()
  ]);
  
  const initialQueue = res.success && res.data ? res.data.tickets : [];
  const initialHistory = res.success && res.data ? res.data.history : [];
  const initialCategories = catRes.success && catRes.data ? catRes.data : [];

  return (
    <TriageDashboard
      session={session}
      initialQueue={initialQueue}
      initialHistory={initialHistory}
      initialCategories={initialCategories as DbCategory[]}
    />
  );
}
