"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  DollarSign,
  MapPin,
  Bot,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  CalendarDays,
  Settings2,
  ArrowRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface DashboardStats {
  todayBookings: string;
  todayRevenue: string;
  activeCourts: string;
  aiConversations: string;
}

interface ApiBooking {
  id: number;
  customer_name: string;
  customer_phone: string;
  court_name: string;
  court_id: number;
  start_time: string;
  end_time: string;
  status: string;
  booking_type: string;
  duration_mins: number;
  price: number;
  source: string;
}

const quickActions = [
  {
    label: "New Booking",
    description: "Create a reservation",
    icon: Plus,
    href: "/bookings/new",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/10 hover:border-emerald-500/25",
  },
  {
    label: "View Calendar",
    description: "Full schedule view",
    icon: CalendarDays,
    href: "/calendar",
    gradient: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/10 hover:border-blue-500/25",
  },
  {
    label: "Manage Courts",
    description: "Court settings",
    icon: Settings2,
    href: "/courts",
    gradient: "from-violet-500/10 to-violet-600/5",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/10 hover:border-violet-500/25",
  },
];

function formatBookingTime(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} - ${fmt(end)}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayBookings, setTodayBookings] = useState<ApiBooking[]>([]);
  const [courts, setCourts] = useState<
    { id: number; name: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setError(null);

      let dashStats: DashboardStats | null = null;
      try {
        const res = await apiClient.get<{
          today_bookings?: number;
          today_revenue?: number;
          active_courts?: number;
          total_courts?: number;
          ai_conversations?: number;
          bookings_change?: string;
          revenue_change?: string;
        }>("/analytics/dashboard");
        dashStats = {
          todayBookings: String(res.today_bookings ?? "—"),
          todayRevenue: res.today_revenue != null ? `${res.today_revenue} JOD` : "—",
          activeCourts:
            res.active_courts != null && res.total_courts != null
              ? `${res.active_courts} / ${res.total_courts}`
              : "—",
          aiConversations: String(res.ai_conversations ?? "—"),
        };
      } catch {
        dashStats = {
          todayBookings: "—",
          todayRevenue: "—",
          activeCourts: "—",
          aiConversations: "—",
        };
      }
      setStats(dashStats);

      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await apiClient.get<{ data: ApiBooking[] }>(
          `/bookings?date_from=${today}&date_to=${today}`
        );
        setTodayBookings(res.data || []);
      } catch {
        setTodayBookings([]);
      }

      try {
        const res = await apiClient.get<
          { id: number; name: string; status: string }[]
        >("/courts");
        const courtsList = Array.isArray(res) ? res : [];
        setCourts(courtsList);
      } catch {
        setCourts([]);
      }

      setLoading(false);
    }

    fetchDashboard();
  }, []);

  const statCards = stats
    ? [
        { label: "Today's Bookings", value: stats.todayBookings, icon: Calendar, gradient: "from-emerald-500/15 to-emerald-600/5", iconColor: "text-emerald-400", borderColor: "border-emerald-500/10" },
        { label: "Today's Revenue", value: stats.todayRevenue, icon: DollarSign, gradient: "from-blue-500/15 to-blue-600/5", iconColor: "text-blue-400", borderColor: "border-blue-500/10" },
        { label: "Active Courts", value: stats.activeCourts, icon: MapPin, gradient: "from-violet-500/15 to-violet-600/5", iconColor: "text-violet-400", borderColor: "border-violet-500/10" },
        { label: "AI Conversations", value: stats.aiConversations, icon: Bot, gradient: "from-amber-500/15 to-amber-600/5", iconColor: "text-amber-400", borderColor: "border-amber-500/10" },
      ]
    : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-[-0.02em]">
            Welcome back
          </h1>
          <p className="text-zinc-500 text-[13px] mt-1">Loading dashboard...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.04] bg-[#0e0e0e] p-6 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-white/[0.04]" />
              <div className="mt-5 space-y-2">
                <div className="h-7 w-16 rounded bg-white/[0.04]" />
                <div className="h-3 w-24 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-[22px] font-bold text-white tracking-[-0.02em]">
          Welcome back
        </h1>
        <p className="text-zinc-500 text-[13px] mt-1">
          Here is what is happening at Al Daoud Courts today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                "relative rounded-xl border bg-[#0e0e0e] p-6 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/20 group overflow-hidden",
                stat.borderColor
              )}
            >
              {/* Subtle gradient overlay */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", stat.gradient)} />

              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.04] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <Icon className={cn("w-5 h-5", stat.iconColor)} />
                </div>
                <p className="text-[26px] font-bold text-white tracking-[-0.02em] leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] text-zinc-500 mt-2 uppercase tracking-[0.08em] font-medium">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="xl:col-span-2 bg-[#0e0e0e] border border-white/[0.04] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-white">
                  Today&apos;s Schedule
                </h2>
                <p className="text-[11px] text-zinc-600">
                  {todayBookings.length} bookings scheduled
                </p>
              </div>
            </div>
            <Link
              href="/bookings"
              className="text-[12px] text-emerald-400/80 hover:text-emerald-400 font-medium flex items-center gap-1 transition-colors duration-200"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {todayBookings.length === 0 && (
              <div className="px-6 py-12 text-center text-zinc-600 text-[13px]">
                No bookings scheduled for today.
              </div>
            )}
            {todayBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-all duration-200 group"
              >
                {/* Color indicator + Time */}
                <div className="flex items-center gap-3 w-32 shrink-0">
                  <div className={cn(
                    "w-1 h-8 rounded-full",
                    booking.status === "confirmed" ? "bg-emerald-500" : booking.status === "completed" ? "bg-blue-500" : "bg-zinc-700"
                  )} />
                  <span className="text-[13px] font-mono font-medium text-zinc-300">
                    {formatBookingTime(booking.start_time, booking.end_time)}
                  </span>
                </div>

                {/* Customer & Court */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                    {booking.customer_name || "Unknown Customer"}
                  </p>
                  <p className="text-[11px] text-zinc-600 truncate">
                    {booking.court_name || `Court ${booking.court_id}`}
                  </p>
                </div>

                {/* Price */}
                <div className="hidden sm:block text-[13px] font-semibold text-zinc-300 shrink-0">
                  {booking.price} <span className="text-zinc-600 font-normal text-[11px]">JOD</span>
                </div>

                {/* Status */}
                <div
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0",
                    booking.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : booking.status === "completed"
                        ? "bg-blue-500/10 text-blue-400"
                        : booking.status === "cancelled"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                  )}
                >
                  {booking.status.charAt(0).toUpperCase() +
                    booking.status.slice(1).replace("_", " ")}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-[#0e0e0e] border border-white/[0.04] rounded-xl p-6">
            <h2 className="text-[13px] font-semibold text-zinc-300 uppercase tracking-[0.06em] mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-md hover:shadow-black/10",
                      action.borderColor,
                      "bg-white/[0.01]"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", action.gradient)}>
                      <Icon className={cn("w-[18px] h-[18px]", action.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-700 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Court Status */}
          <div className="bg-[#0e0e0e] border border-white/[0.04] rounded-xl p-6">
            <h2 className="text-[13px] font-semibold text-zinc-300 uppercase tracking-[0.06em] mb-4">
              Court Status
            </h2>
            <div className="space-y-3">
              {courts.length === 0 && (
                <p className="text-[12px] text-zinc-600">No courts available.</p>
              )}
              {courts.map((court) => {
                const courtStatus = court.status || "available";
                return (
                  <div
                    key={court.id}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            courtStatus === "occupied" && "bg-emerald-500",
                            courtStatus === "available" && "bg-zinc-600",
                            courtStatus === "maintenance" && "bg-amber-400",
                            courtStatus !== "occupied" &&
                              courtStatus !== "available" &&
                              courtStatus !== "maintenance" &&
                              "bg-zinc-600"
                          )}
                        />
                        {courtStatus === "occupied" && (
                          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-30" />
                        )}
                      </div>
                      <span className="text-[13px] text-zinc-300">
                        {court.name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-semibold capitalize px-2 py-0.5 rounded-md",
                        courtStatus === "occupied" && "text-emerald-400 bg-emerald-500/10",
                        courtStatus === "available" && "text-zinc-500 bg-zinc-800/50",
                        courtStatus === "maintenance" && "text-amber-400 bg-amber-500/10",
                        courtStatus !== "occupied" &&
                          courtStatus !== "available" &&
                          courtStatus !== "maintenance" &&
                          "text-zinc-500 bg-zinc-800/50"
                      )}
                    >
                      {courtStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
