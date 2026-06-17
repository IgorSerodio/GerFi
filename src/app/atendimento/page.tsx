import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getQueueStateAction } from "@/features/queue/actions";
import AttendantDashboard from "@/features/queue/components/AttendantDashboard";

export default async function AttendantPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const res = await getQueueStateAction();
  const initialQueue = res.success && res.data ? res.data.tickets : [];
  const initialHistory = res.success && res.data ? res.data.history : [];

  return (
    <AttendantDashboard
      session={session}
      initialQueue={initialQueue}
      initialHistory={initialHistory}
    />
  );
}
