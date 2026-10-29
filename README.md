<!-- profile:hero:start -->
<div align="center">
<img src="./assets/hero.svg?v=b5261c7b" width="100%" alt="Abdellah Ouadoudi, AI agents that ship real fixes and keep the receipts. The merged pull request counts are taken from GitHub and written out below." />
</div>
<!-- profile:hero:end -->

# Hey, I'm Abdellah 👋

<!-- profile:summary:start -->
I direct AI agents to do real engineering work: research a problem, build the fix, verify it holds, and ship it.

[362 pull requests merged](https://github.com/search?q=author%3Aholistis+is%3Apr+is%3Amerged+is%3Apublic&type=pullrequests): 336 in my own repositories, where the tools below live, and [26 in other people's projects](https://github.com/search?q=author%3Aholistis+is%3Apr+is%3Amerged+-user%3Aholistis+is%3Apublic&type=pullrequests) across 17 projects, [6 of them bug fixes](https://github.com/search?q=author%3Aholistis+is%3Apr+is%3Amerged+-user%3Aholistis+fix+in%3Atitle+is%3Apublic&type=pullrequests). I have sent [117 to other projects](https://github.com/search?q=author%3Aholistis+is%3Apr+-user%3Aholistis+is%3Apublic&type=pullrequests) so far, [53 still open](https://github.com/search?q=author%3Aholistis+is%3Apr+is%3Aopen+-user%3Aholistis+is%3Apublic&type=pullrequests).

<sub>Counted from public GitHub data on 2026-10-29.</sub>
<!-- profile:summary:end -->

### Found, reported and fixed: secret redaction in autoharness

[autoharness](https://github.com/tigerless-labs/autoharness) (10,442 stars on 2026-10-28) distills skills from real AI coding sessions, and its redaction function is meant to keep secrets out of the evidence files it writes. I tested that function on its own, not the whole tool, with 17 secret formats in 4 contexts each (bare in prose, in a KEY=value line, in JSON, in a multi-line log), using made-up values generated from a fixed seed. Bare vendor keys (Stripe, OpenAI, Anthropic, Google, npm, JWT) and the variable names AWS_SECRET_ACCESS_KEY and STRIPE_SECRET_KEY stayed readable.

- Found: [issue #277](https://github.com/tigerless-labs/autoharness/issues/277) with the method, the numbers, and what already held up.
- Fixed: [pull request #278](https://github.com/tigerless-labs/autoharness/pull/278) adds six redaction rules and a broader variable-name rule, plus a seeded test that puts no token-shaped value in the repository. In my 68-case check the leaks went from 20 to 4, and the PR names the four that are left and why I did not guess a rule for them. The full suite passed (710 tests) and the linter was clean.
- Outcome: merged by the maintainers on 2026-10-28, and issue #277 closed as completed.

<!-- profile:merged:start -->
Latest changes merged by other maintainers, of any kind, newest first:

- 2026-10-28 [tigerless-labs/autoharness#278](https://github.com/tigerless-labs/autoharness/pull/278) fix(redact): redact bare vendor-prefixed keys and secret-named variables
- 2026-10-27 [x402-foundation/x402#3954](https://github.com/x402-foundation/x402/pull/3954) docs(extensions): bind the payment identifier to a request fingerprint in the idempotency example
- 2026-10-22 [x402-foundation/x402#3826](https://github.com/x402-foundation/x402/pull/3826) fix(core): do not mutate the extensions object while building a 402
- 2026-10-20 [omworldprotocol/om-world#18](https://github.com/omworldprotocol/om-world/pull/18) docs: add buyer-side delivery attestation with explicit evidence limits
- 2026-09-18 [devrelopers/shell-mcp#1](https://github.com/devrelopers/shell-mcp/pull/1) Deny find's -exec/-execdir/-ok/-okdir/-delete regardless of allowlist
<!-- profile:merged:end -->

<!-- profile:fixes:start -->
Bug fixes merged by other maintainers, newest first:

- 2026-10-28 [tigerless-labs/autoharness#278](https://github.com/tigerless-labs/autoharness/pull/278) fix(redact): redact bare vendor-prefixed keys and secret-named variables
- 2026-10-22 [x402-foundation/x402#3826](https://github.com/x402-foundation/x402/pull/3826) fix(core): do not mutate the extensions object while building a 402
- 2026-09-10 [cloudfoundry/terraform-provider-cloudfoundry#592](https://github.com/cloudfoundry/terraform-provider-cloudfoundry/pull/592) fix(provider): guard nil MaintenanceInfo on managed service instance create
- 2026-07-03 [nexu-io/open-design#5078](https://github.com/nexu-io/open-design/pull/5078) fix(amr): normalize Vela JSON catalog ids on the live fetchModels path (fixes #4410)
- 2026-06-24 [activepieces/activepieces#13806](https://github.com/activepieces/activepieces/pull/13806) fix(cal-com): migrate webhook registration from decommissioned API v1…
<!-- profile:fixes:end -->

<!-- profile:open:start -->
Open now in other people's projects, code and spec changes, newest first:

- 2026-10-26 [x402-foundation/x402#3958](https://github.com/x402-foundation/x402/pull/3958) docs(specs): known-answer vectors for section 5.5 canonicalization
- 2026-10-23 [Chain-Love/chain-love#4786](https://github.com/Chain-Love/chain-love/pull/4786) Add Bug Bounty Intelligence (provider, MCP server and security scanner on Base)
- 2026-10-16 [x402-foundation/x402#3830](https://github.com/x402-foundation/x402/pull/3830) spec(offer-receipt): add the svm-memo authorization method
- 2026-09-28 [x402-foundation/x402#3604](https://github.com/x402-foundation/x402/pull/3604) specs: propose Buyer Delivery Claim extension
- 2026-09-15 [inercia/MCPShell#54](https://github.com/inercia/MCPShell/pull/54) Fix shell-quote injection in the weather example, add a shellQuote template helper
- 2026-09-15 [cnosuke/mcp-command-exec#1](https://github.com/cnosuke/mcp-command-exec/pull/1) Validate arguments, not just the program name, in IsCommandAllowed
<!-- profile:open:end -->

<sub>The numbers, the two lists above and the project list below refresh on their own from public GitHub data, see [data/evidence.json](data/evidence.json).</sub>

### Currently active in
- Agent-commerce trust infrastructure: [tokenizen](https://github.com/holistis/tokenizen), signed delivery receipts for AI agents over x402, live on Base mainnet. Other engineers have checked it from the outside: a clean-room Python verifier by [goun7](https://github.com/x402-foundation/x402/issues/2887#issuecomment-5687398497) matched all 7 test vectors and now runs on every push in Tamga, [StelarDigital](https://github.com/x402-foundation/x402/issues/2833#issuecomment-5680708467) ran the metered vector 12 of 12 green, a protocol maintainer linked our verifier in his [official docs](https://github.com/inamprotocol/inam-protocol/pull/143), and two developers built on the claim format in [asm-spec](https://github.com/YE-YI7/asm-spec/pull/18) and [again](https://github.com/YE-YI7/asm-spec/pull/19). A draft ERC-8004 convention takes its metered delivery block from [our spec](https://github.com/predgeAI/erc8004-outcome-validator/blob/2c4d745f1205ba91f3aabded221b5b5acdbcb5ed/grounded-feedback/README.md). [All the evidence](https://github.com/holistis/tokenizen/blob/main/packages/capacity-attest/README.md#independently-checked-not-just-claimed).
- x402 protocol itself: found and fixed a bug in the core library where building a 402 response overwrote part of a route's own extensions declaration. [Merged by the maintainers](https://github.com/x402-foundation/x402/pull/3826).
- x402 receipt verification: [agent-receipt-verify](https://github.com/holistis/agent-receipt-verify), one command checks whether a paid endpoint follows the x402 spec, no account, no key. Benchmarked against 60 real sellers from the Coinbase index, with the [method in the repo](https://github.com/holistis/agent-receipt-verify/blob/main/bench/methodefout.mjs).
- AI agents running real infrastructure: [al-yad](https://github.com/holistis/al-yad) is a free open-source browser agent for your own Chrome, put through an 18-agent adversarial code review and attack runs against the real running code before release ([write-up](https://x402.tokenizen.nl/yad-security)). [muraqib](https://github.com/holistis/muraqib) opens its own fix PRs when nightly tests break, and its work surfaced a gap in Playwright's [CI guidance](https://github.com/microsoft/playwright/issues/42533) that a Playwright maintainer [fixed the next day](https://github.com/microsoft/playwright/pull/42563).
- AI-agent security research: flagged 22 AI-agent repositories for a CI bug class that leaks secrets. 3 confirmed and fixed, among them a High-severity [GitHub Security Advisory](https://github.com/pymc-labs/pymc-marketing/security/advisories/GHSA-72xh-gfpr-v9hx) with credit, plus a High-severity report accepted by GitHub for its own infrastructure. [Details below](#open-source-ci-security-fixes).
- Smart contract security: [bug-bounty-intelligence-mcp](https://github.com/holistis/bug-bounty-intelligence-mcp) and [al-mizaan-judge](https://github.com/holistis/al-mizaan-judge), built on [1,032 findings from 10 Sherlock audit contests](https://github.com/holistis/3ilm-mcp).
- AI-driven health platform: [Longevity AI](https://longevityai.nl), live for the Dutch market, built solo, roughly 190,000 lines of code.

---

## Projects

<!-- profile:projects:start -->
- [tokenizen](https://github.com/holistis/tokenizen): Lets AI agents record, in a way anyone can check, whether they actually got what they paid another agent for over x402. Cites and reads the agent-economy stack it... Latest release [v0.5.0](https://github.com/holistis/tokenizen/releases/tag/v0.5.0), 2026-09-06. [Website](https://tokenizen.nl). Updated 2026-10-29.
- [agent-receipt-verify](https://github.com/holistis/agent-receipt-verify): MCP server and library for independent verification of agent payment and outcome receipts. Written against the published specs, tested against the protocol authors'... Latest release [v0.2.1](https://github.com/holistis/agent-receipt-verify/releases/tag/v0.2.1), 2026-10-17. Updated 2026-10-28.
- [bug-bounty-intelligence-mcp](https://github.com/holistis/bug-bounty-intelligence-mcp): MCP server that scans Solidity repos through a 7-gate verification framework (Al-Mizaan) to cut LLM false positives, benchmarked against Slither; free pattern-search... Latest release [v1.0.3](https://github.com/holistis/bug-bounty-intelligence-mcp/releases/tag/v1.0.3), 2026-07-29. Updated 2026-10-26.
- [muraqib-agent-watch](https://github.com/holistis/muraqib-agent-watch): Free, instant capability check for any MCP server: what can it actually do, and does it say so Updated 2026-10-23.
- [al-yad](https://github.com/holistis/al-yad): Yad: a free, open-source, local-first browser agent. Chrome extension (Part A, the hand) + local Companion (Part B, the brain). Your API key is encrypted on your... Latest release [v0.1.2-companion-npm-standin](https://github.com/holistis/al-yad/releases/tag/v0.1.2-companion-npm-standin), 2026-09-11. [Website](https://yadagent.com). Updated 2026-10-11.
- [muraqib](https://github.com/holistis/muraqib): Nightly Playwright QA that tells you when it stops watching. npx muraqib doctor finds the silent-cancel bug in any existing setup. Claude opens the fix PR. MIT, no... Latest release [v0.3.4](https://github.com/holistis/muraqib/releases/tag/v0.3.4), 2026-09-29. [Website](https://www.npmjs.com/package/muraqib). Updated 2026-09-29.
- [claude-memory-trim](https://github.com/holistis/claude-memory-trim): Keeps Claude Code session memory lean by rotating session logs between hot and cold storage. Cuts token cost at session start by 60-80%. Updated 2026-09-08.
- [al-mizaan-judge](https://github.com/holistis/al-mizaan-judge): Strict 7-gate validity judge for a smart-contract bug bounty finding, a second opinion before you spend a Sherlock/Immunefi/Cantina submission. Updated 2026-09-08.
- [3ilm-mcp](https://github.com/holistis/3ilm-mcp): MCP server: 1,032 verified smart contract vulnerability findings from 10 Sherlock audit contests Updated 2026-09-08.
- [postmortems](https://github.com/holistis/postmortems): Short technical postmortems: what looked right, what turned out wrong Updated 2026-08-24.
- [automation-guardrails](https://github.com/holistis/automation-guardrails): Two small guardrails for Playwright/Puppeteer: verify you're on the right page, and fill contenteditable/rich-text editors without the silent double-write bug Updated 2026-08-03.
<!-- profile:projects:end -->

---

## Open source CI security fixes

I check GitHub Actions workflows across popular open source AI-agent frameworks for the bug class that leaks secrets or lets a broken security check pass silently, and, more specifically, AI CLIs (Claude Code, Copilot CLI, Codex) wired directly into a job and triggered by public, untrusted input, with real secrets sitting in the same job. 22 findings across separate repositories this month, three confirmed and fixing, one escalated to a major AI team's own security group, six retracted by me after I checked my own assumption against the tool's actual source code and found it wrong.

Background: [the original CI-hygiene piece](https://dev.to/holistis/i-spent-a-day-auditing-github-actions-across-a-dozen-ai-agent-frameworks-5fg6) and [the full 22-repository breakdown](https://dev.to/holistis/a-github-comment-can-steal-your-secrets-i-found-22-repositories-where-it-could-1doh).

### Confirmed and fixed

- [pymc-marketing](https://github.com/pymc-labs/pymc-marketing/security/advisories/GHSA-72xh-gfpr-v9hx): public GitHub Security Advisory, severity High, reported by email, fixed within a day, credited as reporter. [Write-up](https://dev.to/holistis/pymc-labs-has-1256-stars-a-github-issue-title-could-still-steal-their-api-key-1hd6).
- [sheepworrier/BilliardsScorer](https://github.com/sheepworrier/BilliardsScorer/commit/734b5e3): script-injection plus missing-author-check in a `claude-agent.yml` workflow, reported by email, both fixed exactly as reported within two days.
- `github/request-marketplace-action`: unquoted shell variable in a self-hosted-runner workflow allowed argument injection into a git clone call next to a live privileged token, reported through GitHub's private vulnerability disclosure process, severity High, credited as reporter (accepted), fix verified live in the current code. Advisory itself is not yet public, so no link here.

Open PRs: [autogen](https://github.com/microsoft/autogen/pull/8205), [semantic-kernel](https://github.com/microsoft/semantic-kernel/pull/14397), [letta-code](https://github.com/letta-ai/letta-code/pull/4279), [adk-python](https://github.com/google/adk-python/pull/7052), [smolagents](https://github.com/huggingface/smolagents/pull/2770), [promptflow](https://github.com/microsoft/promptflow/pull/4221), [langflow](https://github.com/langflow-ai/langflow/pull/14982), [E2B](https://github.com/e2b-dev/E2B/pull/1846), [griptape](https://github.com/griptape-ai/griptape/pull/2307).

Open issues: [mem0](https://github.com/mem0ai/mem0/issues/7260), [camel](https://github.com/camel-ai/camel/issues/4322), [goose](https://github.com/aaif-goose/goose/issues/11914), [mastra](https://github.com/mastra-ai/mastra/issues/23298), [n8n](https://github.com/n8n-io/n8n/issues/38018).

## Working together

Open to roles and freelance work in AI agent infrastructure and orchestration, plus CI/CD supply-chain security and AI-agent hardening. The security findings above were found on my own initiative, in passing. Email info@holistischadviseur.nl.

---

## Longevity AI

[Longevity AI](https://longevityai.nl) is an AI-driven health platform for the Dutch market: 28 questions in, a personal 6-month nutrition and lifestyle plan out, no diagnoses or medication advice. Built for people with chronic symptoms but no clear diagnosis, HR wellness programs, and holistic practitioners who want their own client portal. Live, roughly 190,000 lines of code, built solo, TypeScript end to end.

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
