// Shared fake GitHub for the tests: nothing here touches the network.
export const pr = (repo, number, title, day) => ({
  repository_url: `https://api.github.com/repos/${repo}`,
  number,
  title,
  html_url: `https://github.com/${repo}/pull/${number}`,
  closed_at: `${day}T10:00:00Z`,
});

export const UPSTREAM = [
  pr("x402-foundation/x402", 3826, "fix(core): do not mutate the extensions object while building a 402", "2026-10-22"),
  pr("omworldprotocol/om-world", 18, "docs: add buyer-side delivery attestation", "2026-10-20"),
  pr("windmill-labs/windmill", 9680, "fix(home): preserve URL filter state on page refresh", "2026-06-19"),
  pr("cloudfoundry/terraform-provider-cloudfoundry", 592, "fix(provider): guard nil MaintenanceInfo", "2026-09-10"),
  pr("ZoranPandovski/awesome-testing-tools", 135, "Add Muraqib to Automated Testing Tools", "2026-10-07"),
];
export const FIXES = [UPSTREAM[0], UPSTREAM[2], UPSTREAM[3]];

export const repo = (name, over = {}) => ({
  name,
  description: `${name} does one useful thing`,
  homepage: "",
  fork: false,
  archived: false,
  topics: [],
  pushed_at: "2026-10-20T08:00:00Z",
  ...over,
});

export const FEATURED = { seed: ["tokenizen", "muraqib", "postmortems"], topic: "profile-featured", hideTopic: "profile-hidden", max: 12 };

export function fakeFetch({ upstream = UPSTREAM, fixes = FIXES, ownTotal = 361, repos, releases = {}, incomplete = false, failRepos = false } = {}) {
  const reposList = repos ?? [repo("tokenizen"), repo("muraqib"), repo("postmortems"), repo("holistis"), repo("scratch-test")];
  const json = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  const calls = [];
  const fn = async (url) => {
    const u = new URL(url);
    calls.push(u.pathname + u.search);
    if (u.pathname === "/search/issues") {
      const q = u.searchParams.get("q");
      const per = Number(u.searchParams.get("per_page"));
      const page = Number(u.searchParams.get("page"));
      const list = q.endsWith("fix in:title") ? fixes : q.includes("-user:") ? upstream : null;
      if (list === null) return json({ total_count: ownTotal, incomplete_results: incomplete, items: [] });
      return json({ total_count: list.length, incomplete_results: incomplete, items: list.slice((page - 1) * per, page * per) });
    }
    if (u.pathname === "/users/holistis/repos") {
      if (failRepos) return json({}, 500);
      const per = Number(u.searchParams.get("per_page"));
      const page = Number(u.searchParams.get("page") || 1);
      return json(reposList.slice((page - 1) * per, page * per));
    }
    const m = u.pathname.match(/^\/repos\/holistis\/([\w.-]+)\/releases\/latest$/);
    if (m) return releases[m[1]] ? json(releases[m[1]]) : json({ message: "Not Found" }, 404);
    return json({}, 404);
  };
  fn.calls = calls;
  return fn;
}
