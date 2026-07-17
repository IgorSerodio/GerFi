import { useState, useEffect } from "react";
import { getReportFiltersDataAction } from "@/features/reports/actions";
import { Location } from "@/features/management/types";;
import { User } from "@/features/users/types";

export function useReportFilters() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadFilters = async () => {
      const res = await getReportFiltersDataAction();
      if (res.success && res.data) {
        setLocations(res.data.locations);
        setUsers(res.data.users);
      }
    };
    loadFilters();
  }, []);

  return { locations, users };
}
