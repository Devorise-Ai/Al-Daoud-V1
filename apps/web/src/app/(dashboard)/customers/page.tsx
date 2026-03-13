"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Crown,
  UserCheck,
  UserPlus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  MoreHorizontal,
  Eye,
  MessageCircle,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

type Segment = "vip" | "regular" | "occasional" | "new";

interface Customer {
  id: number;
  name: string;
  phone: string;
  segment: Segment;
  total_bookings: number;
  total_spent: number;
  last_contact: string;
}

const segmentConfig: Record<Segment, { label: string; bg: string; text: string; dot: string }> = {
  vip: { label: "VIP", bg: "bg-emerald/10", text: "text-emerald", dot: "bg-emerald" },
  regular: { label: "Regular", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  occasional: { label: "Occasional", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  new: { label: "New", bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" },
};

const ROWS_PER_PAGE = 20;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<"all" | Segment>("all");
  const [page, setPage] = useState(1);
  const [openAction, setOpenAction] = useState<number | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Segment stats
  const [segmentStats, setSegmentStats] = useState<{
    total: number;
    segments: { segment: string; count: number }[];
  }>({ total: 0, segments: [] });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', ROWS_PER_PAGE.toString());
      if (search) params.set('search', search);
      if (segmentFilter !== 'all') params.set('segment', segmentFilter);

      const res: any = await apiClient.get('/customers?' + params.toString());
      setCustomers(res.data);
      if (res.pagination) {
        setTotalCustomers(res.pagination.total);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, segmentFilter]);

  const fetchSegmentStats = useCallback(async () => {
    try {
      const res: any = await apiClient.get('/customers/segments');
      setSegmentStats(res.data || res);
    } catch (err) {
      console.error('Failed to fetch segment stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchSegmentStats();
  }, [fetchSegmentStats]);

  const getSegmentCount = (seg: string) => {
    const found = segmentStats.segments.find((s: any) => (s.segment || s.name) === seg);
    return found ? found.count : 0;
  };

  const stats = [
    { label: "Total Customers", value: segmentStats.total, icon: Users, color: "text-emerald", bg: "bg-emerald/10" },
    { label: "VIP", value: getSegmentCount("vip"), icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Regular", value: getSegmentCount("regular"), icon: UserCheck, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "New", value: getSegmentCount("new"), icon: UserPlus, color: "text-violet-400", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Customers
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage your customer base and track engagement
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border-subtle rounded-xl p-5 transition-all duration-200 hover:border-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-card border border-border-subtle focus:border-emerald"
          />
        </div>
        <div className="relative">
          <select
            value={segmentFilter}
            onChange={(e) => {
              setSegmentFilter(e.target.value as "all" | Segment);
              setPage(1);
            }}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg text-sm bg-card border border-border-subtle focus:border-emerald cursor-pointer min-w-[160px]"
          >
            <option value="all">All Segments</option>
            <option value="new">New</option>
            <option value="occasional">Occasional</option>
            <option value="regular">Regular</option>
            <option value="vip">VIP</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Segment
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Total Bookings
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted text-sm">
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted text-sm">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const seg = segmentConfig[customer.segment] || segmentConfig.new;
                  const initials = customer.name
                    ? customer.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                    : "?";
                  return (
                    <tr
                      key={customer.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-white/[0.02] transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-emerald/10 border border-emerald/20 flex items-center justify-center text-xs font-semibold text-emerald shrink-0">
                            {initials}
                          </div>
                          <span
                            className="text-sm font-medium text-text-primary group-hover:text-emerald transition-colors"
                            dir="rtl"
                          >
                            {customer.name || customer.phone}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                          <Phone className="w-3.5 h-3.5 text-text-muted" />
                          {customer.phone}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                            seg.bg,
                            seg.text
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", seg.dot)} />
                          {seg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                        {customer.total_bookings}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary font-semibold">
                        {customer.total_spent}{" "}
                        <span className="text-text-muted font-normal text-xs">JOD</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {customer.last_contact ? new Date(customer.last_contact).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 relative">
                          <button
                            onClick={() =>
                              setOpenAction(
                                openAction === customer.id ? null : customer.id
                              )
                            }
                            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openAction === customer.id && (
                            <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-card border border-border rounded-lg shadow-xl py-1">
                              <Link
                                href={`/customers/${customer.id}`}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Profile
                              </Link>
                              <button className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors w-full text-left">
                                <MessageCircle className="w-4 h-4" />
                                Send WhatsApp
                              </button>
                              <button className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors w-full text-left">
                                <Pencil className="w-4 h-4" />
                                Edit Customer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-xs text-text-muted">
            Showing{" "}
            <span className="text-text-secondary font-medium">
              {totalCustomers === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="text-text-secondary font-medium">
              {Math.min(page * ROWS_PER_PAGE, totalCustomers)}
            </span>{" "}
            of{" "}
            <span className="text-text-secondary font-medium">
              {totalCustomers}
            </span>{" "}
            customers
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200",
                  p === page
                    ? "bg-emerald text-white"
                    : "text-text-muted hover:text-text-primary hover:bg-white/[0.06]"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
