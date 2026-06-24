import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
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

  return (
    <ManagementDashboard
      session={session}
    />
  );
}
