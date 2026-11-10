// Keeps the public "Building in public" project board in sync with real issues and
// pull requests in the featured repositories (data/featured.json, the same list the
// README uses). Every card on the board is a live GitHub issue or PR; this script
// never writes a draft card.
//
// Rules, on purpose simple enough to read in one pass:
//   - a merged pull request, or an issue closed as completed, moves to "Shipped"
//   - Shipped is terminal: once a card is there, this script never moves it elsewhere
//   - an open item assigned to the account and updated in the last 7 days is "Building now"
//   - every other open item is "Next up"
//   - issues closed as "not planned" (won't fix, duplicate, ...) are skipped entirely,
//     they are not real backlog and do not belong on the board
//   - auto-generated nightly-test issues ("[Muraqib] ...") are skipped: that is bot noise
//     about this account's own tooling, not product work
//
// Fails closed: a GitHub error, or more new cards in one run than MAX_NEW_PER_RUN,
// stops the whole run before anything is written.
//
// Usage: GITHUB_TOKEN=... node scripts/sync-project.mjs [--dry]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectEvidence } from "./update-evidence.mjs";

const API = "https://api.github.com";
const GRAPHQL = "https://api.github.com/graphql";
const OWNER = "holistis";
const PROJECT_NUMBER = 1;
const BUILDING_WINDOW_DAYS = 7;
const MAX_NEW_PER_RUN = 20;
const NOISE_TITLE_RE = /^\[Muraqib\]/;

async function rest(fetchFn, token, path) {
  const res = await fetchFn(`${API}${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "holistis-project-sync",
      authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${path.split("?")[0]}`);
  return res.json();
}

async function gql(fetchFn, token, query, variables) {
  const res = await fetchFn(GRAPHQL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "holistis-project-sync",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL answered ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
  return json.data;
}

async function loadProject(fetchFn, token) {
  const data = await gql(
    fetchFn,
    token,
    `query($login:String!,$number:Int!){
      user(login:$login){
        projectV2(number:$number){
          id
          field(name:"Status"){ ... on ProjectV2SingleSelectField { id options { id name } } }
          items(first:100){
            nodes{
              id
              content{
                ... on Issue{ id url state stateReason }
                ... on PullRequest{ id url state merged }
              }
              fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue{ name } }
            }
          }
        }
      }
    }`,
    { login: OWNER, number: PROJECT_NUMBER },
  );
  const project = data.user?.projectV2;
  if (!project) throw new Error("project not found");
  if (project.items.nodes.length >= 100) throw new Error("project has 100+ items, pagination is needed before this script can trust the list");
  const status = project.field;
  const options = Object.fromEntries(status.options.map((o) => [o.name, o.id]));
  for (const needed of ["Next up", "Building now", "Shipped"]) {
    if (!options[needed]) throw new Error(`missing status option ${needed}`);
  }
  const byUrl = new Map();
  for (const it of project.items.nodes) {
    if (!it.content?.url) continue;
    byUrl.set(it.content.url, { itemId: it.id, status: it.fieldValueByName?.name ?? null });
  }
  return { projectId: project.id, statusFieldId: status.id, options, byUrl };
}

async function fetchCandidates(fetchFn, token, repo) {
  const [open, closed] = await Promise.all([
    rest(fetchFn, token, `/repos/${OWNER}/${repo}/issues?state=open&per_page=50`),
    rest(fetchFn, token, `/repos/${OWNER}/${repo}/issues?state=closed&per_page=20&sort=updated&direction=desc`),
  ]);
  if (!Array.isArray(open) || !Array.isArray(closed)) throw new Error(`unexpected issue list for ${repo}`);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentClosed = closed.filter((i) => new Date(i.closed_at).getTime() >= cutoff);
  return [...open, ...recentClosed];
}

// null means: skip this item entirely, it is not board material.
export function classify(issue, { owner = OWNER, now = Date.now(), windowDays = BUILDING_WINDOW_DAYS } = {}) {
  if (NOISE_TITLE_RE.test(issue.title ?? "")) return null;
  const isPr = Boolean(issue.pull_request);
  if (issue.state === "closed") {
    const shipped = isPr ? Boolean(issue.pull_request.merged_at) : issue.state_reason === "completed";
    return shipped ? "Shipped" : null;
  }
  const updated = new Date(issue.updated_at).getTime();
  const fresh = now - updated <= windowDays * 24 * 60 * 60 * 1000;
  const mine = (issue.assignees ?? []).some((a) => a.login === owner);
  return fresh && mine ? "Building now" : "Next up";
}

export async function plan({ fetchFn = fetch, token, root = process.cwd() }) {
  const featured = JSON.parse(readFileSync(join(root, "data/featured.json"), "utf8"));
  const evidence = await collectEvidence({ fetchFn, token, today: new Date().toISOString().slice(0, 10), featured });
  const repos = evidence.projects.map((p) => p.name);
  if (repos.length === 0) throw new Error("no featured repositories, refusing to run against an empty list");

  const board = await loadProject(fetchFn, token);
  const add = [];
  const move = [];
  const seen = new Set();

  for (const repo of repos) {
    const candidates = await fetchCandidates(fetchFn, token, repo);
    for (const issue of candidates) {
      const target = classify(issue);
      if (!target) continue;
      const url = issue.html_url;
      if (seen.has(url)) continue;
      seen.add(url);
      const existing = board.byUrl.get(url);
      if (!existing) {
        add.push({ url, nodeId: issue.node_id, target });
      } else if (existing.status !== "Shipped" && existing.status !== target) {
        move.push({ url, itemId: existing.itemId, from: existing.status, to: target });
      }
    }
  }

  if (add.length > MAX_NEW_PER_RUN) {
    throw new Error(`${add.length} new cards in one run is more than the ${MAX_NEW_PER_RUN} safety cap, a human should look first`);
  }
  return { board, add, move };
}

export async function apply(fetchFn, token, { board, add, move }) {
  for (const { nodeId, target } of add) {
    const data = await gql(
      fetchFn,
      token,
      `mutation($projectId:ID!,$contentId:ID!){ addProjectV2ItemById(input:{projectId:$projectId, contentId:$contentId}){ item{id} } }`,
      { projectId: board.projectId, contentId: nodeId },
    );
    const itemId = data.addProjectV2ItemById.item.id;
    await gql(
      fetchFn,
      token,
      `mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$optionId:String!){
        updateProjectV2ItemFieldValue(input:{projectId:$projectId, itemId:$itemId, fieldId:$fieldId, value:{singleSelectOptionId:$optionId}}){ clientMutationId }
      }`,
      { projectId: board.projectId, itemId, fieldId: board.statusFieldId, optionId: board.options[target] },
    );
  }
  for (const { itemId, to } of move) {
    await gql(
      fetchFn,
      token,
      `mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$optionId:String!){
        updateProjectV2ItemFieldValue(input:{projectId:$projectId, itemId:$itemId, fieldId:$fieldId, value:{singleSelectOptionId:$optionId}}){ clientMutationId }
      }`,
      { projectId: board.projectId, itemId, fieldId: board.statusFieldId, optionId: board.options[to] },
    );
  }
}

export async function sync({ fetchFn = fetch, token, dry = false, root = process.cwd() } = {}) {
  if (!token) throw new Error("GITHUB_TOKEN is required");
  const result = await plan({ fetchFn, token, root });
  if (!dry && (result.add.length || result.move.length)) {
    await apply(fetchFn, token, result);
  }
  return result;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  sync({ token: process.env.GITHUB_TOKEN, dry: process.argv.includes("--dry") })
    .then((r) => {
      console.log(`${r.add.length} new card(s), ${r.move.length} moved`);
      for (const a of r.add) console.log(`  + [${a.target}] ${a.url}`);
      for (const m of r.move) console.log(`  ~ [${m.from ?? "none"} -> ${m.to}] ${m.url}`);
    })
    .catch((e) => {
      console.error(`sync failed, nothing was changed: ${e.message}`);
      process.exit(1);
    });
}
