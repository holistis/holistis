// Recounts everything from GitHub and rewrites the generated parts of the profile.
// Fails closed: on any problem nothing is written, so the last verified evidence stays live.
// Usage: GITHUB_TOKEN=... node scripts/refresh.mjs [--dry]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectEvidence } from "./update-evidence.mjs";
import { renderHero } from "./render-hero.mjs";
import { applyBlocks } from "./render-readme.mjs";

const withoutDate = (e) => {
  const { date, ...rest } = e;
  return JSON.stringify(rest);
};

// A lower number than before, or a list that suddenly shrank, is more likely a broken
// answer from GitHub than the truth. A human decides about that, never the bot.
export function assertSane(prev, next) {
  const u = next.upstream;
  if (u.bugFixes > u.mergedPrs) throw new Error("more bug fixes than merged pull requests");
  if (u.projects > u.mergedPrs) throw new Error("more projects than merged pull requests");
  if (u.latestFixes.length !== Math.min(5, u.bugFixes)) throw new Error("bug fix list does not match the bug fix count");
  if (u.openLatest.length > Math.min(6, u.open)) throw new Error("open list is longer than the open count allows");
  if (next.totals.mergedPrs < u.mergedPrs) throw new Error("total merged is smaller than merged upstream");
  if (!prev) return;
  if (prev.totals && next.totals.mergedPrs < prev.totals.mergedPrs) throw new Error(`total merged went down from ${prev.totals.mergedPrs} to ${next.totals.mergedPrs}, a human has to look at that`);
  if (u.mergedPrs < prev.upstream.mergedPrs) throw new Error(`merged count went down from ${prev.upstream.mergedPrs} to ${u.mergedPrs}, a human has to look at that`);
  if (u.bugFixes < prev.upstream.bugFixes) throw new Error(`bug fix count went down from ${prev.upstream.bugFixes} to ${u.bugFixes}, a human has to look at that`);
  const before = prev.projects?.length ?? 0;
  if (before >= 4 && next.projects.length < before / 2) throw new Error(`project list shrank from ${before} to ${next.projects.length}`);
}

export async function refresh({ root = process.cwd(), fetchFn = fetch, token, today = new Date().toISOString().slice(0, 10), dry = false } = {}) {
  const at = (f) => join(root, f);
  const prev = existsSync(at("data/evidence.json")) ? JSON.parse(readFileSync(at("data/evidence.json"), "utf8")) : null;
  const featured = JSON.parse(readFileSync(at("data/featured.json"), "utf8"));

  const next = await collectEvidence({ fetchFn, token, today, featured });
  assertSane(prev, next);

  if (prev && withoutDate(prev) === withoutDate(next) && prev.date === today) return { changed: false, evidence: prev };

  // Render everything in memory first, so a failure never leaves half a profile on disk.
  const evidenceText = `${JSON.stringify(next, null, 2)}\n`;
  const heroText = renderHero(next);
  const readmeText = applyBlocks(readFileSync(at("README.md"), "utf8"), next);

  if (!dry) {
    writeFileSync(at("assets/hero.svg"), heroText);
    writeFileSync(at("README.md"), readmeText);
    writeFileSync(at("data/evidence.json"), evidenceText);
  }
  return { changed: true, evidence: next, before: prev?.upstream ?? null };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  refresh({ token: process.env.GITHUB_TOKEN, dry: process.argv.includes("--dry") })
    .then((r) => {
      const u = r.evidence.upstream;
      console.log(r.changed ? `updated: ${u.mergedPrs} merged PRs in ${u.projects} projects, ${u.bugFixes} bug fixes, ${r.evidence.projects.length} featured repositories` : "nothing changed");
    })
    .catch((e) => {
      console.error(`refresh failed, nothing was changed: ${e.message}`);
      process.exit(1);
    });
}
