'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Brush, Eraser, Save, Trash2, Undo2 } from 'lucide-react';
import { CastFigure } from '@/components/kid/art/cast';

/**
 * The creative studio: where an explorer draws, colors, and keeps artwork.
 *
 * The kid-facing `/create` route renders the full studio (hero, doors, canvas,
 * gallery). The parent dashboard reuses it with `parent` for the artwork
 * portfolio — same saved pieces, no drawing tools.
 *
 * Artwork is kept in localStorage per profile (small JPEGs); there is no
 * server-side artwork store. `onDirtyChange` feeds the explorer shell's
 * "leave without saving?" guard.
 */

type StudioMode = 'draw' | 'color' | 'gallery';

type StudioArtwork = {
  id: string;
  dataUrl: string;
  createdAt: number;
  mode: 'draw' | 'color';
  template?: string;
};

const PALETTE = [
  '#e5484d', '#f76b15', '#ffc53d', '#46a758', '#0090ff',
  '#8e4ec6', '#d6409f', '#ad5700', '#1f2937', '#ffffff',
];

const BRUSH_SIZES = [5, 11, 20];

const CANVAS_W = 1000;
const CANVAS_H = 700;

function storageKey(profileId: string) {
  return `curioquest:studio:${profileId}`;
}

function loadArtwork(profileId: string): StudioArtwork[] {
  try {
    const raw = localStorage.getItem(storageKey(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Light-gray line-art starters for the coloring door, drawn with canvas primitives. */
function paintTemplate(ctx: CanvasRenderingContext2D, template: string) {
  ctx.save();
  ctx.strokeStyle = '#b9c6b0';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  if (template === 'sun') {
    ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150);
      ctx.lineTo(cx + Math.cos(a) * 210, cy + Math.sin(a) * 210);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 40, cy - 20, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy + 20, 45, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else if (template === 'flower') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * 95, cy - 60 + Math.sin(a) * 95, 62, 42, a, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy - 60, 52, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 220); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx - 70, cy + 110, 60, 30, -0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx + 70, cy + 150, 60, 30, 0.5, 0, Math.PI * 2); ctx.stroke();
  } else if (template === 'fish') {
    ctx.beginPath(); ctx.ellipse(cx, cy, 190, 110, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 180, cy); ctx.lineTo(cx + 290, cy - 90); ctx.lineTo(cx + 290, cy + 90); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 110, cy - 25, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 40, cy + 60, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 90, cy + 60, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 40, cy - 80, 60, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  } else {
    // house
    ctx.strokeRect(cx - 150, cy - 40, 300, 230);
    ctx.beginPath(); ctx.moveTo(cx - 185, cy - 40); ctx.lineTo(cx, cy - 190); ctx.lineTo(cx + 185, cy - 40); ctx.closePath(); ctx.stroke();
    ctx.strokeRect(cx - 45, cy + 70, 90, 120);
    ctx.strokeRect(cx - 120, cy + 20, 70, 70);
    ctx.beginPath(); ctx.moveTo(cx - 85, cy + 20); ctx.lineTo(cx - 85, cy + 90); ctx.moveTo(cx - 120, cy + 55); ctx.lineTo(cx - 50, cy + 55); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 105, cy + 55, 8, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

const TEMPLATES = [
  { id: 'sun', label: 'Sunny day' },
  { id: 'flower', label: 'Flower' },
  { id: 'fish', label: 'Fish' },
  { id: 'house', label: 'Little house' },
];

export function CreativeStudio({ profileId, name, paused, onDirtyChange, parent }: {
  profileId: string;
  name: string;
  paused: boolean;
  onDirtyChange: (dirty: boolean) => void;
  parent?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const undoStack = useRef<string[]>([]);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<StudioMode>(parent ? 'gallery' : 'draw');
  const [color, setColor] = useState(PALETTE[4]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const [artwork, setArtwork] = useState<StudioArtwork[]>([]);
  const [template, setTemplate] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [viewing, setViewing] = useState<StudioArtwork | null>(null);
  const dirtyRef = useRef(false);

  const setDirty = useCallback((dirty: boolean) => {
    if (dirtyRef.current !== dirty) {
      dirtyRef.current = dirty;
      onDirtyChange(dirty);
    }
  }, [onDirtyChange]);

  // Load the portfolio once the profile is known.
  useEffect(() => {
    setArtwork(loadArtwork(profileId));
    setDirty(false);
  }, [profileId, setDirty]);

  const getCtx = useCallback(() => canvasRef.current?.getContext('2d') ?? null, []);

  const blankCanvas = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
    if (template) paintTemplate(ctx, template);
  }, [getCtx, template]);

  // (Re)paint the canvas when the mode or template changes.
  useEffect(() => {
    if (parent || mode === 'gallery') return;
    blankCanvas();
    undoStack.current = [];
    setDirty(false);
  }, [mode, template, parent, blankCanvas, setDirty]);

  const canvasPoint = (event: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const pushUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    undoStack.current.push(canvas.toDataURL('image/png'));
    if (undoStack.current.length > 15) undoStack.current.shift();
  };

  const startStroke = (event: React.PointerEvent) => {
    if (paused || parent) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    lastPoint.current = canvasPoint(event);
    pushUndo();
    setDirty(true);
    setMessage('');
  };

  const moveStroke = (event: React.PointerEvent) => {
    if (!drawing.current || !lastPoint.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const point = canvasPoint(event);
    ctx.save();
    ctx.strokeStyle = eraser ? '#ffffff' : color;
    ctx.lineWidth = eraser ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();
    lastPoint.current = point;
  };

  const endStroke = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    const previous = undoStack.current.pop();
    if (!canvas || !ctx || !previous) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0);
    };
    img.src = previous;
  };

  const clear = () => {
    blankCanvas();
    undoStack.current = [];
    setDirty(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Shrink for storage: a 480px JPEG is plenty for a fridge-door gallery.
    const thumb = document.createElement('canvas');
    thumb.width = 480;
    thumb.height = Math.round((480 / CANVAS_W) * CANVAS_H);
    const tctx = thumb.getContext('2d');
    if (!tctx) return;
    tctx.fillStyle = '#ffffff';
    tctx.fillRect(0, 0, thumb.width, thumb.height);
    tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    const piece: StudioArtwork = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      dataUrl: thumb.toDataURL('image/jpeg', 0.85),
      createdAt: Date.now(),
      // Save is only reachable from the draw/color doors; gallery never saves.
      mode: mode === 'gallery' ? 'draw' : mode,
      template: template ?? undefined,
    };
    try {
      const next = [piece, ...loadArtwork(profileId)].slice(0, 60);
      localStorage.setItem(storageKey(profileId), JSON.stringify(next));
      setArtwork(next);
      setDirty(false);
      setMessage(parent ? 'Saved to the portfolio.' : `Beautiful, ${name}! It's in your gallery.`);
    } catch {
      setMessage('Oh no — the gallery is full. Ask a grown-up to tidy it.');
    }
  };

  const removePiece = (id: string) => {
    if (!window.confirm('Remove this artwork from the gallery?')) return;
    const next = artwork.filter((a) => a.id !== id);
    try {
      localStorage.setItem(storageKey(profileId), JSON.stringify(next));
    } catch { /* storage already failed; the in-memory list is the truth now */ }
    setArtwork(next);
    setViewing(null);
  };

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  /* ------------------------------ parent portfolio ------------------------------ */
  if (parent) {
    return (
      <div className="creative-studio">
        <div className="studio-gallery">
          <h2>{name}&rsquo;s artwork</h2>
          {message && <p className="success" role="status">{message}</p>}
          {!artwork.length && <p>Nothing saved yet. Artwork {name} makes in the studio will appear here.</p>}
          <div className="template-grid">
            {artwork.map((piece) => (
              <button key={piece.id} type="button" onClick={() => setViewing(piece)} aria-label={`View artwork from ${fmtDate(piece.createdAt)}`}>
                <img className="art-preview" src={piece.dataUrl} alt={`Artwork by ${name}`} />
                <strong>{piece.mode === 'color' ? 'Coloring' : 'Drawing'}</strong>
                <small>{fmtDate(piece.createdAt)}</small>
              </button>
            ))}
          </div>
        </div>
        {viewing && (
          <div className="studio-viewer" role="dialog" aria-label="Artwork viewer">
            <img src={viewing.dataUrl} alt={`Artwork by ${name}, ${fmtDate(viewing.createdAt)}`} />
            <div className="studio-actions">
              <button type="button" className="secondary" onClick={() => setViewing(null)}>Close</button>
              <button type="button" className="text-button" onClick={() => removePiece(viewing.id)}><Trash2 size={16} />Remove</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* --------------------------------- kid studio --------------------------------- */
  return (
    <div className="creative-studio">
      <div className="creative-hero">
        <h1>{name}&rsquo;s art studio</h1>
        <p>Draw anything you imagine, color a picture, and keep your favorites in the gallery.</p>
        <span className="studio-art-symbols" aria-hidden="true">
          <CastFigure who="bea" state="idle" />
        </span>
      </div>

      <div className="creative-doors" role="tablist" aria-label="Studio activities">
        <button type="button" role="tab" aria-selected={mode === 'draw'} onClick={() => { setMode('draw'); setTemplate(null); }}>
          <span aria-hidden="true"><CastFigure who="curio" state="idle" /></span>
          <strong>Draw</strong>
          <small>A blank page and all your colors.</small>
        </button>
        <button type="button" role="tab" aria-selected={mode === 'color'} onClick={() => setMode('color')}>
          <span aria-hidden="true"><CastFigure who="bea" state="idle" /></span>
          <strong>Color</strong>
          <small>Pick a picture and fill it in.</small>
        </button>
        <button type="button" role="tab" aria-selected={mode === 'gallery'} onClick={() => setMode('gallery')}>
          <span aria-hidden="true"><CastFigure who="luna" state="idle" /></span>
          <strong>Gallery</strong>
          <small>See everything you have made.</small>
        </button>
      </div>

      {paused && (
        <div className="creative-challenge">
          <span aria-hidden="true"><CastFigure who="tuno" state="idle" /></span>
          <div>
            <strong>The studio is resting right now.</strong>
            <p>Come back when your grown-up opens it again. Your gallery is safe.</p>
          </div>
        </div>
      )}

      {!paused && mode !== 'gallery' && (
        <>
          {mode === 'color' && (
            <div className="studio-heading">
              <span>Choose a picture</span>
              <div className="template-grid" style={{ marginTop: 0, width: '100%' }}>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={template === t.id}
                    onClick={() => setTemplate(t.id)}
                  >
                    <strong>{t.label}</strong>
                    <small>{template === t.id ? 'Coloring now' : 'Tap to color'}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <fieldset className="studio-toolbox">
            <legend>Tools</legend>
            <div className="tool-row palette" role="group" aria-label="Colors">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={!eraser && color === c}
                  style={{ background: c }}
                  onClick={() => { setColor(c); setEraser(false); }}
                />
              ))}
              <label>Size
                <input
                  type="range"
                  min={0}
                  max={BRUSH_SIZES.length - 1}
                  value={BRUSH_SIZES.indexOf(brushSize)}
                  onChange={(e) => setBrushSize(BRUSH_SIZES[Number(e.target.value)])}
                  aria-label="Brush size"
                />
              </label>
            </div>
            <div className="tool-row" role="group" aria-label="Actions">
              <button type="button" aria-pressed={!eraser} onClick={() => setEraser(false)}>
                <Brush size={18} />Draw
              </button>
              <button type="button" aria-pressed={eraser} onClick={() => setEraser(true)}>
                <Eraser size={18} />Eraser
              </button>
              <button type="button" onClick={undo} disabled={!undoStack.current.length && !dirtyRef.current}>
                <Undo2 size={18} />Undo
              </button>
              <button type="button" onClick={clear}>
                <Trash2 size={18} />Start over
              </button>
              <button type="button" className="primary" onClick={save}>
                <Save size={18} />Keep it
              </button>
            </div>
          </fieldset>

          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            width={CANVAS_W}
            height={CANVAS_H}
            aria-label={mode === 'color' && template ? `Coloring page: ${template}` : 'Drawing canvas'}
            onPointerDown={startStroke}
            onPointerMove={moveStroke}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={endStroke}
          />
          {message && <p className="success" role="status">{message}</p>}
          <p className="studio-tip">
            {mode === 'color' && !template
              ? 'Pick a picture above, then color inside the lines — or scribble all over. Both are art.'
              : 'Use your finger or a mouse to draw. Press “Keep it” to save it to your gallery.'}
          </p>
        </>
      )}

      {!paused && mode === 'gallery' && (
        <div className="studio-gallery">
          <div className="studio-heading">
            <span>Your gallery</span>
          </div>
          {!artwork.length && (
            <div className="creative-challenge">
              <span aria-hidden="true"><CastFigure who="curio" state="idle" /></span>
              <div>
                <strong>Nothing here yet!</strong>
                <p>Draw or color something, press “Keep it”, and it will live here.</p>
              </div>
            </div>
          )}
          <div className="template-grid">
            {artwork.map((piece) => (
              <button key={piece.id} type="button" onClick={() => setViewing(piece)} aria-label={`View artwork from ${fmtDate(piece.createdAt)}`}>
                <img className="art-preview" src={piece.dataUrl} alt="Your artwork" />
                <strong>{piece.mode === 'color' ? 'Coloring' : 'Drawing'}</strong>
                <small>{fmtDate(piece.createdAt)}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {viewing && (
        <div className="studio-viewer" role="dialog" aria-label="Artwork viewer">
          <img src={viewing.dataUrl} alt={`Artwork from ${fmtDate(viewing.createdAt)}`} />
          <div className="studio-actions">
            <button type="button" className="secondary" onClick={() => setViewing(null)}>Back to gallery</button>
            <button type="button" className="text-button" onClick={() => removePiece(viewing.id)}><Trash2 size={16} />Remove</button>
          </div>
        </div>
      )}

    </div>
  );
}
