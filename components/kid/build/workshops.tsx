"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { dropHeight, mapGrid, mapPlacement, refFor, robotCommands, runRobot, shapeCells, type RobotFrame } from "@/lib/build/engine";
import type { PublicBuildLevel } from "@/lib/build/public";
import {
  cellKey,
  type Block,
  type BuildSubmission,
  type Cell,
  type MapLevel,
  type MapTile,
  type RobotCommand,
  type RobotLevel,
  type RobotStep,
  type ShapeColour,
  type ShapesLevel,
  type TowerLevel,
} from "@/lib/build/types";
import { BuildIcon, CompassArt, FlagArt, GemArt, MapTileArt, RockArt, RobotArt } from "./art";

/**
 * The four workshops. Each one owns its construction and hands it to `submit`, which
 * goes to the server; none of them decides on its own whether a build is right.
 *
 * The robot and the tower still run the shared simulation in the browser, but only to
 * *show* what happens — the robot driving, the blocks tipping — and the verdict that
 * comes back is the server's.
 */

export type BuildResult = { correct: boolean; message: string; success?: string; falls?: number[]; firstTime?: boolean };
export type Submit = (build: BuildSubmission) => Promise<BuildResult | null>;

type Props<L> = { level: PublicBuildLevel & L; busy: boolean; solved: boolean; submit: Submit; onMessage: (text: string) => void };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ grid -- */

function Grid({ cols, rows, labels, className = "", children }: { cols: number; rows: number; labels?: boolean; className?: string; children: ReactNode }) {
  const grid = (
    <div className={`build-grid ${className}`} style={vars({ "--cols": cols, "--rows": rows })}>
      {children}
    </div>
  );
  if (!labels) return grid;
  return (
    <div className="build-grid-labelled" style={vars({ "--cols": cols, "--rows": rows })}>
      <span />
      <div className="build-grid-letters">
        {Array.from({ length: cols }, (_, c) => <span key={c}>{String.fromCharCode(65 + c)}</span>)}
      </div>
      <div className="build-grid-numbers">
        {Array.from({ length: rows }, (_, r) => <span key={r}>{r + 1}</span>)}
      </div>
      {grid}
    </div>
  );
}

/** Where a thing sits on the grid, passed as data; `app/kid.css` does the placing. */
const vars = (values: Record<string, string | number>) => values as CSSProperties;
const at = ([c, r]: Cell, span = 1) => vars({ "--c": c + 1, "--r": r + 1, "--span": span });

/* ================================================================= ROBOT == */

const commandLabel: Record<RobotCommand, string> = {
  up: "Up", down: "Down", left: "Left", right: "Right", forward: "Forward", "turn-left": "Turn left", "turn-right": "Turn right",
};
function CommandIcon({ cmd }: { cmd: RobotCommand }) {
  return <BuildIcon name={cmd === "forward" ? "up" : cmd} size={26} />;
}

export function RobotGarage({ level, busy, solved, submit, onMessage }: Props<RobotLevel>) {
  const [program, setProgram] = useState<RobotStep[]>(level.starter ? level.starter.map((s) => ({ ...s })) : []);
  const [frame, setFrame] = useState<RobotFrame>({ at: level.start, heading: level.heading, step: -1, gems: [] });
  const [running, setRunning] = useState(false);
  const [broken, setBroken] = useState<number | null>(null);
  const cancelled = useRef(false);
  useEffect(() => {
    cancelled.current = false;
    return () => { cancelled.current = true; };
  }, []);
  const commands = robotCommands(level);
  const full = program.length >= level.maxSteps;
  const locked = busy || running || solved;

  function edit(next: RobotStep[]) {
    setProgram(next);
    setBroken(null);
    setFrame({ at: level.start, heading: level.heading, step: -1, gems: [] });
  }

  async function run() {
    if (!program.length) { onMessage("Add some cards first. Each card is one step."); return; }
    setRunning(true);
    setBroken(null);
    // Drive first, judge after: the child should watch what the program does before being
    // told whether it worked.
    const trip = runRobot(level, program);
    if (reducedMotion()) setFrame(trip.frames.at(-1)!);
    else for (const next of trip.frames) {
      if (cancelled.current) return;
      setFrame(next);
      await wait(420);
    }
    const result = await submit({ workshop: "robot", program });
    if (cancelled.current) return;
    setRunning(false);
    if (result && !result.correct && trip.failedStep !== null) setBroken(trip.failedStep);
  }

  return (
    <div className="build-bench" data-workshop="robot">
      <Grid cols={level.cols} rows={level.rows} className="robot-floor">
        {Array.from({ length: level.cols * level.rows }, (_, i) => <span key={i} className="build-cell" style={at([i % level.cols, Math.floor(i / level.cols)])} />)}
        {level.rocks.map((rock) => <span key={cellKey(rock)} className="build-piece" style={at(rock)}><RockArt /></span>)}
        {level.gems.filter((gem) => !frame.gems.includes(cellKey(gem))).map((gem) => <span key={cellKey(gem)} className="build-piece" style={at(gem)}><GemArt /></span>)}
        <span className="build-piece" style={at(level.flag)}><FlagArt /></span>
        <span className="build-piece robot-token" style={at(frame.at)} aria-label={`Robot at column ${frame.at[0] + 1}, row ${frame.at[1] + 1}`}><RobotArt heading={frame.heading} /></span>
      </Grid>

      <div className="robot-program" aria-label="Your program">
        <ol>
          {program.map((card, index) => (
            <li key={index} className="robot-card" data-active={frame.step === index || undefined} data-broken={broken === index || undefined}>
              <span className="robot-card-number">{index + 1}</span>
              <CommandIcon cmd={card.cmd} />
              <span className="robot-card-name">{commandLabel[card.cmd]}</span>
              {level.loops && (
                <button type="button" className="robot-card-times" disabled={locked} aria-label={`Repeat ${card.times} times. Tap to change.`}
                  onClick={() => edit(program.map((c, i) => (i === index ? { ...c, times: (c.times % 5) + 1 } : c)))}>
                  ×{card.times}
                </button>
              )}
              <button type="button" className="robot-card-remove" disabled={locked} aria-label={`Take away card ${index + 1}`} onClick={() => edit(program.filter((_, i) => i !== index))}>
                <BuildIcon name="remove" size={16} />
              </button>
            </li>
          ))}
          {Array.from({ length: Math.max(0, level.maxSteps - program.length) }, (_, i) => <li key={`empty-${i}`} className="robot-card robot-card-empty" aria-hidden="true" />)}
        </ol>
      </div>

      <div className="build-tools" role="group" aria-label="Cards to add">
        {commands.map((cmd) => (
          <button key={cmd} type="button" className="build-tool robot-command" disabled={locked || full} onClick={() => edit([...program, { cmd, times: 1 }])}>
            <CommandIcon cmd={cmd} /><span>{commandLabel[cmd]}</span>
          </button>
        ))}
      </div>
      {full && !solved && <p className="build-note">That is all the cards you can use.{level.loops ? " Tap ×1 on a card to repeat it." : ""}</p>}

      <div className="build-actions">
        <button type="button" className="build-secondary" disabled={locked || !program.length} onClick={() => edit(level.starter ? level.starter.map((s) => ({ ...s })) : [])}><BuildIcon name="clear" size={18} />Start again</button>
        <button type="button" className="build-primary" disabled={locked} onClick={run}><BuildIcon name="play" size={20} />{running ? "Running…" : "Run the robot"}</button>
      </div>
    </div>
  );
}

/* =================================================================== MAP == */

const tileName: Record<MapTile, string> = {
  water: "Water", land: "Land", tree: "Tree", house: "House", school: "School", mountain: "Mountain",
  road: "Road", bridge: "Bridge", treasure: "Treasure", park: "Park", shop: "Shop",
};

export function MapMaker({ level, busy, solved, submit, onMessage }: Props<MapLevel>) {
  const [tiles, setTiles] = useState<Record<string, MapTile>>({});
  const [brush, setBrush] = useState<MapTile | "erase">(level.palette[0]);
  const grid = mapGrid(level, tiles);
  const locked = busy || solved;

  function paint(c: number, r: number) {
    const key = `${c},${r}`;
    const current = grid[r][c];
    if (brush === "erase" || tiles[key] === brush) {
      if (!(key in tiles)) { onMessage(level.fixed[key] ? "That was already on the map." : "Nothing to rub out there."); return; }
      const next = { ...tiles }; delete next[key]; setTiles(next); onMessage(""); return;
    }
    // A bridge stands on water, so swapping it for something else is building on water.
    // Painting land first and then a house on it is fine; a house straight onto water is not.
    const refusal = mapPlacement(level, current === "bridge" ? "water" : current, key, brush);
    if (refusal) { onMessage(refusal); return; }
    setTiles({ ...tiles, [key]: brush });
    onMessage("");
  }

  return (
    <div className="build-bench" data-workshop="map">
      <div className="map-stage">
        <Grid cols={level.cols} rows={level.rows} labels={level.labels} className="map-sheet">
          {grid.flatMap((row, r) => row.map((tile, c) => (
            <button key={`${c},${r}`} type="button" className="build-cell map-cell" data-tile={tile} data-fixed={!!level.fixed[`${c},${r}`] && !(level.fixed[`${c},${r}`] === "water" && tile === "bridge") || undefined}
              style={at([c, r])} disabled={locked} aria-label={`${level.labels ? refFor([c, r]) : `Column ${c + 1}, row ${r + 1}`}: ${tileName[tile]}`}
              onClick={() => paint(c, r)}>
              <MapTileArt tile={tile} />
            </button>
          )))}
        </Grid>
        {level.compass && <div className="map-compass"><CompassArt /></div>}
      </div>
      <div className="build-tools" role="group" aria-label="What to put on the map">
        {level.palette.map((tile) => (
          <button key={tile} type="button" className="build-tool" aria-pressed={brush === tile} disabled={locked} onClick={() => setBrush(tile)}>
            <span className="build-tool-art" data-tile={tile}><MapTileArt tile={tile} /></span><span>{tileName[tile]}</span>
          </button>
        ))}
        <button type="button" className="build-tool" aria-pressed={brush === "erase"} disabled={locked} onClick={() => setBrush("erase")}>
          <BuildIcon name="erase" size={28} /><span>Rub out</span>
        </button>
      </div>
      <div className="build-actions">
        <button type="button" className="build-secondary" disabled={locked || !Object.keys(tiles).length} onClick={() => { setTiles({}); onMessage(""); }}><BuildIcon name="clear" size={18} />Clear</button>
        <button type="button" className="build-primary" disabled={locked} onClick={() => submit({ workshop: "map", tiles })}><BuildIcon name="play" size={20} />Check my map</button>
      </div>
    </div>
  );
}

/* ================================================================= TOWER == */

export function TowerLab({ level, busy, solved, submit, onMessage }: Props<TowerLevel>) {
  const [blocks, setBlocks] = useState<Block[]>(level.fixed);
  const [width, setWidth] = useState(level.widths[0] ?? 1);
  const [prediction, setPrediction] = useState<"stand" | "fall" | null>(null);
  const [falls, setFalls] = useState<number[]>([]);
  const [tested, setTested] = useState(false);
  const predictOnly = level.rule.kind === "predict";
  const added = blocks.length - level.fixed.length;
  const locked = busy || solved || tested;

  function drop(col: number) {
    if (predictOnly) return;
    if (added >= level.maxBlocks) { onMessage(`You have used all ${level.maxBlocks} blocks. Undo one to move it.`); return; }
    const x = Math.max(0, Math.min(col - Math.floor((width - 1) / 2), level.cols - width));
    const y = dropHeight(blocks, x, width);
    if (y >= level.rows) { onMessage("That would reach the sky! Build somewhere else."); return; }
    const overWater = Array.from({ length: width }, (_, k) => x + k).every((c) => level.gaps.includes(c));
    if (y === 0 && overWater) { onMessage("Splash! Nothing is under it there. Blocks need land or another block to rest on."); return; }
    setBlocks([...blocks, { x, y, w: width }]);
    setPrediction(null);
    onMessage("");
  }

  async function test() {
    if (!prediction) { onMessage("First, say what you think: will it stand or fall?"); return; }
    const result = await submit({ workshop: "tower", blocks, prediction });
    if (!result) return;
    setTested(true);
    setFalls(result.falls ?? []);
    if (!predictOnly && result.correct === false && prediction) {
      const stood = (result.falls ?? []).length === 0;
      onMessage(`${stood === (prediction === "stand") ? "Your prediction was right. " : "Surprise! "}${result.message}`);
    }
  }

  function tryAgain() {
    setTested(false);
    setFalls([]);
    setPrediction(null);
    onMessage("");
  }

  const top = level.rows;
  return (
    <div className="build-bench" data-workshop="tower">
      <div className="tower-yard" style={vars({ "--cols": level.cols, "--rows": level.rows })}>
        <Grid cols={level.cols} rows={level.rows} className="tower-air">
          {!predictOnly && Array.from({ length: level.cols }, (_, c) => (
            <button key={c} type="button" className="tower-drop" style={vars({ "--c": c + 1 })} disabled={locked}
              aria-label={`Drop a ${width}-long block at column ${c + 1}`} onClick={() => drop(c)} />
          ))}
          {blocks.map((b, i) => (
            <span key={i} className="tower-block" data-w={b.w} data-fixed={i < level.fixed.length || undefined} data-falls={falls.includes(i) || undefined}
              style={at([b.x, top - b.y - 1], b.w)} aria-hidden="true" />
          ))}
        </Grid>
        <div className="tower-ground" style={vars({ "--cols": level.cols })} aria-hidden="true">
          {Array.from({ length: level.cols }, (_, c) => <span key={c} data-water={level.gaps.includes(c) || undefined} />)}
        </div>
      </div>
      <p className="kid-sr-only" aria-live="polite">{`${blocks.length} blocks. The tallest point is ${blocks.length ? Math.max(...blocks.map((b) => b.y + 1)) : 0} blocks high.`}</p>

      {!predictOnly && (
        <div className="build-tools" role="group" aria-label="Block size">
          {level.widths.map((w) => (
            <button key={w} type="button" className="build-tool" aria-pressed={width === w} disabled={locked} onClick={() => setWidth(w)}>
              <span className="tower-block-sample" data-w={w} style={vars({ "--w": w })} aria-hidden="true" /><span>{w === 1 ? "Small" : w === 2 ? "Medium" : "Long"}</span>
            </button>
          ))}
          <span className="build-count">{level.maxBlocks - added} left</span>
        </div>
      )}

      {!tested && (
        <div className="tower-predict" role="group" aria-label="Will it stand or fall?">
          <span>{predictOnly || blocks.length > level.fixed.length ? "Will it stand or fall?" : "Tap above the ground to drop blocks."}</span>
          {(predictOnly || blocks.length > level.fixed.length) && (
            <>
              <button type="button" className="build-tool" aria-pressed={prediction === "stand"} disabled={busy || solved} onClick={() => setPrediction("stand")}>It will stand</button>
              <button type="button" className="build-tool" aria-pressed={prediction === "fall"} disabled={busy || solved} onClick={() => setPrediction("fall")}>It will fall</button>
            </>
          )}
        </div>
      )}

      <div className="build-actions">
        {!predictOnly && !tested && (
          <>
            <button type="button" className="build-secondary" disabled={locked || !added} onClick={() => { setBlocks(blocks.slice(0, -1)); setPrediction(null); }}><BuildIcon name="undo" size={18} />Undo</button>
            <button type="button" className="build-secondary" disabled={locked || !added} onClick={() => { setBlocks(level.fixed); setPrediction(null); }}><BuildIcon name="clear" size={18} />Clear</button>
          </>
        )}
        {tested && !solved && !predictOnly
          ? <button type="button" className="build-primary" onClick={tryAgain}><BuildIcon name="again" size={20} />Fix it and test again</button>
          : !tested && <button type="button" className="build-primary" disabled={busy || solved || (!predictOnly && !added)} onClick={test}><BuildIcon name="play" size={20} />Test it</button>}
      </div>
    </div>
  );
}

/* ================================================================ SHAPES == */

const colourName: Record<ShapeColour, string> = { red: "Red", blue: "Blue", yellow: "Yellow", green: "Green" };

export function ShapeWorkshop({ level, busy, solved, submit, onMessage }: Props<ShapesLevel>) {
  const [cells, setCells] = useState<Record<string, ShapeColour>>({});
  const [brush, setBrush] = useState<ShapeColour | "erase">(level.colours[0]);
  const filled = shapeCells(level, cells);
  const outline = useMemo(() => (level.outline ? new Set(level.outline.map(cellKey)) : null), [level.outline]);
  const axis = level.rule.kind === "mirror" ? level.rule.axis : null;
  const locked = busy || solved;
  const count = Object.keys(cells).length;

  function paint(key: string) {
    if (level.fixed[key]) { onMessage("That square is part of the puzzle."); return; }
    if (outline && !outline.has(key)) { onMessage(axis !== null ? "Colour on the other side of the fold line." : "Colour inside the outlined shape."); return; }
    const next = { ...cells };
    if (brush === "erase" || next[key] === brush) delete next[key];
    else next[key] = brush;
    setCells(next);
    onMessage("");
  }

  return (
    <div className="build-bench" data-workshop="shapes">
      <Grid cols={level.cols} rows={level.rows} className="shape-sheet">
        {Array.from({ length: level.cols * level.rows }, (_, i) => {
          const c = i % level.cols, r = Math.floor(i / level.cols), key = `${c},${r}`;
          const colour = filled[key];
          return (
            <button key={key} type="button" className="build-cell shape-cell" data-colour={colour} data-fixed={!!level.fixed[key] || undefined}
              data-outside={outline && !outline.has(key) && !level.fixed[key] ? true : undefined} data-fold={axis !== null && c === axis - 1 || undefined}
              style={at([c, r])} disabled={locked} aria-label={`Column ${c + 1}, row ${r + 1}: ${colour ? colourName[colour] : "empty"}`} onClick={() => paint(key)} />
          );
        })}
      </Grid>
      <div className="build-tools" role="group" aria-label="Colours">
        {level.colours.map((colour) => (
          <button key={colour} type="button" className="build-tool" aria-pressed={brush === colour} disabled={locked} onClick={() => setBrush(colour)}>
            <span className="shape-swatch" data-colour={colour} aria-hidden="true" /><span>{colourName[colour]}</span>
          </button>
        ))}
        <button type="button" className="build-tool" aria-pressed={brush === "erase"} disabled={locked} onClick={() => setBrush("erase")}><BuildIcon name="erase" size={28} /><span>Rub out</span></button>
        <span className="build-count" aria-live="polite">{count} coloured</span>
      </div>
      <div className="build-actions">
        <button type="button" className="build-secondary" disabled={locked || !count} onClick={() => { setCells({}); onMessage(""); }}><BuildIcon name="clear" size={18} />Clear</button>
        <button type="button" className="build-primary" disabled={locked} onClick={() => submit({ workshop: "shapes", cells })}><BuildIcon name="play" size={20} />Check it</button>
      </div>
    </div>
  );
}
