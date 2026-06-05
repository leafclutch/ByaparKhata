"use client";

import { create } from "zustand";
import { getNotifications } from "@/lib/services/notifications";
import type { Notification } from "@/lib/types";

// Fix #18: shared store so layout fetch and notifications page share one request
interface NotificationsStore {
  notifications: Notification[];
  companyId: string | null;
  fetch: (companyId: string) => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  companyId: null,
  fetch: async (companyId: string) => {
    if (get().companyId === companyId && get().notifications.length > 0) return;
    set({ companyId });
    try {
      const data = await getNotifications(companyId);
      set({ notifications: data });
    } catch {}
  },
  setNotifications: (notifications) => set({ notifications }),
}));
