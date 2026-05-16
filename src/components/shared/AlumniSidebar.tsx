"use client";


import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCog,
  FileText,
  Users,
  Megaphone,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@/lib/api/useLogout";

export type AlumniTab =
  | "overview"
  | "profile"
  | "academic"
  | "posts"
  | "feed"
  | "directory";

interface Item {
  key: AlumniTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const items: Item[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "profile", label: "Career Profile", icon: UserCog },
  { key: "academic", label: "Academic History", icon: BookOpen },
  { key: "posts", label: "My Posts", icon: FileText },
  { key: "feed", label: "Alumni Feed", icon: Megaphone },
  { key: "directory", label: "Directory", icon: Users },
];

interface AlumniSidebarProps {
  active: AlumniTab;
  onSelect: (tab: AlumniTab) => void;
}

export function AlumniSidebar({ active, onSelect }: AlumniSidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const handleLogout = useLogout();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
    {/* Desktop sidebar */}
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } group sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-neutral-200 bg-white transition-[width] duration-200 md:flex`}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <button
        onClick={() => router.push("/")}
        className={`flex h-16 items-center gap-2.5 border-b border-neutral-200 ${
          collapsed ? "justify-center px-2" : "px-4"
        }`}
      >
        <img src="/logo.png" alt="Vishwaniketan" className="h-8 w-8 flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col leading-tight text-left">
            <span className="text-sm font-semibold tracking-tight text-neutral-900">
              Vishwaniketan
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
              Alumni Portal
            </span>
          </div>
        )}
      </button>

      <nav className="flex-1 overflow-y-auto p-3">
        <p
          className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 ${
            collapsed ? "hidden" : ""
          }`}
        >
          Navigate
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onSelect(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-200 p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2.5 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt=""
                className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                {user.fullName?.slice(0, 2).toUpperCase() || "AL"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">
                {user.fullName}
              </p>
              <p className="truncate text-[11px] text-neutral-500">
                {user.emailId}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>

    {/* Mobile bottom nav */}
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around gap-1 overflow-x-auto border-t border-neutral-200 bg-white px-1 py-1 md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`flex min-w-16 flex-shrink-0 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition ${
              isActive ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
            <span className="max-w-16 truncate">{item.label}</span>
          </button>
        );
      })}
      <button
        onClick={handleLogout}
        className="flex min-w-16 flex-shrink-0 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium text-neutral-400 transition"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>
    </nav>
    </>
  );
}
