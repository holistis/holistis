import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { refresh, assertSane } from "./refresh.mjs";
import { fakeFetch, pr, FEATURED, UPSTREAM, FIXES } from "./fixtures.mjs";

const README = [
  "<!-- profile:hero:start -->\n<!-- profile:hero:end -->",
  "# Hey",
  "<!-- profile:summary:start -->\n<!-- profile:summary:end -->",
  "<!-- profile:merged:start -->\n<!-- profile:merged:end -->",
  "<!-- profile:fixes:start -->\n<!-- profile:fixes:end -->",
  "<!-- profile:open:start -->\n<!-- profile:open:end -->",
  "<!-- profile:projects:start -->\n<!-- profile:projects:end -->",
].join("\n");

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), "profile-refresh-"));
  mkdirSync(join(root, "data"));
  mkdirSync(join(root, "assets"));
  writeFileSync(join(root, "README.md"), README);
  writeFileSync(join(root, "data/featured.json"), JSON.stringify(FEATURED));
  return root;
}
const read = (root, f) => readFileSync(join(root, f), "utf8");
const snapshot = (root) => read(root, "README.md") + read(root, "assets/hero.svg") + read(root, "data/evidence.json");

test("first run writes the evidence, the hero and the README", async () => {
  const root = sandbox();
  const r = await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" });
  assert.equal(r.changed, true);
  assert.match(read(root, "README.md"), /\[205 pull requests merged\]/);
  assert.match(read(root, "assets/hero.svg"), /205 PRS MERGED · 5 IN OTHER PEOPLE'S PROJECTS · 2 OPEN NOW/);
  assert.match(read(root, "README.md"), /src="\.\/assets\/hero\.svg\?v=[0-9a-f]{8}"/);
  assert.equal(JSON.parse(read(root, "data/evidence.json")).upstream.mergedPrs, 5);
});

test("a new merge shows up in the numbers, the hero and the list", async () => {
  const root = sandbox();
  await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" });
  const merged = pr("new-org/new-repo", 7, "fix: something real", "2026-10-24");
  const r = await refresh({ root, fetchFn: fakeFetch({ upstream: [merged, ...UPSTREAM], fixes: [merged, ...FIXES] }), today: "2026-10-24" });
  assert.equal(r.changed, true);
  assert.match(read(root, "README.md"), /\[206 pull requests merged\]/);
  assert.match(read(root, "README.md"), /new-org\/new-repo#7/);
  assert.match(read(root, "assets/hero.svg"), /206 PRS MERGED · 6 IN OTHER PEOPLE'S PROJECTS/);
  assert.match(read(root, "assets/hero.svg"), /4 BUG FIXES IN NEW REPO/);
});

test("nothing is rewritten when nothing changed on the same day", async () => {
  const root = sandbox();
  await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" });
  const before = snapshot(root);
  const r = await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" });
  assert.equal(r.changed, false);
  assert.equal(snapshot(root), before);
});

test("on a new day only the date moves, at most one commit a day", async () => {
  const root = sandbox();
  await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" });
  const r = await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-24" });
  assert.equal(r.changed, true);
  assert.equal(JSON.parse(read(root, "data/evidence.json")).date, "2026-10-24");
});

test("a lower count than before is refused and nothing is written", async () => {
  const root = sandbox();
  await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" });
  const before = snapshot(root);
  await assert.rejects(refresh({ root, fetchFn: fakeFetch({ upstream: UPSTREAM.slice(0, 2), fixes: [UPSTREAM[0]] }), today: "2026-10-24" }), /went down/);
  assert.equal(snapshot(root), before);
});

test("a lower grand total than before is refused too", async () => {
  const root = sandbox();
  await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" });
  const before = snapshot(root);
  await assert.rejects(refresh({ root, fetchFn: fakeFetch({ ownTotal: 150 }), today: "2026-10-24" }), /total merged went down/);
  assert.equal(snapshot(root), before);
});

test("a failing GitHub leaves the last verified profile exactly as it was", async () => {
  const root = sandbox();
  await refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" });
  const before = snapshot(root);
  await assert.rejects(refresh({ root, fetchFn: fakeFetch({ failRepos: true }), today: "2026-10-24" }), /GitHub answered 500/);
  assert.equal(snapshot(root), before);
});

test("a README without markers fails before anything is written", async () => {
  const root = sandbox();
  writeFileSync(join(root, "README.md"), "# no markers");
  await assert.rejects(refresh({ root, fetchFn: fakeFetch(), today: "2026-10-23" }), /exactly one/);
  assert.throws(() => readFileSync(join(root, "data/evidence.json")), "evidence must not be written when the README step failed");
});

test("sanity gate: impossible shapes", () => {
  const base = { totals: { mergedPrs: 9 }, upstream: { mergedPrs: 5, projects: 3, bugFixes: 2, latestFixes: [1, 2], open: 1, openLatest: [1] }, projects: [] };
  const withUp = (over) => ({ ...base, upstream: { ...base.upstream, ...over } });
  assert.throws(() => assertSane(null, withUp({ bugFixes: 9, latestFixes: new Array(5) })), /more bug fixes/);
  assert.throws(() => assertSane(null, withUp({ projects: 9 })), /more projects/);
  assert.throws(() => assertSane(null, withUp({ latestFixes: [1] })), /does not match/);
  assert.throws(() => assertSane(null, withUp({ openLatest: [1, 2, 3] })), /longer than the open count/);
  assert.throws(() => assertSane(null, withUp({ latestMerged: new Array(9) })), /merged list is longer/);
  assert.doesNotThrow(() => assertSane(null, withUp({ latestMerged: [1, 2, 3] })), "an older evidence file without the merged list, or a shorter one, is fine");
  assert.doesNotThrow(() => assertSane(null, withUp({ openLatest: [] })), "a list can be shorter when open pull requests are only directory listings");
  assert.throws(() => assertSane(null, { ...base, totals: { mergedPrs: 4 } }), /smaller than merged upstream/);
  assert.doesNotThrow(() => assertSane(null, base));
});
