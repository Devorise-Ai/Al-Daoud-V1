"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Bot,
  Activity,
  BarChart3,
  Clock,
  ChevronDown,
  Zap,
  Target,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── Period selector ──────────────────────────────────────────────────
type Period = "week" | "month" | "year";
const periodLabels: Record<Period, string> = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

// ── Types ────────────────────────────────────────────────────────────

interface DashboardStats {
  today_bookings: number;
  today_revenue: number;
  week_bookings: number;
  week_revenue: number;
  month_bookings: number;
  month_revenue: number;
  total_customers: number;
  active_conversations: number;
}

interface RevenueTimeline {
  date: string;
  revenue: number;
  bookings_count: number;
}

interface RevenuePerCourt {
  court_name: string;
  revenue: number;
  bookings: number;
}

interface RevenueData {
  timeline: RevenueTimeline[];
  per_court: RevenuePerCourt[];
}

interface BookingsData {
  per_day: { day: string; count: number }[];
  peak_hours: { hour: number; count: number }[];
  popular_courts: { court_name: string; count: number }[];
  source_distribution: { source: string; count: number }[];
  status_distribution: { status: string; count: number }[];
}

interface CustomerData {
  new_per_month: { month: string; count: number }[];
  segments: { segment: string; count: number }[];
  top_customers: { name: string; total_bookings: number; total_spent: number }[];
  retention_rate: number;
}

interface AIData {
  total: number;
  resolved: number;
  abandoned: number;
  success_rate: number;
  avg_messages: number;
  intent_distribution: { intent: string; count: number }[];
}

// ── Custom Tooltip ───────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#a1a1aa] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Pie Tooltip ──────────────────────────────────────────────────────
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-white">
        {entry.name}: {entry.value}
      </p>
    </div>
  );
}

// ── Color helpers ────────────────────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  whatsapp: "#22c55e",
  web: "#3b82f6",
  manual: "#a855f7",
  phone: "#f59e0b",
};

const SEGMENT_COLORS: Record<string, string> = {
  new: "#3b82f6",
  occasional: "#a855f7",
  regular: "#10b981",
  vip: "#f59e0b",
};

const COURT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

// ── Loading skeleton ─────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-[#222] rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#222] rounded-xl p-5 h-32" />
        ))}
      </div>
      <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6 h-[360px]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6 h-[320px]" />
        <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6 h-[320px]" />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [bookingsData, setBookingsData] = useState<BookingsData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [aiData, setAIData] = useState<AIData | null>(null);

  // Fetch period-independent data once
  useEffect(() => {
    async function fetchStaticData() {
      try {
        const [dashRes, custRes, aiRes] = await Promise.all([
          apiClient.get<{ data: DashboardStats }>("/analytics/dashboard"),
          apiClient.get<{ data: CustomerData }>("/analytics/customers"),
          apiClient.get<{ data: AIData }>("/analytics/ai"),
        ]);
        setDashboardStats(dashRes.data);
        setCustomerData(custRes.data);
        setAIData(aiRes.data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        // Keep nulls — UI will show zeros
      }
    }
    fetchStaticData();
  }, []);

  // Fetch period-dependent data
  const fetchPeriodData = useCallback(async (p: Period) => {
    try {
      const [revRes, bookRes] = await Promise.all([
        apiClient.get<{ data: RevenueData }>(`/analytics/revenue?period=${p}`),
        apiClient.get<{ data: BookingsData }>(`/analytics/bookings?period=${p}`),
      ]);
      setRevenueData(revRes.data);
      setBookingsData(bookRes.data);
    } catch (err) {
      console.error("Failed to fetch period data:", err);
      setRevenueData(null);
      setBookingsData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPeriodData(period);
  }, [period, fetchPeriodData]);

  // Derived data for charts
  const revenueTimeline = (revenueData?.timeline || []).map((t) => ({
    date: t.date,
    revenue: Number(t.revenue) || 0,
    bookings: Number(t.bookings_count) || 0,
  }));

  const totalRevenue = revenueTimeline.reduce((s, t) => s + t.revenue, 0);
  const totalBookings = revenueTimeline.reduce((s, t) => s + t.bookings, 0);
  const avgBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const daysInPeriod = revenueTimeline.length || 1;
  const avgPerDay = totalRevenue / daysInPeriod;

  const bookingsPerDay = (bookingsData?.per_day || []).map((d) => ({
    day: d.day,
    bookings: Number(d.count) || 0,
  }));

  const sourceTotal = (bookingsData?.source_distribution || []).reduce((s, d) => s + (Number(d.count) || 0), 0);
  const bookingsBySource = (bookingsData?.source_distribution || []).map((d) => {
    const count = Number(d.count) || 0;
    return {
      name: d.source,
      value: sourceTotal > 0 ? Math.round((count / sourceTotal) * 100) : 0,
      color: SOURCE_COLORS[d.source.toLowerCase()] || "#666",
    };
  });

  const peakHours = bookingsData?.peak_hours || [];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 16 }, (_, i) => i + 8);

  // Build peak data map from API peak_hours
  const peakData: Record<string, Record<number, number>> = {};
  days.forEach((d) => { peakData[d] = {}; });
  peakHours.forEach((ph) => {
    const h = Number(ph.hour);
    const c = Number(ph.count) || 0;
    // API returns aggregated per-hour; distribute evenly across days for now
    days.forEach((d) => {
      peakData[d][h] = (peakData[d][h] || 0) + Math.round(c / 7);
    });
  });
  const maxPeak = Math.max(1, ...Object.values(peakData).flatMap((d) => Object.values(d)));

  const courtPerformance = (revenueData?.per_court || []).map((c, i) => ({
    name: c.court_name,
    revenue: Number(c.revenue) || 0,
    bookings: Number(c.bookings) || 0,
    color: COURT_COLORS[i % COURT_COLORS.length],
  }));

  const customerSegments = (customerData?.segments || []).map((s) => ({
    name: s.segment,
    value: Number(s.count) || 0,
    color: SEGMENT_COLORS[s.segment.toLowerCase()] || "#666",
  }));

  const topCustomers = (customerData?.top_customers || []).map((c) => ({
    name: c.name,
    bookings: Number(c.total_bookings) || 0,
    spent: Number(c.total_spent) || 0,
  }));

  const aiIntents = (aiData?.intent_distribution || []).map((d) => ({
    intent: d.intent,
    count: Number(d.count) || 0,
  }));

  if (loading && !dashboardStats) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Analytics
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Business performance and insights for Al Daoud Courts.
          </p>
        </div>

        {/* Period Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#222] rounded-lg text-sm text-text-primary hover:bg-[#222] transition-colors"
          >
            <Calendar className="w-4 h-4 text-emerald-500" />
            {periodLabels[period]}
            <ChevronDown className={cn("w-4 h-4 text-[#a1a1aa] transition-transform", dropdownOpen && "rotate-180")} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
              {(Object.keys(periodLabels) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setDropdownOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors",
                    p === period
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "text-text-secondary hover:bg-[#222]"
                  )}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 1: Revenue Overview ─────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-text-primary">Revenue Overview</h2>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} JOD`, icon: DollarSign, change: dashboardStats ? `${dashboardStats.today_revenue.toLocaleString()} today` : "--" },
            { label: "Avg per Booking", value: `${avgBooking.toFixed(1)} JOD`, icon: TrendingUp, change: `${totalBookings} bookings` },
            { label: "Total Bookings", value: totalBookings.toLocaleString(), icon: Calendar, change: dashboardStats ? `${dashboardStats.today_bookings} today` : "--" },
            { label: "Avg per Day", value: `${avgPerDay.toFixed(0)} JOD`, icon: Activity, change: `${daysInPeriod} days` },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-[#1a1a1a] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-text-primary tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#a1a1aa] mt-1">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Line Chart */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Revenue Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis
                  dataKey="date"
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                />
                <YAxis
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                  tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#10b981" }}
                  name="Revenue (JOD)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── Section 2: Booking Insights ─────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-text-primary">Booking Insights</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bookings per Day Bar Chart */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Bookings by Day of Week
            </h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis
                    dataKey="day"
                    stroke="#a1a1aa"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    axisLine={{ stroke: "#333" }}
                  />
                  <YAxis
                    stroke="#a1a1aa"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    axisLine={{ stroke: "#333" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="bookings"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Bookings"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings by Source Donut */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Bookings by Source
            </h3>
            <div className="h-[260px] flex items-center">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {bookingsBySource.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 pr-4">
                {bookingsBySource.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{s.name}</p>
                      <p className="text-xs text-[#a1a1aa]">{s.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Peak Hours Heatmap ───────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-text-primary">Peak Hours</h2>
        </div>

        <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Header row: hours */}
            <div className="flex">
              <div className="w-16 shrink-0" />
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex-1 text-center text-[11px] text-[#a1a1aa] pb-2 font-medium"
                >
                  {h <= 12 ? `${h}AM` : `${h - 12}PM`}
                </div>
              ))}
            </div>

            {/* Rows: days */}
            {days.map((day) => (
              <div key={day} className="flex items-center">
                <div className="w-16 shrink-0 text-xs text-[#a1a1aa] font-medium py-1">
                  {day}
                </div>
                {hours.map((h) => {
                  const val = peakData[day]?.[h] || 0;
                  const opacity = val / maxPeak;
                  return (
                    <div key={h} className="flex-1 p-0.5">
                      <div
                        className="w-full aspect-square rounded-[3px] transition-colors"
                        style={{
                          backgroundColor:
                            val === 0
                              ? "rgba(255,255,255,0.03)"
                              : `rgba(16, 185, 129, ${0.15 + opacity * 0.85})`,
                        }}
                        title={`${day} ${h <= 12 ? `${h}AM` : `${h - 12}PM`}: ${val} bookings`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3 pt-2">
              <span className="text-[11px] text-[#a1a1aa]">Less</span>
              {[0, 0.25, 0.5, 0.75, 1].map((o, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-[2px]"
                  style={{
                    backgroundColor:
                      o === 0
                        ? "rgba(255,255,255,0.03)"
                        : `rgba(16, 185, 129, ${0.15 + o * 0.85})`,
                  }}
                />
              ))}
              <span className="text-[11px] text-[#a1a1aa]">More</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Court Performance ────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-text-primary">Court Performance</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {courtPerformance.map((court) => {
            const maxRevenue = Math.max(1, ...courtPerformance.map((c) => c.revenue));
            const pct = (court.revenue / maxRevenue) * 100;
            return (
              <div
                key={court.name}
                className="bg-[#1a1a1a] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: court.color }}
                  />
                  <h4 className="text-sm font-medium text-text-primary truncate">
                    {court.name}
                  </h4>
                </div>
                <p className="text-xl font-bold text-text-primary">
                  {court.revenue.toLocaleString()} JOD
                </p>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  {court.bookings} bookings
                </p>
                {/* Bar */}
                <div className="mt-3 h-2 bg-[#222] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: court.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 5: Customer Insights ────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-text-primary">Customer Insights</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Segment Distribution Donut */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Customer Segments
            </h3>
            <div className="h-[260px] flex items-center">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 pr-4">
                {customerSegments.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{s.name}</p>
                      <p className="text-xs text-[#a1a1aa]">{s.value} customers</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Customers Table */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Top Customers
            </h3>
            <div className="space-y-1">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_100px] gap-2 px-3 py-2 text-xs text-[#a1a1aa] font-medium border-b border-[#222]">
                <span>Customer</span>
                <span className="text-right">Bookings</span>
                <span className="text-right">Spent</span>
              </div>
              {topCustomers.map((c, i) => (
                <div
                  key={c.name}
                  className="grid grid-cols-[1fr_80px_100px] gap-2 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-bold text-emerald-500 shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm text-text-primary truncate">
                      {c.name}
                    </span>
                  </div>
                  <span className="text-sm text-[#a1a1aa] text-right">{c.bookings}</span>
                  <span className="text-sm font-medium text-text-primary text-right">
                    {c.spent.toLocaleString()} JOD
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: AI Performance ───────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-text-primary">AI Performance</h2>
        </div>

        {/* AI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Success Rate", value: aiData ? `${aiData.success_rate}%` : "0%", icon: Zap, desc: "Resolved conversations" },
            { label: "Avg Messages", value: aiData ? `${aiData.avg_messages}` : "0", icon: MessageSquare, desc: "Per conversation" },
            { label: "Total Conversations", value: aiData ? `${aiData.total}` : "0", icon: Bot, desc: `${aiData?.resolved || 0} resolved` },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-[#1a1a1a] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-xs text-[#a1a1aa] mt-0.5">{stat.label}</p>
                    <p className="text-[11px] text-[#666] mt-0.5">{stat.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Intent Distribution Bar Chart */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Intent Distribution
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiIntents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                />
                <YAxis
                  type="category"
                  dataKey="intent"
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  name="Conversations"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
