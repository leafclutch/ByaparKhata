"use client";

import { useAuth } from "@/hooks/useAuth";
import { Topbar } from "./Topbar";
import { DEMO_ADMIN } from "@/lib/mock-data";

export function AuthenticatedTopbar({ title }: { title: string }) {
  const { user } = useAuth();
  return <Topbar title={title} user={user ?? DEMO_ADMIN} />;
}
