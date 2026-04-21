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

// Phase 2: Deep Dot-Notation Resolver
function getNestedValue(obj: any, path: string): string | undefined {
  const value = path.split(".").reduce((acc, part) => acc && acc[part], obj);
  return typeof value === "string" ? value : undefined;
}

export interface SearchOptions {
  keys: string[];
  highlight?: boolean;
}

export class MicroFuzzy {
  static search<T>(data: T[], query: string, options: SearchOptions) {
    if (!query || query.trim() === "") {
      return [];
    }

    const lowerQuery = query.toLowerCase();

    const results = data.map((item) => {
      let bestScore = -Infinity;
      let bestHighlight: string | null = null;

      for (const key of options.keys) {
        const text = getNestedValue(item, key);
        if (!text) continue;

        const { score, highlighted } = this.scoreText(
          text,
          lowerQuery,
          options.highlight,
        );
        if (score > bestScore) {
          bestScore = score;
          bestHighlight = highlighted;
        }
      }

      return { item, score: bestScore, highlighted: bestHighlight };
    });

    // Filter out non-matches and sort by highest score
    return results.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  }

  private static scoreText(text: string, query: string, highlight = false) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    const qLen = q.length;
    const tLen = t.length;

    if (qLen === 0) return { score: 0, highlighted: text };

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
      return { score: 0, highlighted: text };
    }

    return this.formatResult(text, maxScore, matches, highlight);
  }

  private static formatResult(
    text: string,
    score: number,
    matches: number[],
    highlight: boolean,
  ) {
    if (!highlight || matches.length === 0) return { score, highlighted: text };
    let result = "";
    let matchIdx = 0;
    for (let i = 0; i < text.length; i++) {
      if (matchIdx < matches.length && matches[matchIdx] === i) {
        result += `<b>${text[i]}</b>`;
        matchIdx++;
      } else {
        result += text[i];
      }
    }
    return { score, highlighted: result };
  }
}
