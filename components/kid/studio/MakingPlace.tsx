"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CastFigure } from "../art/cast";
import { KidButton } from "../KidButton";
import { ProgressTrail } from "../ProgressTrail";
import { SpeechBubble } from "../SpeechBubble";
import { useKidSurface } from "../surface";
import { speak, stopReading } from "@/lib/speech";
import { workspaceRequest } from "@/lib/workspace-client";
import type { ArtMark, Artwork, WorkspaceItem } from "@/lib/workspace-content";
import type {
  PageFills,
  PieceShape,
  PublicPage,
  StrokePoint,
  StudioTier,
  WritingCharacter,
} from "@/lib/studio/types";
import { ColouringBook } from "./ColouringBook";
import { DrawingBoard } from "./DrawingBoard";
import { GalleryShelf } from "./GalleryShelf";
import { PagePreview } from "./PagePreview";
import { ShapeMark } from "./shapes";
import { WritingDesk, type TraceVerdict } from "./WritingDesk";

/**
 * The Making Place.
 *
 * Three rooms behind one door: a colouring book, a drawing board and a writing desk. It
 * replaces a screen with three emoji on it and one canvas behind all three.
 *
 * ## Why three rooms rather than three modes
 *
 * The old studio had one editor and a `mode` string. Colouring was that editor with an
 * outline drawn underneath, writing was that editor with a text box above it. One surface
 * asked to be three things and was none of them well: you cannot colour neatly with a
 * brush, and a canvas with a typed word traced on it teaches nothing about how the word
 * is made.
 *
 * Each room here is built for its own job — tap-to-fill regions, a pressure-free canvas,
 * a ruled page that checks formation — and they share a paint box, a gallery and a voice.
 *
 * ## What is age-adaptive
 *
 * Almost everything, and all of it resolved on the server: which pages are on the shelf,
 * which letters are in the desk, which words and sentences, which invitation is on the
 * door. The child layer additionally narrows the paint box and the tools, because those
 * are about hands rather than content.
 */

type Room = "doors" | "colour-shelf" | "colour" | "draw" | "write-sets" | "write" | "gallery";

type WritingSet = { id: string; title: string; note: string; characters: WritingCharacter[] };
type Task = { id: string; kind: "word" | "sentence"; prompt: string; seed: string; art: PieceShape };
type Invitation = { id: string; text: string; art: PieceShape };

type StudioData = {
  tier: StudioTier;
  pages: PublicPage[];
  writing: WritingSet[];
  tasks: Task[];
  invitation: Invitation;
  gallery: WorkspaceItem<Artwork>[];
};

export function MakingPlace({
  profileId,
  name,
  paused,
  onDirtyChange,
}: {
  profileId: string;
  name: string;
  paused: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { narration } = useKidSurface();
  const [data, setData] = useState<StudioData | null>(null);
  const [room, setRoom] = useState<Room>("doors");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/making?profile=${encodeURIComponent(profileId)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as StudioData & { error?: string };
        if (!response.ok) throw new Error(body.error || "Please try again.");
        setData(body);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Please try again.");
      });
    return () => {
      controller.abort();
      stopReading();
    };
  }, [profileId]);

  const keep = useCallback(
    async (artwork: Artwork) => {
      setBusy(true);
      setError("");
      try {
        const result = await workspaceRequest<{ item: WorkspaceItem<Artwork> }>({
          action: "save-art",
          profile: profileId,
          data: artwork,
        });
        setData((current) =>
          current ? { ...current, gallery: [result.item, ...current.gallery] } : current,
        );
        setSaved(artwork.title);
        onDirtyChange?.(false);
        if (narration) speak("Saved in your gallery.");
        return true;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Try keeping it again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [narration, onDirtyChange, profileId],
  );

  if (error && !data) {
    return (
      <section className="studio-room">
        <p className="studio-trouble" role="alert">{error}</p>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="studio-room" aria-busy="true">
        <p className="studio-note">Opening the making place…</p>
      </section>
    );
  }

  const shared = { data, paused, busy, error, saved, setError, setSaved, keep, onDirtyChange };

  if (room === "colour-shelf" || room === "colour") {
    return <ColourRoom {...shared} onLeave={() => setRoom("doors")} />;
  }
  if (room === "draw") return <DrawRoom {...shared} onLeave={() => setRoom("doors")} />;
  if (room === "write-sets" || room === "write") {
    return <WriteRoom {...shared} profileId={profileId} onLeave={() => setRoom("doors")} />;
  }
  if (room === "gallery") {
    return (
      <section className="studio-room" data-view="gallery">
        <KidButton label="Back to the doors" tone="quiet" onPress={() => setRoom("doors")} />
        <h1>{name}&rsquo;s gallery</h1>
        <GalleryShelf items={data.gallery} pages={data.pages} />
      </section>
    );
  }

  return (
    <section className="studio-room" data-view="doors">
      <header className="studio-welcome">
        <span className="studio-guide">
          <CastFigure who="nova" state="explain" />
        </span>
        <div>
          <h1>The Making Place</h1>
          <SpeechBubble
            line={{
              who: "nova",
              text: data.gallery.length
                ? `You have made ${data.gallery.length} ${data.gallery.length === 1 ? "thing" : "things"}. What next?`
                : "Colour something, draw something, or write your name.",
            }}
          />
        </div>
      </header>

      <ul className="studio-doors">
        <li>
          <button type="button" className="studio-door" data-room="colour" onClick={() => setRoom("colour-shelf")}>
            <ShapeMark shape="petal" className="studio-door-art" />
            <span className="studio-door-name">Colouring</span>
            <span className="studio-door-line">Touch a part. It fills.</span>
          </button>
        </li>
        <li>
          <button type="button" className="studio-door" data-room="draw" onClick={() => setRoom("draw")}>
            <ShapeMark shape="star" className="studio-door-art" />
            <span className="studio-door-name">Drawing</span>
            <span className="studio-door-line">A whole empty page.</span>
          </button>
        </li>
        <li>
          <button type="button" className="studio-door" data-room="write" onClick={() => setRoom("write-sets")}>
            <ShapeMark shape="stem" className="studio-door-art" />
            <span className="studio-door-name">Writing</span>
            <span className="studio-door-line">Letters, words and stories.</span>
          </button>
        </li>
        <li>
          <button type="button" className="studio-door" data-room="gallery" onClick={() => setRoom("gallery")}>
            <ShapeMark shape="heart" className="studio-door-art" />
            <span className="studio-door-name">My gallery</span>
            <span className="studio-door-line">
              {data.gallery.length ? `${data.gallery.length} kept` : "Nothing yet"}
            </span>
          </button>
        </li>
      </ul>

      <section className="studio-invitation">
        <ShapeMark shape={data.invitation.art} className="studio-invitation-art" />
        <div>
          <h2>If you want an idea</h2>
          <p>{data.invitation.text}</p>
        </div>
        <KidButton label="Draw this" tone="sun" disabled={paused} onPress={() => setRoom("draw")} />
      </section>
    </section>
  );
}

/* ==========================================================================
   COLOURING
   ========================================================================== */

type RoomProps = {
  data: StudioData;
  paused: boolean;
  busy: boolean;
  error: string;
  saved: string;
  setError: (message: string) => void;
  setSaved: (title: string) => void;
  keep: (artwork: Artwork) => Promise<boolean>;
  onDirtyChange?: (dirty: boolean) => void;
  onLeave: () => void;
};

function ColourRoom({ data, paused, busy, error, keep, onDirtyChange, onLeave }: RoomProps) {
  const [pageId, setPageId] = useState("");
  const [fills, setFills] = useState<PageFills>({});
  const [history, setHistory] = useState<PageFills[]>([]);
  const [theme, setTheme] = useState("all");
  const { narration } = useKidSurface();

  const page = data.pages.find((entry) => entry.id === pageId) ?? null;
  const regions = page ? page.pieces.filter((piece) => !piece.detail) : [];
  const done = regions.filter((piece) => fills[piece.id]).length;
  const complete = Boolean(page) && done === regions.length && regions.length > 0;

  useEffect(() => {
    onDirtyChange?.(Object.keys(fills).length > 0);
  }, [fills, onDirtyChange]);

  const open = (id: string) => {
    setPageId(id);
    setFills({});
    setHistory([]);
  };

  const fill = (pieceId: string, colourId: string, partName: string) => {
    setHistory((past) => [...past.slice(-30), fills]);
    setFills((current) => ({ ...current, [pieceId]: colourId }));
    if (narration) speak(partName);
  };

  if (!page) {
    const themes = ["all", ...new Set(data.pages.map((entry) => entry.theme))];
    const shown = data.pages.filter((entry) => theme === "all" || entry.theme === theme);
    return (
      <section className="studio-room" data-view="colour-shelf">
        <KidButton label="Back to the doors" tone="quiet" onPress={onLeave} />
        <h1>The colouring book</h1>
        <div className="studio-themes" role="group" aria-label="Kinds of picture">
          {themes.map((entry) => (
            <button
              key={entry}
              type="button"
              className="studio-theme"
              data-chosen={theme === entry ? "yes" : undefined}
              aria-pressed={theme === entry}
              onClick={() => setTheme(entry)}
            >
              {entry === "all" ? "Everything" : entry}
            </button>
          ))}
        </div>
        <ul className="studio-shelf">
          {shown.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="studio-page-card" disabled={paused} onClick={() => open(entry.id)}>
                <PagePreview page={entry} />
                <span className="studio-page-name">{entry.childTitle}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="studio-room" data-view="colour">
      <KidButton label="Back to the book" tone="quiet" onPress={() => setPageId("")} />
      <h1>{page.childTitle}</h1>
      {error && <p className="studio-trouble" role="alert">{error}</p>}

      <ProgressTrail total={regions.length} done={done} label={`${done} of ${regions.length} parts coloured`} />

      <ColouringBook
        page={page}
        fills={fills}
        busy={busy || paused}
        canUndo={history.length > 0}
        onFill={fill}
        onUndo={() => {
          setFills(history.at(-1) ?? {});
          setHistory((past) => past.slice(0, -1));
        }}
        onSurprise={() => {
          setHistory((past) => [...past.slice(-30), fills]);
          setFills(surpriseFills(page, data.tier));
        }}
      />

      {complete && (
        <p className="studio-finished" role="status">
          Every part has a colour. It is yours now.
        </p>
      )}

      <div className="studio-room-actions">
        <KidButton
          label="Keep it"
          size="primary"
          tone="sun"
          disabled={busy || paused || !done}
          onPress={() =>
            keep({
              title: page.title,
              mode: "coloring",
              template: page.id,
              page: page.id,
              guide: "",
              caption: "",
              fills,
              marks: [],
            })
          }
        />
      </div>
    </section>
  );
}

/** Fill every region with a colour nobody chose. The most-asked-for button in any book. */
function surpriseFills(page: PublicPage, tier: StudioTier): PageFills {
  const box = paletteIds(tier);
  const out: PageFills = {};
  page.pieces.forEach((piece, index) => {
    if (piece.detail) return;
    out[piece.id] = box[(index * 7 + page.id.length * 3) % box.length];
  });
  return out;
}

/** The colour ids a tier's box holds, without importing the palette module's objects. */
function paletteIds(tier: StudioTier): string[] {
  if (tier === "explorer") return ["tomato", "sunflower", "sky", "leaf", "rose", "grape", "bark"];
  if (tier === "investigator") {
    return ["tomato", "coral", "sunflower", "honey", "sky", "sea", "lavender", "grape", "leaf", "moss", "berry", "sand"];
  }
  return ["tomato", "coral", "sunflower", "honey", "apricot", "sky", "sea", "deepsea", "lavender", "grape", "midnight", "leaf", "moss", "mint", "forest", "berry", "rose", "bark", "sand", "stone", "brick"];
}

/* ==========================================================================
   DRAWING
   ========================================================================== */

function DrawRoom({ data, paused, busy, error, keep, onDirtyChange, onLeave }: RoomProps) {
  const [marks, setMarks] = useState<ArtMark[]>([]);
  const [redo, setRedo] = useState<ArtMark[]>([]);
  const [title, setTitle] = useState("My picture");

  useEffect(() => {
    onDirtyChange?.(marks.length > 0);
  }, [marks.length, onDirtyChange]);

  return (
    <section className="studio-room" data-view="draw">
      <KidButton label="Back to the doors" tone="quiet" onPress={onLeave} />
      <h1>The drawing board</h1>
      <p className="studio-note">{data.invitation.text}</p>
      {error && <p className="studio-trouble" role="alert">{error}</p>}

      <DrawingBoard
        marks={marks}
        busy={busy || paused}
        canUndo={marks.length > 0}
        canRedo={redo.length > 0}
        onAdd={(mark) => {
          setMarks((current) => [...current, mark]);
          setRedo([]);
        }}
        onUndo={() => {
          setRedo((current) => [...current, marks.at(-1)!]);
          setMarks((current) => current.slice(0, -1));
        }}
        onRedo={() => {
          setMarks((current) => [...current, redo.at(-1)!]);
          setRedo((current) => current.slice(0, -1));
        }}
        onClear={() => {
          setRedo([...marks].reverse());
          setMarks([]);
        }}
      />

      <label className="studio-name-field">
        <span>What is it called?</span>
        <input value={title} maxLength={70} disabled={busy || paused} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <div className="studio-room-actions">
        <KidButton
          label="Keep it"
          size="primary"
          tone="sun"
          disabled={busy || paused || !marks.length || !title.trim()}
          onPress={() =>
            keep({
              title: title.trim() || "My picture",
              mode: "drawing",
              template: "blank",
              page: "",
              guide: "",
              caption: "",
              fills: {},
              marks,
            })
          }
        />
      </div>
    </section>
  );
}

/* ==========================================================================
   WRITING
   ========================================================================== */

function WriteRoom({
  data,
  profileId,
  paused,
  busy,
  error,
  keep,
  setError,
  onLeave,
}: RoomProps & { profileId: string }) {
  const [setId, setSetId] = useState("");
  const [characterKey, setCharacterKey] = useState("");
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [verdict, setVerdict] = useState<TraceVerdict | null>(null);
  const [taskId, setTaskId] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { narration } = useKidSurface();

  const session = useRef("");
  const startedAt = useRef(0);
  const sessionId = () => {
    if (!session.current) {
      session.current =
        typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `write-${Date.now()}`;
    }
    return session.current;
  };

  const set = data.writing.find((entry) => entry.id === setId) ?? null;
  const character = set?.characters.find((entry) => entry.key === characterKey) ?? null;
  const task = data.tasks.find((entry) => entry.id === taskId) ?? null;

  const trace = useCallback(
    async (points: StrokePoint[]) => {
      if (!set || !character || sending || paused) return;
      setSending(true);
      try {
        const response = await fetch("/api/making", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "trace",
            profile: profileId,
            group: set.id,
            character: character.key,
            stroke: strokeIndex,
            points: points.slice(0, 500),
            session: sessionId(),
            startedAt: startedAt.current || Date.now(),
          }),
        });
        const body = (await response.json()) as {
          ok?: boolean; advice?: string; finished?: boolean; error?: string;
        };
        if (!response.ok || typeof body.ok !== "boolean") throw new Error(body.error || "Please try again.");
        setVerdict({ ok: body.ok, advice: body.advice ?? "", strokeIndex });
        if (narration && body.advice) speak(body.advice);
        if (body.ok) {
          startedAt.current = Date.now();
          if (body.finished) {
            window.setTimeout(() => {
              setVerdict(null);
              setStrokeIndex(0);
              setCharacterKey("");
            }, 1400);
          } else {
            window.setTimeout(() => {
              setVerdict(null);
              setStrokeIndex((current) => current + 1);
            }, 900);
          }
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Please try again.");
      } finally {
        setSending(false);
      }
    },
    [character, narration, paused, profileId, sending, set, setError, strokeIndex],
  );

  /* ---- a letter ---------------------------------------------------------- */
  if (set && character) {
    return (
      <section className="studio-room" data-view="write">
        <KidButton label="Back to the letters" tone="quiet" onPress={() => { setCharacterKey(""); setStrokeIndex(0); setVerdict(null); }} />
        {error && <p className="studio-trouble" role="alert">{error}</p>}
        {/* Keyed on the stroke: a new stroke is a fresh page, and re-mounting is how the
            live ink clears without an effect reaching into the desk from outside. */}
        <WritingDesk
          key={`${character.key}:${strokeIndex}`}
          note={set.note}
          character={character}
          strokeIndex={strokeIndex}
          verdict={verdict}
          busy={sending || paused}
          onTrace={trace}
          onSkip={() => { setCharacterKey(""); setStrokeIndex(0); setVerdict(null); }}
        />
      </section>
    );
  }

  /* ---- a word or a sentence ---------------------------------------------- */
  if (task) {
    return (
      <section className="studio-room" data-view="write-task">
        <KidButton label="Back to writing" tone="quiet" onPress={() => { setTaskId(""); setText(""); }} />
        <h1>{task.kind === "word" ? "Write a word" : "Finish the sentence"}</h1>
        {error && <p className="studio-trouble" role="alert">{error}</p>}
        <div className="studio-task">
          <ShapeMark shape={task.art} className="studio-task-art" />
          <p className="studio-task-prompt">{task.prompt}</p>
        </div>
        <label className="studio-writing-field">
          <span>{task.kind === "word" ? "Your word" : "Your sentence"}</span>
          <textarea
            value={text}
            maxLength={task.kind === "word" ? 40 : 300}
            disabled={busy || paused}
            placeholder={task.kind === "sentence" ? task.seed : ""}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <div className="studio-room-actions">
          <KidButton label="Say it" tone="quiet" disabled={!text.trim()} onPress={() => speak(text)} />
          <KidButton
            label="Keep it"
            size="primary"
            tone="sun"
            disabled={busy || paused || !text.trim()}
            onPress={() =>
              keep({
                title: task.kind === "word" ? `Writing: ${task.seed}` : "My sentence",
                mode: "writing",
                template: "blank",
                page: "",
                guide: task.seed,
                caption: task.kind === "sentence" ? `${task.seed}${text.trim()}` : text.trim(),
                fills: {},
                marks: [],
              })
            }
          />
        </div>
      </section>
    );
  }

  /* ---- a set of letters --------------------------------------------------- */
  if (set) {
    return (
      <section className="studio-room" data-view="write-letters">
        <KidButton label="Back to writing" tone="quiet" onPress={() => setSetId("")} />
        <h1>{set.title}</h1>
        <p className="studio-note">{set.note}</p>
        <ul className="studio-letters">
          {set.characters.map((entry) => (
            <li key={entry.key}>
              <button
                type="button"
                className="studio-letter"
                disabled={paused}
                aria-label={entry.spoken}
                onClick={() => { setCharacterKey(entry.key); setStrokeIndex(0); setVerdict(null); startedAt.current = Date.now(); }}
              >
                <span aria-hidden="true">{entry.key.length > 2 ? entry.spoken.split(" ")[1] ?? entry.key : entry.key}</span>
                {entry.example && <small>{entry.example}</small>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  /* ---- the writing room's own door ---------------------------------------- */
  return (
    <section className="studio-room" data-view="write-sets">
      <KidButton label="Back to the doors" tone="quiet" onPress={onLeave} />
      <h1>The writing desk</h1>
      <ul className="studio-sets">
        {data.writing.map((entry) => (
          <li key={entry.id}>
            <button type="button" className="studio-set" disabled={paused} onClick={() => setSetId(entry.id)}>
              <span className="studio-set-name">{entry.title}</span>
              <span className="studio-set-line">{entry.note}</span>
              <span className="studio-set-count">{entry.characters.length} to try</span>
            </button>
          </li>
        ))}
      </ul>

      <h2>Words and sentences</h2>
      <ul className="studio-sets">
        {data.tasks.map((entry) => (
          <li key={entry.id}>
            <button type="button" className="studio-set" disabled={paused} onClick={() => { setTaskId(entry.id); setText(""); }}>
              <ShapeMark shape={entry.art} className="studio-set-art" />
              <span className="studio-set-name">{entry.kind === "word" ? entry.seed : entry.seed.trim() + "…"}</span>
              <span className="studio-set-line">{entry.prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

