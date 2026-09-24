import * as React from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { roleLabels, roleHome, homeForRoles, type AppRole } from "@/lib/roles";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { Bell, HelpCircle, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/**
 * Wraps a role dashboard root. If the signed-in account does not hold the
 * role this dashboard is for, it is sent to its own dashboard root instead —
 * dashboards are never shared with pieces hidden client-side.
 */
export function DashboardShell({ role, children }: { role: AppRole; children: ReactNode }) {
  const { data, isPending, error } = useSessionProfile();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Stub for unread notifications count - in a real app, we would fetch this
  const [unreadCount, setUnreadCount] = React.useState(0);
  React.useEffect(() => {
    // In a real implementation, we would fetch unread count from the server
    // For now, we stub a random number for demonstration
    setUnreadCount(Math.floor(Math.random() * 10));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-body text-muted-foreground">Loading your workspace…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-3">
        <div className="max-w-md rounded-lg border border-border bg-card p-3 text-center">
          <h1 className="text-heading text-card-foreground">
            We couldn&apos;t open your workspace
          </h1>
          <p className="text-caption mt-1 text-muted-foreground">
            {error instanceof Error ? error.message : "Please try signing in again."}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={() => router.invalidate()}
              className="text-caption rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground"
            >
              Try again
            </button>
            <button
              onClick={signOut}
              className="text-caption rounded-md border border-border px-3 py-1 font-medium text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data.roles.includes(role)) {
    const target = homeForRoles(data.roles);
    if (target !== roleHome[role]) {
      navigate({ to: target, replace: true });
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-3 py-2">
          {/* Left: Logo and tenant name */}
          <div className="flex items-center gap-3">
            {/* Logo placeholder - replace with actual logo */}
            <img src="/logo.png" alt="SalesFlow Pro" className="h-8 w-auto" />
            <div>
              <span className="text-caption font-medium tracking-[0.18em] text-accent uppercase">
                {data.tenantName}
              </span>
            </div>
          </div>

          {/* Right: Notification bell, user avatar dropdown, help icon */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <button className="text-caption" aria-label="Notifications">
                <Bell className="h-5 w-5 text-accent-hover" />
                {/* Unread badge */}
                {unreadCount > 0 && (
                  <Badge className="badge-outline" variant="destructive" className="pointer-events-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </button>
            </div>

            {/* User avatar and dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={data.avatarUrl ?? "/default-avatar.png"} alt={data.fullName ?? ""} />
                  <AvatarFallback>{data.fullName?.[0] ?? data.email?.[0]}</AvatarFallback>
                </Avatar>
                <div className="text-caption font-medium">{data.fullName ?? data.email}</div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 p-2" sideOffset={4}>
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
                {/* TODO: Add Profile link when profile page exists */}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help icon */}
            <button className="text-caption" aria-label="Help">
              <HelpCircle className="h-5 w-5 text-accent-hover" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-4">{children}</main>
    </div>
  );
}