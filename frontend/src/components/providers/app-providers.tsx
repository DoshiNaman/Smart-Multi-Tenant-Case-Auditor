"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-context";
import { SmoothScroll } from "./smooth-scroll";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SmoothScroll />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "glass border border-border text-foreground rounded-xl shadow-lg",
          },
        }}
      />
    </AuthProvider>
  );
}
