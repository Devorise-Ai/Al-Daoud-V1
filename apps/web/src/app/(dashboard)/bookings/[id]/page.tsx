"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  MessageSquare,
  User,
  Hash,
  Globe,
  Edit3,
  XCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Users,
  Cake,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface ApiBooking {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  court_id: number;
  court_name: string;
  booking_type: string;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  start_time: string;
  end_time: string;
  duration_mins: number;
  price: number;
  source: "whatsapp" | "web" | "manual";
  cancel_token: string;
  created_at?: string;
  notes?: string;
}

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    bg: "bg-emerald/10",
    text: "text-emerald",
    border: "border-emerald/20",
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  no_show: {
    label: "No Show",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
};

const sourceConfig = {
  whatsapp: {
    label: "WhatsApp",
    icon: MessageSquare,
    color: "text-green-400",
  },
  web: { label: "Website", icon: Globe, color: "text-blue-400" },
  manual: { label: "Manual Entry", icon: User, color: "text-zinc-400" },
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<ApiBooking>(`/bookings/${bookingId}`);
        setBooking(res);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load booking";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  async function handleCancel() {
    if (!booking || actionLoading) return;
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/bookings/${booking.id}`);
      setBooking({ ...booking, status: "cancelled" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel booking";
      alert(message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkCompleted() {
    if (!booking || actionLoading) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/bookings/${booking.id}`, {
        status: "completed",
      });
      setBooking({ ...booking, status: "completed" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update booking";
      alert(message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/bookings"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="h-7 w-48 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse mt-2" />
          </div>
        </div>
        <div className="text-text-muted text-sm">Loading booking details...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/bookings"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Booking Not Found
            </h1>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error || "Booking not found."}
        </div>
      </div>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.confirmed;
  const source = sourceConfig[booking.source] || sourceConfig.manual;
  const SourceIcon = source.icon;

  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);
  const createdDate = booking.created_at ? new Date(booking.created_at) : null;

  const startTimeStr = startDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTimeStr = endDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const durationStr =
    booking.duration_mins >= 60
      ? `${Math.floor(booking.duration_mins / 60)} hour${Math.floor(booking.duration_mins / 60) > 1 ? "s" : ""}${booking.duration_mins % 60 > 0 ? ` ${booking.duration_mins % 60}m` : ""}`
      : `${booking.duration_mins} minutes`;

  const isEvent = booking.booking_type !== "regular";

  const customerPhone = booking.customer_phone || "";
  const whatsappUrl = `https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button & header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/bookings"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Booking #{booking.id}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
                  status.bg,
                  status.text,
                  status.border
                )}
              >
                {status.label}
              </span>
            </div>
            {createdDate && (
              <p className="text-text-muted text-sm mt-1">
                Created on{" "}
                {createdDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {booking.status === "confirmed" && (
            <>
              <button
                onClick={handleMarkCompleted}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald/10 hover:bg-emerald/20 text-emerald text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Completed
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">
                Booking Details
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Court */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-emerald" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Court</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {booking.court_name || `Court ${booking.court_id}`}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Date</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {startDate.toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Time & Duration */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Time & Duration</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {startTimeStr} - {endTimeStr}
                  </p>
                  <p className="text-xs text-text-muted">{durationStr}</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Price</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {booking.price} JOD
                  </p>
                </div>
              </div>

              {/* Source */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <SourceIcon className={cn("w-4 h-4", source.color)} />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Booking Source</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {source.label}
                  </p>
                </div>
              </div>

              {/* Cancel Token */}
              {booking.cancel_token && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-500/10 flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Cancel Token</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-sm font-mono text-text-secondary bg-background px-2 py-0.5 rounded">
                        {booking.cancel_token}
                      </code>
                      <button
                        className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Copy token"
                        onClick={() =>
                          navigator.clipboard.writeText(booking.cancel_token)
                        }
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Type */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Booking Type</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5 capitalize">
                    {booking.booking_type}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Customer Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">
                Customer Information
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center text-lg font-bold text-emerald">
                  {(booking.customer_name || "?").charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {booking.customer_name || "Unknown Customer"}
                  </p>
                  <p className="text-xs text-text-muted">Customer</p>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    {booking.customer_phone || "—"}
                  </span>
                </div>

                {/* WhatsApp link */}
                {customerPhone && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full px-4 py-2.5 bg-green-500/10 hover:bg-green-500/15 text-green-400 text-sm font-medium rounded-lg transition-all duration-200"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat on WhatsApp
                    <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
