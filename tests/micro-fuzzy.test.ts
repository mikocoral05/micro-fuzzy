import { describe, it, expect } from "vitest";
import { MicroFuzzy } from "../src/index.ts";

describe("MicroFuzzy Core Algorithm", () => {
  const dataset = [
    { title: "Grand Theft Auto", id: 1 },
    { title: "The Witcher", id: 2 },
    { title: "Word Processor", id: 3 },
    { title: "Sword Art Online", id: 4 },
    { nested: { deep: { key: "Hidden Treasure" } }, id: 5 },
  ];

  it("should find simple matches", () => {
    const results = MicroFuzzy.search(dataset, "witch", { keys: ["title"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.title).toBe("The Witcher");
  });

  it("should handle typos with a lower score", () => {
    const exactMatch = MicroFuzzy.search(dataset, "word", { keys: ["title"] });
    const typoMatch = MicroFuzzy.search(dataset, "qord", { keys: ["title"] }); // 'q' is near 'w'

    expect(exactMatch.length).toBeGreaterThan(0);
    expect(typoMatch.length).toBeGreaterThan(0);
    // Exact matches should always score higher than typo matches
    expect(exactMatch[0].score).toBeGreaterThan(typoMatch[0].score);
  });

  it("should return a highlighted string with <b> tags", () => {
    const results = MicroFuzzy.search(dataset, "witch", {
      keys: ["title"],
      highlight: true,
    });
    expect(results[0].highlighted).toContain(
      "The <b>W</b><b>i</b><b>t</b><b>c</b><b>h</b>er",
    );
  });

  it("should find results using deep dot-notation keys", () => {
    const results = MicroFuzzy.search(dataset, "treasure", {
      keys: ["nested.deep.key"],
    });
    expect(results.length).toBe(1);
    expect(results[0].item.id).toBe(5);
  });

  it('should rank acronyms like "GTA" highly for "Grand Theft Auto"', () => {
    const results = MicroFuzzy.search(dataset, "gta", { keys: ["title"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.title).toBe("Grand Theft Auto");
    expect(results[0].score).toBeGreaterThan(80); // Should get the massive acronym boost
  });

  it('should score "qord" higher than "zord" for the word "word"', () => {
    // 'q' is adjacent to 'w' on QWERTY, 'z' is not
    const qordMatch = MicroFuzzy.search(dataset, "qord", { keys: ["title"] });
    const zordMatch = MicroFuzzy.search(dataset, "zord", { keys: ["title"] });

    // Both might find fuzzy matches in the dataset, but qord should score higher for "Word Processor"
    expect(qordMatch.length).toBeGreaterThan(0);
    expect(qordMatch[0].item.title).toBe("Word Processor");

    if (zordMatch.length > 0) {
      expect(qordMatch[0].score).toBeGreaterThan(zordMatch[0].score);
    }
  });

  it("should return an empty array when no matches are found", () => {
    const results = MicroFuzzy.search(dataset, "zxcvbnm", { keys: ["title"] });
    expect(results).toEqual([]);
  });

  it("should return an empty array when the query is empty", () => {
    const results = MicroFuzzy.search(dataset, "", { keys: ["title"] });
    expect(results).toEqual([]);
  });
});
