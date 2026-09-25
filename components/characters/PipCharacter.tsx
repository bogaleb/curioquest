"use client";

import type { CastState } from "@/lib/experience/types";

/**
 * Pip, the small helper robot who already appears throughout CurioQuest's writing but
 * had no face. Built the same way as Nova — a CSS puppet, no video, no sprite sheet —
 * so a production rig can replace this renderer without changing the state contract.
 *
 * Pip is deliberately the junior of the pair: he asks the questions a child might be
 * too shy to ask, and gets things wrong sometimes so that getting things wrong looks
 * survivable.
 */
export function PipCharacter({
  state = "idle",
  size = "normal",
  talking = false,
}: {
  state?: CastState;
  size?: "small" | "normal" | "large";
  talking?: boolean;
}) {
  return (
    <div
      className={`pip-character pip-${size}`}
      data-state={state}
      data-talking={talking || undefined}
      role="img"
      aria-label={`Pip the robot, ${state}`}
    >
      <div className="pip-shadow" />
      <div className="pip-antenna">
        <span className="pip-antenna-bulb" />
      </div>
      <div className="pip-head">
        <div className="pip-screen">
          <span className="pip-eye left" />
          <span className="pip-eye right" />
          <span className="pip-mouth" />
        </div>
      </div>
      <div className="pip-body">
        <span className="pip-light" />
        <span className="pip-arm left" />
        <span className="pip-arm right" />
      </div>
      <div className="pip-tread" />
      {state === "celebrate" && (
        <span className="pip-spark" aria-hidden="true">
          ✧
        </span>
      )}
    </div>
  );
}
