"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Crown,
  Calendar,
  MessageSquare,
  Pencil,
  CalendarDays,
  DollarSign,
  MapPin,
  Globe,
  Clock,
  Users,
  Mail,
  Tag,
  FileText,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

type BookingStatus = "completed" | "confirmed" | "cancelled" | "no_show";

interface CustomerData {
  id: number;
  name: string;
  phone: string;
  email?: string;
  segment: string;
  total_bookings: number;
  total_spent: number;
  notes?: string;
  created_at?: string;
  preferred_court?: string;
  preferred_language?: string;
  preferred_time?: string;
  team_size?: number;
  last_contact?: string;
}

interface BookingRow {
  id: number;
  court_name: string;
  start_time: string;
  end_time: string;
  booking_type: string;
  status: BookingStatus;
  price: number;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  confirmed: { label: "Confirmed", bg: "bg-emerald/10", text: "text-emerald" },
  completed: { label: "Completed", bg: "bg-blue-500/10", text: "text-blue-400" },
  cancelled: { label: "Cancelled", bg: "bg-red-500/10", text: "text-red-400" },
  no_show: { label: "No Show", bg: "bg-amber-500/10", text: "text-amber-400" },
};

const segmentLabels: Record<string, string> = {
  vip: "VIP",
  regular: "Regular",
  occasional: "Occasional",
  new: "New",
};

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.id;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [customerRes, bookingsRes]: any[] = await Promise.all([
          apiClient.get('/customers/' + customerId),
          apiClient.get('/customers/' + customerId + '/bookings'),
        ]);
        setCustomer(customerRes.data);
        setNotes(customerRes.data.notes || "");
        setBookings(bookingsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch customer data:', err);
      } finally {
        setLoading(false);
      }
    }
    if (customerId) fetchData();
  }, [customerId]);

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await apiClient.patch('/customers/' + customerId, { notes });
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-card border border-border-subtle rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/[0.06]" />
            <div className="space-y-3 flex-1">
              <div className="h-6 bg-white/[0.06] rounded w-1/3" />
              <div className="h-4 bg-white/[0.06] rounded w-1/4" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border-subtle rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-white/[0.06] rounded w-2/3 mb-2" />
              <div className="h-6 bg-white/[0.06] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-card border border-border-subtle rounded-xl p-6 text-center text-text-muted">
          Customer not found
        </div>
      </div>
    );
  }

  const initials = customer.name
    ? customer.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
    : "?";

  const whatsappUrl = `https://wa.me/${customer.phone.replace(/\+/g, "")}`;

  const memberSince = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown";

  const statCards = [
    {
      label: "Total Bookings",
      value: (customer.total_bookings || 0).toString(),
      icon: CalendarDays,
      color: "text-emerald",
      bg: "bg-emerald/10",
    },
    {
      label: "Total Spent",
      value: `${(customer.total_spent || 0).toLocaleString()} JOD`,
      icon: DollarSign,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Segment",
      value: segmentLabels[customer.segment] || customer.segment || "—",
      icon: Tag,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
  ];

  const detailRows = [
    { label: "Phone", value: customer.phone, icon: Phone },
    { label: "Email", value: customer.email || "—", icon: Mail },
    { label: "Segment", value: segmentLabels[customer.segment] || customer.segment || "—", icon: Tag },
    { label: "Last Contact", value: customer.last_contact ? new Date(customer.last_contact).toLocaleDateString() : "—", icon: Clock },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar: Back + Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium rounded-lg transition-all duration-200"
          >
            <MessageSquare className="w-4 h-4" />
            Send WhatsApp Message
          </a>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border-subtle hover:border-border text-text-secondary hover:text-text-primary text-sm font-medium rounded-lg transition-all duration-200">
            <Pencil className="w-4 h-4" />
            Edit Customer
          </button>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="bg-card border border-border-subtle rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl font-bold text-emerald-400 shrink-0">
            {initials}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight" dir="rtl">
              {customer.name || customer.phone}
            </h1>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Phone className="w-4 h-4 text-text-muted" />
                {customer.phone}
              </span>
              {customer.segment === "vip" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald/10 text-emerald">
                  <Crown className="w-3 h-3" />
                  VIP
                </span>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <Calendar className="w-3.5 h-3.5" />
              Member since {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => {
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
                  <p className="text-xl font-bold text-text-primary mt-1">
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

      {/* Customer Details Card */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Customer Details</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {detailRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">{row.label}</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {row.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking History */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Booking History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Court
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Price (JOD)
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted text-sm">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const status = statusConfig[booking.status] || statusConfig.confirmed;
                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {booking.start_time ? new Date(booking.start_time).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary font-medium" dir="rtl">
                        {booking.court_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {booking.booking_type}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                            status.bg,
                            status.text
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary font-semibold text-right">
                        {booking.price}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Notes</h2>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this customer..."
            dir="rtl"
            rows={4}
            className="w-full px-4 py-3 rounded-lg text-sm bg-background border border-border-subtle focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald/30 text-text-primary placeholder:text-text-muted resize-none transition-all duration-200"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald hover:bg-emerald/90 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
