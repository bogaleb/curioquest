export type ActivityEngine =
  | { kind: "counting"; objects: string[]; max: number }
  | { kind: "sorting"; items: { id: string; label: string; emoji: string }[]; bins: { id: string; label: string; emoji: string }[]; solution?: Record<string, string> }
  | { kind: "memory"; sequence: string[]; choices: string[] }
  | { kind: "word-builder"; letters: string[]; length: number }
  | { kind: "pattern"; sequence: string[] };

export type PublicQuestion = {
  id: string; subject: "reading" | "math" | "logic"; grade: "prek" | "grade1";
  skillId: string; prompt: string; visual?: string; options: string[];
  engine?: ActivityEngine; hint: string;
};
