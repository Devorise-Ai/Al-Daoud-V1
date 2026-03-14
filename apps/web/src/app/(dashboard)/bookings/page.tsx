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

const statusConfig: Record<BookingStatus, { label: string; dot: string; text: string; bg: string }> = {
  confirmed: { label: "Confirmed", dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" },
  completed: { label: "Completed", dot: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/10" },
  cancelled: { label: "Cancelled", dot: "bg-red-500", text: "text-red-400", bg: "bg-red-500/10" },
  no_show: { label: "No Show", dot: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
};

const sourceConfig: Record<BookingSource, { label: string; bg: string; text: string; icon: typeof MessageSquare }> = {
  whatsapp: { label: "WhatsApp", bg: "bg-green-500/10", text: "text-green-400", icon: MessageSquare },
  web: { label: "Web", bg: "bg-blue-500/10", text: "text-blue-400", icon: Globe },
  manual: { label: "Manual", bg: "bg-zinc-500/10", text: "text-zinc-400", icon: UserPlus },
};

function formatTime(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const fmt = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [courts, setCourts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await apiClient.get<{ id: number; name: string }[]>("/courts");
        setCourts(Array.isArray(res) ? res : []);
      } catch { setCourts([]); }
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

      const res = await apiClient.get<{ data: ApiBooking[]; pagination: PaginationInfo }>(`/bookings?${params.toString()}`);
      setBookings(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load bookings";
      setError(message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, courtFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, courtFilter, dateFrom, dateTo]);

  const totalPages = pagination.pages || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-[-0.02em]">Bookings</h1>
          <p className="text-zinc-500 text-[13px] mt-1">Manage and track all court reservations</p>
        </div>
        <Link
          href="/bookings/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[13px] font-semibold rounded-xl transition-all duration-300 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[#0e0e0e] border border-white/[0.04] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] text-zinc-200 placeholder:text-zinc-600"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3.5 py-2.5 rounded-xl text-[13px] text-zinc-400 cursor-pointer min-w-[130px]">
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          <select value={courtFilter} onChange={(e) => setCourtFilter(e.target.value)} className="px-3.5 py-2.5 rounded-xl text-[13px] text-zinc-400 cursor-pointer min-w-[130px]">
            <option value="all">All Courts</option>
            {courts.map((c) => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
          </select>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-9 pr-3 py-2.5 rounded-xl text-[13px] text-zinc-400" />
            </div>
            <span className="text-zinc-700 text-[11px]">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2.5 rounded-xl text-[13px] text-zinc-400" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-[13px] text-red-400 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0e0e0e] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Customer", "Court", "Date & Time", "Duration", "Price", "Status", "Source", ""].map((h, i) => (
                  <th key={h || i} className={cn("px-6 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.1em]", i === 7 ? "text-right" : "text-left")}>
                    {h === "Date & Time" ? (
                      <span className="flex items-center gap-1.5">{h}<ArrowUpDown className="w-3 h-3 text-zinc-700" /></span>
                    ) : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-zinc-600 text-[13px]">Loading bookings...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-zinc-600 text-[13px]">No bookings found matching your filters.</td></tr>
              ) : (
                bookings.map((booking) => {
                  const status = statusConfig[booking.status] || statusConfig.confirmed;
                  const source = sourceConfig[booking.source] || sourceConfig.manual;
                  const SourceIcon = source.icon;
                  const bookingDate = new Date(booking.start_time);
                  return (
                    <tr
                      key={booking.id}
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                      className="hover:bg-white/[0.02] transition-all duration-200 cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors">{booking.customer_name || "Unknown"}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{booking.customer_phone || "—"}</p>
                      </td>
                      <td className="px-6 py-4"><span className="text-[13px] text-zinc-400">{booking.court_name || `Court ${booking.court_id}`}</span></td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] text-zinc-200">{bookingDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">{formatTime(booking.start_time, booking.end_time)}</p>
                      </td>
                      <td className="px-6 py-4"><span className="text-[13px] text-zinc-400">{formatDuration(booking.duration_mins)}</span></td>
                      <td className="px-6 py-4"><span className="text-[13px] font-semibold text-zinc-200">{booking.price} <span className="text-zinc-600 font-normal text-[11px]">JOD</span></span></td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", status.bg, status.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium", source.bg, source.text)}>
                          <SourceIcon className="w-3 h-3" />{source.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative flex items-center justify-end gap-1">
                          <Link href={`/bookings/${booking.id}`} onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all duration-200" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === booking.id ? null : booking.id); }} className="p-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all duration-200">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openActionId === booking.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-[#141414] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/40 z-20 py-1.5">
                                <button onClick={(e) => { e.stopPropagation(); router.push(`/bookings/${booking.id}`); setOpenActionId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors">
                                  <Eye className="w-3.5 h-3.5" />View Details
                                </button>
                                {booking.status === "confirmed" && (
                                  <button onClick={async (e) => { e.stopPropagation(); try { await apiClient.delete(`/bookings/${booking.id}`); fetchBookings(); } catch (err) { console.error("Failed to cancel booking", err); } setOpenActionId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors">
                                    <XCircle className="w-3.5 h-3.5" />Cancel Booking
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.04]">
          <p className="text-[11px] text-zinc-600">
            Showing <span className="text-zinc-400 font-medium">{pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1}</span> to{" "}
            <span className="text-zinc-400 font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of{" "}
            <span className="text-zinc-400 font-medium">{pagination.total}</span> bookings
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={cn("w-8 h-8 rounded-lg text-[12px] font-semibold transition-all duration-200", page === currentPage ? "bg-emerald-500/15 text-emerald-400" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]")}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
