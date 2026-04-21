import { getNestedValue, KEYBOARD_ADJACENCY } from './src/utils.js';

function scoreString(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const qLen = q.length;
  const tLen = t.length;
  
  if (qLen === 0) return { score: 0, matches: [] };
  
  // 1. Acronym match check
  const acronymMatch = t.match(/\b\w/g);
  if (acronymMatch) {
    const acronym = acronymMatch.join('');
    if (acronym.startsWith(q)) {
      let matchIndices = [];
      let qIdx = 0;
      for (let i = 0; i < t.length && qIdx < q.length; i++) {
        if ((i === 0 || /[^a-z0-9]/i.test(t[i - 1])) && t[i].toLowerCase() === q[qIdx]) {
          matchIndices.push(i);
          qIdx++;
        }
      }
      if (qIdx === q.length) {
        return { score: q.length * 15, matches: matchIndices };
      }
    }
  }

  // 2. DP Fuzzy Match
  const dp = Array.from({ length: qLen + 1 }, () => Array(tLen + 1).fill(-Infinity));
  const track = Array.from({ length: qLen + 1 }, () => Array(tLen + 1).fill(0));
  
  for (let j = 0; j <= tLen; j++) dp[0][j] = 0;

  for (let i = 1; i <= qLen; i++) {
    for (let j = 1; j <= tLen; j++) {
      const qc = q[i - 1];
      const tc = t[j - 1];
      
      let matchScore = -Infinity;
      
      if (qc === tc) {
        matchScore = dp[i - 1][j - 1] + 10;
      } else if (KEYBOARD_ADJACENCY[qc]?.includes(tc)) {
        matchScore = dp[i - 1][j - 1] + 4;
      } else {
        matchScore = dp[i - 1][j - 1] - 2; // Substitution
      }
      
      const skipTarget = dp[i][j - 1] - 0.5;
      
      if (matchScore >= skipTarget) {
        dp[i][j] = matchScore;
        track[i][j] = 1; // 1 means match
      } else {
        dp[i][j] = skipTarget;
        track[i][j] = 2; // 2 means skip target
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

  const matches = [];
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

  return { score: maxScore, matches };
}

console.log("Smartphone vs smrtfon:", scoreString("smrtfon", "Smartphone"));
console.log("Grand Theft Auto vs GTA:", scoreString("GTA", "Grand Theft Auto"));
console.log("word vs qord:", scoreString("qord", "word"));
console.log("word vs zord:", scoreString("zord", "word"));
console.log("hello vs xhellox:", scoreString("hello", "xhellox"));
