// The full ledger of pull requests sent to other people's projects: merged, still open and closed without a merge.
// Same rules as update-evidence.mjs: no dependencies, public data only, anything odd throws so the
// caller keeps the last verified ledger. Repository star counts are deliberately not collected:
// a project's stars belong to that project, so they never appear next to our numbers.
import { queries, searchAll, isListing, clean } from "./update-evidence.mjs";

const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
const API_REPOS = "https://api.github.com/repos/";
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

const stamp = (s, what) => {
  if (typeof s !== "string" || !ISO.test(s)) throw new Error(`unexpected ${what} ${String(s).slice(0, 30)}`);
  return s;
};

export function toActivityPr(item, account) {
  if (typeof item.repository_url !== "string" || !item.repository_url.startsWith(API_REPOS)) throw new Error("unexpected repository_url");
  const repo = item.repository_url.slice(API_REPOS.length);
  if (!REPO_RE.test(repo)) throw new Error(`unexpected repository name ${repo.slice(0, 40)}`);
  if (repo.split("/")[0].toLowerCase() === account.toLowerCase()) throw new Error(`${repo} is our own repository, not another project`);
  if (!Number.isInteger(item.number)) throw new Error("unexpected PR number");
  const url = `https://github.com/${repo}/pull/${item.number}`;
  if (item.html_url !== url) throw new Error(`unexpected PR url for ${repo}#${item.number}`);

  const opened = stamp(item.created_at, "created_at");
  const mergedRaw = item.pull_request?.merged_at ?? null;
  const closedRaw = item.closed_at ?? null;
  let state;
  if (item.state === "open") {
    if (mergedRaw !== null || closedRaw !== null) throw new Error(`${repo}#${item.number} is open but carries a close or merge date`);
    state = "open";
  } else if (item.state === "closed") {
    stamp(closedRaw, "closed_at");
    state = mergedRaw ? "merged" : "closed";
  } else {
    throw new Error(`unexpected state ${String(item.state).slice(0, 20)}`);
  }
  let hoursToMerge = null;
  if (state === "merged") {
    const ms = Date.parse(stamp(mergedRaw, "merged_at")) - Date.parse(opened);
    if (!(ms >= 0)) throw new Error(`${repo}#${item.number} was merged before it was opened`);
    hoursToMerge = Math.round(ms / 36e5);
  }
  return {
    repo,
    number: item.number,
    title: clean(item.title, 140),
    url,
    kind: isListing({ repo }) ? "listing" : "change",
    state,
    openedAt: opened.slice(0, 10),
    closedAt: closedRaw ? closedRaw.slice(0, 10) : null,
    mergedAt: mergedRaw ? mergedRaw.slice(0, 10) : null,
    hoursToMerge,
  };
}

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export async function collectActivity({ fetchFn = fetch, token, account = "holistis", today = new Date().toISOString().slice(0, 10) } = {}) {
  const query = queries(account).sent;
  const items = await searchAll(fetchFn, token, query);
  const prs = items.map((i) => toActivityPr(i, account));

  const seen = new Set();
  for (const p of prs) {
    const k = `${p.repo}#${p.number}`;
    if (seen.has(k)) throw new Error(`${k} appears twice`);
    seen.add(k);
  }
  prs.sort((a, b) => b.openedAt.localeCompare(a.openedAt) || a.repo.localeCompare(b.repo) || b.number - a.number);

  const by = new Map();
  for (const p of prs) {
    const r = by.get(p.repo) ?? { repo: p.repo, merged: 0, open: 0, closed: 0, hours: [] };
    r[p.state]++;
    if (p.state === "merged") r.hours.push(p.hoursToMerge);
    by.set(p.repo, r);
  }
  const repos = [...by.values()]
    .map(({ hours, ...r }) => ({ ...r, medianHoursToMerge: median(hours) }))
    .sort((a, b) => b.merged - a.merged || b.open - a.open || a.repo.localeCompare(b.repo));

  const count = (state, kind) => prs.filter((p) => p.state === state && (!kind || p.kind === kind)).length;
  const merged = count("merged");
  const closed = count("closed");
  const finished = merged + closed;
  return {
    schema: 1,
    account,
    date: today,
    query,
    totals: {
      sent: prs.length,
      merged,
      open: count("open"),
      closed,
      finished,
      mergedPercentOfFinished: finished ? Math.round((merged / finished) * 100) : null,
      mergedChanges: count("merged", "change"),
      mergedListings: count("merged", "listing"),
    },
    repos,
    prs,
  };
}

// The ledger must add up, and it must agree with the separate counts the profile already uses.
// A lower number than before is more likely a broken answer from GitHub than the truth, so a
// human decides about that, never the bot.
export function assertActivitySane(prev, next, evidence) {
  const t = next.totals;
  if (next.prs.length !== t.sent) throw new Error("the pull request list does not match the sent count");
  // Recount from the list itself: totals and per-project rows could agree with each other and still be wrong.
  for (const s of ["merged", "open", "closed"]) {
    if (next.prs.filter((p) => p.state === s).length !== t[s]) throw new Error(`the list holds a different number of ${s} pull requests than the totals say`);
  }
  if (t.mergedChanges + t.mergedListings !== t.merged) throw new Error("merged changes and listings do not add up to merged");
  for (const s of ["merged", "open", "closed"]) {
    if (next.repos.reduce((n, r) => n + r[s], 0) !== t[s]) throw new Error(`per-project ${s} does not add up to the total`);
  }
  if (evidence) {
    const u = evidence.upstream;
    if (t.merged !== u.mergedPrs) throw new Error(`ledger has ${t.merged} merged but the profile counted ${u.mergedPrs}`);
    if (t.open !== u.open) throw new Error(`ledger has ${t.open} open but the profile counted ${u.open}`);
    if (t.sent !== u.sent) throw new Error(`ledger has ${t.sent} sent but the profile counted ${u.sent}`);
  }
  if (!prev) return;
  if (t.sent < prev.totals.sent) throw new Error(`sent went down from ${prev.totals.sent} to ${t.sent}, a human has to look at that`);
  if (t.merged < prev.totals.merged) throw new Error(`merged went down from ${prev.totals.merged} to ${t.merged}, a human has to look at that`);
}

const hours = (h) => (h === null ? "-" : String(h));

export function renderActivityMd(a) {
  const t = a.totals;
  const pct = t.mergedPercentOfFinished === null ? "none finished yet" : `${t.mergedPercentOfFinished} percent`;
  const rows = a.repos.map((r) => `| [${r.repo}](https://github.com/${r.repo}/pulls?q=author%3A${a.account}) | ${r.merged} | ${r.open} | ${r.closed} | ${hours(r.medianHoursToMerge)} |`);
  return [
    "# Pull requests sent to other projects",
    "",
    `Account: ${a.account}. Counted from public GitHub data on ${a.date}. Cite as: github.com/${a.account}, ${a.date}.`,
    "",
    `Sent ${t.sent}. Merged ${t.merged}, still open ${t.open}, closed without a merge ${t.closed}. Of the ones that are finished, ${pct} were merged.`,
    `Of the ${t.merged} merged, ${t.mergedChanges} change a project's code or documents and ${t.mergedListings} add a tool to a directory list.`,
    "",
    "Pull requests closed without a merge are counted here too. Some were closed by a maintainer and some were withdrawn by us; this ledger does not tell them apart. Star counts of other projects are not shown and not claimed.",
    "",
    "## Per project",
    "",
    "| Project | Merged | Open | Closed without merge | Median hours to merge |",
    "| :-- | --: | --: | --: | --: |",
    ...rows,
    "",
    `Every pull request, one record each: [data/activity.json](https://raw.githubusercontent.com/${a.account}/${a.account}/main/data/activity.json). Search used: \`${a.query}\`.`,
    "",
  ].join("\n");
}

export function renderLlmsTxt(a) {
  const t = a.totals;
  const raw = `https://raw.githubusercontent.com/${a.account}/${a.account}/main`;
  return [
    `# ${a.account}`,
    "",
    `> Open source contributions by github.com/${a.account}, counted from public GitHub data on ${a.date}. Sent ${t.sent} pull requests to other projects: ${t.merged} merged, ${t.open} open, ${t.closed} closed without a merge.`,
    "",
    "## Evidence",
    "",
    `- [Ledger of every pull request sent to other projects](${raw}/activity.md): merged, open and closed without a merge, per project, with the median hours to merge.`,
    `- [The same ledger as JSON](${raw}/data/activity.json): one record per pull request.`,
    `- [Profile counts and featured repositories](${raw}/data/evidence.json): the numbers shown on the profile page.`,
    "",
    "## Claim boundaries",
    "",
    "- A merged pull request shows that a maintainer accepted a change. It does not show that anyone deploys it.",
    "- Pull requests closed without a merge are included in the counts. They were closed by a maintainer or withdrawn by us.",
    "- Stars of other projects are not counted and not claimed.",
    "- Only public pull requests are counted, so anyone can repeat the search logged out.",
    "",
    `Cite as: github.com/${a.account}, ${a.date}.`,
    "",
  ].join("\n");
}
