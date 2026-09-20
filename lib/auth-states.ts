/**
 * What the account screens say, and why.
 *
 * The form previously collapsed every failure into one string. A parent whose wifi had
 * dropped, a parent who mistyped a password, and a parent whose account service was
 * down all read "Please try again." — advice that is only correct for one of them.
 *
 * Wave 02 lists the states an account screen has to handle. This resolves a response or
 * a thrown error into exactly one of them, as a pure function, so the wording can be
 * tested without a browser or a Supabase project.
 *
 * ## What is deliberately *not* distinguished
 *
 * Wave 02 also lists "account already exists". It is not implemented, and should not be.
 * Telling a visitor that an address is registered confirms that a specific family uses
 * this product, to anyone who can type an email address. `app/auth/session/route.ts`
 * already refuses to make that distinction — sign-up failures are generic and password
 * resets always answer "if that address has an account". Surfacing it here would undo a
 * security decision that was made correctly on the server.
 */

export type AuthStateKind =
  | "idle"
  | "submitting"
  | "check-email"
  | "reset-sent"
  | "invalid"
  | "offline"
  | "unavailable"
  | "rejected"
  | "expired-link";

export type AuthState = {
  kind: AuthStateKind;
  /** `error` is announced assertively; `notice` politely. `idle` renders nothing. */
  tone: "idle" | "error" | "notice";
  title: string;
  detail: string;
  /** True when the form should be replaced rather than left open to resubmission. */
  resolved: boolean;
};

const idle: AuthState = { kind: "idle", tone: "idle", title: "", detail: "", resolved: false };

export function idleState(): AuthState {
  return idle;
}

/** The screen a confirmation link lands on when it has already been used or has aged out. */
export function expiredLinkState(): AuthState {
  return {
    kind: "expired-link",
    tone: "error",
    title: "That link has expired",
    detail:
      "Confirmation links are single use and time limited. Sign in below, or request a new password reset link.",
    resolved: false,
  };
}

/**
 * Resolve a completed request.
 *
 * `status` is the HTTP status; `payload` is the parsed body. The server's own wording is
 * preferred for errors it chose deliberately, because those strings are where the
 * anti-enumeration care lives — this function must not paraphrase them into something
 * more specific than the server was willing to say.
 */
export function resolveResponse(
  mode: "sign-in" | "sign-up" | "recover" | "update-password",
  status: number,
  payload: { error?: string; message?: string; redirect?: string },
): AuthState {
  if (status >= 200 && status < 300) {
    if (payload.redirect) return { ...idle, kind: "submitting", tone: "idle" };
    if (mode === "recover") {
      return {
        kind: "reset-sent",
        tone: "notice",
        title: "Check your inbox",
        detail:
          payload.message ??
          "If that address has an account, a password reset link is on its way.",
        resolved: true,
      };
    }
    return {
      kind: "check-email",
      tone: "notice",
      title: "Confirm your email",
      detail:
        payload.message ?? "Check your email to confirm your parent account, then sign in.",
      resolved: true,
    };
  }

  // 503 is the route's own "account service is unavailable" path.
  if (status >= 500) {
    return {
      kind: "unavailable",
      tone: "error",
      title: "We could not reach the account service",
      detail:
        payload.error ??
        "This is on our side, not yours. Wait a moment and try again — nothing has been changed.",
      resolved: false,
    };
  }

  if (status === 429) {
    return {
      kind: "unavailable",
      tone: "error",
      title: "Too many attempts just now",
      detail: payload.error ?? "Please wait a minute, then try again.",
      resolved: false,
    };
  }

  if (status === 401) {
    return {
      kind: "expired-link",
      tone: "error",
      title: "This reset link is no longer valid",
      detail: payload.error ?? "Open a valid password reset link first.",
      resolved: false,
    };
  }

  return {
    kind: mode === "sign-in" ? "invalid" : "rejected",
    tone: "error",
    title: mode === "sign-in" ? "That did not sign you in" : "That could not be completed",
    detail: payload.error ?? "Check the details and try again.",
    resolved: false,
  };
}

/**
 * Resolve a request that never completed.
 *
 * A dropped connection and a timeout are the same thing to a parent — the form did not
 * go anywhere — and both need the one piece of advice the generic message never gave:
 * check the connection, and nothing was submitted.
 */
export function resolveThrown(error: unknown, online = true): AuthState {
  const timedOut = error instanceof DOMException && error.name === "TimeoutError";
  if (!online || timedOut || error instanceof TypeError) {
    return {
      kind: "offline",
      tone: "error",
      title: online ? "That took too long" : "You appear to be offline",
      detail: online
        ? "The account service did not answer. Check your connection and try again — nothing was submitted."
        : "Reconnect to the internet and try again. Nothing was submitted.",
      resolved: false,
    };
  }
  // Anything else reaching here is a client-side fault: the response did not parse, or
  // something threw that was not a network condition. Such a message is written for a
  // developer, so it is only shown when it reads like a sentence somebody wrote for a
  // person. "boom" helps nobody and looks like the product is broken in a new way.
  const message = error instanceof Error ? error.message.trim() : "";
  const legible = message.length > 15 && /[.!?]$/.test(message);
  return {
    kind: "unavailable",
    tone: "error",
    title: "Something went wrong",
    detail: legible
      ? message
      : "The account service did not answer in a way we understood. Please try again in a moment.",
    resolved: false,
  };
}
