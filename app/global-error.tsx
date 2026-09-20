"use client";

/**
 * The last resort: a failure in the root layout itself, above every other boundary.
 *
 * This file replaces the root layout when it renders, so it supplies its own `<html>`
 * and `<body>` — and, less obviously, its own styling. Global stylesheets are not
 * applied here, which is why the brand colours are inline rather than tokens. Written
 * for a parent, because at this point the shell that a child recognises is gone.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#fdfcf7",
          color: "#233f37",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          lineHeight: 1.55,
        }}
      >
        <title>CurioQuest could not start</title>
        <main
          style={{
            maxWidth: "26rem",
            textAlign: "center",
            background: "#fff",
            border: "1px solid #e0e4d8",
            borderRadius: "20px",
            padding: "32px 28px",
            boxShadow: "0 8px 28px rgba(35, 63, 55, 0.09)",
          }}
        >
          <p aria-hidden="true" style={{ fontSize: "44px", margin: "0 0 8px" }}>🦊</p>
          <h1 style={{ fontSize: "24px", margin: "0 0 12px", color: "#125540" }}>
            CurioQuest could not start
          </h1>
          <p style={{ margin: "0 0 24px" }}>
            Something went wrong before the adventure could load. Nothing your family has
            saved is affected.
          </p>
          <button
            onClick={() => retry()}
            style={{
              minHeight: "48px",
              padding: "0 24px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#fff",
              background: "#17694e",
              border: 0,
              borderBottom: "3px solid #0f4434",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ margin: "20px 0 0", fontSize: "13px", color: "#77836f" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
