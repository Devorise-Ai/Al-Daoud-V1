"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { setToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiClient.post<{ token: string }>("/auth/login", {
        email,
        password,
      });
      setToken(data.token);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden">
      {/* Layered ambient glow */}
      <div className="absolute top-[-30%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      <div className="absolute top-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-emerald-400/[0.02] blur-[80px]" />
      <div className="absolute top-[60%] left-[30%] w-[250px] h-[250px] rounded-full bg-emerald-600/[0.02] blur-[90px]" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Login Card */}
        <div className="relative">
          {/* Glow border effect */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent" />
          {/* Logo glow */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/[0.06] rounded-full blur-[50px]" />

          <div className="relative bg-[#0c0c0c] rounded-2xl p-10 backdrop-blur-xl">
            {/* Brand Header */}
            <div className="text-center mb-10">
              {/* Logo */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 mb-5 shadow-lg shadow-emerald-500/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.6" />
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                </svg>
              </div>

              <h1 className="text-[26px] font-bold text-white tracking-[-0.02em] leading-none">
                Al Daoud
              </h1>
              <p className="text-emerald-400/70 text-[13px] font-medium mt-2 tracking-wide" dir="rtl">
                &#1605;&#1604;&#1575;&#1593;&#1576; &#1575;&#1604;&#1583;&#1575;&#1593;&#1608;&#1583; &#1604;&#1603;&#1585;&#1577; &#1575;&#1604;&#1602;&#1583;&#1605;
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-zinc-700" />
                <p className="text-zinc-500 text-[11px] uppercase tracking-[0.15em] font-medium">
                  Management Portal
                </p>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-zinc-700" />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-[13px] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aldaoud.jo"
                  required
                  className="w-full px-4 py-3.5 rounded-xl text-[14px] text-white bg-white/[0.03] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3.5 pr-12 rounded-xl text-[14px] text-white bg-white/[0.03] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full py-3.5 px-4 rounded-xl text-[14px] font-semibold transition-all duration-300",
                    "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white",
                    "hover:from-emerald-500 hover:to-emerald-400 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-emerald-500/25",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-[#0c0c0c]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
                    "active:translate-y-[1px] active:shadow-none"
                  )}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-zinc-600 text-[11px] tracking-wide">
            Al Daoud Football Courts &middot; Abdoun, Amman
          </p>
          <p className="text-zinc-700 text-[10px]">
            v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
