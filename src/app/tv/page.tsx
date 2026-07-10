import React from "react";
import { getQueueStateAction } from "@/features/queue/actions";
import { getTvSettingsAction } from "@/features/tv/actions";
import TvDashboard from "@/features/tv/components/TvDashboard";

export default async function TvPage() {
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
  };

  const queueRes = await getQueueStateAction(initialSettings.locationId, initialSettings.services);
  const initialHistory = queueRes.success && queueRes.data ? queueRes.data.history : [];

  return <TvDashboard initialHistory={initialHistory} initialSettings={initialSettings} />;
}
