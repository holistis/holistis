# Hey, I'm Abdellah 👋

I build tools that make AI agents more reliable and more secure. Bug bounty analysis, DeFi bot signals, QA automation, browser automation reliability. On the side, I also run an AI health platform.

---

## Security and reliability tooling

#### [al-yad](https://github.com/holistis/al-yad): Yad, a browser agent
Free and open-source browser agent, in your own real Chrome, on your own computer. Two parts: a Chrome extension and a local Companion app, no cloud copy of your accounts. The API key is encrypted at rest with Windows DPAPI, capped and stoppable with one click, and the security code went through an 18-agent adversarial review plus live attack testing (checkout-bypass attempts, DNS-rebinding, wire-protocol fuzzing) before it shipped, [written up in full](https://wazir-x402.duckdns.org/yad-security). [Add it to Chrome](https://chromewebstore.google.com/detail/dacfhekkemkiikecbjffmbdcohddodea).

#### [muraqib](https://github.com/holistis/muraqib): self-healing nightly QA
Free, self-hosted GitHub Action. Runs your Playwright tests every night, and when one breaks, has Claude read the failure and open a fix PR, for the cost of infrastructure you likely already pay for. Live in production on Longevity AI for months before I open-sourced it. Before making it public I audited it end to end and found, then fixed, three real defects: a script-injection hole, a YAML bug that had silently disabled the auto-fix path since the first commit, and a bug that meant the fix-PR's failure context was always empty. Every fix verified with a reproduction, not a read-through. [Security writeup](https://github.com/holistis/muraqib/blob/main/SECURITY.md). Running it also surfaced a gap in Playwright itself: a CI job timeout kills a run rather than failing it, so no report is written and no alert fires. Reported as [playwright#42533](https://github.com/microsoft/playwright/issues/42533), and the maintainers changed both the [docs](https://github.com/microsoft/playwright/pull/42563) and the [project scaffolding](https://github.com/microsoft/create-playwright/pull/181), so every new Playwright project now gets the safe default. [Write-up](https://dev.to/holistis/a-ci-timeout-is-a-kill-not-a-failure-playwrights-defaults-changed-because-of-it-318j).

#### [tokenizen](https://github.com/holistis/tokenizen): capacity-attest, signed delivery receipts for AI agents
An MCP server for x402 agent commerce. After one agent pays another for capacity (GPU-hours, storage, API credits, bandwidth), the paying agent leaves a signed, factual claim of whether what was promised actually arrived, so the next agent can check a seller's history before paying. No reputation score, no token, no lending, just a signed receipt anyone can verify offline. When a reviewer from the x402 Foundation ([x402#3379](https://github.com/x402-foundation/x402/issues/3379)) asked the two hard questions, can a host hide claims and how does a buyer find claims recorded on another installation, each became working, tested code: a per-buyer signed chain that makes a hidden middle claim detectable, and trustless cross-installation discovery that re-verifies every claim locally. The discovery path was proven live on Base mainnet via the Ethereum Attestation Service, with public attestations anyone can open. Two runnable fixtures let you check the guarantees yourself, and the decision log is honest about what it does not solve (completeness, and demand). Live on [npm](https://www.npmjs.com/package/capacity-attest) and [tokenizen.nl](https://tokenizen.nl).

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

## Open source CI security fixes

I check GitHub Actions workflows across popular open source AI-agent frameworks for the bug class that leaks secrets or lets a broken security check pass silently: actions pinned to a mutable tag instead of a commit hash, PR-controlled values interpolated straight into a shell command, and checks that can never fail. Wrote up the pattern with real examples on [dev.to](https://dev.to/holistis/i-spent-a-day-auditing-github-actions-across-a-dozen-ai-agent-frameworks-5fg6).

That grew into a specific, more serious bug class: AI CLIs (Claude Code, Copilot CLI, Codex) wired directly into a GitHub Actions job, triggered by public, untrusted input, with real secrets in the same job. 22 findings across separate repositories, three confirmed and fixing, one escalated to a major AI team's own security group, six retracted by me after I checked my own assumption against the tool's actual source code and found it wrong. Full breakdown on [dev.to](https://dev.to/holistis/a-github-comment-can-steal-your-secrets-i-found-22-repositories-where-it-could-1doh).

Fixed and published: [pymc-marketing](https://github.com/pymc-labs/pymc-marketing/security/advisories/GHSA-72xh-gfpr-v9hx), a public GitHub Security Advisory, severity High, reported by email, fixed within a day, credited as reporter. [Write-up](https://dev.to/holistis/pymc-labs-has-1256-stars-a-github-issue-title-could-still-steal-their-api-key-1hd6).

Also found and reported by email, also fixed: [sheepworrier/BilliardsScorer](https://github.com/sheepworrier/BilliardsScorer/commit/734b5e3), a stacked script-injection plus missing-author-check bug in a `claude-agent.yml` workflow, both fixed exactly as reported within two days.

Open PRs: [autogen](https://github.com/microsoft/autogen/pull/8205), [semantic-kernel](https://github.com/microsoft/semantic-kernel/pull/14397), [letta-code](https://github.com/letta-ai/letta-code/pull/4279), [adk-python](https://github.com/google/adk-python/pull/7052), [smolagents](https://github.com/huggingface/smolagents/pull/2770), [promptflow](https://github.com/microsoft/promptflow/pull/4221), [langflow](https://github.com/langflow-ai/langflow/pull/14982), [E2B](https://github.com/e2b-dev/E2B/pull/1846), [griptape](https://github.com/griptape-ai/griptape/pull/2307).

Open issues: [mem0](https://github.com/mem0ai/mem0/issues/7260), [camel](https://github.com/camel-ai/camel/issues/4322), [goose](https://github.com/aaif-goose/goose/issues/11914), [mastra](https://github.com/mastra-ai/mastra/issues/23298), [n8n](https://github.com/n8n-io/n8n/issues/38018).

## Working together

Open to paid work on CI/CD supply-chain security and AI-agent hardening. The findings above were found on my own initiative, in passing. If you want that kind of review done deliberately across your own setup, email info@holistischadviseur.nl.

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
