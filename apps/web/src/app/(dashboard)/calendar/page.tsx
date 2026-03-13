"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface ApiBooking {
  id: number;
  court_id: number;
  court_name: string;
  customer_name: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
  status: string;
}

interface CalendarBooking {
  id: number;
  courtId: number;
  courtName: string;
  customer: string;
  dayOffset: number;
  startHour: number;
  startMinute: number;
  duration: number; // in hours (can be fractional)
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatDayHeader(date: Date): { day: string; date: string } {
  return {
    day: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.getDate().toString(),
  };
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8AM to 11PM

const courtColors: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "bg-emerald/20", border: "border-emerald/40", text: "text-emerald" },
  2: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
  3: { bg: "bg-violet-500/20", border: "border-violet-500/40", text: "text-violet-400" },
  4: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400" },
};

// Fallback colors for court IDs > 4
const defaultCourtColor = { bg: "bg-pink-500/20", border: "border-pink-500/40", text: "text-pink-400" };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if "now" falls within the displayed week
  const nowInWeek = useMemo(() => {
    const start = weekDays[0];
    const end = addDays(weekDays[6], 1);
    return now >= start && now < end;
  }, [weekDays, now]);

  // Which day column is "today"
  const todayColIndex = useMemo(() => {
    if (!nowInWeek) return -1;
    return weekDays.findIndex(
      (d) =>
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
  }, [weekDays, nowInWeek, now]);

  // Fetch bookings for the week
  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        const dateFrom = formatDateStr(weekDays[0]);
        const dateTo = formatDateStr(weekDays[6]);

        const res = await apiClient.get<{ data: ApiBooking[] }>(
          `/bookings?date_from=${dateFrom}&date_to=${dateTo}&limit=100`
        );

        const apiBookings = res.data || [];
        const mondayStart = weekDays[0].getTime();

        const mapped: CalendarBooking[] = apiBookings
          .filter((b) => b.status !== "cancelled")
          .map((b) => {
            const start = new Date(b.start_time);
            const dayOffset = Math.floor(
              (start.getTime() - mondayStart) / (1000 * 60 * 60 * 24)
            );
            return {
              id: b.id,
              courtId: b.court_id,
              courtName: b.court_name || `Court ${b.court_id}`,
              customer: b.customer_name || "Unknown",
              dayOffset,
              startHour: start.getHours(),
              startMinute: start.getMinutes(),
              duration: b.duration_mins / 60,
            };
          })
          .filter((b) => b.dayOffset >= 0 && b.dayOffset < 7);

        setBookings(mapped);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [weekStart]);

  function goToPreviousWeek() {
    setCurrentDate((d) => addDays(d, -7));
  }
  function goToNextWeek() {
    setCurrentDate((d) => addDays(d, 7));
  }
  function goToToday() {
    setCurrentDate(new Date());
  }

  // Build a lookup: key = `${dayOffset}-${hour}` => booking
  const bookingMap = useMemo(() => {
    const map = new Map<string, CalendarBooking>();
    for (const b of bookings) {
      const durationHours = Math.ceil(b.duration);
      for (let h = 0; h < durationHours; h++) {
        map.set(`${b.dayOffset}-${b.startHour + h}`, b);
      }
    }
    return map;
  }, [bookings]);

  // Collect unique court IDs for legend
  const courtIds = useMemo(() => {
    const ids = new Set<number>();
    for (const b of bookings) ids.add(b.courtId);
    return Array.from(ids).sort((a, b) => a - b);
  }, [bookings]);

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Calendar
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Weekly court schedule overview
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

      {/* Week Navigation */}
      <div className="bg-card border border-border-subtle rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.06] border border-border transition-all duration-200"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-semibold text-text-primary">
              {formatShortDate(weekDays[0])} - {formatShortDate(weekDays[6])},{" "}
              {weekDays[6].getFullYear()}
            </span>
          </div>

          {/* Court legend */}
          <div className="flex items-center gap-4">
            {(courtIds.length > 0 ? courtIds : [1, 2, 3, 4]).map((courtId) => {
              const color = courtColors[courtId] || defaultCourtColor;
              return (
                <div key={courtId} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-sm",
                      color.bg,
                      "border",
                      color.border
                    )}
                  />
                  <span className="text-xs text-text-muted">Court {courtId}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-text-muted text-sm text-center py-2">
          Loading calendar...
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border">
              <div className="p-3" />
              {weekDays.map((day, i) => {
                const header = formatDayHeader(day);
                const isToday =
                  day.getFullYear() === now.getFullYear() &&
                  day.getMonth() === now.getMonth() &&
                  day.getDate() === now.getDate();
                return (
                  <div
                    key={i}
                    className={cn(
                      "p-3 text-center border-l border-border",
                      isToday && "bg-emerald/5"
                    )}
                  >
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      {header.day}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold mt-0.5",
                        isToday ? "text-emerald" : "text-text-primary"
                      )}
                    >
                      {header.date}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {/* Current time indicator */}
              {nowInWeek &&
                todayColIndex >= 0 &&
                currentHour >= 8 &&
                currentHour <= 23 && (
                  <div
                    className="absolute z-10 pointer-events-none"
                    style={{
                      top: `${(currentHour - 8) * 56 + (currentMinute / 60) * 56}px`,
                      left: `calc(80px + ${todayColIndex} * ((100% - 80px) / 7))`,
                      width: `calc((100% - 80px) / 7)`,
                    }}
                  >
                    <div className="relative flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  </div>
                )}

              {hours.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-b-0"
                  style={{ height: "56px" }}
                >
                  {/* Time label */}
                  <div className="p-2 flex items-start justify-end pr-3">
                    <span className="text-xs text-text-muted">
                      {hour === 0
                        ? "12 AM"
                        : hour < 12
                          ? `${hour} AM`
                          : hour === 12
                            ? "12 PM"
                            : `${hour - 12} PM`}
                    </span>
                  </div>

                  {/* Day cells */}
                  {weekDays.map((day, dayIndex) => {
                    const booking = bookingMap.get(`${dayIndex}-${hour}`);
                    const isStart = booking && booking.startHour === hour;
                    const isToday =
                      day.getFullYear() === now.getFullYear() &&
                      day.getMonth() === now.getMonth() &&
                      day.getDate() === now.getDate();

                    if (booking && isStart) {
                      const color = courtColors[booking.courtId] || defaultCourtColor;
                      const durationHours = Math.ceil(booking.duration);
                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "border-l border-border relative p-1",
                            isToday && "bg-emerald/[0.03]"
                          )}
                        >
                          <Link
                            href={`/bookings/${booking.id}`}
                            className={cn(
                              "absolute inset-x-1 rounded-lg border px-2 py-1.5 overflow-hidden transition-all duration-200 hover:brightness-125 cursor-pointer z-[5]",
                              color.bg,
                              color.border
                            )}
                            style={{
                              height: `${durationHours * 56 - 8}px`,
                              top: "4px",
                            }}
                          >
                            <p
                              className={cn(
                                "text-xs font-semibold truncate",
                                color.text
                              )}
                            >
                              {booking.courtName}
                            </p>
                            <p className="text-[10px] text-text-secondary truncate mt-0.5">
                              {booking.customer}
                            </p>
                            {durationHours >= 2 && (
                              <p className="text-[10px] text-text-muted mt-0.5">
                                {booking.startHour <= 12
                                  ? `${booking.startHour}${booking.startHour < 12 ? "AM" : "PM"}`
                                  : `${booking.startHour - 12}PM`}{" "}
                                -{" "}
                                {booking.startHour + durationHours <= 12
                                  ? `${booking.startHour + durationHours}${booking.startHour + durationHours < 12 ? "AM" : "PM"}`
                                  : `${booking.startHour + durationHours - 12}PM`}
                              </p>
                            )}
                          </Link>
                        </div>
                      );
                    }

                    if (booking && !isStart) {
                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "border-l border-border",
                            isToday && "bg-emerald/[0.03]"
                          )}
                        />
                      );
                    }

                    return (
                      <Link
                        key={dayIndex}
                        href="/bookings/new"
                        className={cn(
                          "border-l border-border hover:bg-white/[0.02] transition-colors",
                          isToday && "bg-emerald/[0.03]"
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
