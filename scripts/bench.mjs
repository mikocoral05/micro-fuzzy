import { performance } from "node:perf_hooks";
import { MicroFuzzy } from "micro-fuzzy";

const DEFAULT_WARMUP_RUNS = Number.parseInt(
  process.env.MICRO_FUZZY_BENCH_WARMUP ?? "3",
  10,
);
const DEFAULT_SAMPLE_RUNS = Number.parseInt(
  process.env.MICRO_FUZZY_BENCH_RUNS ?? "10",
  10,
);

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min)) + min;
}

function sample(rng, values) {
  return values[randomInt(rng, 0, values.length)];
}

function suffix(index) {
  return `${index}`.padStart(5, "0");
}

function buildStringDataset(size) {
  const templates = [
    "Grand Theft Auto",
    "The Witcher 3 Wild Hunt",
    "Word Processor",
    "Hidden Treasure",
    "Galaxy Travel Assistant",
    "Winter Garden Atlas",
    "Micro Search Toolkit",
    "Golden Ticket Archive",
  ];

  return Array.from({ length: size }, (_, index) => {
    const base = templates[index % templates.length];
    return `${base} ${suffix(index)}`;
  });
}

function buildObjectDataset(size) {
  const rng = mulberry32(size * 17 + 11);
  const categories = ["game", "app", "movie", "book", "tool"];
  const titles = [
    "Grand Theft Auto",
    "The Witcher 3 Wild Hunt",
    "Word Processor",
    "Solar Transit Authority",
    "Micro Search Toolkit",
    "Garden Trail Almanac",
  ];
  const treasures = [
    "Hidden Treasure",
    "Sunken Treasure",
    "Treasure Ledger",
    "Treasure Atlas",
  ];

  return Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    title: `${sample(rng, titles)} ${suffix(index)}`,
    category: sample(rng, categories),
    nested: {
      deep: {
        key: `${sample(rng, treasures)} ${suffix(index)}`,
      },
    },
  }));
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.floor(percentileValue * (sorted.length - 1)),
  );
  return sorted[index];
}

function benchmarkScenario({
  label,
  dataset,
  query,
  options,
  warmupRuns = DEFAULT_WARMUP_RUNS,
  sampleRuns = DEFAULT_SAMPLE_RUNS,
}) {
  for (let run = 0; run < warmupRuns; run++) {
    MicroFuzzy.search(dataset, query, options);
  }

  const timings = [];
  let resultCount = 0;
  let topScore = null;

  for (let run = 0; run < sampleRuns; run++) {
    const startedAt = performance.now();
    const results = MicroFuzzy.search(dataset, query, options);
    const elapsed = performance.now() - startedAt;
    timings.push(elapsed);
    resultCount = results.length;
    topScore = results[0]?.score ?? null;
  }

  const average =
    timings.reduce((sum, value) => sum + value, 0) / timings.length;

  return {
    scenario: label,
    size: dataset.length,
    avgMs: average.toFixed(3),
    p95Ms: percentile(timings, 0.95).toFixed(3),
    minMs: Math.min(...timings).toFixed(3),
    maxMs: Math.max(...timings).toFixed(3),
    matches: resultCount,
    topScore,
  };
}

const sizes = [1_000, 5_000, 10_000];
const results = [];

for (const size of sizes) {
  const stringDataset = buildStringDataset(size);
  const objectDataset = buildObjectDataset(size);

  results.push(
    benchmarkScenario({
      label: "strings / exact",
      dataset: stringDataset,
      query: "witcher",
    }),
  );
  results.push(
    benchmarkScenario({
      label: "objects / acronym",
      dataset: objectDataset,
      query: "gta",
      options: { keys: ["title"] },
    }),
  );
  results.push(
    benchmarkScenario({
      label: "objects / typo",
      dataset: objectDataset,
      query: "qord",
      options: { keys: ["title"] },
    }),
  );
  results.push(
    benchmarkScenario({
      label: "objects / deep key",
      dataset: objectDataset,
      query: "treasure",
      options: { keys: ["nested.deep.key"] },
    }),
  );
}

console.log(
  `Benchmark results on ${process.version} (warmup: ${DEFAULT_WARMUP_RUNS}, samples: ${DEFAULT_SAMPLE_RUNS})`,
);
console.table(results);
