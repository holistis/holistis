import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { classify, plan, sync } from "./sync-project.mjs";
import { repo as makeRepo, FEATURED } from "./fixtures.mjs";

const NOW = new Date("2026-11-10T12:00:00Z").getTime();

function sandboxRoot() {
  const root = mkdtempSync(join(tmpdir(), "project-sync-"));
  mkdirSync(join(root, "data"));
  writeFileSync(join(root, "data/featured.json"), JSON.stringify(FEATURED));
  return root;
}

const issue = (over = {}) => ({
  title: "Something real",
  state: "open",
  html_url: "https://github.com/holistis/tokenizen/issues/1",
  node_id: "I_1",
  updated_at: "2026-11-09T12:00:00Z",
  assignees: [],
  ...over,
});

// --- classify(): the pure decision table ---

test("an open issue with no assignee is Next up", () => {
  assert.equal(classify(issue()), "Next up");
});

test("an open issue assigned to the account, updated recently, is Building now", () => {
  assert.equal(classify(issue({ assignees: [{ login: "holistis" }] }), { now: NOW }), "Building now");
});

test("an open issue assigned to the account but stale falls back to Next up", () => {
  assert.equal(classify(issue({ assignees: [{ login: "holistis" }], updated_at: "2026-10-01T00:00:00Z" }), { now: NOW }), "Next up");
});

test("a merged pull request is Shipped", () => {
  assert.equal(classify(issue({ state: "closed", pull_request: { merged_at: "2026-11-01T00:00:00Z" } })), "Shipped");
});

test("a closed, unmerged pull request is skipped", () => {
  assert.equal(classify(issue({ state: "closed", pull_request: { merged_at: null } })), null);
});

test("an issue closed as completed is Shipped", () => {
  assert.equal(classify(issue({ state: "closed", state_reason: "completed" })), "Shipped");
});

test("an issue closed as not planned is skipped, it is not real backlog", () => {
  assert.equal(classify(issue({ state: "closed", state_reason: "not_planned" })), null);
});

test("an auto-generated Muraqib nightly issue is skipped regardless of state", () => {
  assert.equal(classify(issue({ title: "[Muraqib] Nightly tests failed, 0 test(s) failed." })), null);
  assert.equal(classify(issue({ title: "[Muraqib] Nightly tests failed, 0 test(s) failed.", assignees: [{ login: "holistis" }] }), { now: NOW }), null);
});

// --- plan()/sync(): the board-sync loop against a fake GitHub ---

function fakeBoardFetch({ existingItems = [], issuesByRepo = {} } = {}) {
  const PROJECT_ID = "PVT_test";
  const FIELD_ID = "FIELD_status";
  const OPTIONS = { "Next up": "opt-next", "Building now": "opt-building", Shipped: "opt-shipped" };
  const mutations = [];
  const json = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  const names = new Set([...FEATURED.seed, ...Object.keys(issuesByRepo)]);
  const reposList = [...names].map((n) => makeRepo(n));

  return async (url, opts = {}) => {
    const u = new URL(url);
    if (u.pathname === "/graphql") {
      const body = JSON.parse(opts.body);
      if (body.query.includes("projectV2(number:")) {
        return json({
          data: {
            user: {
              projectV2: {
                id: PROJECT_ID,
                field: { id: FIELD_ID, options: Object.entries(OPTIONS).map(([name, id]) => ({ id, name })) },
                items: { nodes: existingItems },
              },
            },
          },
        });
      }
      if (body.query.includes("addProjectV2ItemById")) {
        const itemId = `item-${mutations.length}`;
        mutations.push({ op: "add", contentId: body.variables.contentId, itemId });
        return json({ data: { addProjectV2ItemById: { item: { id: itemId } } } });
      }
      if (body.query.includes("updateProjectV2ItemFieldValue")) {
        mutations.push({ op: "set-status", itemId: body.variables.itemId, optionId: body.variables.optionId });
        return json({ data: { updateProjectV2ItemFieldValue: { clientMutationId: null } } });
      }
      return json({ errors: [{ message: "unexpected query" }] }, 200);
    }
    if (u.pathname === "/users/holistis/repos") return json(reposList);
    const releaseMatch = u.pathname.match(/^\/repos\/holistis\/([\w.-]+)\/releases\/latest$/);
    if (releaseMatch) return json({ message: "Not Found" }, 404);
    const issuesMatch = u.pathname.match(/^\/repos\/holistis\/([\w.-]+)\/issues$/);
    if (issuesMatch) {
      const state = u.searchParams.get("state");
      const all = issuesByRepo[issuesMatch[1]] ?? { open: [], closed: [] };
      return json(state === "open" ? all.open : all.closed);
    }
    if (u.pathname === "/search/issues") return json({ total_count: 0, incomplete_results: false, items: [] });
    return json({}, 404);
  };
}

test("a brand new candidate issue is added and set to Next up", async () => {
  const fetchFn = fakeBoardFetch({
    issuesByRepo: {
      tokenizen: { open: [issue({ html_url: "https://github.com/holistis/tokenizen/issues/9", node_id: "I_9" })], closed: [] },
    },
  });
  const r = await plan({ fetchFn, token: "t", root: sandboxRoot() });
  assert.equal(r.add.length, 1);
  assert.equal(r.add[0].target, "Next up");
  assert.equal(r.move.length, 0);
});

test("an item already on the board that is now merged moves to Shipped", async () => {
  const url = "https://github.com/holistis/tokenizen/pull/9";
  const fetchFn = fakeBoardFetch({
    existingItems: [{ id: "item-existing", content: { url, state: "open" }, fieldValueByName: { name: "Next up" } }],
    issuesByRepo: {
      tokenizen: { open: [], closed: [issue({ html_url: url, pull_request: { merged_at: "2026-11-05T00:00:00Z" }, state: "closed", closed_at: "2026-11-05T00:00:00Z" })] },
    },
  });
  const r = await plan({ fetchFn, token: "t", root: sandboxRoot() });
  assert.equal(r.add.length, 0);
  assert.equal(r.move.length, 1);
  assert.equal(r.move[0].to, "Shipped");
});

test("an item already Shipped never moves again, even if it would reclassify", async () => {
  const url = "https://github.com/holistis/tokenizen/pull/9";
  const fetchFn = fakeBoardFetch({
    existingItems: [{ id: "item-existing", content: { url, state: "open" }, fieldValueByName: { name: "Shipped" } }],
    issuesByRepo: { tokenizen: { open: [issue({ html_url: url, node_id: "I_9" })], closed: [] } },
  });
  const r = await plan({ fetchFn, token: "t", root: sandboxRoot() });
  assert.equal(r.add.length, 0);
  assert.equal(r.move.length, 0);
});

test("dry run computes the plan but writes nothing", async () => {
  const fetchFn = fakeBoardFetch({
    issuesByRepo: { tokenizen: { open: [issue({ html_url: "https://github.com/holistis/tokenizen/issues/9", node_id: "I_9" })], closed: [] } },
  });
  const r = await sync({ fetchFn, token: "t", dry: true, root: sandboxRoot() });
  assert.equal(r.add.length, 1);
});

test("more new cards than the safety cap stops the run before writing anything", async () => {
  const open = Array.from({ length: 25 }, (_, i) =>
    issue({ html_url: `https://github.com/holistis/tokenizen/issues/${i}`, node_id: `I_${i}` }),
  );
  const fetchFn = fakeBoardFetch({ issuesByRepo: { tokenizen: { open, closed: [] } } });
  await assert.rejects(() => plan({ fetchFn, token: "t", root: sandboxRoot() }), /safety cap/);
});

test("sync without a token refuses outright", async () => {
  await assert.rejects(() => sync({ token: undefined }), /GITHUB_TOKEN/);
});
