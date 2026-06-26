import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ManagementDashboard from "@/features/management/components/ManagementDashboard";
import { hasPermission } from "@/features/auth/permissions";
import ReportsView from "@/features/reports/components/ReportsView";
import LogisticsDashboard from "@/features/reports/components/LogisticsDashboard";

export default async function ManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const role = session.user?.role;
  if (!hasPermission("ACCESS_MANAGEMENT", role)) {
    redirect("/");
  }

  return (
    <ManagementDashboard
      session={session}
      reportsViewComponent={<ReportsView />}
      dashboardViewComponent={<LogisticsDashboard showHeader />}
    />
  );
}
