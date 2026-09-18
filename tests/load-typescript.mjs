import ts from "typescript";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";

// Execute pure TypeScript domain modules in memory with the app's alias.
// This keeps the tests independent of a running Worker or a real child database.
const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const modules = new Map();
export function loadTs(name) {
  const filename = resolve(root, name.endsWith(".ts") ? name : name + ".ts");
  if (modules.has(filename)) return modules.get(filename).exports;
  const loadedModule = { exports: {} };
  modules.set(filename, loadedModule);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const localRequire = (specifier) => specifier.startsWith("@/")
    ? loadTs(specifier.slice(2))
    : specifier.startsWith(".")
      ? loadTs(resolve(dirname(filename), specifier))
      : require(specifier);
  new Function("require", "module", "exports", source)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
