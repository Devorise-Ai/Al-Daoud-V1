"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Cake,
  PartyPopper,
  UtensilsCrossed,
  Sparkles,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Court {
  id: number;
  name: string;
  price_per_hour?: number;
  pricePerHour?: number;
}

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

const durations = [
  { label: "1 Hour", value: 1 },
  { label: "2 Hours", value: 2 },
  { label: "3 Hours", value: 3 },
];

const bookingTypes = [
  { label: "Regular", value: "regular", icon: Calendar },
  { label: "Birthday", value: "birthday", icon: Cake },
  { label: "Private Event", value: "event", icon: PartyPopper },
];

function formatTime(t: string): string {
  const [h] = t.split(":");
  const hour = parseInt(h, 10);
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [bookingType, setBookingType] = useState("regular");
  const [guestCount, setGuestCount] = useState("");
  const [decorations, setDecorations] = useState(false);
  const [catering, setCatering] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");

  const [courts, setCourts] = useState<Court[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string[] | null>(null);

  // Fetch courts
  useEffect(() => {
    async function fetchCourts() {
      setCourtsLoading(true);
      try {
        const res = await apiClient.get<Court[]>("/courts");
        setCourts(Array.isArray(res) ? res : []);
      } catch {
        setCourts([]);
      } finally {
        setCourtsLoading(false);
      }
    }
    fetchCourts();
  }, []);

  // Check availability when court + date change
  useEffect(() => {
    if (!selectedCourt || !selectedDate) {
      setAvailability(null);
      return;
    }
    async function checkAvailability() {
      try {
        const res = await apiClient.get<{ available_slots?: string[] }>(
          `/availability?date=${selectedDate}&court_id=${selectedCourt}`
        );
        setAvailability(res.available_slots || null);
      } catch {
        setAvailability(null);
      }
    }
    checkAvailability();
  }, [selectedCourt, selectedDate]);

  const court = courts.find((c) => String(c.id) === selectedCourt);
  const pricePerHour = court
    ? court.price_per_hour || court.pricePerHour || 0
    : 0;
  const basePrice = pricePerHour * selectedDuration;
  const eventSurcharge =
    bookingType !== "regular" ? Math.round(basePrice * 0.3) : 0;
  const totalPrice = basePrice + eventSurcharge;

  const endTime =
    selectedTime && selectedDuration
      ? (() => {
          const [h] = selectedTime.split(":");
          const endH = parseInt(h, 10) + selectedDuration;
          return `${endH.toString().padStart(2, "0")}:00`;
        })()
      : "";

  const isEvent = bookingType === "birthday" || bookingType === "event";

  async function handleSubmit() {
    if (!customerName || !customerPhone || !selectedCourt || !selectedDate || !selectedTime) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const startDateTime = `${selectedDate}T${selectedTime}:00`;
      const endDateTime = `${selectedDate}T${endTime}:00`;

      await apiClient.post("/bookings", {
        customer_name: customerName,
        customer_phone: `+962${customerPhone.replace(/\s/g, "")}`,
        court_id: Number(selectedCourt),
        start_time: startDateTime,
        end_time: endDateTime,
        booking_type: bookingType,
        source: "web",
      });

      router.push("/bookings");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create booking";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/bookings"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            New Booking
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Create a new court reservation
          </p>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <User className="w-4 h-4 text-text-muted" />
                Customer Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-background border border-r-0 border-border rounded-l-lg text-sm text-text-muted">
                    +962
                  </span>
                  <input
                    type="tel"
                    placeholder="79 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-background border border-border rounded-r-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="Ahmad Al-Rashid"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Court & Schedule */}
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <MapPin className="w-4 h-4 text-text-muted" />
                Court & Schedule
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Court Selection */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Court
                </label>
                <select
                  value={selectedCourt}
                  onChange={(e) => setSelectedCourt(e.target.value)}
                  disabled={courtsLoading}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {courtsLoading ? "Loading courts..." : "Select a court"}
                  </option>
                  {courts.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} -{" "}
                      {c.price_per_hour || c.pricePerHour || 0} JOD/hr
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Start Time
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map((t) => {
                      const isAvailable =
                        availability === null || availability.includes(t);
                      return (
                        <option
                          key={t}
                          value={t}
                          disabled={!isAvailable}
                        >
                          {formatTime(t)}
                          {!isAvailable ? " (Unavailable)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Duration
                  </label>
                  <div className="flex gap-2">
                    {durations.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setSelectedDuration(d.value)}
                        className={cn(
                          "flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200",
                          selectedDuration === d.value
                            ? "bg-emerald/10 border-emerald/30 text-emerald"
                            : "bg-background border-border text-text-secondary hover:border-border-subtle"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Type */}
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-muted" />
                Booking Type
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {bookingTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setBookingType(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                        bookingType === type.value
                          ? "bg-emerald/10 border-emerald/30 text-emerald"
                          : "bg-background border-border text-text-secondary hover:border-border-subtle"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Event extras */}
              {isEvent && (
                <div className="mt-4 p-4 bg-background rounded-xl border border-border-subtle space-y-4">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Event Details
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Guest Count
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={decorations}
                        onChange={(e) => setDecorations(e.target.checked)}
                        className="w-4 h-4 rounded border-border bg-card text-emerald accent-emerald"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Sparkles className="w-3.5 h-3.5 text-text-muted" />
                        Decorations
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={catering}
                        onChange={(e) => setCatering(e.target.checked)}
                        className="w-4 h-4 rounded border-border bg-card text-emerald accent-emerald"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-text-muted" />
                        Catering
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Special Requests
                    </label>
                    <textarea
                      placeholder="Any special requirements or notes..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Summary Sidebar */}
        <div>
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden sticky top-24">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">
                Booking Summary
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Summary items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Customer</span>
                  <span className="text-sm text-text-primary font-medium">
                    {customerName || "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Phone</span>
                  <span className="text-sm text-text-secondary">
                    {customerPhone ? `+962 ${customerPhone}` : "--"}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Court</span>
                  <span className="text-sm text-text-primary font-medium">
                    {court?.name || "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Date</span>
                  <span className="text-sm text-text-secondary">
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Time</span>
                  <span className="text-sm text-text-secondary">
                    {selectedTime && endTime
                      ? `${formatTime(selectedTime)} - ${formatTime(endTime)}`
                      : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Duration</span>
                  <span className="text-sm text-text-secondary">
                    {selectedDuration} hour{selectedDuration > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Type</span>
                  <span className="text-sm text-text-secondary capitalize">
                    {bookingType === "regular"
                      ? "Regular"
                      : bookingType === "birthday"
                        ? "Birthday"
                        : "Private Event"}
                  </span>
                </div>

                {isEvent && (
                  <>
                    <div className="h-px bg-border" />
                    {guestCount && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Guests</span>
                        <span className="text-sm text-text-secondary">
                          {guestCount}
                        </span>
                      </div>
                    )}
                    {decorations && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          Decorations
                        </span>
                        <span className="text-sm text-emerald">Included</span>
                      </div>
                    )}
                    {catering && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          Catering
                        </span>
                        <span className="text-sm text-emerald">Included</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Price breakdown */}
              <div className="h-px bg-border" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    Base ({pricePerHour} JOD x {selectedDuration}h)
                  </span>
                  <span className="text-sm text-text-secondary">
                    {basePrice} JOD
                  </span>
                </div>
                {eventSurcharge > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      Event Surcharge
                    </span>
                    <span className="text-sm text-text-secondary">
                      +{eventSurcharge} JOD
                    </span>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    Total
                  </span>
                  <span className="text-lg font-bold text-emerald">
                    {totalPrice} JOD
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald hover:bg-emerald-dark text-white text-sm font-semibold rounded-lg transition-all duration-200 mt-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
