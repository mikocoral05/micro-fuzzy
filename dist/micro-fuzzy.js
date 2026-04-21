//#region src/index.ts
var e = {
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
	m: "jkn"
};
function t(e, t) {
	let n = t.split(".").reduce((e, t) => e && e[t], e);
	return typeof n == "string" ? n : void 0;
}
var n = class {
	static search(e, n, r) {
		if (!n || n.trim() === "") return [];
		let i = n.toLowerCase();
		return e.map((e) => {
			let n = -Infinity, a = null;
			for (let o of r.keys) {
				let s = t(e, o);
				if (!s) continue;
				let { score: c, highlighted: l } = this.scoreText(s, i, r.highlight);
				c > n && (n = c, a = l);
			}
			return {
				item: e,
				score: n,
				highlighted: a
			};
		}).filter((e) => e.score > 0).sort((e, t) => t.score - e.score);
	}
	static scoreText(t, n, r = !1) {
		let i = n.toLowerCase(), a = t.toLowerCase(), o = i.length, s = a.length;
		if (o === 0) return {
			score: 0,
			highlighted: t
		};
		let c = a.match(/\b\w/g);
		if (c && c.join("").startsWith(i)) {
			let e = [], n = 0;
			for (let t = 0; t < a.length && n < o; t++) (t === 0 || /[^a-z0-9]/i.test(a[t - 1])) && a[t] === i[n] && (e.push(t), n++);
			if (n === o) return this.formatResult(t, o * 15 + 100, e, r);
		}
		let l = Array.from({ length: o + 1 }, () => Array(s + 1).fill(-Infinity)), u = Array.from({ length: o + 1 }, () => Array(s + 1).fill(0));
		for (let e = 0; e <= s; e++) l[0][e] = 0;
		for (let t = 1; t <= o; t++) for (let n = 1; n <= s; n++) {
			let r = i[t - 1], o = a[n - 1], s = -Infinity;
			r === o ? s = l[t - 1][n - 1] + 10 : e[r]?.includes(o) && (s = l[t - 1][n - 1] + 2);
			let c = l[t][n - 1] - .5;
			s >= c && s !== -Infinity ? (l[t][n] = s, u[t][n] = 1) : (l[t][n] = c, u[t][n] = 2);
		}
		let d = -Infinity, f = s;
		for (let e = 1; e <= s; e++) l[o][e] > d && (d = l[o][e], f = e);
		let p = [], m = o, h = f;
		for (; m > 0 && h > 0;) u[m][h] === 1 ? (p.unshift(h - 1), m--, h--) : h--;
		return m > 0 || d < 0 ? {
			score: 0,
			highlighted: t
		} : this.formatResult(t, d, p, r);
	}
	static formatResult(e, t, n, r) {
		if (!r || n.length === 0) return {
			score: t,
			highlighted: e
		};
		let i = "", a = 0;
		for (let t = 0; t < e.length; t++) a < n.length && n[a] === t ? (i += `<b>${e[t]}</b>`, a++) : i += e[t];
		return {
			score: t,
			highlighted: i
		};
	}
};
//#endregion
export { n as MicroFuzzy };
