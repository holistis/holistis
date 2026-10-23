// node --test scripts/render-hero.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderHero, fitNames } from "./render-hero.mjs";
import { collectEvidence } from "./update-evidence.mjs";
import { fakeFetch, FEATURED } from "./fixtures.mjs";

// Built from the fake GitHub, never from the live data file, so a schema change cannot lock the tests out.
const ev = await collectEvidence({ fetchFn: fakeFetch(), today: "2026-10-23", featured: FEATURED });

test("the hero shows exactly the counted numbers from the evidence file", () => {
  const svg = renderHero(ev);
  assert.match(svg, new RegExp(`${ev.totals.mergedPrs} PRS MERGED · ${ev.upstream.mergedPrs} IN OTHER PEOPLE'S PROJECTS · ${ev.upstream.open} OPEN NOW`));
  assert.match(svg, new RegExp(`${ev.upstream.bugFixes} BUG FIXES? IN `));
  assert.match(svg, new RegExp(`COUNTED FROM PUBLIC GITHUB DATA · ${ev.date} UTC`));
});

test("the svg is safe for GitHub: no script, no external resource, no event handlers", () => {
  const svg = renderHero(ev);
  for (const bad of [/<script/i, /foreignObject/i, /\son[a-z]+\s*=/i, /xlink:href/i, /\shref\s*=/i, /@import/i, /url\(\s*['"]?https?:/i, /<image/i]) {
    assert.doesNotMatch(svg, bad, `forbidden pattern ${bad}`);
  }
});

test("the first frame is complete and reduced motion is honoured", () => {
  const svg = renderHero(ev);
  assert.match(svg, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(svg, /@keyframes reveal \{[^}]*opacity/, "the reveal may move text, never fade it, so a still frame is fully legible");
  assert.match(svg, /<title id="title">/);
  assert.match(svg, /<desc id="desc">/);
});

test("text from the evidence file is XML-escaped", () => {
  const svg = renderHero({ ...ev, upstream: { ...ev.upstream, bugFixProjects: ["a&b", "<x>"] } });
  assert.match(svg, /A&amp;B · &lt;X&gt;/);
});

test("impossible evidence is refused instead of drawn", () => {
  assert.throws(() => renderHero({ ...ev, upstream: { ...ev.upstream, bugFixes: 999999 } }), /cannot exceed/);
  assert.throws(() => renderHero({ ...ev, upstream: { ...ev.upstream, mergedPrs: -1 } }), /non-negative/);
  assert.throws(() => renderHero({ ...ev, totals: { mergedPrs: 0 } }), /at least upstream/);
  assert.throws(() => renderHero({ ...ev, date: "yesterday" }), /YYYY-MM-DD/);
});

test("many project names are cut to what fits on one line", () => {
  assert.equal(fitNames(["a", "b"]), "A · B");
  const long = fitNames(["x402", "windmill", "activepieces", "cloudfoundry", "open design", "another one", "and more"]);
  assert.ok(long.length <= 60, long);
  assert.match(long, /\+\d+$/);
});
