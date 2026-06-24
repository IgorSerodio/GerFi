import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getTvSettingsAction } from "@/features/queue/actions";
import ManagementDashboard from "@/features/management/components/ManagementDashboard";

export default async function ManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const role = session.user?.role;
  if (role !== "Admin" && role !== "Gerente") {
    redirect("/");
  }

  const tvRes = await getTvSettingsAction();
  const initialTvSettings = tvRes.success && tvRes.data ? tvRes.data : {
    id: 1,
    mode: "live" as const,
    videoUrl: [],
    uploadedFiles: [],
  };

  return (
    <ManagementDashboard
      session={session}
      initialTvSettings={initialTvSettings}
    />
  );
}
