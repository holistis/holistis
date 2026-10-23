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

export function summaryMd(ev) {
  const { mergedPrs: n, projects: p, bugFixes: f } = ev.upstream;
  return (
    `I direct AI agents to do real engineering work: research a problem, build the fix, verify it actually holds, and send it to the maintainers. ` +
    `${n} of my pull ${plural(n, "request")} ${n === 1 ? "is" : "are"} merged in other people's projects ` +
    `(${p} ${plural(p, "project")}, ${f} of them bug ${plural(f, "fix", "fixes")}). ` +
    `The rest of my merged pull requests sit in my own repositories, which I do not count as proof. ` +
    `Check the numbers yourself: [all ${n}](${safeSearch(searchLink(ev.queries.upstream))}) and [the ${f} with fix in the title](${safeSearch(searchLink(ev.queries.bugFixes))}).`
  );
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
  out = replaceBlock(out, "projects", projectsMd(ev));
  return out;
}
