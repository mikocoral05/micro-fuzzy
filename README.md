# micro-fuzzy

A sub-2kb, typo-tolerant fuzzy search library for JavaScript and TypeScript.

## Features

- **Tiny**: Less than 2kb gzipped!
- **Typo-Tolerant**: Uses QWERTY keyboard adjacency to forgive common typing mistakes (e.g., scoring `qord` higher than `zord` for `word`).
- **Smart Acronyms**: Matches acronyms like `GTA` to `Grand Theft Auto`.
- **Deep Keys**: Search through deeply nested objects using dot-notation (`author.name.first`).
- **Auto-Highlighting**: Optionally wraps matching characters in `<b>` tags for easy UI integration.

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
```

## API

### `MicroFuzzy.search(data, query, options)`

- `data`: Array of objects (or strings) to search through.
- `query`: The search string.
- `options.keys`: Array of string paths to search within each object (e.g. `['title', 'author.name']`).
- `options.highlight`: (Optional) Boolean. If `true`, returns a `highlighted` string with matches wrapped in `<b>` tags.

## License

MIT
