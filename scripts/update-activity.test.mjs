// node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { queries } from "./update-evidence.mjs";
import { collectActivity, assertActivitySane, renderActivityMd, renderLlmsTxt } from "./update-activity.mjs";
import { fakeFetch, tamperSearch, pr, openPr, closedPr, UPSTREAM, OPEN, CLOSED } from "./fixtures.mjs";

const SENT = queries("holistis").sent;
const run = (fetchFn) => collectActivity({ fetchFn, today: "2026-11-12" });
const broken = (mutate) => run(tamperSearch(fakeFetch(), SENT, mutate));
const evidenceOf = (a) => ({ upstream: { mergedPrs: a.totals.merged, open: a.totals.open, sent: a.totals.sent } });

test("merged, open and closed are all counted, and closed is not merged", async () => {
  const a = await run(fakeFetch());
  assert.deepEqual(
    { sent: a.totals.sent, merged: a.totals.merged, open: a.totals.open, closed: a.totals.closed, finished: a.totals.finished },
    { sent: 10, merged: 5, open: 2, closed: 3, finished: 8 },
  );
  assert.equal(a.totals.mergedPercentOfFinished, 63);
  assert.equal(a.totals.mergedChanges, 4);
  assert.equal(a.totals.mergedListings, 1, "the awesome-list addition is merged but named as a listing");
  assert.equal(a.prs.find((p) => p.number === 90).state, "closed");
  assert.equal(a.prs.find((p) => p.number === 90).mergedAt, null);
  assert.doesNotThrow(() => assertActivitySane(null, a, evidenceOf(a)));
});

test("the median hours to merge is taken per project, from the real timestamps", async () => {
  const mk = (n, created, merged) => ({
    ...pr("a-org/a-repo", n, "fix: x", "2026-10-01"),
    created_at: created,
    closed_at: merged,
    pull_request: { merged_at: merged },
  });
  const list = [
    mk(1, "2026-10-01T00:00:00Z", "2026-10-01T04:00:00Z"),
    mk(2, "2026-10-02T00:00:00Z", "2026-10-02T10:00:00Z"),
    mk(3, "2026-10-03T00:00:00Z", "2026-10-07T04:00:00Z"),
  ];
  const a = await run(fakeFetch({ upstream: list, open: [], closed: [] }));
  assert.equal(a.repos[0].medianHoursToMerge, 10);
  const b = await run(fakeFetch({ upstream: list.slice(0, 2), open: [], closed: [] }));
  assert.equal(b.repos[0].medianHoursToMerge, 7, "two values: the rounded average of the middle pair");
  const c = await run(fakeFetch({ upstream: [], open: [], closed: [closedPr("a-org/a-repo", 5, "fix: y", "2026-10-01")] }));
  assert.equal(c.repos[0].medianHoursToMerge, null, "nothing merged, nothing to take a median of");
  assert.equal(c.totals.mergedPercentOfFinished, 0);
});

// The planted faults. A checker that lets any of these through is blind.
test("planted fault, changed: an open pull request that carries a close date", async () => {
  await assert.rejects(broken((j) => { j.items.find((i) => i.state === "open").closed_at = "2026-10-30T10:00:00Z"; }), /open but carries/);
});
test("planted fault, changed: a closed pull request without a close date", async () => {
  await assert.rejects(broken((j) => { j.items.find((i) => i.state === "closed").closed_at = null; }), /unexpected closed_at/);
});
test("planted fault, removed: one pull request missing while the total still says ten", async () => {
  await assert.rejects(broken((j) => { j.items.pop(); }), /fetched 9 of 10/);
});
test("planted fault, added: one of our own repositories slips into the list", async () => {
  await assert.rejects(broken((j) => { j.items.push(pr("holistis/tokenizen", 1, "feat: own", "2026-10-01")); j.total_count++; }), /own repository/);
});
test("planted fault, doubled: the same pull request twice", async () => {
  await assert.rejects(broken((j) => { j.items.push(structuredClone(j.items[0])); j.total_count++; }), /appears twice/);
});
test("planted fault, swapped: merged before it was opened", async () => {
  await assert.rejects(broken((j) => { const i = j.items.find((x) => x.state === "closed" && x.pull_request.merged_at); i.pull_request.merged_at = "2020-01-01T00:00:00Z"; }), /merged before it was opened/);
});
test("planted fault, truncated: GitHub says the answer is incomplete", async () => {
  await assert.rejects(broken((j) => { j.incomplete_results = true; }), /incomplete/);
});
test("planted fault, variant: a state we have never seen", async () => {
  await assert.rejects(broken((j) => { j.items[0].state = "merged"; }), /unexpected state/);
});
test("planted fault, emptied: an empty answer after a ledger that had pull requests", async () => {
  const before = await run(fakeFetch());
  const empty = await run(fakeFetch({ upstream: [], open: [], closed: [] }));
  assert.throws(() => assertActivitySane(before, empty, evidenceOf(empty)), /sent went down/);
});
test("planted fault: fewer merged than before is held back for a human, even when the total grew", async () => {
  const before = await run(fakeFetch());
  // Two merges are gone from the list while four new pull requests appeared: sent grew, merged shrank.
  const after = await run(fakeFetch({
    upstream: UPSTREAM.slice(0, 3),
    open: [...OPEN, openPr("n/e", 1, "x", "2026-11-01"), openPr("n/f", 2, "y", "2026-11-01")],
    closed: [...CLOSED, closedPr("p/q", 1, "a", "2026-10-01"), closedPr("p/q", 2, "b", "2026-10-01")],
  }));
  assert.ok(after.totals.sent >= before.totals.sent && after.totals.merged < before.totals.merged, "set-up: sent did not shrink, merged did");
  assert.throws(() => assertActivitySane(before, after, evidenceOf(after)), /merged went down/);
});
test("planted fault: the ledger disagrees with the profile counts", async () => {
  const a = await run(fakeFetch());
  const ev = evidenceOf(a);
  for (const key of ["mergedPrs", "open", "sent"]) {
    const bad = { upstream: { ...ev.upstream, [key]: ev.upstream[key] + 1 } };
    assert.throws(() => assertActivitySane(null, a, bad), /profile counted/, key);
  }
});
test("planted fault: totals and per-project rows that do not add up", async () => {
  const a = await run(fakeFetch());
  const t = structuredClone(a); t.totals.merged += 1;
  assert.throws(() => assertActivitySane(null, t), /list holds a different number/);
  const r = structuredClone(a); r.repos.pop();
  assert.throws(() => assertActivitySane(null, r), /per-project .* does not add up/);
  const l = structuredClone(a); l.prs.pop();
  assert.throws(() => assertActivitySane(null, l), /does not match the sent count/);
});

test("planted fault: totals and project rows agree with each other but not with the list", async () => {
  const a = await run(fakeFetch());
  const x = structuredClone(a);
  x.totals.merged -= 1; x.totals.closed += 1; x.totals.mergedChanges -= 1;
  x.repos[0].merged -= 1; x.repos[0].closed += 1;
  assert.throws(() => assertActivitySane(null, x), /list holds a different number/);
});

// Every sentence the published files say about what the tool does has a test here.
test("claims: public only, closed-without-merge included, no star counts, a cite line, no tell-tale characters", async () => {
  const a = await run(fakeFetch());
  assert.match(a.query, /is:public/, "only public pull requests, so anyone can repeat the search logged out");
  assert.doesNotMatch(JSON.stringify(a), /star/i, "no star count of another project is collected");
  const md = renderActivityMd(a);
  const llms = renderLlmsTxt(a);
  assert.match(md, /Sent 10\. Merged 5, still open 2, closed without a merge 3\./);
  assert.match(md, /Pull requests closed without a merge are counted here too\./);
  assert.match(llms, /Pull requests closed without a merge are included in the counts\./);
  assert.match(llms, /Cite as: github\.com\/holistis, 2026-11-12\./);
  assert.match(md, /Cite as: github\.com\/holistis, 2026-11-12\./);
  for (const text of [md, llms]) assert.doesNotMatch(text, /[–—]|\*\*/, "no em dash, en dash or double asterisk");
});

test("the same input gives the same bytes, so a rerun on the same day changes nothing", async () => {
  const a = await run(fakeFetch());
  const b = await run(fakeFetch());
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(renderActivityMd(a), renderActivityMd(b));
});
