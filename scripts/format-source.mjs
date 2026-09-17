import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
// Mechanical formatting only; no AST transformations.
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
for(const path of process.argv.slice(2)) {
  const file=ts.createSourceFile(path,readFileSync(path,"utf8"),ts.ScriptTarget.Latest,true,path.endsWith("tsx")?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  writeFileSync(path,printer.printFile(file));
}
