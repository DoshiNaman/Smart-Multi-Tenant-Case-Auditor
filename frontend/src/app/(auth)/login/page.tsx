"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ScaleIcon,
  ArrowRightIcon,
  LoaderCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

gsap.registerPlugin(useGSAP);

const DEMO_USERS = [
  { label: "Acme Legal — Partner", email: "partner@acme.test" },
  { label: "Acme Legal — Associate", email: "associate@acme.test" },
  { label: "Brightline LLP — Partner", email: "partner@brightline.test" },
  { label: "Brightline LLP — Associate", email: "associate@brightline.test" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/cases");
  }, [loading, user, router]);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".reveal-brand", { y: 12, opacity: 0, duration: 0.6 })
        .from(".reveal-heading", { y: 18, opacity: 0, duration: 0.7 }, "-=0.35")
        .from(".reveal-sub", { y: 12, opacity: 0, duration: 0.6 }, "-=0.45")
        .from(
          ".reveal-card",
          { y: 24, opacity: 0, duration: 0.8, scale: 0.985 },
          "-=0.4",
        )
        .from(
          ".reveal-field",
          { y: 8, opacity: 0, duration: 0.5, stagger: 0.08 },
          "-=0.55",
        )
        .from(".reveal-cta", { y: 8, opacity: 0, duration: 0.45 }, "-=0.3")
        .from(
          ".reveal-demo",
          { y: 8, opacity: 0, duration: 0.5, stagger: 0.05 },
          "-=0.3",
        );
    },
    { scope: containerRef },
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      router.replace("/cases");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Something went wrong";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 grid lg:grid-cols-[1.05fr_1fr] min-h-screen"
    >
      {/* Left — brand pane */}
      <aside className="hidden lg:flex relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.78_0.13_70_/_0.12),transparent_55%),radial-gradient(ellipse_at_70%_85%,oklch(0.78_0.13_70_/_0.08),transparent_55%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="reveal-brand flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-accent to-accent/60 grid place-items-center shadow-lg shadow-accent/20">
              <ScaleIcon className="size-4.5 text-accent-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium tracking-tight">
                Case Auditor
              </div>
              <div className="text-[11px] text-muted-foreground tracking-wider uppercase">
                Multi-tenant intelligence
              </div>
            </div>
          </div>

          <div className="max-w-lg">
            <h1 className="reveal-heading heading-display text-balance text-4xl xl:text-5xl leading-[1.05]">
              The judgement is yours.
              <br />
              <span className="text-muted-foreground">
                The triage is ours.
              </span>
            </h1>
            <p className="reveal-sub mt-6 text-pretty text-muted-foreground text-base xl:text-lg leading-relaxed max-w-md">
              Submit a case summary. We classify risk, surface jurisdiction, and
              keep an immutable audit trail — so every partner override is
              traceable and every firm's data stays its own.
            </p>
          </div>

          <div className="reveal-sub flex items-center gap-6 text-xs text-muted-foreground">
            <Hallmark label="Tenant-isolated" />
            <Hallmark label="Audit-grade trail" />
            <Hallmark label="AI-assisted, partner-final" />
          </div>
        </div>
      </aside>

      {/* Right — form pane */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="reveal-card w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-accent to-accent/60 grid place-items-center shadow-lg shadow-accent/20">
              <ScaleIcon className="size-4.5 text-accent-foreground" />
            </div>
            <div className="text-sm font-medium tracking-tight">
              Case Auditor
            </div>
          </div>

          <div className="glass rounded-2xl border border-border p-8 shadow-2xl shadow-black/30">
            <div className="mb-7">
              <h2 className="heading-display text-2xl">Sign in</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Use your firm credentials to continue.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="reveal-field space-y-1.5">
                <Label htmlFor="email" className="text-xs tracking-wide">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@firm.example"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-background/40"
                />
              </div>

              <div className="reveal-field space-y-1.5">
                <Label htmlFor="password" className="text-xs tracking-wide">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-background/40 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="reveal-cta pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 group"
                >
                  {submitting ? (
                    <>
                      <LoaderCircleIcon className="size-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <Separator className="my-7" />

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Demo accounts
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {DEMO_USERS.map((d) => (
                  <button
                    type="button"
                    key={d.email}
                    onClick={() => setEmail(d.email)}
                    className="reveal-demo group flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors"
                  >
                    <span className="text-foreground/90">{d.label}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {d.email}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Password for every demo account:{" "}
                <span className="font-mono text-foreground/80">
                  password123
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Hallmark({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-1 rounded-full bg-accent" />
      <span>{label}</span>
    </div>
  );
}
