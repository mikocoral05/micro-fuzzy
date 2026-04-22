import { describe, expect, it } from "vitest";
import { MicroFuzzy } from "../src/index.ts";

const ADJACENCY_MAP: Record<string, string> = {
  q: "wa",
  w: "qeasd",
  e: "wrsdf",
  r: "etdfg",
  t: "ryfgh",
  y: "tughj",
  u: "yihjk",
  i: "uojkl",
  o: "ipl",
  p: "o[;",
  a: "qwsz",
  s: "awedxz",
  d: "erfcxs",
  f: "rtgvcd",
  g: "tyhbvf",
  h: "yujnbg",
  j: "uikmnh",
  k: "iolmj",
  l: "opk",
  z: "asx",
  x: "sdzc",
  c: "dfxv",
  v: "fgcb",
  b: "ghvn",
  n: "hjbm",
  m: "jkn",
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min)) + min;
}

function randomWord(rng: () => number, length: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let word = "";
  for (let index = 0; index < length; index++) {
    word += alphabet[randomInt(rng, 0, alphabet.length)];
  }
  return word;
}

function uniqueWord(rng: () => number, used: Set<string>, length: number) {
  let word = randomWord(rng, length);
  while (used.has(word)) {
    word = randomWord(rng, length);
  }
  used.add(word);
  return word;
}

function mutateWithAdjacentLetter(word: string, rng: () => number) {
  for (let index = 0; index < word.length; index++) {
    const adjacent = ADJACENCY_MAP[word[index]];
    if (!adjacent) continue;
    const replacement = adjacent[randomInt(rng, 0, adjacent.length)];
    if (replacement !== word[index]) {
      return `${word.slice(0, index)}${replacement}${word.slice(index + 1)}`;
    }
  }
  return word;
}

function mutateWithDistantLetter(word: string, rng: () => number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  for (let index = 0; index < word.length; index++) {
    const original = word[index];
    const adjacent = ADJACENCY_MAP[original] ?? "";
    const candidates = alphabet
      .split("")
      .filter((letter) => letter !== original && !adjacent.includes(letter));
    const replacement = candidates[randomInt(rng, 0, candidates.length)];
    if (replacement) {
      return `${word.slice(0, index)}${replacement}${word.slice(index + 1)}`;
    }
  }
  return word;
}

function stripBoldTags(text: string) {
  return text.replace(/<\/?b>/g, "");
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function randomPhrase(rng: () => number, used: Set<string>) {
  const wordCount = 3;
  const words = [];

  for (let index = 0; index < wordCount; index++) {
    words.push(uniqueWord(rng, used, randomInt(rng, 4, 8)));
  }

  return words.map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join(" ");
}

describe("MicroFuzzy fuzz coverage", () => {
  it("keeps exact matches ahead of typo variants across generated words", () => {
    const rng = mulberry32(42);

    for (let caseIndex = 0; caseIndex < 75; caseIndex++) {
      const word = randomWord(rng, randomInt(rng, 5, 10));
      const adjacentTypo = mutateWithAdjacentLetter(word, rng);
      const distantTypo = mutateWithDistantLetter(word, rng);
      const results = MicroFuzzy.search(
        [distantTypo, adjacentTypo, word],
        word,
      );

      expect(results[0].item).toBe(word);

      const adjacentScore =
        results.find((result) => result.item === adjacentTypo)?.score ?? -Infinity;
      const distantScore =
        results.find((result) => result.item === distantTypo)?.score ?? -Infinity;

      expect(adjacentScore).toBeGreaterThanOrEqual(distantScore);
    }
  });

  it("returns deterministic, descending results for generated object corpora", () => {
    const rng = mulberry32(314159);
    const used = new Set<string>();

    for (let caseIndex = 0; caseIndex < 30; caseIndex++) {
      const dataset = Array.from({ length: 25 }, () => ({
        title: uniqueWord(rng, used, randomInt(rng, 5, 10)),
      }));
      const target = dataset[randomInt(rng, 0, dataset.length)].title;

      const firstRun = MicroFuzzy.search(dataset, target, {
        keys: ["title"],
        highlight: true,
      });
      const secondRun = MicroFuzzy.search(dataset, target, {
        keys: ["title"],
        highlight: true,
      });

      expect(firstRun).toEqual(secondRun);
      expect(firstRun[0].item.title).toBe(target);

      for (let index = 1; index < firstRun.length; index++) {
        expect(firstRun[index - 1].score).toBeGreaterThanOrEqual(
          firstRun[index].score,
        );
      }
    }
  });

  it("preserves escaped source text when generating highlights", () => {
    const rng = mulberry32(20260422);

    for (let caseIndex = 0; caseIndex < 50; caseIndex++) {
      const word = randomWord(rng, randomInt(rng, 5, 9));
      const text = `<${word}&"${word}' >`;
      const query = word.slice(0, 3);
      const [result] = MicroFuzzy.search([text], query, { highlight: true });

      expect(result).toBeDefined();
      expect(result.highlighted).not.toBeNull();
      expect(stripBoldTags(result.highlighted ?? "")).toBe(escapeHtml(text));
    }
  });

  it("keeps acronym queries on top for generated multi-word phrases", () => {
    const rng = mulberry32(8675309);

    for (let caseIndex = 0; caseIndex < 40; caseIndex++) {
      const used = new Set<string>();
      const target = randomPhrase(rng, used);
      const distractors = Array.from({ length: 8 }, () => randomPhrase(rng, used));
      const query = target
        .split(" ")
        .map((word) => word[0].toLowerCase())
        .join("");
      const results = MicroFuzzy.search([target, ...distractors], query);

      expect(results[0].item).toBe(target);
    }
  });
});
