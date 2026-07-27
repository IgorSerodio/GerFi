import { useState, useEffect } from "react";
import { getReportFiltersDataAction } from "@/features/reports/actions";
import { getCategoriesAction } from "@/features/management/actions";
import { Location, DbCategory } from "@/features/management/types";
import { User } from "@/features/users/types";

export function useReportFilters() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);

  useEffect(() => {
    const loadFilters = async () => {
      const [resFilters, resCategories] = await Promise.all([
        getReportFiltersDataAction(),
        getCategoriesAction()
      ]);
      
      if (resFilters.success && resFilters.data) {
        setLocations(resFilters.data.locations);
        setUsers(resFilters.data.users);
      }
      
      if (resCategories.success && resCategories.data) {
        setCategories(resCategories.data as DbCategory[]);
      }
    };
    loadFilters();
  }, []);

  return { locations, users, categories };
}
