// node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { collectEvidence, searchLink, queries, shortName, clean } from "./update-evidence.mjs";
import { fakeFetch, pr, repo, FEATURED, UPSTREAM } from "./fixtures.mjs";

const run = (fetchFn, featured = FEATURED) => collectEvidence({ fetchFn, today: "2026-10-23", featured });

test("counts, distinct projects and bug fixes come from the search results", async () => {
  const ev = await run(fakeFetch());
  assert.equal(ev.upstream.mergedPrs, 5);
  assert.equal(ev.upstream.projects, 5);
  assert.equal(ev.upstream.bugFixes, 3);
  assert.deepEqual(ev.upstream.bugFixProjects, ["x402", "cloudfoundry", "windmill"]); // newest first, long repo names fall back to the owner
  assert.equal(ev.upstream.latestFixes[0].number, 3826);
  assert.equal(ev.ownRepos.mergedPrs, 361);
  assert.equal(ev.ownRepos.countedAsCredit, false);
});

test("the search link shows the same query the numbers come from", () => {
  const q = queries("holistis");
  assert.equal(searchLink(q.upstream), "https://github.com/search?q=author%3Aholistis+is%3Apr+is%3Amerged+-user%3Aholistis&type=pullrequests");
  assert.equal(searchLink(q.bugFixes), "https://github.com/search?q=author%3Aholistis+is%3Apr+is%3Amerged+-user%3Aholistis+fix+in%3Atitle&type=pullrequests");
});

test("incomplete search results are refused, never counted", async () => {
  await assert.rejects(run(fakeFetch({ incomplete: true })), /incomplete/);
});

test("a bug fix that is not in the upstream set means the data is inconsistent", async () => {
  const stray = pr("someone/else", 1, "fix: stray", "2026-10-01");
  await assert.rejects(run(fakeFetch({ fixes: [stray] })), /missing from the upstream set/);
});

test("a failing GitHub call stops the whole run", async () => {
  await assert.rejects(run(fakeFetch({ failRepos: true })), /GitHub answered 500/);
});

test("results are paginated and counted completely", async () => {
  const many = Array.from({ length: 130 }, (_, i) => pr(`org${i % 7}/repo`, i + 1, `change ${i}`, "2026-09-01"));
  const ev = await run(fakeFetch({ upstream: many, fixes: [] }));
  assert.equal(ev.upstream.mergedPrs, 130);
  assert.equal(ev.upstream.projects, 7);
});

test("featured projects: seed list plus opt-in topic, minus hidden, archived, forks and repos without a description", async () => {
  const repos = [
    repo("tokenizen", { pushed_at: "2026-10-22T00:00:00Z", homepage: "https://tokenizen.nl" }),
    repo("muraqib", { pushed_at: "2026-10-21T00:00:00Z" }),
    repo("postmortems", { topics: ["profile-hidden"] }),
    repo("brand-new-tool", { topics: ["profile-featured"], pushed_at: "2026-10-23T00:00:00Z" }),
    repo("not-opted-in", { pushed_at: "2026-10-23T00:00:00Z" }),
    repo("archived-one", { topics: ["profile-featured"], archived: true }),
    repo("forked-one", { topics: ["profile-featured"], fork: true }),
    repo("no-description", { topics: ["profile-featured"], description: null }),
    repo("holistis", { topics: ["profile-featured"] }),
  ];
  const ev = await run(fakeFetch({ repos, releases: { tokenizen: { tag_name: "v0.5.0", published_at: "2026-09-06T00:00:00Z" } } }));
  assert.deepEqual(ev.projects.map((p) => p.name), ["brand-new-tool", "tokenizen", "muraqib"], "newest push first");
  assert.equal(ev.projects[1].release.tag, "v0.5.0");
  assert.equal(ev.projects[1].release.url, "https://github.com/holistis/tokenizen/releases/tag/v0.5.0");
  assert.equal(ev.projects[1].homepage, "https://tokenizen.nl");
  assert.equal(ev.projects[0].release, null);
});

test("more than one page of repositories is read completely (forks included in the pages, excluded from the list)", async () => {
  const forks = Array.from({ length: 120 }, (_, i) => repo(`fork-${i}`, { fork: true, pushed_at: "2026-10-23T00:00:00Z" }));
  const ev = await run(fakeFetch({ repos: [...forks, repo("tokenizen"), repo("muraqib"), repo("postmortems")] }));
  assert.deepEqual(ev.projects.map((p) => p.name).sort(), ["muraqib", "postmortems", "tokenizen"]);
});

test("an unsafe homepage is dropped instead of written to the README", async () => {
  const repos = [repo("tokenizen", { homepage: "javascript:alert(1)" }), repo("muraqib", { homepage: "https://a.nl/x y" }), repo("postmortems")];
  const ev = await run(fakeFetch({ repos }));
  assert.ok(ev.projects.every((p) => p.homepage === null));
});

test("if most featured repositories vanish the run is refused", async () => {
  await assert.rejects(run(fakeFetch({ repos: [repo("tokenizen")] })), /most featured repositories were not found/);
});

test("hostile data from GitHub is flattened to one bounded line", () => {
  assert.equal(clean(`a\nb${String.fromCharCode(0x2028)}c\t d`, 50), "a b c d");
  assert.ok(clean("x".repeat(500), 100).length <= 100);
  assert.equal(clean("word ".repeat(40), 30).endsWith("..."), true);
});

test("unexpected repository or pull request shapes are refused", async () => {
  const bad = [{ ...UPSTREAM[0], repository_url: "https://evil.example/repos/x/y" }];
  await assert.rejects(run(fakeFetch({ upstream: bad, fixes: [] })), /repository_url/);
  const badUrl = [{ ...UPSTREAM[0], html_url: "https://evil.example/pull/1" }];
  await assert.rejects(run(fakeFetch({ upstream: badUrl, fixes: [] })), /unexpected PR url/);
});

test("short names use the repo name, or the owner when the name is long", () => {
  assert.equal(shortName("x402-foundation/x402"), "x402");
  assert.equal(shortName("nexu-io/open-design"), "open design");
  assert.equal(shortName("cloudfoundry/terraform-provider-cloudfoundry"), "cloudfoundry");
});
