import Link from "next/link";
import { FileSearchIcon, HomeIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 grid place-items-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto size-14 rounded-2xl bg-accent/10 border border-accent/30 grid place-items-center shadow-lg shadow-accent/10">
          <FileSearchIcon className="size-6 text-accent" />
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          404 · Not found
        </p>
        <h1 className="heading-display mt-2 text-3xl text-balance">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          The link may be stale, or the case may belong to another firm. Either
          way, it&apos;s not here.
        </p>

        <div className="mt-7 flex items-center justify-center gap-2">
          <Link href="/cases" className={buttonVariants()}>
            <HomeIcon className="size-4" />
            Back to cases
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline" })}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
