import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const cwd = process.cwd();
const require = createRequire(import.meta.url);
const distEsmPath = path.resolve(cwd, "dist/micro-fuzzy.js");
const distUmdPath = path.resolve(cwd, "dist/micro-fuzzy.umd.cjs");

const scenarios = [];

const packageEsm = await import("micro-fuzzy");
assert(
  typeof packageEsm.MicroFuzzy?.search === "function",
  "Package ESM import did not expose MicroFuzzy.search",
);
scenarios.push({
  scenario: "Node package ESM",
  entry: 'import { MicroFuzzy } from "micro-fuzzy"',
  status: "pass",
});

const packageCjs = require("micro-fuzzy");
assert(
  typeof packageCjs.MicroFuzzy?.search === "function",
  "Package CommonJS require did not expose MicroFuzzy.search",
);
scenarios.push({
  scenario: "Node package CJS",
  entry: 'const { MicroFuzzy } = require("micro-fuzzy")',
  status: "pass",
});

const distEsm = await import(pathToFileURL(distEsmPath).href);
assert(
  typeof distEsm.MicroFuzzy?.search === "function",
  "Direct ESM bundle import did not expose MicroFuzzy.search",
);
scenarios.push({
  scenario: "Direct ESM bundle",
  entry: 'import { MicroFuzzy } from "./dist/micro-fuzzy.js"',
  status: "pass",
});

const umdSource = await readFile(distUmdPath, "utf8");
const context = {
  console,
};
context.globalThis = context;
context.window = context;
context.self = context;
context.global = context;
vm.runInNewContext(umdSource, context);

assert(
  typeof context.MicroFuzzy?.search === "function",
  "UMD browser global did not expose MicroFuzzy.search",
);
scenarios.push({
  scenario: "Browser UMD global",
  entry: '<script src="./dist/micro-fuzzy.umd.cjs"></script>',
  status: "pass",
  note: "Use window.MicroFuzzy.search(...)",
});

console.log(`Compatibility smoke tests passed on ${process.version}`);
console.table(scenarios);
