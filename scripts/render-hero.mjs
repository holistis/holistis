// Renders assets/hero.svg from data/evidence.json. No dependencies, no network.
// The SVG is one self-contained file: CSS keyframes only, no script, no external
// resource, system fonts, a reduced-motion fallback and a complete first frame.
// Usage: node scripts/render-hero.mjs [evidence.json] [out.svg]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const MONO = "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace";
const SANS = "Avenir Next,Segoe UI,Helvetica Neue,Arial,sans-serif";

const COLOR = { n: "#BFD3CA", us: "#F5C26B", ext: "#34D399" };

// Isometric tiles (2:1). Centers sit on one iso axis, the last stage forks in two.
const TILES = [
  { id: "t1", cx: 710, cy: 130, label: "PAID", kind: "n", chip: "above" },
  { id: "t2", cx: 830, cy: 190, label: "DELIVERED", kind: "n", chip: "above" },
  { id: "t3", cx: 950, cy: 250, label: "SIGNED", kind: "n", chip: "above" },
  { id: "t4b", cx: 1070, cy: 190, label: "CHECKED BY OTHERS", kind: "ext", chip: "above" },
  { id: "t4a", cx: 1070, cy: 310, label: "CHECKED BY US", kind: "us", chip: "below" },
];
const W = 50, H = 25, T = 14;

function tile({ id, cx, cy, kind }) {
  const top = `${cx},${cy - H} ${cx + W},${cy} ${cx},${cy + H} ${cx - W},${cy}`;
  const left = `${cx - W},${cy} ${cx},${cy + H} ${cx},${cy + H + T} ${cx - W},${cy + T}`;
  const right = `${cx + W},${cy} ${cx},${cy + H} ${cx},${cy + H + T} ${cx + W},${cy + T}`;
  const rim = kind === "us" ? "#F5C26B" : kind === "ext" ? "#34D399" : "#4A7A66";
  const rimOpacity = kind === "n" ? 1 : 0.7;
  const glow = kind === "us" ? "#F5C26B" : kind === "ext" ? "#34D399" : "#9DC6D8";
  return `
    <polygon points="${cx},${cy - H + 30} ${cx + W},${cy + 30} ${cx},${cy + H + 30} ${cx - W},${cy + 30}" fill="#000" opacity=".4" filter="url(#blur)"/>
    <polygon points="${left}" fill="#0C1914"/>
    <polygon points="${right}" fill="#10201A"/>
    <polygon points="${top}" fill="#14281F" stroke="${rim}" stroke-opacity="${rimOpacity}" stroke-width="1.4" stroke-linejoin="round"/>
    <polygon class="gl gl-${id}" points="${top}" fill="${glow}"/>`;
}

function chip({ cx, cy, label, kind, chip: where }) {
  const w = Math.round(label.length * 8.8 + 30);
  const y = where === "above" ? cy - 64 : cy + H + T + 14;
  const c = COLOR[kind];
  return `
    <g transform="translate(${cx - w / 2} ${y})">
      <rect width="${w}" height="24" rx="12" fill="#0A1511" stroke="${c}" stroke-opacity=".45"/>
      <text x="${w / 2}" y="16" text-anchor="middle" fill="${c}" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="1.3">${esc(label)}</text>
    </g>`;
}

const MOTES = Array.from({ length: 16 }, (_, i) => {
  const x = 620 + ((i * 137) % 540);
  const y = 70 + ((i * 89) % 330);
  const r = [1.2, 1.8, 2.4][i % 3];
  const gold = i % 4 === 0;
  return `<circle class="mote" cx="${x}" cy="${y}" r="${r}" fill="${gold ? "#F5C26B" : "#9BE8C6"}" style="--d:${7 + (i % 5) * 2}s;--o:-${(i * 1.7).toFixed(1)}s;--a:${gold ? 0.45 : 0.35}"/>`;
}).join("\n    ");

const card = `
      <g transform="matrix(0.894 0.447 -0.894 0.447 0 0)">
        <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#EAF3EE"/>
        <rect x="-10" y="-5" width="16" height="2.4" rx="1.2" fill="#8AA89B"/>
        <rect x="-10" y="0" width="11" height="2.4" rx="1.2" fill="#8AA89B"/>
        <circle cx="8" cy="4.5" r="3.2" fill="#F5C26B"/>
      </g>`;

export function renderHero(ev) {
  const up = ev?.upstream;
  for (const k of ["mergedPrs", "projects", "bugFixes"]) {
    if (!Number.isInteger(up?.[k]) || up[k] < 0) throw new Error(`evidence.upstream.${k} must be a non-negative integer`);
  }
  if (up.bugFixes > up.mergedPrs) throw new Error("bugFixes cannot exceed mergedPrs");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.date ?? "")) throw new Error("evidence.date must be YYYY-MM-DD");
  const fixNames = (up.bugFixProjects ?? []).map((s) => esc(String(s).toUpperCase())).join(" · ");

  const desc =
    `Abdellah Ouadoudi directs AI agents that ship real fixes and keep the receipts. ` +
    `Counted from GitHub on ${ev.date}: ${up.mergedPrs} merged pull requests in ${up.projects} projects owned by others, ` +
    `${up.bugFixes} of them bug fixes, own repositories not counted. ` +
    `The graphic shows a receipt that is paid, delivered and signed, then checked by us and checked by someone else.`;

  const tiles = TILES.map((t) => tile(t)).join("");
  const chips = TILES.map((t) => chip(t)).join("");

  return `<svg width="1200" height="440" viewBox="0 0 1200 440" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Abdellah Ouadoudi, AI agents that ship real fixes and keep the receipts</title>
  <desc id="desc">${esc(desc)}</desc>
  <defs>
    <style>
      .reveal { animation: reveal .9s cubic-bezier(.16,1,.3,1) both; }
      .r2 { animation-delay: .12s; } .r3 { animation-delay: .24s; } .r4 { animation-delay: .38s; } .r5 { animation-delay: .54s; } .r6 { animation-delay: .7s; }
      .lattice { animation: lattice 26s linear infinite; }
      .float { animation: float 9s ease-in-out infinite; }
      .rail { stroke-dasharray: 6 8; animation: rail 2.4s linear infinite; }
      .sweep { animation: sweep 10s cubic-bezier(.65,0,.35,1) infinite; opacity: 0; }
      .live { animation: live 3s ease-in-out infinite; }
      .cardA { opacity: 0; animation: cardA 9s linear infinite; }
      .cardB { opacity: 0; animation: cardB 9s linear infinite; }
      .gl { opacity: 0; }
      .mote { animation: drift var(--d) linear infinite; animation-delay: var(--o); }
      .gl-t1 { animation: g1 9s linear infinite; }
      .gl-t2 { animation: g2 9s linear infinite; }
      .gl-t3 { animation: g3 9s linear infinite; }
      .gl-t4a, .gl-t4b { animation: g4 9s linear infinite; }
      .wave { opacity: 0; transform-box: fill-box; transform-origin: center; animation: wave 9s linear infinite; }
      @keyframes reveal { from { transform: translateY(12px); } to { transform: none; } }
      @keyframes lattice { to { transform: translate(-100px,-50px); } }
      @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      @keyframes drift { 0% { transform: translateY(0); opacity: 0; } 15%,70% { opacity: var(--a); } 100% { transform: translateY(-90px); opacity: 0; } }
      @keyframes rail { to { stroke-dashoffset: -28; } }
      @keyframes sweep { 0%,12% { transform: translateX(0); opacity: 0; } 22%,58% { opacity: 1; } 70%,100% { transform: translateX(1100px); opacity: 0; } }
      @keyframes live { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
      @keyframes cardA {
        0% { transform: translate(0,0); opacity: 0; }
        4%,12% { transform: translate(0,0); opacity: 1; }
        26%,34% { transform: translate(120px,60px); opacity: 1; }
        48%,56% { transform: translate(240px,120px); opacity: 1; }
        72%,86% { transform: translate(360px,180px); opacity: 1; }
        94%,100% { transform: translate(360px,180px); opacity: 0; }
      }
      @keyframes cardB {
        0%,55% { transform: translate(240px,120px); opacity: 0; }
        58% { transform: translate(240px,120px); opacity: 1; }
        72%,86% { transform: translate(360px,60px); opacity: 1; }
        94%,100% { transform: translate(360px,60px); opacity: 0; }
      }
      @keyframes g1 { 0%,2%,14%,100% { opacity: 0; } 6%,10% { opacity: .5; } }
      @keyframes g2 { 0%,24%,36%,100% { opacity: 0; } 28%,32% { opacity: .5; } }
      @keyframes g3 { 0%,50%,62%,100% { opacity: 0; } 54%,58% { opacity: .55; } }
      @keyframes g4 { 0%,68%,94%,100% { opacity: 0; } 76%,86% { opacity: .6; } }
      @keyframes wave { 0%,70% { opacity: 0; transform: scale(.6); } 74% { opacity: .65; } 92%,100% { opacity: 0; transform: scale(1.6); } }
      @media (prefers-reduced-motion: reduce) {
        .reveal { animation: none; transform: none; }
        .lattice, .float, .rail, .live, .gl { animation: none; }
        .mote { display: none; }
        .sweep, .cardA, .cardB, .wave { display: none; }
      }
    </style>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="440" gradientUnits="userSpaceOnUse">
      <stop stop-color="#07110D"/><stop offset=".55" stop-color="#0A1713"/><stop offset="1" stop-color="#0C131C"/>
    </linearGradient>
    <radialGradient id="halo" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(930 240) scale(300 230)">
      <stop stop-color="#34D399" stop-opacity=".13"/><stop offset="1" stop-color="#34D399" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sweepGrad" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E8FFF4" stop-opacity="0"/><stop offset=".5" stop-color="#E8FFF4" stop-opacity=".07"/><stop offset="1" stop-color="#E8FFF4" stop-opacity="0"/>
    </linearGradient>
    <pattern id="iso" width="100" height="50" patternUnits="userSpaceOnUse">
      <path d="M0 25L50 0L100 25L50 50Z" stroke="#9DB0A6" stroke-opacity=".07"/>
    </pattern>
    <filter id="blur" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
    <clipPath id="panel"><rect width="1200" height="440" rx="28"/></clipPath>
  </defs>

  <rect width="1200" height="440" rx="28" fill="url(#bg)"/>
  <g clip-path="url(#panel)">
    <rect class="lattice" x="-100" y="-50" width="1500" height="560" fill="url(#iso)"/>
    <ellipse cx="930" cy="240" rx="300" ry="230" fill="url(#halo)"/>
    ${MOTES}
    <g transform="rotate(18 600 220)"><rect class="sweep" x="-300" y="-120" width="140" height="700" fill="url(#sweepGrad)"/></g>
  </g>
  <rect x="1" y="1" width="1198" height="438" rx="27" stroke="#F4F7F5" stroke-opacity=".08" stroke-width="2"/>

  <g font-family="${MONO}">
    <text class="reveal" x="72" y="66" fill="#F5C26B" font-size="14" font-weight="700" letter-spacing="3">ABDELLAH OUADOUDI · HOLISTIS</text>
    <text class="reveal r2" x="72" y="142" fill="#F4F7F5" font-family="${SANS}" font-size="46" font-weight="800" letter-spacing="-1.4">I direct AI agents</text>
    <text class="reveal r3" x="72" y="200" fill="#F4F7F5" font-family="${SANS}" font-size="46" font-weight="800" letter-spacing="-1.4">that ship real fixes</text>
    <text class="reveal r4" x="72" y="258" fill="#F5C26B" font-family="${SANS}" font-size="46" font-weight="800" letter-spacing="-1.4">and keep the receipts.</text>
    <text class="reveal r5" x="72" y="308" fill="#A9BBB1" font-family="${SANS}" font-size="14">Agent trust infrastructure · x402 receipts · open source security</text>
    <g class="reveal r6">
      <line x1="72" y1="338" x2="640" y2="338" stroke="#22372E"/>
      <circle class="live" cx="78" cy="362" r="5" fill="#34D399"/>
      <text x="94" y="366" fill="#B4C6BC" font-size="12.5" letter-spacing=".5">MERGED IN OTHER PEOPLE'S PROJECTS · ${up.mergedPrs} PRS · ${up.projects} PROJECTS</text>
      <text x="94" y="387" fill="#B4C6BC" font-size="12" letter-spacing=".4">${up.bugFixes} BUG FIXES IN ${fixNames}</text>
      <text x="94" y="410" fill="#7C998B" font-size="11" letter-spacing=".8">OWN REPOSITORIES NOT COUNTED · COUNTED FROM GITHUB ${esc(ev.date)} UTC</text>
    </g>
  </g>

  <g class="float">
${tiles}
    <path class="rail" d="M710 130L950 250" stroke="#9DC6D8" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
    <path class="rail" d="M950 250L1070 310" stroke="#F5C26B" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>
    <path class="rail" d="M950 250L1070 190" stroke="#34D399" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>
    <ellipse class="wave" cx="1070" cy="310" rx="50" ry="25" stroke="#F5C26B" stroke-width="2"/>
    <ellipse class="wave" cx="1070" cy="190" rx="50" ry="25" stroke="#34D399" stroke-width="2"/>
    <g class="cardA"><g transform="translate(710 121)">${card}
    </g></g>
    <g class="cardB"><g transform="translate(710 121)">${card}
    </g></g>${chips}
  </g>

  <text class="reveal r6" x="1150" y="412" text-anchor="end" fill="#6F8B7E" font-family="${SANS}" font-size="13" font-style="italic">paid, delivered, signed, then checked: by us, and by someone else</text>
</svg>
`;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [inPath = "data/evidence.json", outPath = "assets/hero.svg"] = process.argv.slice(2);
  const svg = renderHero(JSON.parse(readFileSync(inPath, "utf8")));
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, svg);
  console.log(`wrote ${outPath} (${svg.length} bytes)`);
}
