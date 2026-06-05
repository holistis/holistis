# Hey, I'm the person behind @holistis 👋

I build AI-powered health tools — specifically for people stuck between "nothing's wrong" and "I don't know what to do about my body."

---

## What I'm building

**[Longevity AI](https://longevityai.nl)** — an AI-driven health platform for the Dutch market.

You answer 28 questions. The system cross-references 10+ organ systems, identifies patterns, and generates a personal 6-month nutrition and lifestyle plan. No diagnoses, no medication advice — just clarity, direction, and something you can actually act on.

Built for:
- People with chronic symptoms but no clear diagnosis (fatigue, hormonal, gut, etc.)
- HR teams running employee wellness checks at scale
- Holistic practitioners who want their own client portal

Currently live and in active development. **~149,000 lines of code. Built solo.**

---

## Autonomous systems running 24/7

I don't manually write blog posts, monitor the app, or push hotfixes at 2am. Three machines handle that:

**Nightly QA + auto-fix loop**
118 Playwright tests run against the live app every night. When something breaks, Claude Code automatically writes a fix, opens a PR, and merges it when CI passes. I get one weekly email. Zero-maintenance production monitoring for a one-person team.

**Autonomous marketing machine**
Every 6 hours: BBC Health, PubMed, EFSA and ClinicalTrials are scanned for relevant publications. Matching items are automatically turned into trilingual (NL/EN/FR) blog posts — EFSA-checked claims, internal links, AI-generated cover images — and published directly to longevityai.nl/blog. No editor needed.

**AI video pipeline**
Health topics are turned into short-form social videos via Heygen (AI presenter) + fal.ai (Veo/Sora) and distributed across platforms. The whole pipeline from topic to published video runs without manual intervention.

Self-improving AI brain — This is the one that's different. Every week, 10 synthetic patients run through the production pipeline. A second AI agent scores each report on 4 dimensions. Gaps are automatically converted into PubMed research queries, facts are extracted and stored in the knowledge base. Every report generated after Wednesday is smarter than the one from the week before — without a single manual step. Cost: max €0.60/week.


Wednesday 03:00  Synthetic Patients Agent
  ├── 10 fake patient profiles (5 conditions × 2 archetypes)
  ├── Runs real reports through the production pipeline
  ├── Haiku agent scores: protocol depth / personalization / legal safety
  └── Legal flag → triggers compliance agent immediately

Wednesday 04:00  Auto-KB Agent
  ├── PubMed abstracts fetched automatically
  └── Facts → knowledge base → next report is smarter

Tuesday 03:30  Developer Tools Radar
  ├── GitHub Trending + dev.to scanned weekly
  └── Relevant tools summarized → admin UI

Monday 07:00  Weekly digest → my inbox

Agent Orchestrator (always active)
  └── All agents report here → triggers downstream actions

  
Psychological profiling — €0 extra — Every report detects the patient's psychological archetype from existing intake answers (no new questions, no extra LLM call) and adapts tone: overwhelmed patients get small steps and validation first, skeptics get the biological mechanism before the advice, beginners get warmth and simplicity.-
  
--

## Open source tools I've built

**[claude-memory-trim](https://github.com/holistis/claude-memory-trim)** — keeps Claude Code's context window lean by automatically rotating session logs between hot and cold storage. Cuts token cost at session start by 60-80%. 99 lines of vanilla Node.js.

**[muraqib](https://github.com/holistis/muraqib)** — a nightly QA guardian for solo SaaS founders. 118 Playwright tests run against your live app every night. When something breaks, Claude Code automatically writes a fix, opens a PR, and merges it when CI passes. You get one weekly email. Zero-maintenance production monitoring for one-person teams.

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

## A bit more context

Most health apps either hand you a generic advice PDF or push you toward a doctor's waiting room. I wanted to build something in between — a tool that actually listens to the full picture (sleep, stress, nutrition, hormones, gut, energy) and gives you something concrete to work with.

The whole stack is TypeScript end-to-end. CI/CD on Railway, AVG/GDPR-compliant. Most repos are private while the platform is in early access.

---

## Links

🌐 **Platform:** [longevityai.nl](https://longevityai.nl)
📬 **Contact:** info@holistischadviseur.nl
