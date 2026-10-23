// Fills the generated blocks of README.md from data/evidence.json.
// Hand-written text outside the markers is never touched.
import { searchLink } from "./update-evidence.mjs";

// Text that came from GitHub is data, never markup: one line, markdown characters escaped.
// Bare URLs, www. hosts and e-mail addresses are broken up too, so GitHub does not turn them into links.
export const mdText = (s) =>
  String(s)
    .replace(/[\\`*_\[\]<>|~]/g, "\\$&")
    .replace(/:\/\//g, ":\\/\\/")
    .replace(/\bwww\./gi, (m) => `${m.slice(0, -1)}\\.`)
    .replace(/@/g, "\\@")
    .replace(/\s+/g, " ")
    .trim();

const GITHUB_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/[\w.\/#?=&%+:~-]*)?$/;
const HTTPS_URL = /^https:\/\/[\w.-]+(\/[\w.\/#?=&%+:~-]*)?$/;
const safeUrl = (u) => {
  if (!GITHUB_URL.test(u)) throw new Error(`refusing to write a non-GitHub link: ${String(u).slice(0, 60)}`);
  return u;
};
const SEARCH_URL = /^https:\/\/github\.com\/search\?q=[\w%+.:-]+&type=pullrequests$/;
const safeSearch = (u) => {
  if (!SEARCH_URL.test(u)) throw new Error(`refusing to write an unexpected search link: ${String(u).slice(0, 60)}`);
  return u;
};
const safeHttps = (u) => {
  if (!HTTPS_URL.test(u)) throw new Error(`refusing to write an unsafe link: ${String(u).slice(0, 60)}`);
  return u;
};

const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);

// Every number is a link to the public GitHub search that produces it.
export function summaryMd(ev) {
  const u = ev.upstream;
  const total = ev.totals.mergedPrs;
  const link = (text, q) => `[${text}](${safeSearch(searchLink(q))})`;
  return (
    `I direct AI agents to do real engineering work: research a problem, build the fix, verify it holds, and ship it.\n\n` +
    `${link(`${total} pull ${plural(total, "request")} merged`, ev.queries.total)}: ${ev.ownRepos.mergedPrs} in my own repositories, where the tools below live, ` +
    `and ${link(`${u.mergedPrs} in other people's projects`, ev.queries.upstream)} across ${u.projects} ${plural(u.projects, "project")}, ` +
    `${link(`${u.bugFixes} of them bug ${plural(u.bugFixes, "fix", "fixes")}`, ev.queries.bugFixes)}. ` +
    `I have sent ${link(`${u.sent} to other projects`, ev.queries.sent)} so far, ${link(`${u.open} still open`, ev.queries.open)}.\n\n` +
    `<sub>Counted from public GitHub data on ${ev.date}.</sub>`
  );
}

export function openMd(ev) {
  const list = ev.upstream.openLatest;
  if (!list.length) return "";
  const lines = list.map((x) => `- ${x.openedAt} [${x.repo}#${x.number}](${safeUrl(x.url)}) ${mdText(x.title)}`);
  return `Open now in other people's projects, code and spec changes, newest first:\n\n${lines.join("\n")}`;
}

export function fixesMd(ev) {
  const list = ev.upstream.latestFixes;
  if (!list.length) return "";
  const lines = list.map((x) => `- ${x.mergedAt} [${x.repo}#${x.number}](${safeUrl(x.url)}) ${mdText(x.title)}`);
  return `Bug fixes merged by other maintainers, newest first:\n\n${lines.join("\n")}`;
}

export function projectsMd(ev) {
  return ev.projects
    .map((p) => {
      const rel = p.release ? ` Latest release [${mdText(p.release.tag)}](${safeUrl(p.release.url)}), ${p.release.date}.` : "";
      const site = p.homepage ? ` [Website](${safeHttps(p.homepage)}).` : "";
      return `- [${mdText(p.name)}](${safeUrl(p.url)}): ${mdText(p.description)}${rel}${site} Updated ${p.updated}.`;
    })
    .join("\n");
}

export function replaceBlock(text, name, body) {
  const start = `<!-- profile:${name}:start -->`;
  const end = `<!-- profile:${name}:end -->`;
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i === -1 || j === -1 || j < i || text.lastIndexOf(start) !== i || text.lastIndexOf(end) !== j) {
    throw new Error(`README needs exactly one ${start} ... ${end} pair`);
  }
  return `${text.slice(0, i + start.length)}\n${body.trim()}\n${text.slice(j)}`;
}

export function applyBlocks(readme, ev) {
  let out = replaceBlock(readme, "summary", summaryMd(ev));
  out = replaceBlock(out, "fixes", fixesMd(ev));
  out = replaceBlock(out, "open", openMd(ev));
  out = replaceBlock(out, "projects", projectsMd(ev));
  return out;
}
