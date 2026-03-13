"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  MapPin,
  Users,
  DollarSign,
  Pencil,
  Trash2,
  ExternalLink,
  Leaf,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

type CourtType = "5v5" | "7v7" | "11v11";

interface Court {
  id: number;
  name: string;
  name_ar: string;
  type: CourtType;
  surface: string;
  capacity: number;
  hourly_rate: number;
  peak_rate: number;
  is_active: boolean;
  maps_link: string;
}

const typeConfig: Record<
  CourtType,
  { label: string; bg: string; text: string; border: string }
> = {
  "5v5": {
    label: "5v5",
    bg: "bg-emerald/10",
    text: "text-emerald",
    border: "border-l-emerald",
  },
  "7v7": {
    label: "7v7",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-l-blue-400",
  },
  "11v11": {
    label: "11v11",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-l-violet-400",
  },
};

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await apiClient.get<{ data: Court[] }>('/courts');
        setCourts(res.data);
      } catch (err) {
        console.error('Failed to fetch courts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourts();
  }, []);

  const toggleStatus = async (id: number, currentActive: boolean) => {
    try {
      await apiClient.patch('/courts/' + id, { is_active: !currentActive });
      setCourts((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, is_active: !c.is_active } : c
        )
      );
    } catch (err) {
      console.error('Failed to toggle court status:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Courts
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Manage your football courts and pricing
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card border border-border-subtle rounded-xl overflow-hidden animate-pulse"
            >
              <div className="p-6 space-y-4">
                <div className="h-5 bg-white/[0.06] rounded w-2/3" />
                <div className="h-4 bg-white/[0.06] rounded w-1/3" />
                <div className="h-16 bg-white/[0.06] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Courts
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage your football courts and pricing
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald hover:bg-emerald-dark text-white text-sm font-medium rounded-lg transition-all duration-200">
          <Plus className="w-4 h-4" />
          Add Court
        </button>
      </div>

      {/* Courts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {courts.map((court) => {
          const type = typeConfig[court.type] || typeConfig["5v5"];
          return (
            <div
              key={court.id}
              className={cn(
                "bg-card border border-border-subtle rounded-xl overflow-hidden transition-all duration-200 hover:border-border",
                "border-l-[3px]",
                type.border
              )}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {court.name}{" "}
                      <span className="text-text-muted font-normal">
                        &mdash; {court.name_ar}
                      </span>
                    </h3>
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        type.bg,
                        type.text
                      )}
                    >
                      {type.label}
                    </span>
                  </div>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => toggleStatus(court.id, court.is_active)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border shrink-0",
                    court.is_active
                      ? "bg-emerald/10 text-emerald border-emerald/20 hover:bg-emerald/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      court.is_active ? "bg-emerald" : "bg-red-400"
                    )}
                  />
                  {court.is_active ? "Active" : "Inactive"}
                </button>
              </div>

              {/* Card Body - Details Grid */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Surface */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                      <Leaf className="w-4 h-4 text-emerald" />
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                        Surface
                      </p>
                      <p className="text-sm text-text-secondary font-medium">
                        {court.surface}
                      </p>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                        Capacity
                      </p>
                      <p className="text-sm text-text-secondary font-medium">
                        {court.capacity} Players
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="mx-6 mb-4 p-3.5 bg-white/[0.02] rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2.5">
                  <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                    Pricing
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-text-muted">Off-Peak</p>
                    <p className="text-base font-bold text-text-primary">
                      {court.hourly_rate}{" "}
                      <span className="text-xs font-normal text-text-muted">
                        JOD/hr
                      </span>
                    </p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xs text-amber-400">Peak</p>
                    <p className="text-base font-bold text-text-primary">
                      {court.peak_rate}{" "}
                      <span className="text-xs font-normal text-text-muted">
                        JOD/hr
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer - Actions */}
              <div className="flex items-center gap-2 px-6 py-4 border-t border-border">
                <a
                  href={court.maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.06] border border-border transition-all duration-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Google Maps
                </a>
                <div className="flex-1" />
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.06] border border-border transition-all duration-200">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all duration-200">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
