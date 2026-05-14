"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  AlertTriangleIcon,
  RotateCcwIcon,
  HomeIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

gsap.registerPlugin(useGSAP);

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (isDev) console.error("[ErrorBoundary]", error);
  }, [error, isDev]);

  useGSAP(
    () => {
      gsap.from(".err-reveal", {
        y: 14,
        opacity: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.07,
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 grid place-items-center px-6 py-16"
    >
      <div className="max-w-md text-center">
        <div className="err-reveal mx-auto size-14 rounded-2xl bg-destructive/10 border border-destructive/30 grid place-items-center shadow-lg shadow-destructive/10">
          <AlertTriangleIcon className="size-6 text-destructive" />
        </div>

        <h1 className="err-reveal heading-display mt-6 text-3xl text-balance">
          Something went sideways
        </h1>

        <p className="err-reveal mt-2 text-sm text-muted-foreground text-pretty">
          A part of the workspace crashed unexpectedly. Your data is safe — the
          page state was rolled back. Try again, or head back home.
        </p>

        {isDev && (
          <pre className="err-reveal mt-5 max-h-48 overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left text-[11px] font-mono text-destructive/90 leading-relaxed">
            {error.message}
            {error.digest && (
              <>
                {"\n\n"}
                <span className="opacity-60">digest:</span> {error.digest}
              </>
            )}
          </pre>
        )}

        <div className="err-reveal mt-7 flex items-center justify-center gap-2">
          <Button onClick={reset}>
            <RotateCcwIcon className="size-4" />
            Try again
          </Button>
          <Link
            href="/cases"
            className={buttonVariants({ variant: "outline" })}
          >
            <HomeIcon className="size-4" />
            Back to cases
          </Link>
        </div>
      </div>
    </div>
  );
}
