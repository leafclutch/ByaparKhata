"use client";

import { useAuth } from "@/hooks/useAuth";
import { Topbar } from "./Topbar";

export function AuthenticatedTopbar({ title }: { title: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return <Topbar title={title} user={user} />;
}
