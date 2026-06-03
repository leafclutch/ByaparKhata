"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getCompany } from "@/lib/services/company";
import type { Company } from "@/lib/types";

export function useCompany(): Company | null {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!user?.company_id) return;
    getCompany(user.company_id).then(setCompany).catch(() => {});
  }, [user?.company_id]);

  return company;
}
