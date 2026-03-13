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
    color: "emerald",
  },
  {
    label: "View Calendar",
    description: "Full schedule view",
    icon: CalendarDays,
    href: "/calendar",
    color: "blue",
  },
  {
    label: "Manage Courts",
    description: "Court settings",
    icon: Settings2,
    href: "/courts",
    color: "violet",
  },
];

const colorMap: Record<
  string,
  { bg: string; text: string; iconBg: string; border: string }
> = {
  emerald: {
    bg: "bg-emerald/5",
    text: "text-emerald",
    iconBg: "bg-emerald/10",
    border: "border-emerald/10",
  },
  blue: {
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    iconBg: "bg-blue-500/10",
    border: "border-blue-500/10",
  },
  violet: {
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    iconBg: "bg-violet-500/10",
    border: "border-violet-500/10",
  },
  amber: {
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    iconBg: "bg-amber-500/10",
    border: "border-amber-500/10",
  },
};

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

      // Fetch dashboard stats (requires auth - graceful fallback)
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

      // Fetch today's bookings
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await apiClient.get<{ data: ApiBooking[] }>(
          `/bookings?date_from=${today}&date_to=${today}`
        );
        setTodayBookings(res.data || []);
      } catch {
        setTodayBookings([]);
      }

      // Fetch courts list
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
        {
          label: "Today's Bookings",
          value: stats.todayBookings,
          change: "",
          trend: "up" as const,
          icon: Calendar,
          color: "emerald",
        },
        {
          label: "Today's Revenue",
          value: stats.todayRevenue,
          change: "",
          trend: "up" as const,
          icon: DollarSign,
          color: "blue",
        },
        {
          label: "Active Courts",
          value: stats.activeCourts,
          change: "",
          trend: "up" as const,
          icon: MapPin,
          color: "violet",
        },
        {
          label: "AI Conversations",
          value: stats.aiConversations,
          change: "",
          trend: "up" as const,
          icon: Bot,
          color: "amber",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Welcome back, Admin
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Here is what is happening at Al Daoud Courts today.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border-subtle bg-card p-5 animate-pulse"
            >
              <div className="h-10 w-10 rounded-lg bg-white/[0.06]" />
              <div className="mt-4 space-y-2">
                <div className="h-6 w-16 rounded bg-white/[0.06]" />
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
        <div className="text-text-muted text-sm">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Welcome back, Admin
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Here is what is happening at Al Daoud Courts today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <div
              key={stat.label}
              className={cn(
                "rounded-xl border bg-card p-5 transition-all duration-200 hover:bg-card-hover",
                colors.border
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    colors.iconBg
                  )}
                >
                  <Icon className={cn("w-5 h-5", colors.text)} />
                </div>
                {stat.change && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                      stat.trend === "up"
                        ? "text-emerald bg-emerald/10"
                        : "text-danger bg-danger/10"
                    )}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {stat.change}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-text-primary tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-text-muted mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="xl:col-span-2 bg-card border border-border-subtle rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Today&apos;s Schedule
                </h2>
                <p className="text-xs text-text-muted">
                  {todayBookings.length} bookings scheduled
                </p>
              </div>
            </div>
            <Link
              href="/bookings"
              className="text-xs text-emerald hover:text-emerald-light font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {todayBookings.length === 0 && (
              <div className="px-6 py-8 text-center text-text-muted text-sm">
                No bookings scheduled for today.
              </div>
            )}
            {todayBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                {/* Time */}
                <div className="w-28 shrink-0">
                  <span className="text-sm font-medium text-text-primary">
                    {formatBookingTime(booking.start_time, booking.end_time)}
                  </span>
                </div>

                {/* Court & Customer */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {booking.customer_name || "Unknown Customer"}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {booking.court_name || `Court ${booking.court_id}`}
                  </p>
                </div>

                {/* Duration */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {booking.duration_mins}m
                </div>

                {/* Status */}
                <div
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
                    booking.status === "confirmed"
                      ? "bg-emerald/10 text-emerald"
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

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const colors = colorMap[action.color];
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border-subtle hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        colors.iconBg
                      )}
                    >
                      <Icon className={cn("w-4 h-4", colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {action.label}
                      </p>
                      <p className="text-xs text-text-muted">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Court Status Card */}
          <div className="bg-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">
              Court Status
            </h2>
            <div className="space-y-3">
              {courts.length === 0 && (
                <p className="text-xs text-text-muted">No courts available.</p>
              )}
              {courts.map((court) => {
                const courtStatus = court.status || "available";
                return (
                  <div
                    key={court.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          courtStatus === "occupied" && "bg-emerald",
                          courtStatus === "available" && "bg-text-muted",
                          courtStatus === "maintenance" && "bg-amber-400",
                          courtStatus !== "occupied" &&
                            courtStatus !== "available" &&
                            courtStatus !== "maintenance" &&
                            "bg-text-muted"
                        )}
                      />
                      <span className="text-sm text-text-secondary">
                        {court.name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium capitalize",
                        courtStatus === "occupied" && "text-emerald",
                        courtStatus === "available" && "text-text-muted",
                        courtStatus === "maintenance" && "text-amber-400",
                        courtStatus !== "occupied" &&
                          courtStatus !== "available" &&
                          courtStatus !== "maintenance" &&
                          "text-text-muted"
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
