"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Circle, Eye, EyeOff, Loader2 } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.05)_0%,_transparent_40%)]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Login Card */}
        <div className="bg-card border border-border-subtle rounded-2xl p-8 shadow-2xl shadow-black/20">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center">
                <Circle className="w-5 h-5 text-emerald fill-emerald" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Al Daoud
              </h1>
            </div>
            <p className="text-text-secondary text-sm font-arabic">
              &#1605;&#1604;&#1575;&#1593;&#1576; &#1575;&#1604;&#1583;&#1575;&#1593;&#1608;&#1583; &#1604;&#1603;&#1585;&#1577; &#1575;&#1604;&#1602;&#1583;&#1605;
            </p>
            <p className="text-text-muted text-xs mt-1">
              Management Dashboard
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aldaoud.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm bg-background border border-border-subtle focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all duration-200 placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary"
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
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm bg-background border border-border-subtle focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all duration-200 placeholder:text-text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200",
                "bg-emerald hover:bg-emerald-dark text-white",
                "focus:outline-none focus:ring-2 focus:ring-emerald/40 focus:ring-offset-2 focus:ring-offset-background",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg shadow-emerald/20 hover:shadow-emerald/30"
              )}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-xs mt-6">
          Al Daoud Football Courts Management System
        </p>
      </div>
    </div>
  );
}
