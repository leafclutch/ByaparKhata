"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck, Zap, BarChart3, Package, ArrowRight,
  Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { IS_DEMO_MODE } from "@/lib/env";

type Role = "admin" | "operator";

const DEMO_CREDS: Record<Role, { email: string; password: string }> = {
  admin: { email: "admin@nexusretail.in", password: "demo123456" },
  operator: { email: "operator@nexusretail.in", password: "demo123456" },
};

const features = [
  { icon: BarChart3, text: "Real-time business analytics" },
  { icon: Package, text: "Smart inventory management" },
  { icon: Zap, text: "Lightning-fast billing & invoicing" },
  { icon: ShieldCheck, text: "Secure multi-tenant platform" },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState(IS_DEMO_MODE ? DEMO_CREDS.admin.email : "");
  const [password, setPassword] = useState(IS_DEMO_MODE ? DEMO_CREDS.admin.password : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleRoleSwitch(r: Role) {
    setRole(r);
    if (IS_DEMO_MODE) {
      setEmail(DEMO_CREDS[r].email);
      setPassword(DEMO_CREDS[r].password);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (IS_DEMO_MODE) {
      await new Promise((res) => setTimeout(res, 800));
      if (email === DEMO_CREDS[role].email && password === DEMO_CREDS[role].password) {
        toast.success(`Welcome back! Signing in as ${role === "admin" ? "Admin" : "Operator"}…`);
        setTimeout(() => router.push(role === "admin" ? "/admin" : "/operator"), 600);
      } else {
        toast.error("Invalid credentials. Use the demo credentials shown below.");
        setLoading(false);
      }
      return;
    }

    // Real Supabase auth
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message || "Sign in failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      const userRole = (data.user?.user_metadata as { role?: string })?.role;
      toast.success(`Welcome back! Signing in as ${userRole === "operator" ? "Operator" : "Admin"}…`);
      setTimeout(() => router.push(userRole === "operator" ? "/operator" : "/admin"), 600);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — gradient hero */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-12"
        style={{
          background: "linear-gradient(145deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)",
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-violet-600/30 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
            >
              <span className="text-white font-black text-lg tracking-tight">VK</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-tight">ByaparKhata</div>
              <div className="text-indigo-300 text-xs">by Leafclutch Technologies</div>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold text-white leading-tight mb-4"
          >
            Business Operations<br />
            <span className="text-indigo-200">Simplified.</span>
          </motion.h1>
          <p className="text-indigo-200 text-base mb-10 leading-relaxed max-w-sm">
            The modern inventory & billing platform built for growing Indian businesses.
          </p>

          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-indigo-200" />
                </div>
                <span className="text-indigo-100 text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-indigo-300/60 text-xs">
            © 2026 Leafclutch Technologies Pvt. Ltd. · All rights reserved
          </p>
        </div>
      </motion.div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Sign in to your account</h2>
              <p className="text-sm text-slate-500">Choose your role and enter your credentials</p>
            </div>

            {/* Role selector */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
              {(["admin", "operator"] as Role[]).map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRoleSwitch(r)}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                    role === r
                      ? "bg-white text-brand-700 shadow-sm shadow-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {r === "admin" ? "🛡 Admin" : "⚡ Operator"}
                </motion.button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-brand-600 rounded" />
                  Remember me
                </label>
                <button type="button" className="text-brand-600 hover:underline font-medium">
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign in <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo credentials — only shown in demo mode */}
            {IS_DEMO_MODE && (
              <div className="mt-5 p-3.5 bg-brand-50 rounded-xl border border-brand-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                  <span className="text-xs font-semibold text-brand-700">Demo credentials pre-filled</span>
                </div>
                <p className="text-xs text-slate-500">
                  Email: <code className="text-slate-700">{DEMO_CREDS[role].email}</code><br />
                  Password: <code className="text-slate-700">{DEMO_CREDS[role].password}</code>
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            © 2026 Leafclutch Technologies · ByaparKhata v1.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
