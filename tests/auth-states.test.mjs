import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { idleState, expiredLinkState, resolveResponse, resolveThrown } = loadTs("lib/auth-states");

test("a redirect keeps the form in its submitting state rather than flashing back to idle", () => {
  const state = resolveResponse("sign-in", 200, { redirect: "/account/children" });
  assert.equal(state.kind, "submitting");
  assert.equal(state.tone, "idle");
  assert.equal(state.resolved, false);
});

test("sign-up and reset end resolved, so the form is not left open to a second submission", () => {
  const signUp = resolveResponse("sign-up", 200, { message: "Check your email to confirm." });
  assert.equal(signUp.kind, "check-email");
  assert.equal(signUp.resolved, true);
  assert.equal(signUp.tone, "notice");

  const recover = resolveResponse("recover", 200, {});
  assert.equal(recover.kind, "reset-sent");
  assert.equal(recover.resolved, true);
  // The non-committal wording is a security decision and must survive the default.
  assert.match(recover.detail, /if that address has an account/i);
});

test("the server's own wording is preferred over a paraphrase", () => {
  // The route deliberately refuses to say whether an account exists. Rewording its
  // errors here is how that protection would get lost.
  const sent = "If that address has an account, a password reset link is on its way.";
  assert.equal(resolveResponse("recover", 200, { message: sent }).detail, sent);

  const generic = "Sign-in failed. Check your email, password, and email confirmation.";
  assert.equal(resolveResponse("sign-in", 400, { error: generic }).detail, generic);
});

test("a failed sign-in is not reported as a broken service", () => {
  const state = resolveResponse("sign-in", 400, { error: "Sign-in failed." });
  assert.equal(state.kind, "invalid");
  assert.equal(state.tone, "error");
  assert.equal(state.resolved, false);
});

test("server faults, rate limits, and dead reset links are told apart", () => {
  assert.equal(resolveResponse("sign-in", 503, {}).kind, "unavailable");
  assert.match(resolveResponse("sign-in", 503, {}).detail, /on our side/i);
  assert.equal(resolveResponse("recover", 429, {}).kind, "unavailable");
  assert.match(resolveResponse("recover", 429, {}).title, /too many/i);
  assert.equal(resolveResponse("update-password", 401, {}).kind, "expired-link");
});

test("a request that never completed says so, and says nothing was submitted", () => {
  // Wave 02 names "network error" as its own state. Collapsing it into the generic
  // failure gives a parent with no signal advice that cannot help them.
  const offline = resolveThrown(new TypeError("Failed to fetch"), false);
  assert.equal(offline.kind, "offline");
  assert.match(offline.title, /offline/i);
  assert.match(offline.detail, /nothing was submitted/i);

  const timeout = resolveThrown(new DOMException("timeout", "TimeoutError"), true);
  assert.equal(timeout.kind, "offline");
  assert.match(timeout.detail, /nothing was submitted/i);

  // A dropped connection while the browser still believes it is online.
  assert.equal(resolveThrown(new TypeError("Failed to fetch"), true).kind, "offline");
});

test("an unexpected error is reported when legible, and replaced when it is not", () => {
  // A message somebody wrote for a person is passed through.
  const written = resolveThrown(new Error("The response could not be read."), true);
  assert.equal(written.kind, "unavailable");
  assert.equal(written.detail, "The response could not be read.");

  // A developer's message is not shown to a parent as though it were advice.
  const terse = resolveThrown(new Error("boom"), true);
  assert.equal(terse.kind, "unavailable");
  assert.ok(!terse.detail.includes("boom"));
  assert.match(terse.detail, /try again/i);
});

test("every state a screen can reach carries wording and a usable tone", () => {
  const states = [
    idleState(),
    expiredLinkState(),
    resolveResponse("sign-in", 200, { redirect: "/x" }),
    resolveResponse("sign-up", 200, {}),
    resolveResponse("recover", 200, {}),
    resolveResponse("sign-in", 400, {}),
    resolveResponse("sign-up", 400, {}),
    resolveResponse("sign-in", 503, {}),
    resolveResponse("recover", 429, {}),
    resolveResponse("update-password", 401, {}),
    resolveThrown(new TypeError("Failed to fetch"), false),
    resolveThrown(new Error("boom"), true),
  ];
  for (const state of states) {
    assert.ok(["idle", "error", "notice"].includes(state.tone), state.kind);
    if (state.tone === "idle") continue;
    assert.ok(state.title.length > 3, `${state.kind} has no title`);
    assert.ok(state.detail.length > 10, `${state.kind} has no detail`);
    // No state should tell a parent to "try again" without saying anything else.
    assert.ok(state.detail.length > "Please try again.".length, `${state.kind} is too thin`);
  }
});
