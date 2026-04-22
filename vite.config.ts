import { resolve } from "path";
import { defineConfig } from "vite";

function normalizeUmdGlobal() {
  return {
    name: "normalize-umd-global",
    generateBundle(_: unknown, bundle: Record<string, { type: string; fileName: string; code?: string }>) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk" || !output.fileName.endsWith(".umd.cjs")) {
          continue;
        }

        output.code += `
if (typeof globalThis !== "undefined") {
  const microFuzzyGlobal = globalThis.MicroFuzzy;
  if (
    microFuzzyGlobal &&
    typeof microFuzzyGlobal.search !== "function" &&
    microFuzzyGlobal.MicroFuzzy
  ) {
    globalThis.MicroFuzzy = microFuzzyGlobal.MicroFuzzy;
  }
}
`;
      }
    },
  };
}

export default defineConfig({
  plugins: [normalizeUmdGlobal()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MicroFuzzy",
      fileName: "micro-fuzzy",
    },
  },
});
