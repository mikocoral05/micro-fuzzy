# micro-fuzzy

A sub-2kb, typo-tolerant fuzzy search library for JavaScript and TypeScript.

## Features

- **Tiny**: Less than 2kb gzipped!
- **Typo-Tolerant**: Uses QWERTY keyboard adjacency to forgive common typing mistakes (e.g., scoring `qord` higher than `zord` for `word`).
- **Smart Acronyms**: Matches acronyms like `GTA` to `Grand Theft Auto`.
- **Deep Keys**: Search through deeply nested objects using dot-notation (`author.name.first`).
- **Auto-Highlighting**: Optionally wraps matching characters in `<b>` tags for easy UI integration.
- **Typed**: Ships TypeScript declarations for the public API.

## Installation

```bash
npm install micro-fuzzy
```

## Usage

```typescript
import { MicroFuzzy } from "micro-fuzzy";

const dataset = [
  { title: "Grand Theft Auto", category: "game" },
  { title: "The Witcher 3: Wild Hunt", category: "game" },
  { title: "Word Processor", category: "app" },
  { nested: { deep: { key: "Hidden Treasure" } } },
];

// Basic search & Acronyms
const results = MicroFuzzy.search(dataset, "gta", {
  keys: ["title"],
});
// Returns: [{ item: { title: 'Grand Theft Auto', ... }, score: 145, highlighted: null }]

// Search with typo forgiveness and HTML highlighting
const typoResults = MicroFuzzy.search(dataset, "witch", {
  keys: ["title"],
  highlight: true,
});
// Returns: [{ item: { ... }, score: 50, highlighted: "The <b>W</b><b>i</b><b>t</b><b>c</b><b>h</b>er 3: Wild Hunt" }]

// Deep dot-notation search
const deepResults = MicroFuzzy.search(dataset, "treasure", {
  keys: ["nested.deep.key"],
});

// String arrays work without keys
const stringResults = MicroFuzzy.search(
  ["Grand Theft Auto", "The Witcher 3: Wild Hunt", "Word Processor"],
  "witch",
);
```

## API

### `MicroFuzzy.search(data, query, options)`

- `data`: Array of objects (or strings) to search through.
- `query`: The search string.
- `options.keys`: Array of string paths to search within each object (e.g. `['title', 'author.name']`). Required for object datasets, not needed for string arrays.
- `options.highlight`: (Optional) Boolean. If `true`, returns a `highlighted` string with matches wrapped in `<b>` tags. Source text is HTML-escaped before tags are added.

## Quality Checks

```bash
npm test
npm run compat
npm run bench
```

- `npm test`: unit and fuzz-style regression coverage.
- `npm run compat`: builds the library and verifies Node ESM, Node CommonJS, direct ESM bundle loading, and browser-style UMD globals.
- `npm run bench`: builds the library and runs deterministic benchmarks against 1k, 5k, and 10k item datasets. The benchmark defaults to 3 warmup runs and 10 measured runs per scenario.

## Compatibility Matrix

| Scenario | Entry point | Status |
| --- | --- | --- |
| Node.js ESM | `import { MicroFuzzy } from "micro-fuzzy"` | Verified by `npm run compat` |
| Node.js CommonJS | `const { MicroFuzzy } = require("micro-fuzzy")` | Verified by `npm run compat` |
| Direct ESM bundle | `import { MicroFuzzy } from "./dist/micro-fuzzy.js"` | Verified by `npm run compat` |
| Browser UMD global | `<script src="./dist/micro-fuzzy.umd.cjs"></script>` | Verified by `npm run compat` smoke test |

The UMD build exposes the browser global as `window.MicroFuzzy.search(...)`.

## License

MIT
