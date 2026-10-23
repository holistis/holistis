// Collects every number and list shown on the profile, straight from GitHub.
// No dependencies. Public data only: the token just raises the rate limit.
// Anything unexpected throws, so the caller keeps the last verified evidence.
const API = "https://api.github.com";
const MAX_FIXES_LISTED = 5;
const MAX_QUERY_RESULTS = 900; // the search API stops at 1000, refuse before it silently truncates

export const queries = (account) => ({
  upstream: `author:${account} is:pr is:merged -user:${account}`,
  bugFixes: `author:${account} is:pr is:merged -user:${account} fix in:title`,
  own: `author:${account} is:pr is:merged user:${account}`,
});

export const searchLink = (q) => `https://github.com/search?q=${encodeURIComponent(q).replace(/%20/g, "+")}&type=pullrequests`;

// Unicode line and paragraph separators, built from code points so no source file ever holds them.
const SEPARATORS = new RegExp(`[${String.fromCharCode(0x2028, 0x2029)}]+`, "g");

// One line of plain text, bounded. Everything that comes from GitHub goes through this.
export const clean = (s, max) => {
  const t = String(s ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(SEPARATORS, " ").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 3);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.-]+$/, "") + "...";
};

const isoDay = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(s)) throw new Error(`unexpected date ${String(s).slice(0, 30)}`);
  return s.slice(0, 10);
};

async function api(fetchFn, token, path, { allow404 = false } = {}) {
  const res = await fetchFn(`${API}${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "holistis-profile-refresh",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (allow404 && res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${path.split("?")[0]}`);
  return res.json();
}

async function searchPage(fetchFn, token, q, page, perPage) {
  const j = await api(fetchFn, token, `/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=${perPage}&page=${page}`);
  if (j.incomplete_results) throw new Error("GitHub returned incomplete search results");
  if (!Number.isInteger(j.total_count) || !Array.isArray(j.items)) throw new Error("unexpected search response");
  return j;
}

async function searchAll(fetchFn, token, q) {
  const items = [];
  let total = 0;
  for (let page = 1; page <= 10; page++) {
    const j = await searchPage(fetchFn, token, q, page, 100);
    total = j.total_count;
    if (total > MAX_QUERY_RESULTS) throw new Error(`search returns ${total} results, too many to count safely`);
    items.push(...j.items);
    if (items.length >= total || j.items.length === 0) break;
  }
  if (items.length !== total) throw new Error(`fetched ${items.length} of ${total} search results`);
  return items;
}

async function searchCount(fetchFn, token, q) {
  return (await searchPage(fetchFn, token, q, 1, 1)).total_count;
}

const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
const HTTPS_URL = /^https:\/\/[\w.-]+(\/[\w.\/#?=&%+:~-]*)?$/; // no spaces, quotes, brackets or parentheses

function toPr(item, api_prefix = `${API}/repos/`) {
  if (typeof item.repository_url !== "string" || !item.repository_url.startsWith(api_prefix)) throw new Error("unexpected repository_url");
  const repo = item.repository_url.slice(api_prefix.length);
  if (!REPO_RE.test(repo)) throw new Error(`unexpected repository name ${repo.slice(0, 40)}`);
  if (!Number.isInteger(item.number)) throw new Error("unexpected PR number");
  const url = `https://github.com/${repo}/pull/${item.number}`;
  if (item.html_url !== url) throw new Error(`unexpected PR url for ${repo}#${item.number}`);
  return { repo, number: item.number, title: clean(item.title, 140), url, mergedAt: isoDay(item.closed_at) };
}

const newestFirst = (a, b) => b.mergedAt.localeCompare(a.mergedAt) || b.number - a.number;
const keyOf = (p) => `${p.repo}#${p.number}`;

// Short display name: the repository name, or the owner when the name is long.
export function shortName(repo) {
  const [owner, name] = repo.split("/");
  return (name.length <= 16 ? name : owner).replace(/[-_]+/g, " ");
}

async function collectProjects(fetchFn, token, account, featured) {
  const repos = [];
  for (let page = 1; ; page++) {
    if (page > 5) throw new Error("more than 500 repositories, raise the page limit before trusting this list");
    const batch = await api(fetchFn, token, `/users/${account}/repos?type=owner&sort=pushed&direction=desc&per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("unexpected repository list");
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const seed = new Set(featured.seed);
  const missing = [...seed].filter((n) => !repos.some((r) => r.name === n));
  if (seed.size && missing.length > seed.size / 2) throw new Error(`most featured repositories were not found: ${missing.slice(0, 4).join(", ")}`);

  const chosen = repos
    .filter((r) => /^[\w.-]+$/.test(r.name ?? ""))
    .filter((r) => !r.fork && !r.archived && r.name !== account && r.name !== ".github" && r.description)
    .filter((r) => !(r.topics ?? []).includes(featured.hideTopic))
    .filter((r) => seed.has(r.name) || (r.topics ?? []).includes(featured.topic))
    .sort((a, b) => String(b.pushed_at).localeCompare(String(a.pushed_at)))
    .slice(0, featured.max);

  const out = [];
  for (const r of chosen) {
    const rel = await api(fetchFn, token, `/repos/${account}/${r.name}/releases/latest`, { allow404: true });
    out.push({
      name: r.name,
      url: `https://github.com/${account}/${r.name}`,
      description: clean(r.description, 170),
      homepage: typeof r.homepage === "string" && HTTPS_URL.test(r.homepage) ? r.homepage : null,
      updated: isoDay(r.pushed_at),
      release: rel
        ? { tag: clean(rel.tag_name, 40), date: isoDay(rel.published_at), url: `https://github.com/${account}/${r.name}/releases/tag/${encodeURIComponent(rel.tag_name)}` }
        : null,
    });
  }
  return out;
}

export async function collectEvidence({ fetchFn = fetch, token, account = "holistis", today, featured }) {
  const q = queries(account);
  const upstream = (await searchAll(fetchFn, token, q.upstream)).map((i) => toPr(i)).sort(newestFirst);
  const fixes = (await searchAll(fetchFn, token, q.bugFixes)).map((i) => toPr(i)).sort(newestFirst);
  const ownTotal = await searchCount(fetchFn, token, q.own);

  const known = new Set(upstream.map(keyOf));
  for (const f of fixes) if (!known.has(keyOf(f))) throw new Error(`bug fix ${keyOf(f)} is missing from the upstream set`);

  const fixProjects = [];
  for (const f of fixes) {
    const name = shortName(f.repo);
    if (!fixProjects.includes(name)) fixProjects.push(name);
  }

  return {
    schema: 2,
    account,
    date: isoDay(today),
    queries: q,
    upstream: {
      mergedPrs: upstream.length,
      projects: new Set(upstream.map((p) => p.repo)).size,
      bugFixes: fixes.length,
      bugFixProjects: fixProjects,
      latestFixes: fixes.slice(0, MAX_FIXES_LISTED),
    },
    ownRepos: { mergedPrs: ownTotal, countedAsCredit: false },
    projects: await collectProjects(fetchFn, token, account, featured),
  };
}
