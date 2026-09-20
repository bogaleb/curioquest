'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Compass, Eye, EyeOff, LoaderCircle, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import {
  expiredLinkState,
  idleState,
  resolveResponse,
  resolveThrown,
  type AuthState,
} from '@/lib/auth-states';

type Mode = 'sign-in' | 'sign-up' | 'recover' | 'update-password';

const COPY: Record<Mode, { title: string; lead: string; submit: string }> = {
  'sign-in': {
    title: 'Welcome back',
    lead: 'Sign in to open your family’s adventures.',
    submit: 'Sign in',
  },
  'sign-up': {
    title: 'Create your parent account',
    lead: 'One account for the grown-ups. A separate learning adventure for each child.',
    submit: 'Create account',
  },
  recover: {
    title: 'Reset your password',
    lead: 'We will email you a link to choose a new one.',
    submit: 'Email me a link',
  },
  'update-password': {
    title: 'Choose a new password',
    lead: 'Pick something long. You will not need to type it often.',
    submit: 'Save new password',
  },
};

const MIN_PASSWORD = 12;

/**
 * The account screens.
 *
 * These were a single unstyled panel with inline dimensions, which made them the least
 * finished surface in a product whose every other screen is designed — and the first one
 * anybody sees. Wave 02 asks for something that reads as a children's learning product
 * rather than a generic sign-in box, and that handles its states honestly.
 *
 * The layout is two halves: what this is, and the form. On a phone the explanation moves
 * below the form, because someone returning to sign in should not scroll past a pitch to
 * reach the password field.
 */
export function AuthForm({ mode, initialError = '' }: { mode: Mode; initialError?: string }) {
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<AuthState>(initialError ? expiredLinkState() : idleState());
  const [reveal, setReveal] = useState(false);
  const [password, setPassword] = useState('');
  const announcement = useRef<HTMLDivElement>(null);

  const copy = COPY[mode];
  const needsPassword = mode !== 'recover';
  const wantsStrongPassword = mode === 'sign-up' || mode === 'update-password';

  // A message nobody notices is a message that was not delivered. Moving focus to it
  // means a screen reader announces it and a keyboard user is standing next to the
  // retry, rather than back at the top of a form they already filled in.
  useEffect(() => {
    if (state.tone !== 'idle') announcement.current?.focus();
  }, [state]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setState(idleState());
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch('/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          email: values.get('email'),
          password: values.get('password'),
          name: values.get('name'),
        }),
        signal: AbortSignal.timeout(20000),
      });
      const data = (await response.json()) as { error?: string; message?: string; redirect?: string };
      const next = resolveResponse(mode, response.status, data);
      if (response.ok && data.redirect) {
        // Keep the button in its submitting state through the navigation, so the screen
        // never flashes back to idle on the way out.
        window.location.assign(data.redirect);
        return;
      }
      setState(next);
    } catch (error) {
      setState(resolveThrown(error, typeof navigator === 'undefined' ? true : navigator.onLine));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-card">
          <Link className="brand auth-brand" href="/">
            <span className="brand-icon"><Compass size={26} /></span>
            <span>curio<span className="brand-q">quest</span></span>
          </Link>

          <h1>{copy.title}</h1>
          <p className="lead">{copy.lead}</p>

          {state.tone !== 'idle' && (
            <div
              ref={announcement}
              tabIndex={-1}
              className={state.tone === 'error' ? 'auth-message is-error' : 'auth-message is-notice'}
              role={state.tone === 'error' ? 'alert' : 'status'}
            >
              <span aria-hidden="true">{state.tone === 'error' ? '!' : <Mail size={20} />}</span>
              <div>
                <strong>{state.title}</strong>
                <p>{state.detail}</p>
              </div>
            </div>
          )}

          {state.resolved ? (
            // Sign-up and password reset both end in "go and check your email". Leaving
            // the form on screen invites a second submission that cannot help.
            <div className="auth-resolved">
              <Link className="secondary" href="/auth/sign-in">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate={false}>
              {mode === 'sign-up' && (
                <label>
                  Your name
                  <input name="name" required maxLength={80} autoComplete="name" autoFocus placeholder="What should we call you?" />
                </label>
              )}

              {mode !== 'update-password' && (
                <label>
                  Parent email
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus={mode !== 'sign-up'}
                    placeholder="you@example.com"
                  />
                </label>
              )}

              {needsPassword && (
                <label className="auth-password">
                  {mode === 'sign-in' ? 'Password' : 'New password'}
                  <span className="auth-password-field">
                    <input
                      name="password"
                      type={reveal ? 'text' : 'password'}
                      required
                      minLength={mode === 'sign-in' ? 1 : MIN_PASSWORD}
                      maxLength={128}
                      autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                      autoFocus={mode === 'update-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-reveal"
                      aria-pressed={reveal}
                      aria-label={reveal ? 'Hide password' : 'Show password'}
                      onClick={() => setReveal((on) => !on)}
                    >
                      {reveal ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </span>
                  {wantsStrongPassword && (
                    // Live, and phrased as progress rather than as failure. The server
                    // enforces the same bound; this only removes the surprise.
                    <small className={password.length >= MIN_PASSWORD ? 'is-met' : undefined}>
                      {password.length >= MIN_PASSWORD
                        ? <><Check size={14} /> Long enough</>
                        : `At least ${MIN_PASSWORD} characters — ${MIN_PASSWORD - password.length} to go`}
                    </small>
                  )}
                </label>
              )}

              <button className="primary auth-submit" disabled={busy} aria-busy={busy}>
                {busy ? <><LoaderCircle size={19} className="spin" />Just a moment…</> : <>{copy.submit}<ArrowRight size={19} /></>}
              </button>
            </form>
          )}

          {/*
            A resolved screen already offers the one route onward, so the standing link
            row would repeat it immediately below itself.
          */}
          {!state.resolved && (
          <p className="auth-links">
            {mode === 'sign-in' ? (
              <>
                <Link href="/auth/sign-up">Create an account</Link>
                <span aria-hidden="true">·</span>
                <Link href="/auth/recover">Forgot password?</Link>
              </>
            ) : (
              <Link href="/auth/sign-in">Back to sign in</Link>
            )}
          </p>
          )}
        </section>

        {/*
          The reassurance panel. It is second in the document so that a returning parent
          reaches the form first with a keyboard or a screen reader, and it is the part
          that moves below the fold on a phone.
        */}
        <aside className="auth-aside">
          <span className="eyebrow">SMALL STEPS. BIG DISCOVERIES.</span>
          <h2>A learning world built for children, run by you.</h2>
          <ul>
            <li>
              <span aria-hidden="true"><Sparkles size={19} /></span>
              <div>
                <strong>Adventures that fit the child</strong>
                Reading, numbers, science, and puzzles that change with their age and what
                they already know.
              </div>
            </li>
            <li>
              <span aria-hidden="true"><ShieldCheck size={19} /></span>
              <div>
                <strong>Children never need an email address</strong>
                You create the account. Each child gets a nickname and an avatar — no birth
                date, no location, no public profile.
              </div>
            </li>
            <li>
              <span aria-hidden="true"><Compass size={19} /></span>
              <div>
                <strong>You can see what they are learning</strong>
                Parent Corner shows real practice and progress, behind a PIN only you know.
              </div>
            </li>
          </ul>
          <p className="auth-note">
            No advertising, no leaderboards, and no open-ended chat. CurioQuest follows
            COPPA-style principles for children’s software.
          </p>
        </aside>
      </div>
    </main>
  );
}
