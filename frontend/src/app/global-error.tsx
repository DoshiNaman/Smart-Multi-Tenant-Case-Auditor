"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalError]", error);
    }
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "oklch(0.135 0.004 80)",
          color: "oklch(0.965 0.005 80)",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              border: "1px solid oklch(0.7 0.19 22 / 0.3)",
              background: "oklch(0.7 0.19 22 / 0.1)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 1.5rem",
              color: "oklch(0.7 0.19 22)",
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            !
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            The app failed to load
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "oklch(0.68 0.01 80)",
              lineHeight: 1.5,
            }}
          >
            Something broke before the layout could mount. Your data is safe on
            the server.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.7rem",
                color: "oklch(0.55 0 0)",
              }}
            >
              digest: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              padding: "0.6rem 1.2rem",
              borderRadius: 10,
              border: "1px solid transparent",
              background: "oklch(0.78 0.13 70)",
              color: "oklch(0.18 0.02 80)",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Reload the app
          </button>
        </div>
      </body>
    </html>
  );
}
