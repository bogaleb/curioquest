"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PublicExplorer, QuestFeedback } from "@/lib/explorer-view";
import type { PublicQuestion } from "@/lib/activity-types";
import type { RunMode } from "@/lib/experience/types";

export type QuestResponse = {
  profile: PublicExplorer;
  profiles: PublicExplorer[];
  feedback: QuestFeedback;
  error?: string;
  deleted?: string;
};

type ExplorerContextValue = {
  profiles: PublicExplorer[];
  profile: PublicExplorer | undefined;
  profileId: string;
  selectProfile: (id: string) => void;
  loaded: boolean;
  busy: boolean;
  error: string;
  setError: (message: string) => void;
  reload: () => Promise<void>;

  /** Posts to the quest API, folding the response back into local state. */
  action: (body: Record<string, unknown>, explorerId?: string) => Promise<QuestResponse | null>;
  createProfile: (form: HTMLFormElement) => Promise<boolean>;
  setProfiles: React.Dispatch<React.SetStateAction<PublicExplorer[]>>;

  /** Quest player. */
  playing: boolean;
  current: PublicQuestion | null;
  feedback: QuestFeedback;
  selected: string;
  openQuest: (response: QuestResponse | null) => boolean;
  closeQuest: () => void;
  answer: (value: string) => Promise<void>;
  hint: () => Promise<QuestResponse | null>;
  next: () => void;
  start: (subject: string) => Promise<boolean>;

  /** The Creative Studio blocks navigation while a drawing is unsaved. */
  studioDirty: boolean;
  setStudioDirty: (dirty: boolean) => void;

  experienceMode: RunMode;
  setExperienceMode: (mode: RunMode) => void;

  /** Parent Corner session, held here so every route sees the same unlock state. */
  parentOpen: boolean;
  setParentOpen: (open: boolean) => void;
  gateOpen: boolean;
  setGateOpen: (open: boolean) => void;
  addingProfile: boolean;
  setAddingProfile: (adding: boolean) => void;
  assignmentVersion: number;
  bumpAssignments: () => void;
};

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export function useExplorer() {
  const value = useContext(ExplorerContext);
  if (!value) throw new Error("useExplorer must be used inside ExplorerProvider.");
  return value;
}

/**
 * Shared explorer state for every route under the app shell.
 *
 * The screens were previously one component switching on a `view` string, which meant
 * every screen's code shipped in the first bundle. Lifting the state here lets each
 * screen become its own route segment and load on demand, while the profile list,
 * the in-flight quest, and the parent unlock stay shared across them.
 */
export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<PublicExplorer[]>([]);
  const [profileId, setProfileId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState<PublicQuestion | null>(null);
  const [feedback, setFeedback] = useState<QuestFeedback>(null);
  const [selected, setSelected] = useState("");

  const [studioDirty, setStudioDirty] = useState(false);
  const [experienceMode, setExperienceMode] = useState<RunMode>("daily");
  const [parentOpen, setParentOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  const [assignmentVersion, setAssignmentVersion] = useState(0);

  // One request at a time: two overlapping writes to the same explorer would race
  // the optimistic revision check on the server.
  const requestLock = useRef(false);

  const profile = profiles.find((item) => item.id === profileId);
  const session = profile?.session;

  const reload = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/quest");
      const data = (await response.json()) as QuestResponse;
      if (!response.ok) throw Error(data.error || "Please try again.");
      setProfiles(data.profiles);
      setLoaded(true);
      setProfileId((current) =>
        data.profiles.some((item) => item.id === current) ? current : data.profiles[0]?.id ?? "",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/quest", { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as QuestResponse;
        if (!response.ok) throw Error(data.error);
        setProfiles(data.profiles);
        setLoaded(true);
        setProfileId((current) => {
          const requested = new URLSearchParams(window.location.search).get("child") ?? current;
          return data.profiles.some((item) => item.id === requested)
            ? requested
            : data.profiles[0]?.id ?? "";
        });
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, []);

  const action = useCallback<ExplorerContextValue["action"]>(
    async (body, explorerId) => {
      if (requestLock.current) return null;
      requestLock.current = true;
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/quest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, profile: explorerId ?? profileId }),
        });
        const data = (await response.json()) as QuestResponse;
        if (!response.ok) throw Error(data.error || "Please try again.");
        setProfiles((current) =>
          data.deleted
            ? data.profiles
            : current.map(
                (item) => (data.profiles || [data.profile]).find((next) => next.id === item.id) || item,
              ),
        );
        if (data.deleted && data.profiles[0]) setProfileId(data.profiles[0].id);
        return data;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Please try again.");
        return null;
      } finally {
        requestLock.current = false;
        setBusy(false);
      }
    },
    [profileId],
  );

  const createProfile = useCallback<ExplorerContextValue["createProfile"]>(async (form) => {
    if (requestLock.current) return false;
    requestLock.current = true;
    setBusy(true);
    setError("");
    try {
      const fields = new FormData(form);
      const response = await fetch("/api/quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-profile",
          name: fields.get("name"),
          band: fields.get("band"),
          grade: fields.get("grade"),
          avatar: fields.get("avatar"),
          dailyGoal: Number(fields.get("dailyGoal")),
          interests: fields.getAll("interests"),
        }),
      });
      const data = (await response.json()) as QuestResponse;
      if (!response.ok) throw Error(data.error || "Please try again.");
      setProfiles((current) => [...current, data.profile]);
      setProfileId(data.profile.id);
      setAddingProfile(false);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
      return false;
    } finally {
      requestLock.current = false;
      setBusy(false);
    }
  }, []);

  /** Opens the player on whatever session the response returned. */
  const openQuest = useCallback<ExplorerContextValue["openQuest"]>((response) => {
    if (!response?.profile.session) return false;
    setCurrent(response.profile.session.question);
    setFeedback(null);
    setSelected("");
    setPlaying(true);
    return true;
  }, []);

  const closeQuest = useCallback(() => {
    setPlaying(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const start = useCallback<ExplorerContextValue["start"]>(
    async (subject) => {
      if (busy || !profile) return false;
      return openQuest(await action({ action: "start", subject }));
    },
    [action, busy, openQuest, profile],
  );

  const answer = useCallback<ExplorerContextValue["answer"]>(
    async (value) => {
      if (!session || !current || busy || feedback?.correct) return;
      setSelected(value);
      const data = await action({
        action: "answer",
        session: session.id,
        question: current.id,
        answer: value,
      });
      if (data) setFeedback(data.feedback);
    },
    [action, busy, current, feedback?.correct, session],
  );

  const hint = useCallback<ExplorerContextValue["hint"]>(async () => {
    if (!session || !current) return null;
    const data = await action({ action: "hint", session: session.id, question: current.id });
    if (data) setFeedback(data.feedback);
    return data;
  }, [action, current, session]);

  const next = useCallback(() => {
    setFeedback(null);
    setSelected("");
    setCurrent(session?.question ?? null);
  }, [session]);

  const selectProfile = useCallback((id: string) => {
    setProfileId(id);
    setPlaying(false);
  }, []);

  const bumpAssignments = useCallback(() => setAssignmentVersion((value) => value + 1), []);

  // The parent PIN session lives in an expiring server cookie, so a reload should not
  // ask for the PIN again while that session is still valid. Client state alone would
  // lose the unlock on every refresh.
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/parent", { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<{ unlocked?: boolean }>) : null))
      .then((status) => {
        if (status?.unlocked) setParentOpen(true);
      })
      .catch(() => {
        // No parent session, or the check is unavailable. Corner stays locked, which
        // is the safe default.
      });
    return () => controller.abort();
  }, []);

  // Parent Corner expires on its own so an unlocked session cannot be left open.
  useEffect(() => {
    if (!parentOpen) return;
    const timer = setTimeout(() => setParentOpen(false), 15 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [parentOpen]);

  const value = useMemo<ExplorerContextValue>(
    () => ({
      profiles, profile, profileId, selectProfile, loaded, busy, error, setError, reload,
      action, createProfile, setProfiles,
      playing, current, feedback, selected, openQuest, closeQuest, answer, hint, next, start,
      studioDirty, setStudioDirty,
      experienceMode, setExperienceMode,
      parentOpen, setParentOpen, gateOpen, setGateOpen,
      addingProfile, setAddingProfile, assignmentVersion, bumpAssignments,
    }),
    [
      profiles, profile, profileId, selectProfile, loaded, busy, error, reload,
      action, createProfile,
      playing, current, feedback, selected, openQuest, closeQuest, answer, hint, next, start,
      studioDirty, experienceMode, parentOpen, gateOpen, addingProfile,
      assignmentVersion, bumpAssignments,
    ],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}
