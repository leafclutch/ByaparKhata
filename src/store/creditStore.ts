"use client";

import { create } from "zustand";

interface CreditStore {
  createCustomerOpen: boolean;
  issueCreditOpen: boolean;
  settleCreditOpen: boolean;
  setCreateCustomerOpen: (open: boolean) => void;
  setIssueCreditOpen: (open: boolean) => void;
  setSettleCreditOpen: (open: boolean) => void;
}

export const useCreditStore = create<CreditStore>((set) => ({
  createCustomerOpen: false,
  issueCreditOpen: false,
  settleCreditOpen: false,
  setCreateCustomerOpen: (open) => set({ createCustomerOpen: open }),
  setIssueCreditOpen: (open) => set({ issueCreditOpen: open }),
  setSettleCreditOpen: (open) => set({ settleCreditOpen: open }),
}));
