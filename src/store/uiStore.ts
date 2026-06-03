"use client";

import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  notifPanelOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setNotifPanelOpen: (open: boolean) => void;
  toggleNotifPanel: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  notifPanelOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setNotifPanelOpen: (open) => set({ notifPanelOpen: open }),
  toggleNotifPanel: () => set((s) => ({ notifPanelOpen: !s.notifPanelOpen })),
}));
