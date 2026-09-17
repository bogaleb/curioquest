export type ActivityEngine =
  | { kind: "counting"; objects: string[]; max: number }
  | { kind: "sorting"; items: { id: string; label: string; emoji: string }[]; bins: { id: string; label: string; emoji: string }[]; solution?: Record<string, string> }
  | { kind: "memory"; sequence: string[]; choices: string[] }
  | { kind: "word-builder"; letters: string[]; length: number }
  | { kind: "pattern"; sequence: string[] }
  | { kind: "ten-frame"; size: number; emoji: string }
  | { kind: "route"; size: number; start: number; goal: number; rocks: number[]; maxMoves: number }
  | { kind: "matching"; items: { id: string; label: string }[]; targets: { id: string; label: string }[]; solution?: Record<string, string> }
  | { kind: "ordering"; items: { id: string; label: string; emoji: string }[]; solution?: string[] };

export type PublicQuestion = {
  id: string; subject: "reading" | "math" | "logic"; grade: "prek" | "grade1";
  skillId: string; prompt: string; visual?: string; options: string[];
  engine?: ActivityEngine; hint: string;
  passage?: { title: string; text: string; emoji: string };
  audioLabel?: string;
};
