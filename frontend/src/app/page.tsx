"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/cases" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="size-2 rounded-full bg-accent animate-pulse" />
        <span className="text-sm tracking-wide">Preparing your workspace</span>
      </div>
    </div>
  );
}
