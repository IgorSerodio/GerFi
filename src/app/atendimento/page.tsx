import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getQueueStateAction, getCategoriesAction, getTicketWindowsAction } from "@/features/queue/actions";
import AttendantDashboard from "@/features/queue/components/attendant/AttendantDashboard";
import { DbCategory, DbTicketWindow } from "@/features/queue/types";

export default async function AttendantPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const [res, catRes, twRes] = await Promise.all([
    getQueueStateAction(),
    getCategoriesAction(),
    getTicketWindowsAction()
  ]);

  const initialQueue = res.success && res.data ? res.data.tickets : [];
  const initialHistory = res.success && res.data ? res.data.history : [];
  const initialCategories = catRes.success && catRes.data ? catRes.data : [];
  const initialTicketWindows = twRes.success && twRes.data ? twRes.data : [];

  return (
    <AttendantDashboard
      session={session}
      initialQueue={initialQueue}
      initialHistory={initialHistory}
      initialCategories={initialCategories as DbCategory[]}
      initialTicketWindows={initialTicketWindows as DbTicketWindow[]}
    />
  );
}
