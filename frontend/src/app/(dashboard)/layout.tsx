"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon, ScaleIcon, ScrollTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/cases", label: "Cases" },
  { href: "/audit", label: "Audit log" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border">
          <div className="max-w-6xl w-full mx-auto px-6 py-4 flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-7 w-32" />
          </div>
        </div>
        <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-6xl w-full mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/cases" className="flex items-center gap-2.5">
              <div className="size-7 rounded-md bg-gradient-to-br from-accent to-accent/60 grid place-items-center shadow-md shadow-accent/20">
                <ScaleIcon className="size-3.5 text-accent-foreground" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-medium tracking-tight">
                  Case Auditor
                </div>
                <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
                  {user.tenant.name}
                </div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm transition-colors",
                      active
                        ? "text-foreground bg-accent/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/5",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full px-2 py-1 hover:bg-accent/10 transition-colors">
              <div className="size-7 rounded-full bg-gradient-to-br from-muted to-secondary grid place-items-center text-[11px] font-medium">
                {user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")}
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm">{user.name.split(" ")[0]}</span>
                <Badge variant="outline" className="text-[10px] py-0">
                  {user.role}
                </Badge>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  render={<Link href="/audit" className="cursor-pointer" />}
                >
                  <ScrollTextIcon className="size-4" /> Audit log
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={async () => {
                    await logout();
                    router.replace("/login");
                  }}
                >
                  <LogOutIcon className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
