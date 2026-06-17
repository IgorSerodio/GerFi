import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getQueueStateAction } from "@/features/queue/actions";
import TriageDashboard from "@/features/queue/components/TriageDashboard";

export default async function TriagePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const res = await getQueueStateAction();
  const initialQueue = res.success && res.data ? res.data.tickets : [];
  const initialHistory = res.success && res.data ? res.data.history : [];

  return (
    <TriageDashboard
      session={session}
      initialQueue={initialQueue}
      initialHistory={initialHistory}
    />
  );
}
