# Hey, I'm Abdellah 👋

I build tools that make AI agents more reliable and more secure. Bug bounty analysis, DeFi bot signals, QA automation, browser automation reliability. On the side, I also run an AI health platform.

---

## Security and reliability tooling

#### [al-yad](https://github.com/holistis/al-yad): Yad, a browser agent
Free and open-source browser agent, in your own real Chrome, on your own computer. Two parts: a Chrome extension and a local Companion app, no cloud copy of your accounts. The API key is encrypted at rest with Windows DPAPI, capped and stoppable with one click, and the security code went through an 18-agent adversarial review plus live attack testing (checkout-bypass attempts, DNS-rebinding, wire-protocol fuzzing) before it shipped, [written up in full](https://wazir-x402.duckdns.org/yad-security). [Add it to Chrome](https://chromewebstore.google.com/detail/dacfhekkemkiikecbjffmbdcohddodea).

#### [muraqib](https://github.com/holistis/muraqib): self-healing nightly QA
Free, self-hosted GitHub Action. Runs your Playwright tests every night, and when one breaks, has Claude read the failure and open a fix PR, for the cost of infrastructure you likely already pay for. Live in production on Longevity AI for months before I open-sourced it. Before making it public I audited it end to end and found, then fixed, three real defects: a script-injection hole, a YAML bug that had silently disabled the auto-fix path since the first commit, and a bug that meant the fix-PR's failure context was always empty. Every fix verified with a reproduction, not a read-through. [Security writeup](https://github.com/holistis/muraqib/blob/main/SECURITY.md).

#### [bug-bounty-intelligence-mcp](https://github.com/holistis/bug-bounty-intelligence-mcp)
MCP server that scans a public Solidity repo through a 7-gate verification framework (Al-Mizaan) to cut LLM false positives. Free pattern search from 1,032 reconciled Sherlock findings, paid full scan via x402. Benchmarked against Slither, including a fix that went upstream.

#### [al-mizaan-judge](https://github.com/holistis/al-mizaan-judge)
A CLI that judges a smart contract bug finding against real platform rules before you spend a submission on Sherlock, Immunefi, or Cantina. Runs deterministic gates plus a Defender vs Attacker vs Judge debate. Built from real audit work, not a generic prompt, and honest about where its own calibration is still unproven.

#### [3ilm-mcp](https://github.com/holistis/3ilm-mcp)
MCP server that returns Sherlock acceptance rates for 12 vulnerability patterns, built from 1,032 reconciled real audit findings across 10 contests. Every number traces back to an actual contest outcome, not an estimate.

#### [automation-guardrails](https://github.com/holistis/automation-guardrails)
Two small guardrails for Playwright and Puppeteer: verify you are still on the right page before acting, and fill contenteditable rich text editors without the silent double write bug. Fixes two failure modes I hit in production, backed by real issue reports.

#### [claude-memory-trim](https://github.com/holistis/claude-memory-trim)
Keeps Claude Code's session memory lean by rotating logs between a hot recent file and a cold archive. Cuts token cost at session start by roughly 60 to 80 percent. 99 lines of vanilla Node.js, no dependencies.

I also write up the failures, not just the wins: [postmortems](https://github.com/holistis/postmortems).

---

## Longevity AI

[Longevity AI](https://longevityai.nl) is an AI-driven health platform for the Dutch market. You answer 28 questions, the system cross-references 10+ organ systems, and generates a personal 6-month nutrition and lifestyle plan. No diagnoses, no medication advice, just direction and something concrete to act on.

Built for people with chronic symptoms but no clear diagnosis, HR teams running wellness checks at scale, and holistic practitioners who want their own client portal. Currently live, roughly 149,000 lines of code, built solo.

It runs with a fair amount of automation behind it: [muraqib](https://github.com/holistis/muraqib) watches it every night and writes and merges its own fixes when tests break, a content pipeline turns new health research into trilingual blog posts every few hours, and a weekly self-improvement loop scores synthetic patient runs and turns the gaps into research queries that make the next report smarter. All of it costs a few cents a week to run.

The stack is TypeScript end to end, CI/CD on Railway, GDPR compliant. Most of the platform repos are private while it is in early access.

---

## Tech stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js_22-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-2596BE?style=flat-square&logo=trpc&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL_9-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)
![Claude API](https://img.shields.io/badge/Claude_API-D97757?style=flat-square&logo=anthropic&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk_Auth-6C47FF?style=flat-square&logo=clerk&logoColor=white)

---

## Links

🌐 Platform: [longevityai.nl](https://longevityai.nl)
📬 Contact: info@holistischadviseur.nl
