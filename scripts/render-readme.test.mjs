import { test } from "node:test";
import assert from "node:assert/strict";
import { collectEvidence } from "./update-evidence.mjs";
import { applyBlocks, replaceBlock, mdText, summaryMd, projectsMd, fixesMd } from "./render-readme.mjs";
import { fakeFetch, pr, repo, FEATURED, FIXES, UPSTREAM } from "./fixtures.mjs";

const TEMPLATE = [
  "# Hey",
  "<!-- profile:summary:start -->",
  "old",
  "<!-- profile:summary:end -->",
  "<!-- profile:fixes:start -->",
  "<!-- profile:fixes:end -->",
  "hand written text that must survive",
  "<!-- profile:projects:start -->",
  "<!-- profile:projects:end -->",
  "tail",
].join("\n");

const evidence = (opts) => collectEvidence({ fetchFn: fakeFetch(opts), today: "2026-10-23", featured: FEATURED });

test("blocks are filled and hand written text is untouched", async () => {
  const out = applyBlocks(TEMPLATE, await evidence());
  assert.match(out, /3 of my pull requests are merged|5 of my pull requests are merged/);
  assert.match(out, /hand written text that must survive/);
  assert.ok(out.startsWith("# Hey\n") && out.endsWith("\ntail"));
});

test("running it twice gives the same file", async () => {
  const ev = await evidence();
  const once = applyBlocks(TEMPLATE, ev);
  assert.equal(applyBlocks(once, ev), once);
});

test("missing or duplicated markers are an error, never a silent skip", async () => {
  const ev = await evidence();
  assert.throws(() => applyBlocks("no markers here", ev), /exactly one/);
  assert.throws(() => replaceBlock(`${TEMPLATE}\n<!-- profile:summary:start -->\n<!-- profile:summary:end -->`, "summary", "x"), /exactly one/);
});

test("titles and descriptions from GitHub cannot inject markup or links", async () => {
  const hostile = pr("some/repo", 9, "fix: <img src=x onerror=alert(1)> [click](https://evil.example) `code` | pipe\nnew line", "2026-10-22");
  const ev = await evidence({ upstream: [hostile], fixes: [hostile], repos: [repo("tokenizen", { description: "nice <script>alert(1)</script> [x](javascript:alert(1))" }), repo("muraqib"), repo("postmortems")] });
  const md = `${fixesMd(ev)}\n${projectsMd(ev)}`;
  assert.doesNotMatch(md, /(^|[^\\])<(img|script)/, "every angle bracket is escaped");
  const withoutOwnLinks = md.replace(/\]\(https:\/\/github\.com\/[^)\s]*\)/g, "]()");
  assert.doesNotMatch(withoutOwnLinks, /(^|[^\\])https?:\/\//, "outside our own github links no bare URL survives, so nothing autolinks");
  assert.doesNotMatch(md, /\[click\]\(/, "square brackets are escaped, so no link can be built from a title");
  assert.doesNotMatch(md, /\[x\]\(/);
  assert.equal(md.split("\n").filter((l) => l.startsWith("- ")).length, 1 + ev.projects.length, "one line per item, no newline smuggling");
});

test("only github.com links are ever written", async () => {
  const ev = await evidence();
  ev.upstream.latestFixes[0].url = "https://evil.example/x";
  assert.throws(() => fixesMd(ev), /non-GitHub link/);
});

test("wording follows the numbers, including one", async () => {
  const one = await evidence({ upstream: [UPSTREAM[0]], fixes: [FIXES[0]] });
  const text = summaryMd(one);
  assert.match(text, /1 of my pull request is merged in other people's projects \(1 project, 1 of them bug fix\)/);
  assert.match(text, /\[the 1 with fix in the title\]/);
});

test("urls, www hosts and e-mail addresses are neutralised", () => {
  assert.equal(mdText("see https://evil.example and www.evil.com and a@b.co"), "see https:\\/\\/evil.example and www\\.evil.com and a\\@b.co");
});

test("mdText escapes the characters that make markdown", () => {
  assert.equal(mdText("a_b *c* [d] <e> `f` | g ~h"), "a\\_b \\*c\\* \\[d\\] \\<e\\> \\`f\\` \\| g \\~h");
});
