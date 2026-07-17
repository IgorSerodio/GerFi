import React from "react";
import { getQueueStateAction } from "@/features/queue/actions";;;
import { getTvSettingsAction } from "@/features/tv/actions";
import TvDashboard from "@/features/tv/components/TvDashboard";

export default async function CustomTvPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const tvRes = await getTvSettingsAction(resolvedParams.slug);
  
  const initialSettings = tvRes.success && tvRes.data ? tvRes.data : {
    id: 1,
    slug: resolvedParams.slug,
    name: "TV Customizada",
    mode: "live" as const,
    videoUrl: [],
    uploadedFiles: [],
    services: [],
    locationId: 1,
  };

  // Puxa o estado inicial da fila já filtrado para essa TV
  const queueRes = await getQueueStateAction(initialSettings.locationId, initialSettings.services);
  const initialHistory = queueRes.success && queueRes.data ? queueRes.data.history : [];

  return <TvDashboard initialHistory={initialHistory} initialSettings={initialSettings} />;
}
