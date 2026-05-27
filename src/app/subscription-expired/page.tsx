"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

function ExpiredContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "Your Company";
  const email = params.get("email");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Avatar */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xl mb-5">
          {getInitials(name)}
        </div>

        <h1 className="text-lg font-bold text-slate-900">{name}</h1>

        {/* Icon + message */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Subscription Expired</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
            Your subscription has expired or been paused. Please contact your administrator to renew access.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          {email && (
            <Button asChild className="gap-2 bg-brand-600 hover:bg-brand-700">
              <a href={`mailto:${email}`}>
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>

        <p className="mt-8 text-[10px] text-slate-300">Powered by VyaparKhata</p>
      </div>
    </div>
  );
}

export default function SubscriptionExpiredPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-sm text-slate-400">Loading…</p></div>}>
      <ExpiredContent />
    </Suspense>
  );
}
