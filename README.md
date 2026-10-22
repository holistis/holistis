# Hey, I'm Abdellah 👋

I direct AI agents to do real engineering work: research a problem, build the fix, verify it actually holds, and get it through a real maintainer's review. 375 merged pull requests across dozens of repositories prove the loop works at scale.

**Currently active in:**
- **Agent-commerce trust infrastructure**: [tokenizen](https://github.com/holistis/tokenizen), signed delivery receipts for AI agents, live on Base mainnet (chain eip155:8453, verified directly off the live payment header). Independently rebuilt from scratch in a separate stack by two different engineers, 7/7 and 12/12 match on the test vectors including adversarial cases. Cited as the source of truth in a draft ERC-8004 feedback convention, and a third protocol linked our verifier in its own official docs. [Details](https://github.com/holistis/tokenizen/blob/main/packages/capacity-attest/README.md#onafhankelijk-gecontroleerd-niet-alleen-beweerd).
- **x402 protocol itself**: found and fixed a bug where `createPaymentRequiredResponse` silently dropped part of its own extensions declaration. [Merged by the maintainer](https://github.com/x402-foundation/x402/pull/3826).
- **x402 receipt verification**: [agent-receipt-verify](https://github.com/holistis/agent-receipt-verify), one command checks whether a paid endpoint follows the x402 spec, no account, no key. Measured against 60 real sellers from the Coinbase index on 18 October 2026: caught 38 false failures in our own first version, now zero.
- **AI agents running real infrastructure**: [al-yad](https://github.com/holistis/al-yad) drives a browser autonomously, reviewed by 18 adversarial agents plus live attack testing before shipping. [muraqib](https://github.com/holistis/muraqib) opens its own fix PRs when nightly tests break and once [surfaced a real bug in Playwright itself](https://github.com/microsoft/playwright/pull/42563), fixed by their own maintainers.
- **AI-agent security research**: 22+ vulnerabilities found across major open source AI tools, including a High-severity one in GitHub's own infrastructure. [Details below](#open-source-ci-security-fixes).
- **Smart contract security**: [bug-bounty-intelligence-mcp](https://github.com/holistis/bug-bounty-intelligence-mcp) and [al-mizaan-judge](https://github.com/holistis/al-mizaan-judge), built from real Sherlock/Immunefi audit work on 1,032 reconciled findings.
- **AI-driven health platform**: [Longevity AI](https://longevityai.nl), solo-built, live for the Dutch market, 149,000 lines of code.

---

## Projects

- **[tokenizen](https://github.com/holistis/tokenizen)**: capacity-attest, signed delivery receipts for AI-agent commerce over x402. No reputation score, no token, just a receipt anyone can verify offline. Live on Base mainnet, on [npm](https://www.npmjs.com/package/capacity-attest) and [tokenizen.nl](https://tokenizen.nl).
- **[agent-receipt-verify](https://github.com/holistis/agent-receipt-verify)**: `npx -y agent-receipt-verify <url>` checks a paid endpoint before you pay, offline, no account. Carries 19 conformance vectors for x402 spec section 5.5 and 12 receipt-to-settlement vectors in another project's own layout. Four maintainers of related specs have adopted the four-outcome vocabulary it uses, including the split between a failed check and a check that could not run.
- **[al-yad](https://github.com/holistis/al-yad)**: Yad, a free open-source browser agent that runs in your own Chrome. API key encrypted at rest, capped, stoppable with one click. Security-reviewed with 18 adversarial agents plus live attack testing before shipping. [Security writeup](https://x402.tokenizen.nl/yad-security) · [Add to Chrome](https://chromewebstore.google.com/detail/dacfhekkemkiikecbjffmbdcohddodea).
- **[muraqib](https://github.com/holistis/muraqib)**: self-healing nightly QA. Runs your Playwright tests every night, has Claude open a fix PR when one breaks. Reviewed before release (3 real defects found and fixed), and reporting it [surfaced a real Playwright bug the maintainers fixed upstream](https://github.com/microsoft/playwright/pull/42563). [Write-up](https://dev.to/holistis/a-ci-timeout-is-a-kill-not-a-failure-playwrights-defaults-changed-because-of-it-318j).
- **[bug-bounty-intelligence-mcp](https://github.com/holistis/bug-bounty-intelligence-mcp)**: MCP server that scans Solidity repos through a 7-gate framework to cut LLM false positives. Free pattern search from 1,032 reconciled Sherlock findings, paid full scan via x402.
- **[al-mizaan-judge](https://github.com/holistis/al-mizaan-judge)**: judges a smart contract bug finding against real platform rules before you spend a submission on Sherlock, Immunefi, or Cantina.
- **[3ilm-mcp](https://github.com/holistis/3ilm-mcp)**: Sherlock acceptance rates for 12 vulnerability patterns, built from 1,032 reconciled real audit findings.
- **[automation-guardrails](https://github.com/holistis/automation-guardrails)**: two small Playwright/Puppeteer guardrails, fixing failure modes I hit in production.
- **[claude-memory-trim](https://github.com/holistis/claude-memory-trim)**: keeps Claude Code's session memory lean, cuts token cost at session start by 60 to 80 percent.
- **[postmortems](https://github.com/holistis/postmortems)**: I write up the failures too, not just the wins.

---

## Open source CI security fixes

I check GitHub Actions workflows across popular open source AI-agent frameworks for the bug class that leaks secrets or lets a broken security check pass silently, and, more specifically, AI CLIs (Claude Code, Copilot CLI, Codex) wired directly into a job and triggered by public, untrusted input, with real secrets sitting in the same job. 22 findings across separate repositories this month, three confirmed and fixing, one escalated to a major AI team's own security group, six retracted by me after I checked my own assumption against the tool's actual source code and found it wrong.

Background: [the original CI-hygiene piece](https://dev.to/holistis/i-spent-a-day-auditing-github-actions-across-a-dozen-ai-agent-frameworks-5fg6) and [the full 22-repository breakdown](https://dev.to/holistis/a-github-comment-can-steal-your-secrets-i-found-22-repositories-where-it-could-1doh).

**Confirmed and fixed**

- [pymc-marketing](https://github.com/pymc-labs/pymc-marketing/security/advisories/GHSA-72xh-gfpr-v9hx): public GitHub Security Advisory, severity High, reported by email, fixed within a day, credited as reporter. [Write-up](https://dev.to/holistis/pymc-labs-has-1256-stars-a-github-issue-title-could-still-steal-their-api-key-1hd6).
- [sheepworrier/BilliardsScorer](https://github.com/sheepworrier/BilliardsScorer/commit/734b5e3): script-injection plus missing-author-check in a `claude-agent.yml` workflow, reported by email, both fixed exactly as reported within two days.
- `github/request-marketplace-action`: unquoted shell variable in a self-hosted-runner workflow allowed argument injection into a git clone call next to a live privileged token, reported through GitHub's private vulnerability disclosure process, severity High, credited as reporter (accepted), fix verified live in the current code. Advisory itself is not yet public, so no link here.

**Open PRs**: [autogen](https://github.com/microsoft/autogen/pull/8205), [semantic-kernel](https://github.com/microsoft/semantic-kernel/pull/14397), [letta-code](https://github.com/letta-ai/letta-code/pull/4279), [adk-python](https://github.com/google/adk-python/pull/7052), [smolagents](https://github.com/huggingface/smolagents/pull/2770), [promptflow](https://github.com/microsoft/promptflow/pull/4221), [langflow](https://github.com/langflow-ai/langflow/pull/14982), [E2B](https://github.com/e2b-dev/E2B/pull/1846), [griptape](https://github.com/griptape-ai/griptape/pull/2307).

**Open issues**: [mem0](https://github.com/mem0ai/mem0/issues/7260), [camel](https://github.com/camel-ai/camel/issues/4322), [goose](https://github.com/aaif-goose/goose/issues/11914), [mastra](https://github.com/mastra-ai/mastra/issues/23298), [n8n](https://github.com/n8n-io/n8n/issues/38018).

## Working together

Open to roles and freelance work in AI agent infrastructure and orchestration, plus CI/CD supply-chain security and AI-agent hardening. The security findings above were found on my own initiative, in passing. Email info@holistischadviseur.nl.

---

## Longevity AI

[Longevity AI](https://longevityai.nl) is an AI-driven health platform for the Dutch market: 28 questions in, a personal 6-month nutrition and lifestyle plan out, no diagnoses or medication advice. Built for people with chronic symptoms but no clear diagnosis, HR wellness programs, and holistic practitioners who want their own client portal. Live, roughly 149,000 lines of code, built solo, TypeScript end to end, GDPR compliant.

Runs on its own automation: [muraqib](https://github.com/holistis/muraqib) watches it nightly and merges its own fixes, a content pipeline turns new health research into trilingual posts every few hours, and a weekly self-improvement loop scores synthetic patient runs to sharpen the next report. All of it costs a few cents a week.

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
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat-square&logo=solidity&logoColor=white)
![Foundry](https://img.shields.io/badge/Foundry-000000?style=flat-square)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude_API-D97757?style=flat-square&logo=anthropic&logoColor=white)
![Claude Agent SDK](https://img.shields.io/badge/Claude_Agent_SDK-D97757?style=flat-square)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=flat-square)
![Base](https://img.shields.io/badge/Base-0052FF?style=flat-square)
![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat-square&logo=solana&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk_Auth-6C47FF?style=flat-square&logo=clerk&logoColor=white)

---

## Links

🌐 Platform: [longevityai.nl](https://longevityai.nl)
📬 Contact: info@holistischadviseur.nl
