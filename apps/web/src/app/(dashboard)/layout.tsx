"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  MapPin,
  Users,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout, getUser } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Bookings", href: "/bookings", icon: Calendar },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Courts", href: "/courts", icon: MapPin },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "AI Monitor", href: "/ai-monitor", icon: Bot },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const item = navItems.find((item) => item.href === pathname);
  return item?.label || "Dashboard";
}

function getBreadcrumb(pathname: string): string[] {
  if (pathname === "/") return ["Home", "Dashboard"];
  const title = getPageTitle(pathname);
  return ["Home", title];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const breadcrumb = getBreadcrumb(pathname);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="min-h-screen bg-[#060606] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Accent line at top */}
        <div className="h-[2px] bg-gradient-to-r from-emerald-500/60 via-emerald-400/40 to-transparent" />

        {/* Brand */}
        <div className="h-16 flex items-center px-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/15 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-[-0.01em] leading-none">
                Al Daoud
              </h1>
              <p className="text-[10px] text-zinc-500 leading-none mt-1 tracking-wide uppercase">
                Football Courts
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Separator */}
        <div className="mx-4 h-[1px] bg-white/[0.04]" />

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 relative group",
                  isActive
                    ? "text-white bg-white/[0.06]"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-500" />
                )}
                <Icon
                  className={cn(
                    "w-[17px] h-[17px] shrink-0 transition-colors duration-200",
                    isActive ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mx-3 mb-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 border border-emerald-500/15 flex items-center justify-center text-[13px] font-semibold text-emerald-400">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-zinc-200 truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-[11px] text-zinc-600 truncate">
                {user?.role || "Administrator"}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-14 border-b border-white/[0.04] bg-[#060606]/90 backdrop-blur-lg flex items-center px-6 sticky top-0 z-30 shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-4 lg:hidden text-zinc-500 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px]">
            {breadcrumb.map((item, index) => (
              <span key={item} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="w-3 h-3 text-zinc-700" />
                )}
                <span
                  className={cn(
                    index === breadcrumb.length - 1
                      ? "text-zinc-200 font-medium"
                      : "text-zinc-600"
                  )}
                >
                  {item}
                </span>
              </span>
            ))}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
