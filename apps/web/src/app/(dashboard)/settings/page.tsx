"use client";

import { useState, useEffect, useCallback } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Building2,
  Cpu,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  Globe,
  Calendar,
  Wifi,
  WifiOff,
  Save,
  Bot,
  Languages,
  Hash,
  Link2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

// --- Pricing Rules ---
interface PricingRule {
  id: number;
  court_id: number | null;
  day_of_week: string;
  start_hour: number;
  end_hour: number;
  price: number;
  is_peak: boolean;
}

// --- Business Info ---
interface BusinessInfo {
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  phone: string;
  whatsapp: string;
  openTime: string;
  closeTime: string;
  mapsLink: string;
}

const defaultBusinessInfo: BusinessInfo = {
  nameEn: "",
  nameAr: "",
  addressEn: "",
  addressAr: "",
  phone: "",
  whatsapp: "",
  openTime: "06:00",
  closeTime: "01:00",
  mapsLink: "",
};

function formatHour(h: number): string {
  const hh = h.toString().padStart(2, "0");
  return `${hh}:00`;
}

function formatDayOfWeek(d: string): string {
  return d || "Daily";
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("pricing");
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(defaultBusinessInfo);

  // Pricing rules state
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);

  // Business info state
  const [businessLoading, setBusinessLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);

  // Fetch pricing rules
  const fetchPricingRules = useCallback(async () => {
    try {
      setPricingLoading(true);
      const res: any = await apiClient.get('/pricing');
      setPricingRules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pricing rules:', err);
    } finally {
      setPricingLoading(false);
    }
  }, []);

  // Fetch business info
  const fetchBusinessInfo = useCallback(async () => {
    try {
      setBusinessLoading(true);
      const [hoursRes, locationRes]: any[] = await Promise.all([
        apiClient.get('/info/hours').catch(() => ({ data: null })),
        apiClient.get('/info/location').catch(() => ({ data: null })),
      ]);

      const info = { ...defaultBusinessInfo };
      if (hoursRes.data) {
        info.openTime = hoursRes.data.open_time || hoursRes.data.openTime || info.openTime;
        info.closeTime = hoursRes.data.close_time || hoursRes.data.closeTime || info.closeTime;
      }
      if (locationRes.data) {
        info.nameEn = locationRes.data.name_en || locationRes.data.nameEn || "";
        info.nameAr = locationRes.data.name_ar || locationRes.data.nameAr || "";
        info.addressEn = locationRes.data.address_en || locationRes.data.addressEn || "";
        info.addressAr = locationRes.data.address_ar || locationRes.data.addressAr || "";
        info.phone = locationRes.data.phone || "";
        info.whatsapp = locationRes.data.whatsapp || "";
        info.mapsLink = locationRes.data.maps_link || locationRes.data.mapsLink || "";
      }
      setBusinessInfo(info);
    } catch (err) {
      console.error('Failed to fetch business info:', err);
    } finally {
      setBusinessLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricingRules();
    fetchBusinessInfo();
  }, [fetchPricingRules, fetchBusinessInfo]);

  const handleAddRule = async () => {
    try {
      const newRule = {
        court_id: null,
        day_of_week: "Daily",
        start_hour: 8,
        end_hour: 16,
        price: 25,
        is_peak: false,
      };
      await apiClient.post('/pricing', newRule);
      fetchPricingRules();
    } catch (err) {
      console.error('Failed to add pricing rule:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Configure pricing, business details, and system integrations
        </p>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex items-center gap-1 p-1 bg-card border border-border-subtle rounded-xl w-fit">
          <Tabs.Trigger
            value="pricing"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "pricing"
                ? "bg-emerald/10 text-emerald"
                : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
            )}
          >
            <DollarSign className="w-4 h-4" />
            Pricing Rules
          </Tabs.Trigger>
          <Tabs.Trigger
            value="business"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "business"
                ? "bg-emerald/10 text-emerald"
                : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
            )}
          >
            <Building2 className="w-4 h-4" />
            Business Info
          </Tabs.Trigger>
          <Tabs.Trigger
            value="system"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "system"
                ? "bg-emerald/10 text-emerald"
                : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
            )}
          >
            <Cpu className="w-4 h-4" />
            System
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab: Pricing Rules */}
        <Tabs.Content value="pricing" className="mt-6">
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">
                    Pricing Rules
                  </h2>
                  <p className="text-xs text-text-muted">
                    {pricingRules.length} rules configured
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddRule}
                className="flex items-center gap-2 px-4 py-2 bg-emerald hover:bg-emerald-dark text-white text-sm font-medium rounded-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Rule
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Court
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Day
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Price (JOD)
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pricingLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-muted text-sm">
                        Loading...
                      </td>
                    </tr>
                  ) : pricingRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-muted text-sm">
                        No pricing rules configured
                      </td>
                    </tr>
                  ) : (
                    pricingRules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <span className="text-sm text-text-primary font-medium">
                            {rule.court_id ? `Court ${rule.court_id}` : "All Courts"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-sm text-text-secondary">
                            {formatDayOfWeek(rule.day_of_week)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-sm text-text-secondary font-mono">
                            {formatHour(rule.start_hour)} - {formatHour(rule.end_hour)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-semibold text-text-primary">
                            {rule.price} JOD
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                              rule.is_peak
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-blue-500/10 text-blue-400"
                            )}
                          >
                            {rule.is_peak ? "Peak" : "Off-Peak"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* Tab: Business Info */}
        <Tabs.Content value="business" className="mt-6">
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Business Information
                </h2>
                <p className="text-xs text-text-muted">
                  Update your business details
                </p>
              </div>
            </div>

            {businessLoading ? (
              <div className="p-6 text-center text-text-muted text-sm">Loading...</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Business Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Business Name (English)
                    </label>
                    <input
                      type="text"
                      value={businessInfo.nameEn}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, nameEn: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Business Name (Arabic)
                    </label>
                    <input
                      type="text"
                      value={businessInfo.nameAr}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, nameAr: e.target.value })
                      }
                      dir="rtl"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        Address (English)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={businessInfo.addressEn}
                      onChange={(e) =>
                        setBusinessInfo({
                          ...businessInfo,
                          addressEn: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        Address (Arabic)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={businessInfo.addressAr}
                      onChange={(e) =>
                        setBusinessInfo({
                          ...businessInfo,
                          addressAr: e.target.value,
                        })
                      }
                      dir="rtl"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Phone & WhatsApp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        Phone Number
                      </span>
                    </label>
                    <input
                      type="text"
                      value={businessInfo.phone}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp Number
                      </span>
                    </label>
                    <input
                      type="text"
                      value={businessInfo.whatsapp}
                      onChange={(e) =>
                        setBusinessInfo({
                          ...businessInfo,
                          whatsapp: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Opening Time
                      </span>
                    </label>
                    <input
                      type="time"
                      value={businessInfo.openTime}
                      onChange={(e) =>
                        setBusinessInfo({
                          ...businessInfo,
                          openTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Closing Time
                      </span>
                    </label>
                    <input
                      type="time"
                      value={businessInfo.closeTime}
                      onChange={(e) =>
                        setBusinessInfo({
                          ...businessInfo,
                          closeTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-emerald/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Google Maps Link */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      Google Maps Link
                    </span>
                  </label>
                  <input
                    type="url"
                    value={businessInfo.mapsLink}
                    onChange={(e) =>
                      setBusinessInfo({
                        ...businessInfo,
                        mapsLink: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald/50 transition-colors"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald hover:bg-emerald-dark text-white text-sm font-medium rounded-lg transition-all duration-200">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* Tab: System */}
        <Tabs.Content value="system" className="mt-6 space-y-6">
          {/* AI Agent Settings */}
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  AI Agent Settings
                </h2>
                <p className="text-xs text-text-muted">
                  Configure the AI booking assistant
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Model */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                      Model
                    </p>
                    <p className="text-sm text-text-primary font-semibold mt-0.5">
                      Qwen2.5-72B-Instruct
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400">
                  Active
                </span>
              </div>

              {/* Default Language */}
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-3 h-3" />
                    Default Language
                  </span>
                </label>
                <select
                  defaultValue="arabic"
                  className="w-full max-w-xs px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-secondary focus:outline-none focus:border-emerald/50 cursor-pointer transition-colors"
                >
                  <option value="arabic">Arabic</option>
                  <option value="english">English</option>
                </select>
              </div>

              {/* Max Conversation Length */}
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3 h-3" />
                    Max Conversation Length
                  </span>
                </label>
                <input
                  type="number"
                  defaultValue={50}
                  min={10}
                  max={200}
                  className="w-full max-w-xs px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-emerald/50 transition-colors"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Maximum number of messages per conversation (10 - 200)
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Integration */}
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  WhatsApp Integration
                </h2>
                <p className="text-xs text-text-muted">
                  WhatsApp Business API connection
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-text-primary font-medium">
                    Connection Status
                  </span>
                </div>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald/10 text-emerald border border-emerald/20">
                  <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                  Connected
                </span>
              </div>

              {/* Phone Number ID */}
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    Phone Number ID
                  </span>
                </label>
                <input
                  type="password"
                  defaultValue="1234567890123456"
                  readOnly
                  className="w-full max-w-md px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-muted focus:outline-none transition-colors"
                />
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3 h-3" />
                    Webhook URL
                  </span>
                </label>
                <div className="flex items-center gap-2 max-w-2xl">
                  <input
                    type="text"
                    defaultValue="https://api.aldaoud.jo/webhooks/whatsapp"
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-muted font-mono focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Google Calendar */}
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Google Calendar
                </h2>
                <p className="text-xs text-text-muted">
                  Calendar sync for court bookings
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-text-primary font-medium">
                    Connection Status
                  </span>
                </div>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald/10 text-emerald border border-emerald/20">
                  <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                  Connected
                </span>
              </div>

              {/* Sync Frequency */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm text-text-primary font-medium">
                      Sync Frequency
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Last synced 2 minutes ago
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Every 5 minutes
                </span>
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
