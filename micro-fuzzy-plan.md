# Implementation Plan: micro-fuzzy

## Objective
Build a sub-2kb, highly optimized, typo-tolerant fuzzy search library for the client-side, featuring auto-highlighting, deep dot-notation searching, smart acronym matching, and keyboard layout forgiveness.

## Background & Motivation
Developers often resort to heavy enterprise search libraries (like Fuse.js or Algolia) just to add a simple search bar for a few hundred items on the frontend. `micro-fuzzy` aims to provide a zero-setup, incredibly lightweight alternative that still delivers "premium" intelligent search features.

## Scope & Impact
The project will be built from scratch in the current empty repository.
The library will be implemented in modern JavaScript (ES6+).
It will export a single `MicroFuzzy` object with a `search` method.
The focus will be on algorithmic efficiency and small bundle size.

## Implementation Steps

### Phase 1: Project Setup
1.  Initialize a new Node.js project (`npm init -y`).
2.  Install a lightweight testing framework (e.g., `vitest` or `jest`) to ensure algorithmic correctness.
3.  Set up a minimal bundler (e.g., `esbuild` or `rollup`) to compress the final output and verify the sub-2kb goal.
4.  Create the initial directory structure (`src/`, `tests/`).

### Phase 2: Core Utilities
1.  **Deep Dot-Notation Resolver:** Implement a tiny helper function (e.g., `getNestedValue(obj, path)`) to safely extract values from deeply nested objects using string paths (e.g., `profile.address.city`).
2.  **Keyboard Adjacency Map:** Create a compact data structure mapping QWERTY keys to their immediate physical neighbors to calculate typographical distance penalties for typos.

### Phase 3: The Search Algorithm
1.  **Smart Acronym Matching:** Implement logic to detect if a query is likely an acronym. If the query characters sequentially match the first letters of words in the target string, assign a high score multiplier.
2.  **Fuzzy Matching & Scoring:** Implement the core fuzzy matching algorithm.
    *   Iterate through characters of the query and target string.
    *   Calculate a base score based on character matches.
    *   Apply penalties for gaps between matched characters.
    *   Apply the **Keyboard Layout Forgiveness** penalty: if a character mismatches, check if the typed character is adjacent to the target character on a QWERTY keyboard. If so, apply a smaller penalty than a completely random typo.
3.  **Highlight Tracking:** During the matching process, record the exact indices in the target string where characters successfully matched the query.

### Phase 4: API & Formatting
1.  **The `search` Method:** Implement `MicroFuzzy.search(data, query, options)`.
    *   Iterate over the `data` array.
    *   For each item, extract the relevant strings based on `options.keys` (using the deep dot-notation resolver).
    *   Score each string against the `query`.
    *   Aggregate scores for the item.
2.  **Auto-Highlighting UI:** If `options.highlight` is true, use the recorded match indices to inject `<b>` (or custom) tags around the matched characters in the original strings, returning them in a `highlighted_string` (or similar structure) alongside the original data.
3.  **Sorting & Returning:** Sort the final results array by their calculated scores (highest first) and return them.

## Verification & Testing
*   Write unit tests for the deep dot-notation resolver.
*   Write unit tests for the QWERTY adjacency logic.
*   Write comprehensive test cases for the `search` method covering:
    *   Exact matches.
    *   Fuzzy matches with typos.
    *   Keyboard layout typos vs. random typos (verifying scoring differences).
    *   Acronym matching (e.g., "GTA" matching "Grand Theft Auto").
    *   Deeply nested object searching.
    *   Highlighting injection correctness.
*   Build the library and verify the final minified size is under 2kb.