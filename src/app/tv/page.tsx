import React from "react";
import { getQueueStateAction } from "@/features/queue/actions";;;
import { getTvSettingsAction } from "@/features/tv/actions";
import { getTicketWindowsAction } from "@/features/management/actions";
import TvDashboard from "@/features/tv/components/TvDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { hasPermission } from "@/features/auth/permissions";

export default async function TvPage() {
  const session = await getServerSession(authOptions);
  
  if (session && !hasPermission("ACCESS_TV", session.user.role)) {
    redirect("/");
  }
  const tvRes = await getTvSettingsAction();

  const initialSettings = tvRes.success && tvRes.data ? tvRes.data : {
    id: 1,
    slug: "global",
    name: "TV Principal",
    mode: "live" as const,
    videoUrl: [],
    uploadedFiles: [],
    services: [],
    locationId: 1,
    marqueeMessages: [],
    slides: [],
  };

  const queueRes = await getQueueStateAction(initialSettings.locationId, initialSettings.services);
  const initialHistory = queueRes.success && queueRes.data ? queueRes.data.history : [];

  const twRes = await getTicketWindowsAction(initialSettings.locationId);
  const initialTicketWindows = twRes.success && twRes.data ? twRes.data : [];

  return <TvDashboard initialHistory={initialHistory} initialSettings={initialSettings} initialTicketWindows={initialTicketWindows} />;
}
