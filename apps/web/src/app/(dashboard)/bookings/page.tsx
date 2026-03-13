"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
  MoreHorizontal,
  Calendar,
  Phone,
  MessageSquare,
  Globe,
  UserPlus,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

type BookingStatus = "confirmed" | "completed" | "cancelled" | "no_show";
type BookingSource = "whatsapp" | "web" | "manual";

interface ApiBooking {
  id: number;
  customer_name: string;
  customer_phone: string;
  court_name: string;
  court_id: number;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  booking_type: string;
  duration_mins: number;
  price: number;
  source: BookingSource;
  cancel_token: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const statusConfig: Record<
  BookingStatus,
  { label: string; bg: string; text: string }
> = {
  confirmed: {
    label: "Confirmed",
    bg: "bg-emerald/10",
    text: "text-emerald",
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-500/10",
    text: "text-red-400",
  },
  no_show: {
    label: "No Show",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
};

const sourceConfig: Record<
  BookingSource,
  { label: string; bg: string; text: string; icon: typeof MessageSquare }
> = {
  whatsapp: {
    label: "WhatsApp",
    bg: "bg-green-500/10",
    text: "text-green-400",
    icon: MessageSquare,
  },
  web: {
    label: "Web",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    icon: Globe,
  },
  manual: {
    label: "Manual",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    icon: UserPlus,
  },
};

function formatTime(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} - ${fmt(end)}`;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function BookingsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [courts, setCourts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courts once
  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await apiClient.get<{ id: number; name: string }[]>(
          "/courts"
        );
        setCourts(Array.isArray(res) ? res : []);
      } catch {
        setCourts([]);
      }
    }
    fetchCourts();
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "20");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (courtFilter !== "all") params.set("court_id", courtFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (searchQuery) params.set("search", searchQuery);

      const res = await apiClient.get<{
        data: ApiBooking[];
        pagination: PaginationInfo;
      }>(`/bookings?${params.toString()}`);

      setBookings(res.data || []);
      setPagination(
        res.pagination || { page: 1, limit: 20, total: 0, pages: 1 }
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load bookings";
      setError(message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, courtFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Debounce search - reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, courtFilter, dateFrom, dateTo]);

  const totalPages = pagination.pages || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Bookings
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage and track all court reservations
          </p>
        </div>
        <Link
          href="/bookings/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald hover:bg-emerald-dark text-white text-sm font-medium rounded-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border-subtle rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-secondary focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          {/* Court */}
          <select
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-secondary focus:outline-none cursor-pointer"
          >
            <option value="all">All Courts</option>
            {courts.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-text-secondary focus:outline-none"
              />
            </div>
            <span className="text-text-muted text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-secondary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Court
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    Date & Time
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Price (JOD)
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Source
                </th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-text-muted text-sm"
                  >
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-text-muted text-sm"
                  >
                    No bookings found matching your filters.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const status =
                    statusConfig[booking.status] || statusConfig.confirmed;
                  const source =
                    sourceConfig[booking.source] || sourceConfig.manual;
                  const SourceIcon = source.icon;
                  const bookingDate = new Date(booking.start_time);
                  return (
                    <tr
                      key={booking.id}
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {booking.customer_name || "Unknown"}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.customer_phone || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {booking.court_name || `Court ${booking.court_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-text-primary">
                            {bookingDate.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {formatTime(booking.start_time, booking.end_time)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {formatDuration(booking.duration_mins)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-text-primary">
                          {booking.price} JOD
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                            status.bg,
                            status.text
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            source.bg,
                            source.text
                          )}
                        >
                          <SourceIcon className="w-3 h-3" />
                          {source.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative flex items-center justify-end gap-1">
                          <Link
                            href={`/bookings/${booking.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(
                                  openActionId === booking.id
                                    ? null
                                    : booking.id
                                );
                              }}
                              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openActionId === booking.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border-subtle rounded-lg shadow-xl z-20 py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/bookings/${booking.id}`);
                                    setOpenActionId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Details
                                </button>
                                {booking.status === "confirmed" && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await apiClient.delete(
                                          `/bookings/${booking.id}`
                                        );
                                        fetchBookings();
                                      } catch (err) {
                                        console.error(
                                          "Failed to cancel booking",
                                          err
                                        );
                                      }
                                      setOpenActionId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Cancel Booking
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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
              {pagination.total === 0
                ? 0
                : (currentPage - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="text-text-secondary font-medium">
              {Math.min(currentPage * pagination.limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="text-text-secondary font-medium">
              {pagination.total}
            </span>{" "}
            bookings
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200",
                  page === currentPage
                    ? "bg-emerald/10 text-emerald"
                    : "text-text-muted hover:text-text-primary hover:bg-white/[0.06]"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
