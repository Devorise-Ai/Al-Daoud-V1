'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Edit3,
  ArrowLeft,
  Timer,
  Banknote,
  Hash,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Mock data -- replace with real API calls later
// ---------------------------------------------------------------------------
type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

interface MockBooking {
  id: string;
  cancel_token: string;
  court_name: string;
  court_name_ar: string;
  date: string; // ISO date
  start_time: string; // e.g. "18:00"
  end_time: string; // e.g. "19:00"
  duration_mins: number;
  price: number;
  status: BookingStatus;
  booking_type: string;
  customer_name: string;
}

const MOCK_BOOKING: MockBooking = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  cancel_token: 'abc123token',
  court_name: 'Court 1 - Premium',
  court_name_ar: 'الملعب 1 - مميز',
  date: '2026-03-14',
  start_time: '18:00',
  end_time: '19:00',
  duration_mins: 60,
  price: 35,
  status: 'confirmed',
  booking_type: 'regular',
  customer_name: 'Ahmad Al-Rashid',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateAr(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('ar-JO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function shortRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 23; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PublicBookingPage() {
  const params = useParams<{ token: string }>();
  const _token = params.token; // eslint-disable-line @typescript-eslint/no-unused-vars

  // State
  const [booking, setBooking] = useState<MockBooking>(MOCK_BOOKING);
  const [view, setView] = useState<'details' | 'modify' | 'cancel-confirm'>(
    'details'
  );
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modify form state
  const [newDate, setNewDate] = useState(booking.date);
  const [newTime, setNewTime] = useState(booking.start_time);

  // ---- Cancel handler ----
  const handleCancel = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setBooking((prev) => ({ ...prev, status: 'cancelled' }));
    setView('details');
    setSuccessMessage('تم إلغاء الحجز بنجاح');
    setLoading(false);
  };

  // ---- Modify handler ----
  const handleModify = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const [h] = newTime.split(':').map(Number);
    const endH = h + booking.duration_mins / 60;
    const endTime = `${Math.floor(endH).toString().padStart(2, '0')}:00`;
    setBooking((prev) => ({
      ...prev,
      date: newDate,
      start_time: newTime,
      end_time: endTime,
    }));
    setView('details');
    setSuccessMessage('تم تعديل الحجز بنجاح');
    setLoading(false);
  };

  // ---- Status badge ----
  const statusBadge = () => {
    const map: Record<
      BookingStatus,
      { label: string; labelAr: string; bg: string; text: string }
    > = {
      confirmed: {
        label: 'Confirmed',
        labelAr: 'مؤكد',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
      },
      cancelled: {
        label: 'Cancelled',
        labelAr: 'ملغي',
        bg: 'bg-red-500/15',
        text: 'text-red-400',
      },
      completed: {
        label: 'Completed',
        labelAr: 'مكتمل',
        bg: 'bg-blue-500/15',
        text: 'text-blue-400',
      },
      no_show: {
        label: 'No Show',
        labelAr: 'لم يحضر',
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
      },
    };
    const s = map[booking.status];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${s.bg} ${s.text}`}
      >
        {booking.status === 'confirmed' && (
          <CheckCircle className="w-3.5 h-3.5" />
        )}
        {booking.status === 'cancelled' && (
          <XCircle className="w-3.5 h-3.5" />
        )}
        {s.label} / {s.labelAr}
      </span>
    );
  };

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.02] blur-[80px]" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* ---- Header / Branding ---- */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 mb-5 shadow-lg shadow-emerald-500/10">
            <MapPin className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-[-0.02em]">
            Al Daoud Football Courts
          </h1>
          <p className="text-emerald-400/70 text-[13px] font-medium mt-2 tracking-wide font-arabic">
            ملاعب الداعود لكرة القدم
          </p>
        </header>

        {/* ---- Success Message ---- */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300 font-arabic">
              {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-emerald-400/60 hover:text-emerald-400 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* DETAILS VIEW */}
        {/* ============================================ */}
        {view === 'details' && (
          <>
            {/* Booking Card */}
            <div className="bg-[#0e0e0e] border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Card header */}
              <div className="px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">
                    Booking Details
                  </h2>
                  {statusBadge()}
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-5 space-y-4">
                {/* Court */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/10">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                      Court
                    </p>
                    <p className="text-sm text-white font-medium mt-0.5">
                      {booking.court_name}
                    </p>
                    <p className="text-sm text-zinc-400 font-arabic">
                      {booking.court_name_ar}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/10">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                      Date
                    </p>
                    <p className="text-sm text-white font-medium mt-0.5">
                      {formatDate(booking.date)}
                    </p>
                    <p className="text-sm text-zinc-400 font-arabic">
                      {formatDateAr(booking.date)}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/10">
                    <Clock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                      Time
                    </p>
                    <p className="text-sm text-white font-medium mt-0.5">
                      {formatTime(booking.start_time)} -{' '}
                      {formatTime(booking.end_time)}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/10">
                    <Timer className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                      Duration
                    </p>
                    <p className="text-sm text-white font-medium mt-0.5">
                      {booking.duration_mins >= 60
                        ? `${booking.duration_mins / 60} hour${booking.duration_mins > 60 ? 's' : ''}`
                        : `${booking.duration_mins} min`}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/10">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                      Price
                    </p>
                    <p className="text-sm text-white font-medium mt-0.5">
                      {booking.price} JOD
                    </p>
                  </div>
                </div>

                {/* Reference */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/10">
                    <Hash className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                      Booking Reference
                    </p>
                    <p className="text-sm text-white font-mono font-medium mt-0.5">
                      {shortRef(booking.id)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons — only when confirmed */}
              {booking.status === 'confirmed' && (
                <div className="px-5 py-4 border-t border-white/[0.04] flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setNewDate(booking.date);
                      setNewTime(booking.start_time);
                      setView('modify');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/40 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modify Booking
                  </button>
                  <button
                    onClick={() => setView('cancel-confirm')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all duration-200"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ============================================ */}
        {/* CANCEL CONFIRMATION VIEW */}
        {/* ============================================ */}
        {view === 'cancel-confirm' && (
          <div className="bg-[#0e0e0e] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mx-auto">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Are you sure?
                </h2>
                <p className="text-base text-zinc-400 font-arabic mt-1">
                  هل أنت متأكد؟
                </p>
                <p className="text-sm text-zinc-500 mt-3">
                  This action cannot be undone. Your booking for{' '}
                  <span className="text-white font-medium">
                    {formatDate(booking.date)}
                  </span>{' '}
                  at{' '}
                  <span className="text-white font-medium">
                    {formatTime(booking.start_time)}
                  </span>{' '}
                  will be cancelled.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setView('details')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all duration-200 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  No, Go Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {loading ? 'Cancelling...' : 'Yes, Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODIFY VIEW */}
        {/* ============================================ */}
        {view === 'modify' && (
          <div className="bg-[#0e0e0e] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-3">
              <button
                onClick={() => setView('details')}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-semibold text-white">
                Modify Booking
              </h2>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Current booking info */}
              <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">
                  Current Booking
                </p>
                <p className="text-sm text-zinc-300">
                  {booking.court_name} — {formatDate(booking.date)} at{' '}
                  {formatTime(booking.start_time)}
                </p>
              </div>

              {/* New date */}
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                  New Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              {/* New time */}
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                  New Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all appearance-none cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {formatTime(slot)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleModify}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {loading ? 'Saving Changes...' : 'Confirm Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ---- Footer ---- */}
        <footer className="mt-10 text-center space-y-2">
          <a
            href="https://maps.app.goo.gl/abdoun-amman"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Al Daoud Football Courts — Abdoun, Amman
          </a>
          <p className="text-xs text-zinc-600 font-arabic">
            ملاعب الداعود لكرة القدم — عبدون، عمّان
          </p>
        </footer>
      </div>
    </div>
  );
}
