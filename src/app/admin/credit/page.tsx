"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCheck, BookOpen, AlertCircle, Phone, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getCustomers } from "@/lib/services/credits";
import { formatNPR } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export default function AdminCreditKhataPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    if (!user) return;
    try {
      const data = await getCustomers(user.company_id);
      setCustomers(data);
    } catch {
      toast.error("Failed to load customer list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      );
    });
  }, [customers, search]);

  const totalOutstanding = useMemo(() => {
    return customers.reduce((acc, c) => acc + Number(c.current_balance), 0);
  }, [customers]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading credit ledger…</div>;

  return (
    <div className="space-y-5 px-0 md:px-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" /> Credit Khata (Udharo Ledger)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">View customer credit accounts and outstanding balances</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 text-white shadow-xl shadow-brand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-100">Total Outstanding Receivables</p>
          <h3 className="text-3xl font-black mt-1 tracking-tight">
            {formatNPR(totalOutstanding)}
          </h3>
        </div>
        <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10 text-xs sm:max-w-xs">
          <p className="font-semibold text-brand-100 mb-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-300" /> Read-Only View
          </p>
          This is a read-only overview of all customer credit accounts managed by your operators.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or phone…"
            className="pl-9 h-10 text-sm rounded-xl"
          />
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium">No customers found</p>
            </div>
          ) : (
            filtered.map((customer) => (
              <div
                key={customer.id}
                onClick={() => router.push(`/admin/credit/${customer.id}`)}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                      {customer.name}
                    </h4>
                    {customer.phone ? (
                      <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" /> {customer.phone}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic mt-0.5">No phone number</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Balance</p>
                    <p className="text-sm font-black text-slate-800">
                      {formatNPR(customer.current_balance)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
