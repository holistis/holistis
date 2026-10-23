// node --test scripts/render-hero.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderHero } from "./render-hero.mjs";

const ev = JSON.parse(readFileSync(new URL("../data/evidence.json", import.meta.url), "utf8"));

test("the hero shows exactly the counted numbers from the evidence file", () => {
  const svg = renderHero(ev);
  assert.match(svg, new RegExp(`${ev.upstream.mergedPrs} PRS · ${ev.upstream.projects} PROJECTS`));
  assert.match(svg, new RegExp(`${ev.upstream.bugFixes} BUG FIXES IN `));
  assert.match(svg, new RegExp(`GITHUB ${ev.date} UTC`));
  assert.doesNotMatch(svg, new RegExp(String(ev.ownRepos.mergedPrs)), "own-repo count must never appear on the hero");
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
  assert.throws(() => renderHero({ ...ev, upstream: { ...ev.upstream, bugFixes: 99 } }), /cannot exceed/);
  assert.throws(() => renderHero({ ...ev, upstream: { ...ev.upstream, mergedPrs: -1 } }), /non-negative/);
  assert.throws(() => renderHero({ ...ev, date: "yesterday" }), /YYYY-MM-DD/);
});
