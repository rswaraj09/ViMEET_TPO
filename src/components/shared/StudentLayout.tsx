"use client";

import { StudentSidebar } from "./StudentSidebar";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/context/AuthContext";

interface StudentLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function StudentLayout({
  title,
  subtitle,
  actions,
  children,
}: StudentLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <StudentSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 md:gap-4 md:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-neutral-900">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs text-neutral-500">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {actions}
            <NotificationBell />
            {user && (
              <div className="hidden items-center gap-2 border-l border-neutral-200 pl-4 sm:flex">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                    {user.fullName?.slice(0, 2).toUpperCase() || "ST"}
                  </div>
                )}
                <div className="hidden leading-tight md:block">
                  <p className="text-sm font-medium text-neutral-900">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {user.emailId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-20 md:px-6 md:py-6 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
