// QWERTY keyboard adjacency map for typographical forgiveness
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const OBJECT_KEYS_REQUIRED_ERROR =
  "MicroFuzzy.search requires `options.keys` when searching object data.";

type TextResolver = (item: Record<string, unknown>) => string | undefined;

function createTextResolvers(keys?: string[]): TextResolver[] {
  if (!keys?.length) {
    return [];
  }

  return keys.map((key) => {
    const parts = key.split(".");

    return (item: Record<string, unknown>) => {
      let value: unknown = item;

      for (const part of parts) {
        if (!isRecord(value)) {
          return undefined;
        }

        value = value[part];
      }

      return typeof value === "string" ? value : undefined;
    };
  });
}

export interface SearchOptions {
  keys?: string[];
  highlight?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  highlighted: string | null;
}

export class MicroFuzzy {
  static search(data: string[], query: string, options?: SearchOptions): SearchResult<string>[];
  static search<T>(data: T[], query: string, options: SearchOptions): SearchResult<T>[];
  static search<T>(data: T[], query: string, options: SearchOptions = {}): SearchResult<T>[] {
    if (!query || query.trim() === "") {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const shouldHighlight = options.highlight === true;
    const textResolvers = createTextResolvers(options.keys);

    const results = data.map((item) => {
      let bestScore = -Infinity;
      let bestHighlight: string | null = null;

      if (typeof item === "string") {
        const { score, highlighted } = this.scoreText(
          item,
          lowerQuery,
          shouldHighlight,
        );
        return { item, score, highlighted };
      }

      if (isRecord(item)) {
        if (textResolvers.length === 0) {
          throw new Error(OBJECT_KEYS_REQUIRED_ERROR);
        }

        for (const resolveText of textResolvers) {
          const text = resolveText(item);
          if (!text) {
            continue;
          }

          const { score, highlighted } = this.scoreText(
            text,
            lowerQuery,
            shouldHighlight,
          );
          if (score > bestScore) {
            bestScore = score;
            bestHighlight = highlighted;
          }
        }
      }

      return { item, score: bestScore, highlighted: bestHighlight };
    });

    // Filter out non-matches and sort by highest score
    return results.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  }

  private static scoreText(text: string, lowerQuery: string, highlight = false) {
    const q = lowerQuery;
    const t = text.toLowerCase();
    const qLen = q.length;
    const tLen = t.length;

    if (qLen === 0) return { score: 0, highlighted: null };

    // Phase 3: Smart Acronym Matching (e.g., "GTA" -> "Grand Theft Auto")
    const acronymMatch = t.match(/\b\w/g);
    if (acronymMatch) {
      const acronym = acronymMatch.join("");
      if (acronym.startsWith(q)) {
        let matchIndices: number[] = [];
        let qIdx = 0;
        for (let i = 0; i < t.length && qIdx < qLen; i++) {
          if ((i === 0 || /[^a-z0-9]/i.test(t[i - 1])) && t[i] === q[qIdx]) {
            matchIndices.push(i);
            qIdx++;
          }
        }
        if (qIdx === qLen) {
          return this.formatResult(
            text,
            qLen * 15 + 100,
            matchIndices,
            highlight,
          );
        }
      }
    }

    // Phase 3: Fuzzy Matching & Scoring with Dynamic Programming
    const dp = Array.from({ length: qLen + 1 }, () =>
      Array(tLen + 1).fill(-Infinity),
    );
    const track = Array.from({ length: qLen + 1 }, () =>
      Array(tLen + 1).fill(0),
    );

    for (let j = 0; j <= tLen; j++) dp[0][j] = 0;

    for (let i = 1; i <= qLen; i++) {
      for (let j = 1; j <= tLen; j++) {
        const qc = q[i - 1];
        const tc = t[j - 1];

        let matchScore = -Infinity;

        if (qc === tc) {
          matchScore = dp[i - 1][j - 1] + 10;
        } else if (ADJACENCY_MAP[qc]?.includes(tc)) {
          // Phase 3: Keyboard Layout Forgiveness
          matchScore = dp[i - 1][j - 1] + 2;
        }

        const skipTarget = dp[i][j - 1] - 0.5; // Gap penalty

        if (matchScore >= skipTarget && matchScore !== -Infinity) {
          dp[i][j] = matchScore;
          track[i][j] = 1;
        } else {
          dp[i][j] = skipTarget;
          track[i][j] = 2;
        }
      }
    }

    let maxScore = -Infinity;
    let bestJ = tLen;
    for (let j = 1; j <= tLen; j++) {
      if (dp[qLen][j] > maxScore) {
        maxScore = dp[qLen][j];
        bestJ = j;
      }
    }

    const matches: number[] = [];
    let currI = qLen;
    let currJ = bestJ;

    while (currI > 0 && currJ > 0) {
      if (track[currI][currJ] === 1) {
        matches.unshift(currJ - 1);
        currI--;
        currJ--;
      } else {
        currJ--;
      }
    }

    if (currI > 0 || maxScore < 0) {
      return { score: 0, highlighted: null };
    }

    return this.formatResult(text, maxScore, matches, highlight);
  }

  private static escapeHtml(text: string) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  private static formatResult(
    text: string,
    score: number,
    matches: number[],
    highlight: boolean,
  ) {
    if (!highlight) {
      return { score, highlighted: null };
    }

    let result = "";
    let matchIdx = 0;
    for (let i = 0; i < text.length; i++) {
      const escapedChar = this.escapeHtml(text[i]);
      if (matchIdx < matches.length && matches[matchIdx] === i) {
        result += `<b>${escapedChar}</b>`;
        matchIdx++;
      } else {
        result += escapedChar;
      }
    }
    return { score, highlighted: result };
  }
}
