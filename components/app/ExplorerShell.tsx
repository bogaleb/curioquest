"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Compass,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { AccountActions } from "@/components/auth/account-actions";
import { CelebrationLayer } from "@/components/learning/celebration-layer";
import { ParentGate } from "@/components/learning/parent-gate";
import { QuestPlayer } from "@/components/learning/quest-player";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { destinationForPath, destinationHref } from "@/lib/navigation";
import { AVATARS, INTERESTS, avatarEmoji } from "@/lib/explorers";
import { learningBands, primaryContentBand, resolveBand } from "@/lib/learning-bands";
import { configureAudio, quietAudio, unlockAudio } from "@/lib/audio";
import { readAloud as speak } from "@/lib/speech";
import { ExplorerProvider, useExplorer } from "./explorer-context";

/**
 * The persistent frame around every explorer route.
 *
 * Navigation, the quest player, the parent gate, and the add-explorer dialog live
 * here rather than in any one screen, so moving between routes never tears down an
 * in-flight quest or asks for the parent PIN again.
 */
export function ExplorerShell({ children }: { children: ReactNode }) {
  return (
    <ExplorerProvider>
      <ShellFrame>{children}</ShellFrame>
    </ExplorerProvider>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const explorer = useExplorer();
  const {
    profile, profiles, profileId, selectProfile, loaded, busy, error, reload,
    playing, closeQuest, gateOpen, setGateOpen, addingProfile, setAddingProfile,
    parentOpen, setParentOpen, studioDirty, setStudioDirty, setError,
  } = explorer;

  const view = destinationForPath(pathname);
  const blocking = playing || gateOpen || addingProfile;

  const navigate = useCallback(
    (id: string) => {
      if (studioDirty && !window.confirm("Leave the studio without saving these changes?")) return;
      setStudioDirty(false);
      router.push(destinationHref(id));
    },
    [router, setStudioDirty, studioDirty],
  );

  const closeDialog = useCallback(() => {
    if (busy) return;
    closeQuest();
    setGateOpen(false);
    setAddingProfile(false);
  }, [busy, closeQuest, setAddingProfile, setGateOpen]);
  useDialogFocus(blocking, closeDialog);

  // Audio follows the selected explorer's own comfort settings.
  useEffect(() => {
    if (profile) {
      configureAudio(
        profile.preferences.paused
          ? { ...profile.controls.audio, music: false, effects: false }
          : profile.controls.audio,
      );
    }
  }, [profile]);

  useEffect(() => {
    const unlock = () => void unlockAudio();
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      quietAudio();
    };
  }, []);

  async function lockParent() {
    try {
      const response = await fetch("/api/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lock" }),
      });
      if (!response.ok) throw Error("Parent Corner could not be locked. Please try again.");
      setParentOpen(false);
      router.push("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    }
  }

  const brand = (
    <Link className="brand" href="/" aria-label="CurioQuest home">
      <span className="brand-icon"><Compass size={29} /></span>
      <span>
        curio<span className="brand-q">quest</span>
        <small>SMALL STEPS. BIG DISCOVERIES.</small>
      </span>
    </Link>
  );

  const switcher = (
    <div className="explorer-switch">
      <span className="avatar">{avatarEmoji(profile?.avatar)}</span>
      <label>
        <span>YOUR EXPLORER</span>
        <select
          aria-label="Choose explorer"
          disabled={busy}
          value={profileId}
          onChange={(event) => {
            if (studioDirty && !window.confirm("Leave without saving your artwork?")) return;
            setStudioDirty(false);
            selectProfile(event.target.value);
          }}
        >
          {profiles.length
            ? profiles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {resolveBand(item.band).label}
                </option>
              ))
            : <option>Loading…</option>}
        </select>
      </label>
      <ChevronDown size={16} />
    </div>
  );

  const utility = (
    <>
      <div className="nova-note">
        <span className="fox">🦊</span>
        <strong>A little curious?</strong>
        <p>That’s where every great adventure begins.</p>
        <span>— Nova, your quest guide</span>
      </div>
      <button
        className={view === "parent" ? "nav-item active" : "nav-item"}
        onClick={() => setGateOpen(true)}
      >
        <ShieldCheck />Parent corner
      </button>
      <Link className="nav-item" href="/account/children">Switch family explorer</Link>
      <AccountActions />
      <small className="version">CurioQuest · First adventure edition</small>
    </>
  );

  const topbarActions = (
    <>
      <span className="star-pill">
        <Star size={17} fill="currentColor" />{profile?.stars || 0} stars
      </span>
      <button
        className="icon-button"
        title="Read a welcome"
        aria-label="Read a welcome"
        onClick={() =>
          speak(`Hello ${profile?.name || "explorer"}! Ready for a little adventure?`)
        }
      >
        <Volume2 size={20} />
      </button>
      <span className="avatar mini">{avatarEmoji(profile?.avatar)}</span>
    </>
  );

  return (
    <>
      <CelebrationLayer />
      <AppShell
        view={view}
        onNavigate={navigate}
        band={profile?.band ?? "prek"}
        faith={profile?.controls.faith ?? false}
        stars={profile?.stars ?? 0}
        inert={blocking}
        reducedMotion={profile?.preferences?.reducedMotion}
        brand={brand}
        switcher={switcher}
        utility={utility}
        topbarActions={topbarActions}
        footer={
          <>
            <span className="footer-brand"><Compass size={15} /> A little curiosity goes a long way.</span>
            <span>Learn. Think. Build. Explore.</span>
          </>
        }
      >
        {error && (
          <div className="error" role="alert">
            {error} <button onClick={reload}>Try again</button>
          </div>
        )}
        {!profile ? (
          loaded ? (
            <section className="panel">
              <h1>Your family&apos;s first adventure</h1>
              <p>Set up your Parent Corner PIN, then create an explorer. Children do not need email addresses.</p>
              <button className="primary" onClick={() => setGateOpen(true)}>Create your first explorer</button>
            </section>
          ) : (
            <div className="loading"><LoaderCircle className="spin" /> Opening your adventure…</div>
          )
        ) : (
          <>
            {profile.preferences.paused && view !== "parent" && (
              <section className="pause-card">
                <span>🌿</span>
                <h2>A little time away from the screen</h2>
                <p>Your adventures and discoveries are safely saved.<br />A grown-up can resume play in Parent Corner.</p>
              </section>
            )}
            {view === "parent" && parentOpen && (
              <div className="parent-lock-toolbar">
                <button className="secondary" onClick={lockParent}>
                  <ShieldCheck size={17} />Lock Parent Corner
                </button>
              </div>
            )}
            {children}
          </>
        )}
      </AppShell>

      {addingProfile && <AddExplorerDialog />}
      {gateOpen && (
        <ParentGate
          onClose={() => setGateOpen(false)}
          onUnlocked={() => {
            setParentOpen(true);
            setGateOpen(false);
            if (!profiles.length) setAddingProfile(true);
            router.push("/parent");
          }}
        />
      )}
      {playing && profile && !profile.preferences.paused && <PlayerOverlay />}
    </>
  );
}

function PlayerOverlay() {
  const router = useRouter();
  const explorer = useExplorer();
  const { profile, current, feedback, selected, busy, error, answer, hint, next, action, closeQuest, openQuest } = explorer;
  const session = profile?.session;
  if (!profile || !session) return null;

  const leave = () => {
    closeQuest();
    router.push(
      session.gameId ? "/play"
        : session.teamId ? "/team"
        : session.chapter !== undefined ? "/build"
        : "/",
    );
  };

  return (
    <QuestPlayer
      profile={profile}
      current={current}
      feedback={feedback}
      selected={selected}
      busy={busy}
      error={error}
      onBack={leave}
      onAnswer={answer}
      onHint={hint}
      onNext={next}
      onReflect={(strategy) => action({ action: "reflect", session: session.id, question: current!.id, strategy })}
      onFeeling={(value) => action({ action: "feeling", session: session.id, value })}
      onFinish={leave}
      onRestart={async () => {
        // Only a game mission can be restarted; the control is not offered elsewhere.
        if (!session.gameId) return;
        openQuest(await action({
          action: "game-restart",
          game: session.gameId,
          level: session.gameLevel ?? 0,
        }));
      }}
    />
  );
}

/** Creating an explorer is a parent action, so the dialog lives with the shell. */
function AddExplorerDialog() {
  const { busy, error, setError, createProfile, setAddingProfile } = useExplorer();
  const router = useRouter();
  return (
    <div className="overlay profile-overlay">
      <section className="gate panel add-profile" role="dialog" aria-modal="true" aria-labelledby="add-explorer-title">
        <button className="close" aria-label="Close" onClick={() => { setAddingProfile(false); setError(""); }}>
          <X />
        </button>
        <div className="add-profile-heading">
          <span className="add-profile-icon"><Sparkles size={28} /></span>
          <div>
            <div className="eyebrow">A NEW ADVENTURE BEGINS</div>
            <h2 id="add-explorer-title">Create an explorer</h2>
            <p>Just enough detail to make learning feel like theirs.</p>
          </div>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const band = String(new FormData(form).get("band") ?? "prek");
            form.querySelector<HTMLInputElement>('input[name="grade"]')!.value = primaryContentBand(
              resolveBand(band).id,
            );
            if (await createProfile(form)) router.push("/");
          }}
        >
          <input type="hidden" name="grade" defaultValue="prek" />
          <div className="form-two">
            <label>Explorer name<input name="name" autoFocus required maxLength={24} placeholder="What should Nova call them?" /></label>
            <label>
              Learning band
              <select name="band" defaultValue="prek">
                {learningBands.map((band) => (
                  <option key={band.id} value={band.id}>{band.label} · {band.ageLabel}</option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend>Choose a quest buddy</legend>
            <div className="avatar-options">
              {AVATARS.map((avatar, index) => (
                <label key={avatar.id} title={avatar.label}>
                  <input type="radio" name="avatar" value={avatar.id} defaultChecked={index === 0} />
                  <span aria-hidden="true">{avatar.emoji}</span>
                  <small>{avatar.label.split(" ")[1]}</small>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>What lights them up? <small>Choose up to 3</small></legend>
            <div className="interest-options">
              {INTERESTS.map((interest) => (
                <label key={interest.id}>
                  <input type="checkbox" name="interests" value={interest.id} />
                  <span>{interest.emoji} {interest.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Daily adventure length
            <select name="dailyGoal" defaultValue="10">
              <option value="8">About 8 minutes</option>
              <option value="10">About 10 minutes</option>
              <option value="15">About 15 minutes</option>
              <option value="20">About 20 minutes</option>
            </select>
          </label>
          <p className="privacy-note">
            <ShieldCheck size={17} /> CurioQuest stores a nickname and learning preferences—not a birth date, child email, or location.
          </p>
          <div className="modal-actions">
            <button type="button" className="text-button" onClick={() => { setAddingProfile(false); setError(""); }}>Cancel</button>
            <button className="primary" disabled={busy}>
              {busy ? "Creating explorer…" : "Begin their adventure"}<ArrowRight size={18} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
