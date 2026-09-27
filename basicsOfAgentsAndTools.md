<!-- 2026-09-03: folded in material from the July 2026 Word drafts
     "Getting Set Up: From Idea to a Live Project" (getting-started-agent-workflow.docx)
     and "CodingGuide - Fall 2026.docx" (OneDrive). Markdown conversions of both
     are in sourceDocs/. Part 1 (general workflow) went into the existing
     sections. Part 2 (web, local apps, TouchDesigner, Unity, Arduino) became
     the "Channels: Project Types" part near the end, so the guide serves a
     general audience rather than one course or one stack. -->

# Main Concepts

**Who this is for.** People who know some code but have no idea where to start with agents, or what strategies to use once they do. The guide is written for a general audience, not one course or one kind of project. The first half covers the workflow that applies to almost any project: concepts, components, agent types, GitHub, good practices, and a first hour in Getting Started. After that, the Channels part covers what is different for each kind of project: web applications, local applications, TouchDesigner, Unity, and Arduino. OpenCode with the Go subscription is the worked example harness throughout. It is one option among several, and everything here transfers to the others.

Working with agents is about managing a budget — finding the balance between what you spend and what you get back. Three budgets are always in play:

- **Context** — the model's working memory. Finite, and the most valuable resource in the system.
- **Tokens** — context and cost are both measured in tokens. Every file read, tool output, and reasoning pass spends them.
- **Rate limits** — subscriptions meter usage in reset windows (5 hours, a day, a week, a month), and scarce models burn through them fastest. The meter is as real a constraint as the context window.
- **Attention** — yours. Everything you approve, read, and review by hand costs time. The goal is designing a process where the agent verifies its own work, so your attention goes to the decisions that actually matter.

**The agentic loop.** Under the hood, every agent runs the same cycle: the model reasons about the task, requests a tool (read a file, run a command, edit code), the harness executes it and feeds the result back, and the model repeats until it decides it's done. Everything else in this document — harnesses, tools, permissions, subagents — is machinery around that loop.

**Chat and agents are different tools.** A chat (Claude.ai and similar) is a conversation. It answers with text or code, and you copy the result yourself. It does not touch your files, and it does not remember anything between sessions unless you tell it. An agent (OpenCode, Claude Code) can read and edit your files, run commands, and act on a real project. That power is why it needs more structure around it than chat does. This guide uses both on purpose. Chat is for the slow, careful thinking. The agent is for the building.

**Non-determinism.** The same prompt can produce different code twice in a row. You are not writing instructions for a compiler; you are steering a probabilistic system. This is the biggest mental shift coming from regular programming. Precision still matters, but *verification* matters more — assume nothing works until something proves it does.

**You are a manager, not (just) an author.** The leverage moves from typing code to writing clear specs, slicing work into reviewable pieces, and reviewing output. Code you didn't type is still code you own.

**Self-testing loops.** An agent that can check its own work — run the tests, compile, take a screenshot, hit the endpoint — is dramatically more effective than one working blind. A large part of agent setup is making sure feedback exists *before* the agent starts.

**Design the setup, the process, and the output.** Result quality is mostly decided before the first prompt: what's in the repo (docs, plans, tests), what tools and permissions the agent has, and how the work is sliced.

**The autonomy dial.** You decide everything, including how much the agent decides — from approving every single command, up through auto-approving edits, to fully autonomous sessions that report back with a pull request. Choosing the right setting per task is a skill you develop over time.

**The filesystem is memory.** Sessions are cheap and disposable; files persist. Write plans, decisions, and progress to files so any future session or agent can pick up the thread.

**Everything is just text files.** Plans, skills, agent type definitions, AGENTS.md, permission configs — almost everything in this system is plain markdown sitting in your repo, not settings locked inside an application. This makes the whole setup radically flexible: multiple sessions can work from the same plan file, different harnesses can operate on the same repo and read the same AGENTS.md, and you can switch tools entirely without losing your setup. Your agent configuration is as inspectable, editable, and version-controllable as your code — you can read it, diff it, and commit it.

**Grow the system step by step.** The flip side of all this flexibility is that none of it is required up front. You do not need tons of agent types and skills to get started — one harness, plan mode, and build mode are enough to do real work. Add a skill when you notice yourself repeating the same instructions; add a subagent when context gets noisy; add a custom agent type when a role keeps recurring. Building the system incrementally is itself a skill: let the complexity of your setup grow to match the complexity of your work, rather than assembling a big machine before writing anything.

**Hands on.** All of this requires hands-on testing and prototyping. Models and harnesses differ, and the same prompt lands differently on different setups. Reading about agents is like reading about swimming.

# Main Components

## Harness

This can take the form of a Terminal application or a dedicated application.
This is the main interface between the user, model, tools, skills, etc.

These allow users to interact with models from multiple providers.

The harness is the deterministic scaffolding around the probabilistic model — the model is the engine, the harness is the rest of the car. It:

- Assembles each request: system prompt + conversation history + tool results
- Executes the tool calls the model requests, gated by your permission settings
- Manages sessions (resume, compact), model selection, and thinking level
- Renders output and diffs
- Holds the configuration: permissions, MCP servers, skills, custom commands

Forms it takes:

- **Terminal-native:** OpenCode, Claude Code, Codex CLI, Gemini CLI, Aider
- **IDE-embedded:** Cursor, GitHub Copilot, Cline, Roo Code, Windsurf
- **Dedicated apps / web:** GUI harnesses and cloud agents that run in a hosted workspace

Most harnesses are model-agnostic — you can switch providers (Anthropic, OpenAI, Google, local models via Ollama) mid-project. Which harness you pick matters less than whether it fits how you work (terminal vs. IDE), but features do differ: permission systems, subagent support, skills, MCP support.

## Model

The LLM that the task or agent is working with. Models come from competing providers (Anthropic, OpenAI, Google, xAI, Meta, DeepSeek...) and differ meaningfully in strength, speed, and cost. Most harnesses let you choose per session — and even per subagent. A common pattern: a strong model writes the plan, a cheaper model implements it.

### Number of Parameters

Though it is not explicit, the number of parameters tends to determine the capacity of the model — roughly, more parameters means more capability, but also slower and more expensive. Vendors rarely publish exact counts anymore, so in practice you choose by tier (frontier / mid / small-fast), price, and how well the model handles *your* task. Don't over-index on size; test on real work.

### Modality

This determines the type of data a model can take as input. The most common input type is text — writing, code, etc. Several models are shown to have *vision*, meaning they can read and interpret images as inputs. This is helpful in multiple ways: a user can provide a visual reference or mockup of what they want, and it lets an agent check the visual output of what it built — e.g. take an automated screenshot of an interface, read it, and verify it. This second use is a big deal for frontend work. Some models also accept audio; output is still almost always text plus tool calls.

### Thinking Level

Adjusts the amount of effort the model uses: more effort = more reasoning before answering, but slower and more tokens. Higher settings pay off on hard problems — architecture, tricky bugs, planning. Routine edits don't need it. Start lower and move up as needed.

### Context

A model has a context window, which is essentially its short-term memory. It is measured in tokens (a token is roughly three-quarters of a word) and commonly holds on the order of 200,000 tokens, with some models reaching a million or more. The window holds everything at once: system prompt, the conversation so far, file contents the agent has read, and tool outputs. It fills faster than you'd expect.

- The immediate context is the most valuable real estate in the system — what's in the window right now shapes everything the model does.
- **Context rot:** as the window fills, recall and reasoning degrade. A stuffed context performs worse than a fresh one.
- **Compaction:** when the window fills, the harness summarizes the thread to make room — details blur.
- This is why multi-agent systems exist: managing large problems exceeds what one window can hold well. Keep a thread focused on a single topic.
- This is also why tools matter: an advantage of these tools is that the agent can read information on demand — from the repo, the web, etc. — instead of holding everything in memory. There is a limit to how much can be in the immediate context, so deciding *what* deserves to be there ("context engineering") is arguably the core skill.

### Worked example: one subscription, many models (OpenCode Go)

This guide is built around the OpenCode Go subscription ([opencode.ai/go](https://opencode.ai/go)): one flat monthly fee buys access to a curated lineup of models — different labs, different sizes, one account. Any comparable multi-model subscription works the same way. This is worth more than convenience: because switching models is a moment's work, you can *feel* the differences described above instead of taking them on faith.

The lineup is effectively a capability ladder priced in requests per 5 hours (lineup as of August 2026 — the names change, the shape doesn't):

| Tier | Models | Requests / 5 hrs |
|---|---|---|
| Frontier reasoners | Kimi K3, Qwen3.8 Max | 110–160 |
| Strong all-rounders | Grok 4.6, GPT 5.6 Luna, GLM-5.3-Flash | ~2,000–3,200 |
| Mid-tier workers | MiniMax M3, Qwen3.7 Plus, DeepSeek V4 Flash | ~4,300–11,400 |
| Volume models | LongCat-2.0, MiMo-V2.5, Hy | ~30,000–45,300 |

(A twelfth model, Muse Spark 1.2, sits on a contributor tier with regional restrictions.)

How the concepts above show up in this ladder:

- **Capacity ≈ your rate limit.** The scarce models at the top are the biggest and most capable — the ones you want planning architecture and debugging hard problems. The abundant ones at the bottom are small and fast — built for mechanical edits and simple tasks. The roughly 400× spread between Kimi K3 (110 requests) and Hy (45,300) is the strong-model-plans / cheaper-model-builds pattern turned into a literal budget.
- **Parameters stay invisible.** Nobody in this lineup publishes parameter counts; the naming conventions (Max / Plus / Flash) and the ladder position are the practical signals of capacity. That's normal — judge models by where they sit and how they perform on your task, not by specs.
- **Thinking level stretches your budget.** Most of these models expose reasoning variants through the harness. Turning thinking up on a mid-tier model is often a better trade than spending scarce frontier-tier requests — try it first when a task is hard.
- **Context varies by model.** Exact window sizes differ across the lineup and are shown in the model picker (details live on models.dev). The practical effect of switching: a smaller model with a shorter window loses long-thread coherence sooner — one more reason to keep sessions focused.
- **Check modality before pasting.** Vision support varies across the lineup — some models read screenshots and mockups, others are text-only. The model picker marks which is which; check before you lean on screenshots.

**Reading the meters.** Go measures usage in requests per 5-hour rolling window — the base layer of a pattern nearly every subscription uses: limits stack in reset windows of increasing length (5 hours, a day, a week, a month; the exact windows vary by plan, the shape doesn't). Scarce models drain the short window in a handful of requests; volume models barely move it.

Two things surprise everyone at first:

- **One task ≠ one request.** Every turn of the agentic loop is a request, so a single build session can burn dozens — or hundreds — before it reports back. Long autonomous stretches are bursts, not drips.
- **The scarce tier runs out mid-task if you sprint.** Budget by task value: spend frontier requests where they compound — planning, where one good request produces the plan file that directs hundreds of cheap requests later — and route everything else down the ladder.

Managing that meter is a key skill in its own right — the same skill as managing context and attention, applied to a calendar:

- Check the gauge before starting big work; the harness shows what's left in each window.
- Match the model to the value of the request — never spend a frontier request on something a volume model does perfectly.
- When a tier runs dry, drop down the ladder and keep working; windows reset faster than deadlines arrive.

A practical default while learning: plan with a top-of-ladder model (Kimi K3 or Grok 4.6), build with a mid-ladder workhorse (GLM-5.3-Flash or DeepSeek V4 Flash), and let the volume models absorb repetitive chores. When a scarce model runs dry mid-task, the plan file is what lets a cheaper model pick up exactly where it left off — the ladder only works because your work is written down.

## Tools

A tool is a capability the harness exposes to the model. The model never runs anything itself — it emits a structured *tool call* (name + arguments), the harness executes it, and the result comes back into context as text.

Because these tools live in the terminal they can use and install their own tools. Many existing tools have command line interfaces. Agents can use any of them, regardless of whether they were designed for AI. Harness built-ins typically include file read/write/edit, filename and content search, shell execution, web fetch, and web search. The shell is the escape hatch to everything else:

- `git` / `gh` — version control, PRs, issues
- `ripgrep`, `fd`, `jq` — fast search and JSON munging
- `ffmpeg`, ImageMagick — media processing
- Language toolchains and package managers — `npm`, `pip`, `cargo`, ...
- Test runners — `pytest`, `jest`, `go test`
- `playwright` / `puppeteer` — driving a real browser
- Homebrew / Chocolatey / apt — installing more tools (with your permission)

Nothing needs to be "AI-enabled" for an agent to use it — any program with a CLI is a tool. This is a large part of why agents are good at gluing together software that was never designed to work together.

And when the tool it needs doesn't exist, an agent can often just make one. Not all agent-written code is the deliverable — frequently the agent is writing tools *for itself*: a small script to batch-process images, a CLI wrapper around a web service that has no API, a one-off converter so file format A can become file format B. The code exists so the agent has something it can operate — a step inside a larger task, used a few times, often discarded afterwards. This quietly inverts a traditional assumption: tooling used to be a deliberate up-front investment, something you avoided building until you were sure you needed it. When an agent can write the tool it wishes it had in seconds, it is often cheaper to build the missing tool than to work around its absence.

Two things to know:

- Tool output lands in context and spends tokens — this is why agents grep for a needle instead of reading whole files.
- The harness assists the model in finding and installing the tools it needs to complete the task, subject to your approval.

You will see these names go by as the agent narrates its work ("using grep to search the project", "running a Playwright check"). The list above is so that reads as a description of what is happening rather than a black box. Playwright matters most for visual work. It opens a real browser, often an invisible one, to check what a sketch actually looks like instead of trusting that the code ran without errors.

## MCP Servers

Model Context Protocol is an open protocol that allows a model to speak with different tools — think of it as USB-C for AI tool connections: one standard plug, any device. It originated with Anthropic in 2024 and has since been adopted across the industry. An MCP *server* is a small program that exposes tools and data to the agent over that protocol, either running locally or hosted remotely. Examples: GitHub (issues and PRs), Postgres (query schemas and data), browser automation, Slack, Linear, Notion, Figma.

There is a huge overlap with tools in functionality, and when to use one vs. the other is often project specific and a matter of general preference. Rough heuristics:

- If a good CLI already exists, letting the agent use it through the shell is often simpler (e.g. `git`/`gh` vs. a GitHub MCP server).
- MCP shines for authenticated services and structured APIs with no CLI, and for shared team setups — one config gives everyone the integration.
- Each server's tool descriptions load into context, so enable selectively. A pile of unused servers costs context and makes tool choice noisier.

Configuration lives in the harness, scoped either to a project or globally for the user.

## Skills

A skill is a packaged procedure: a folder containing a `SKILL.md` file — a name, a short description of when it applies, and instructions for how to do something well — plus optional scripts and reference files. When a task matches the description, the harness loads the skill's instructions into context.

Skills exist because models don't know your workflows, your conventions, or the messy specifics of certain file formats — and re-explaining them every session is exactly the waste this whole document is about avoiding. Write it once, reuse everywhere.

Good skill material:

- House conventions — how this repo structures things, naming rules
- Multi-step workflows with a specific order (build a PDF report, deploy the site, prep a submission)
- File-format expertise the model only half-knows (docx, xlsx, pdf — often with helper scripts included)
- Recurring project rituals (release checklist, report format)

How skills relate to their neighbors:

- **vs. AGENTS.md:** AGENTS.md is always-on context loaded every session; skills are on-demand, loaded only when relevant — so it's cheap to own many.
- **vs. MCP:** MCP provides *connectivity* to external systems; skills provide *knowledge and procedure*. A skill can call scripts and CLIs itself, which covers more than you'd expect.

The name and short description are visible to the agent at all times; the full body loads only when used ("progressive disclosure"), so skills cost almost no context until they're needed.

## Agents.md file

A markdown file (typically at the repo root) that harnesses load automatically at the start of every session. README is for humans; AGENTS.md is for agents. Since an agent starts every session with no memory, this is the persistent briefing.

Typical contents:

- Build / test / lint commands — the exact ones that work, e.g. `npm test`
- A project structure map — what lives where
- Conventions: style, naming, patterns in use, what not to touch
- Gotchas: known traps, flaky tests, environment quirks
- Pointers to deeper docs — point at them, don't paste them

Practices:

- Keep it short and high-signal: it spends context every single session.
- Stale instructions are worse than none — update it when commands or structure change.
- Committed to the repo, it onboards every agent (and teammate) the same way. Many harnesses also support a personal/global version outside the repo for individual preferences, and some use their own filename (e.g. `CLAUDE.md`) — same idea.

## Subagents

A subagent is a full agent session spawned by the main agent to do a bounded job with its own fresh context window, then report back a written result.

Why they exist — context economy is the big one:

- A research task might read 30 files and produce two paragraphs. Run in the main thread, all 30 files of noise sit in your context forever. Run in a subagent, only the conclusions come back.
- **Parallelism:** independent tasks (search here, search there, run the test suite) can run simultaneously.
- **Specialization:** each subagent can use a different model or thinking level — cheap fast exploration, strong model for design.

Common types (names vary by harness): Explore/research agents, Plan agents, general-purpose workers, code reviewers.

Caveats:

- A subagent cannot see your conversation — the main agent must hand it a self-contained brief: what to do, where to look, what to return.
- Results come back as text; subtle context doesn't transfer.
- They multiply cost. Best for fan-out searches and dirty work, while decisions stay in the main thread.

## Access and Permissions

Since agents are performing tasks on your computer, they generally have to ask permission. Deciding how much you want to be involved is a learned skill over time.

Typical tiers, roughly in order of risk:

- Reading files and searching — usually auto-allowed
- Editing files — ask by default, with modes to auto-accept
- Running shell commands — gated, with allowlists ("always allow `npm test`", "always ask before `rm -rf`")
- High blast radius — git push, package installs, deployments, anything network-facing — stay gated longest

In OpenCode, each tool maps to an ask / allow / deny setting, configured in `opencode.json` for the project or granted interactively at the prompt.

Permission modes usually span the range from ask-per-action → auto-accept edits → plan-only → fully autonomous (sometimes nicknamed "yolo" mode, best combined with sandboxing). Sandboxing adds guardrails: restricted filesystem and network access, git worktree isolation, and checkpoints you can rewind to if an attempt goes sideways.

Approving everything gives you more control, but doesn't allow for long-running autonomous sessions — you become the bottleneck and everything stalls waiting for a click. Approving nothing is fast until it isn't. Calibrate by blast radius: cheap-to-undo actions get autonomy; destructive or outward-facing actions stay behind a gate.

## Slash Commands and @ file references

**Slash commands** are typed shortcuts that expand into pre-written prompts or workflows. Built-ins typically include things like `/plan` (plan mode), `/compact` (summarize the session to free context), and `/init` (generate an AGENTS.md). Most harnesses let you define your own as markdown files in the repo — in OpenCode, a file like `.opencode/commands/verify.md` becomes `/verify` — so a recurring workflow ("scaffold a new page", "prep a release") becomes one keystroke with consistent instructions. Commands can take arguments and can wrap skills.

**@ references** pull things into context precisely:

- `@src/components/nav.tsx` — load this exact file
- `@planning/` — a whole folder
- `@agent-name` — route work to a named subagent (harness-dependent)

Images and screenshots can usually be pasted or dragged in as well. Agents are literal: pointing beats describing — `@` the right file instead of hoping the agent finds it.

## Standard Repo Structures

Because almost everything an agent uses is a text file, it all lives in predictable places — and the layout conventions are nearly identical across harnesses:

```
my-project/
├── AGENTS.md                 # project briefing, auto-loaded every session
├── opencode.json             # harness config: permissions, MCP servers, defaults
├── .opencode/                # this harness's config folder
│   ├── agents/               #   custom agent types — one .md file each
│   ├── commands/             #   custom slash commands — one .md file each
│   └── skills/               #   one folder per skill...
│       └── pdf-report/
│           ├── SKILL.md      #     frontmatter (name, description) + instructions
│           └── scripts/      #     optional helper scripts and templates
└── plans/
    └── plan.md               # working artifacts — no convention, just files
```

Every harness follows this shape: a root instruction file plus a hidden dot-folder named after the tool. The names shift — `.claude/`, `.cursor/`, `.gemini/` — but the subfolders do the same jobs: skills, commands, agents, settings. Skills in particular have converged on a shared `SKILL.md` format — OpenCode reads them out of `.claude/skills/` and `.agents/skills/` as well, so skills travel between harnesses.

There are two scopes for all of it:

- **Project-level** (inside the repo): committed to git, so every teammate — and every teammate's agent — gets the same briefing, skills, and permissions.
- **User-level** (in your home directory, e.g. `~/.config/opencode/`): personal preferences that apply to every project you touch.

The notable exception is Claude Code, which uses `CLAUDE.md` where everyone else uses `AGENTS.md`. In practice this barely matters: these are all just text files, so an agent can read one format and generate the other in seconds. Conversion — or generating a whole config folder from scratch — is itself a trivial agent task. Adopting a new harness is usually one sentence: "read the existing setup and recreate it in this tool's format." Many harnesses will also generate a starter version for you (`/init`).

Two practices worth keeping:

- Start with just the root instruction file and add folders as recurring needs appear — the structure should grow the same step-by-step way as everything else in the system.
- Decide deliberately what gets committed. Shared conventions belong in the repo; personal hacks belong in the user-level folder or `.gitignore`.

## Threads or Sessions

This is a basic unit of how you interact. A session (or thread) is one continuous conversation with its own context window. It can be resumed later, and it can spawn other sessions or agents.

Designing how to determine the focus of a session is a developed skill:

- Keep it focused on a single theme. A session that drifts from feature to research to debugging accumulates context that makes everything slower and worse.
- New task → new session. Point it at the plan file or notes instead of re-explaining.
- Longer sessions eat tokens faster — every message re-sends the whole history — and degrade as context fills.
- Compaction summarizes a full session to make room, but details blur. Better to start fresh from written notes than to keep stretching a bloated session.

One good practice is to make sure that the session documents what has happened — progress, decisions, next steps written to files (plan.md, notes, AGENTS.md) — so it can be read by other agents and sessions. Sessions are disposable; the filesystem is the memory.

## Standard Agent Types

### Typical Pattern

Ideation Chat -> Plan.md -> Iterate the idea in Build

1. Ideate in a throwaway chat — cheap, nothing on disk, explore the problem space
2. Distill into plan.md — the durable artifact
3. Build in a fresh session — implement against the plan, checking things off
4. Verify — tests, review, actually run it — and commit
5. Iterate — take the next slice back through plan → build

Diverge cheaply, converge in writing, execute, verify.

The chat habit trains a particular expectation: one prompt, one finished answer. Real projects almost never work that way. A realistic rhythm for a bigger project looks like this: plan a first version, build it in small committed steps, look at it and form new ideas, branch off to explore the promising ones, keep what works, update the plan to reflect what you learned, repeat. Exploring more than one idea before settling is not a sign something went wrong. It is the work. The plan and the git history together become a record of how your thinking evolved, not just what you built. For a creative project that is often the more interesting story.

### Plan

Most harnesses ship with a standard Plan agent. You can use any type of model with this, but the basics are that it will not result in code — ONLY a plan.

Plan mode is read-only: the agent explores the codebase and produces a plan file. Often during this stage, the agent will ask you a series of multiple choice questions that clarify the requirements before writing anything.

This is a key shift in dev strategy: a thorough, clear plan is incredibly important. It is typically more effective to have a strong model write the plan so a simpler one can implement. Think chefs and cooks: chefs write the recipe, cooks follow it. The plan file allows the agents to follow the rules and check the results against it.

The plan is also your review gate — you approve the approach before any code exists, which is the cheapest possible moment to change direction.

A good plan file includes: the goal, constraints, the approach at a file/module level, what's out of scope, and acceptance criteria — how it will be verified as done.

Written out for a first project, that list looks like this:

- **What you're building.** One or two sentences, plainly stated.
- **Core features.** A short list in priority order, so the most important thing gets built first, not last.
- **File structure.** What files will exist and what each one is responsible for (for example `index.html`, `sketch.js`, `style.css`).
- **Build order.** Steps small enough to check one at a time. Not "build the whole thing."
- **Tools and libraries.** p5.js, three.js, anything external.
- **Known risks and open questions.** Flagged up front, not discovered mid-build.
- **What "done" looks like.** A concrete definition of finished, so the agent knows when to stop instead of polishing forever.

You do not have to write this yourself. The ideation chat can draft it. Ask directly: "Write this up as a project plan covering what we're building, core features, file structure, a step-by-step build order, and a definition of done."

This is almost always stored as a markdown file, but in some cases can be html. Markdown (`.md`) is plain text with light formatting: `#` for headings, `-` for bullets, backticks for code. It is the default format for anything meant to be read by both people and models. It opens anywhere and needs no special software.

The plan has to live inside the repo, not in Downloads or on the desktop. The agent can only see files inside the folder it was started in, and an `@PROJECT-PLAN.md` reference only works for files it can see. A good opening prompt for plan mode:

> @PROJECT-PLAN.md Read through this plan and tell me if anything is unclear or missing before we start building. If it looks solid, break the first task down into concrete steps.

Asking the agent to restate the plan in its own words is a cheap way to catch a misunderstanding before it turns into a pile of wrong code.

### Build

This is where the work actually happens — tools, skills, subagents, real code. If you started in plan mode it requires an explicit switch to build. Don't build anything without a formal plan file.

Good build behavior to encourage: small increments, run the tests after each change, update the plan's checkboxes as things complete, and stop to revise the plan when reality disagrees with it. A build session silently improvising around a bad plan is how you get confident garbage.

### Review

Worth knowing: many harnesses include a review mode or reviewer agent that reads a diff or PR and reports problems without changing anything. Since agents write most of the code now, having an agent review the agent is a standard second pair of eyes — cheap and surprisingly effective. You still review too.

### Custom Agent Types

Plan and Build are all you need to get started — the full ideation → plan → build → review cycle works with nothing else. But agent types are not fixed categories; they are configurations, and most harnesses let you create your own. A custom type is usually a markdown file specifying a name, a description of when it should be used, and instructions — often including a restricted tool set, its own permissions, and a default model. Skills define *how* the work is done; custom agent types define *who* does it.

Roles that come up repeatedly:

- **Orchestrator** — splits a large job into pieces, delegates each piece to other agents, and tracks overall progress. This is usually what drives the subagents described earlier.
- **Critic** — reads a plan, diff, or draft and attacks it: correctness, edge cases, missed requirements. It fixes nothing — it only reports. Cheap insurance before expensive work.
- **Coder** — a focused implementation worker, often running a cheaper model, handed well-defined tasks with tight scope.
- **Git manager** — owns branches, commits, PRs, and changelogs so the working agents never context-switch into repo hygiene.
- **Researcher / Explorer** — gathers information from the codebase or the web and reports findings back, keeping the noise out of the main session.

**Where they live and how to define one.** In OpenCode, an agent type is literally a markdown file, and the filename is the agent's name. Drop `critic.md` into `.opencode/agents/` in the repo (committed, so the whole team gets it) or `~/.config/opencode/agents/` (global, applies to every project). The file is YAML frontmatter — the configuration — over a body that serves as the agent's standing instructions:

```markdown
---
description: Attacks plans and diffs for correctness, edge cases, and missed requirements
mode: subagent
model: opencode/glm-5.3-flash  # any model from your plan's lineup (provider/model)
permission:
  edit: deny
  bash: deny
---

You are a critic. Read plans, diffs, and drafts and report problems —
correctness, edge cases, missed requirements — ordered by severity, each
with a file and line reference. You never edit anything yourself. End
every report with the single biggest risk in one sentence.
```

The frontmatter is where the constraints live, and they're enforced rather than suggested: `mode: subagent` means primary agents delegate to it automatically (or you can summon it directly with `@critic`); `permission: edit: deny` turns "this agent only reads" from a hope into a guarantee; `model` pins which tier it runs on — a strong all-rounder for judging work, a cheap one for grunt work. The body is just instructions, and writing them like a job description — role, method, output format — is most of the craft.

The built-ins are the same mechanism under the hood: Build and Plan ship as primary agents (Tab switches between them), General, Explore, and Scout ship as subagents, and `opencode agent create` will interview you and generate a starter file.

The pattern to notice: an agent type is just a role with instructions and constraints. You are designing a small team — start with the two roles you need, and add more when a recurring job earns one.

## Github

### Automated Commits and Worktrees

Agents commit early and often, with generated messages. Treat their commits and PRs like a teammate's: review the diff before it merges.

You can also type the git commands yourself (`git add .`, `git commit -m "..."`, `git push`). It is worth knowing how, even if you rarely do it. It is what the agent is doing on your behalf either way, and it helps when something needs fixing by hand. [Git's own basics guide](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics) is a short reference for what these commands do.

### Branches: Two Directions Without Losing Either

Every commit is a checkpoint you can return to. That covers the first situation that comes up constantly: you tried something and it made things worse. Instead of untangling the changes by hand, go back to the last good checkpoint. Nothing is lost as long as you were committing along the way.

The second situation is wanting to explore two ideas at once. That is what **branches** are for. A branch is a parallel copy of the project where you can try something (a different visual style, a riskier feature) without disturbing the main working version. If it pans out, merge it back. If not, abandon the branch, and the main version was never touched. You can have several going, one per idea, and compare them.

You do not need to master branching on day one. Knowing it exists early changes how you approach ambitious work, because you stop being afraid to try things. The agent can handle the mechanics: "make a new branch called particle-experiment so we can try this without touching the main version." The concept is the useful part. The commands are something the agent can run for you.

Worktrees (`git worktree`) let you check out the same repo into multiple folders at once, so several agents can work on separate tasks in parallel without stomping each other. One branch per task keeps main clean, and throwing away a bad attempt is just deleting a branch.

### Managing Project research and ideas

The repo holds more than code: PDFs, images, spreadsheets, meeting notes. Commit them and any agent can read them on demand — summarizing, cross-referencing, extracting structure. A notes/planning folder the agent can search turns "that thing someone said weeks ago" into retrievable context.

### Pages for Web-based Projects

GitHub Pages serves a static site straight from the repo for free, which makes publishing a web project one settings switch, and lets an agent build the site, deploy it, and open it in a browser tool to verify the result. The setup steps, the three ways to see a site while building (local, phone, published), and the gotchas are in the Web channel under Channels: Project Types. (Related: GitHub Actions runs CI on push — and increasingly can run agents themselves.)

# Good Practices Still Apply

It's tempting to treat agents as a reason to skip the old disciplines — the code arrives so fast, why bother? The opposite is true. Agents amplify whatever they're given: a messy repo produces mess faster, a disciplined one produces quality faster. None of the practices below are new — what's changed is the return on investment, because one written rule or one clean structure now pays off across every future session, for every agent that touches the project.

**Build in pieces.** Task size is the most reliable predictor of agent success. A small, well-defined slice gets finished, verified, and reviewed; "build the whole app" produces a confident pile that almost works. One feature per session, one commit per working state. If a slice still feels big, describe it as a sequence of verifiable steps in the plan — then both you and the agent can see progress and catch drift early.

**Have standards, and write them down.** Agents follow written rules far better than they infer taste. Put durable conventions in AGENTS.md — naming, structure, patterns in use, what never to touch — and enforce mechanical rules with linters and formatters the agent can run itself. This scales beautifully: write the rule once, and every future session inherits it. The flip side is just as reliable — conventions that live only in your head will be violated, not respected.

**Self-documentation.** Code that explains itself — names that say what things do, small functions, obvious structure — was always a courtesy to future-you. Now it is also the primary interface for agents: the codebase is the context they read, and clear structure is how they navigate correctly instead of re-deriving your intent. Two practical additions: comments should explain *why* — agents can read the *what* in the code — and doc updates belong in the definition of done, since "update the README to match" is one sentence in a prompt. The classic excuse that documentation rots mostly disappears when the documentation is maintained by the same process that maintains the code.

**Tests are the contract.** An agent that can run tests can verify itself; an agent working without them is guessing with confidence. Tests written first — or alongside — give the build loop its feedback signal; this is the mechanism behind the self-testing loops described in Main Concepts. On a project with no tests, "add tests for whatever you change" is a reasonable standing rule.

That's the summary in one line: agent craft is mostly classic engineering discipline, applied to a very fast, very literal junior colleague.

# Getting Started

The sections above describe the parts. Here is how they fit together in practice — a first hour with an agent. OpenCode is the example harness; other harnesses differ only in install commands and menu names.

## 1. Every project starts as a GitHub repo

Before any agent gets involved, put the project in a GitHub repository. This is not optional bookkeeping. Agents produce change at a volume and speed where "what exactly did it just do?" is a question you will ask constantly, and git is the only thing that can answer it: every edit lands as an inspectable diff, every state is restorable, and GitHub adds history, branches, and pull requests on top. Working without a repo takes away both your undo button and your ability to see how much change the agents are creating.

You do not need to master git for this — agents handle the branch-and-commit mechanics themselves. You need to be able to read a diff and revert, and you need the repo to exist.

There are three equally valid ways to create it — pick whichever fits how you work:

- **Web interface:** on github.com, click **New repository**, give it a name, tick "Add a README," and create. Done — clone it to your machine next (via the **Code** button, GitHub Desktop, or `git clone`).
- **GitHub Desktop:** the graphical GitHub app. **File → New Repository** to start one, or **File → Clone Repository** to bring an existing one down; stage and commit with buttons. The comfortable route if the terminal still feels unfamiliar.
- **Command line:** in your project folder, `git init` and make a first commit — then `gh repo create` with the GitHub CLI if you want it on GitHub.

All three produce the same thing: a history of commits. From here on, agents commit into that history and you read their diffs like a reviewer.

The most common first-time route combines the first two. Create the repo on github.com (keep it public, since free Pages hosting needs that, and tick "Add a README"). Then in GitHub Desktop choose **File → Clone Repository**, find the repo in the list or paste its URL, pick a folder on your computer, and click **Clone**. **Repository → Show in Finder** (or Explorer) reveals the folder on disk. That folder is what you open with the agent next. If the project starts from a template repo, **Use this template** on github.com makes your own copy first. The clone step is the same.

## 2. What you need (besides the repo)

Install once, not per project:

- **A GitHub account.** Free, at [github.com](https://github.com).
- **GitHub Desktop.** A free app for cloning and syncing repos without typing git commands ([desktop.github.com](https://desktop.github.com)). Git itself comes bundled with it, so there is nothing separate to install.
- **Node.js.** Most harnesses, OpenCode included, run on it. Install the LTS version from [nodejs.org](https://nodejs.org).
- **The harness.** OpenCode runs in a terminal, or as a desktop app ([opencode.ai/download](https://opencode.ai/download)) with the same capabilities and no terminal. Either is fine. The desktop app is the gentler first week.
- **A model account.** This guide is built around the **OpenCode Go** subscription ([opencode.ai/go](https://opencode.ai/go)): one flat monthly fee that includes a whole lineup of different models under one account, metered in requests rather than tokens (see the worked example under Model). The alternative is API-key billing — pay per token: small tasks in pennies, long sessions in a few dollars.
- **Optional: VS Code** or another editor, for browsing files visually alongside the agent. Not required.

You do not need the GitHub CLI (`gh`) to follow this guide. Creating repos through the website is simpler for a first pass.

Tools specific to one kind of project (Python, `arduino-cli`, Unity and its MCP server) are listed in the Channels part, not here.

## 3. Install the harness, then start it *inside your project*

Install OpenCode with the one-liner from [opencode.ai](https://opencode.ai) — `curl -fsSL https://opencode.ai/install | bash`, or `npm install -g opencode-ai` — then launch it from your project's root by running `opencode`. This part matters: the folder you start in is the agent's working world. It reads, edits, and searches relative to where it was launched, and your AGENTS.md is discovered from there. In the desktop app the equivalent is opening the repo folder as the project (**File → Open Folder** or similar). Point it at the same folder GitHub Desktop cloned. The agent can then see and edit those files, and only those files.

## 4. Connect a model

Run `/connect` inside OpenCode, choose the **opencode** provider, and sign in at [opencode.ai/auth](https://opencode.ai/auth). The model picker then shows the full lineup described under Model. Accept the default to start, and keep thinking level low — raise it only when you're stuck.

## 5. Make it safe to experiment

Make sure your current state is committed, and stay in the default ask-per-action permission mode for your first session. Read every permission prompt before approving — not because you should always approve, but because reading the asks *is* the lesson: it shows you exactly what the agent is doing on your behalf. Expect it to ask before anything irreversible: deleting files, force-pushing, installing dependencies. Do not switch those confirmations off just to move faster.

## 6. First session: three small tasks, in order

1. **Explore.** "Give me a tour of this repo: what it does, how it's structured, and how to run it." Cheap, safe, and shows you how the agent reads.
2. **Persist what it learned.** Run `/init` to generate an AGENTS.md, then read it and correct anything wrong. Every future session now starts smarter. The ideation chat can draft this file too: a short job description for the agent, covering what the project is, coding style, rules to follow, and whether to commit and push after each task. Save it at the repo root and have the agent read it.
3. **One small, real change.** This is where phrasing matters. A good task prompt states three things — goal, constraints, and how to verify:

   - Weak: "fix the styling"
   - Stronger: "The submit button wraps to two lines at mobile widths. Make it stay on one line down to 320px without affecting other buttons. Verify by running the dev server and checking at 375px and 320px."

   The verification clause does most of the work — it converts your request into something the agent can check itself, which is what makes self-testing loops possible.

## 7. Commit as you go

Committing saves a checkpoint. Pushing sends it to GitHub. The easiest way is to ask the agent after each working chunk: "commit and push this." If AGENTS.md says to commit after each task, it will do this on its own. Glance at what it says it committed, and step in by hand when something looks off. Letting the agent handle commits is a fine default. It keeps the history tidy and matches the pace of the work.

## 8. Review like a reviewer, not a typist

Actually run it after each meaningful change. Do not assume it works because the code looks right. How you run it depends on the kind of project: a local script, a TouchDesigner file, serial output from a board, or a live URL. The Channels part covers each. Read the diff (`git diff`), run the thing, run the tests. Reject freely — "this works, but try it this way" is a normal sentence to say to an agent. Iterate in the same session while it has context; start a new session for the next task.

## 9. Grow into the full loop

Once the basics feel comfortable, use plan mode on your next substantial task and follow the Typical Pattern: ideation chat → plan.md → build → verify → commit. Add skills, subagents, or custom agent types only when repetition appears. You already know what every piece is for — the system grows the same way you just worked: one step at a time.

## Habits worth forming from day one

- New session per task; point it at files instead of re-explaining
- Write decisions into files — plans, notes, AGENTS.md — the filesystem is the memory
- Review every diff before it's committed or merged
- Keep autonomy low until trust is earned; let blast radius set the permission level
- When results disappoint, fix the setup (context, plan, verification) before blaming the model

## Quick checklist

- [ ] GitHub account created
- [ ] GitHub Desktop, Node.js, and OpenCode installed
- [ ] Model connected (Go subscription or API key)
- [ ] Repo created on github.com and cloned locally with GitHub Desktop
- [ ] OpenCode started inside the repo folder
- [ ] Plan written in chat and saved as `PROJECT-PLAN.md` inside the repo
- [ ] AGENTS.md generated with `/init` or drafted in chat, then read and corrected
- [ ] Plan mode used to confirm the approach before building
- [ ] Build mode used in small, checked steps
- [ ] Committed and pushed along the way
- [ ] Ran it and checked the result the way your channel needs (see Channels: Project Types)
- [ ] Web projects only: Pages enabled with the GitHub Actions source, live URL confirmed

# Channels: Project Types

<!-- Claims to re-check before publishing. The channel material was written in
     July 2026 and some of it is time-sensitive:
     - Unity AI Assistant: "open beta as of 2026", the Personal Edition trial,
       credit pricing, and the AI Gateway bring-your-own-model terms.
     - Unity MCP Server: official status and current setup.
     - Immersive Web Emulator: current name and availability as an extension.
     - three.js VRButton / ARButton helpers and the renderer.xr API names.
     - TouchDesigner Python calls (create, connectors, par) on the current build.
     - arduino-cli flags on the current release: board list --format json,
       monitor --config baudrate, config add board_manager.additional_urls,
       and sketch.yaml build profiles.
     - Cloudflared quick tunnel as the phone-testing route.
     - OpenCode Desktop availability (Getting Started, What you need). -->

Everything above applies no matter what you build. This part covers what is different for each kind of project. The core loop stays the same everywhere: plan in chat, build with the agent, run it, commit, iterate. Each channel adds only the pieces specific to it. Read the general half first, then jump to the channel that matches what you are making.

## Web applications

A web app here means an HTML/JS/CSS project that runs in a browser, including creative-coding sketches with p5.js or three.js. It is the channel with the smoothest path from "built" to "shared with anyone": a URL, no install, no build step.

**Three ways to see it while building:**

- **Locally.** A small local server serves the files to your own browser. The agent can start one for you, or a project template may ship a command such as `npm run preview`.
- **On a phone or another device.** Most networks isolate devices from each other, so the reliable route is a quick tunnel: a temporary public URL that points at your local server. Ask the agent to set up a cloudflared quick tunnel. There is a standard pattern for it.
- **Published.** The permanent, shareable version at `https://yourusername.github.io/repo-name/`.

**Enabling GitHub Pages** takes a minute and can happen before or after building:

1. On the repo's GitHub page, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions** rather than "Deploy from a branch." It deploys on each push and refreshes faster after changes.
3. Pick the plain **Static HTML** workflow template, not a framework-specific one. This adds a small file under `.github/workflows/`.
4. Commit and push that file. Adding it alone does nothing. A push to main triggers the build.
5. The site goes live at the Pages URL. Give the first push a minute or two.

The easier option is to ask the agent: "set up GitHub Pages for this repo using a GitHub Actions workflow that deploys on push to main." Read the file it writes before pushing, same as any other generated file. Some templates ship with the workflow already in place. Then only the Settings switch is needed. Keep the repo public, since free Pages hosting needs that.

**Three things that cause "it worked locally" bugs:**

- The main file must be named exactly `index.html` and sit at the repo root.
- Link to other files with relative paths (`sketch.js`), not a leading slash (`/sketch.js`). Pages serves from a subfolder, so absolute paths break.
- Browsers only expose motion sensors, the camera, and the microphone over HTTPS. A plain `http://` address on the local network will not grant them on a phone. The tunnel and Pages are both HTTPS, which is why they are the two device-testing routes.

**What the agent can check itself.** Because the result is a page, the agent can verify it: start the local server, open the page in a headless browser such as Playwright, read the console, take a screenshot. Put that in the plan's acceptance criteria and the build loop tests itself.

### three.js for games, and web AR/VR/XR

The browser is not only for flat pages. With **three.js** it is a capable 3D and game platform, and one that avoids a lot of Unity's overhead for the right kind of project. For many games, especially stylized, experimental, or web-native ones, three.js is worth considering before reaching for a full game engine. There is no install for the player. There is no build step. It deploys through the same Pages flow above. And it fits the agent workflow cleanly, since it is plain JavaScript the agent can write and test like any web code.

The trade-off, stated plainly: Unity (see the Unity channel) gives you a visual editor, a physics engine, an asset pipeline, and a huge ecosystem. It is better for larger or more conventional games. three.js is code-first and lighter. It is better for browser-native, art-driven, or quick-to-share pieces. If the work leans visual and you want people to see it instantly, "runs at a URL, no download" is a real advantage.

**Web AR, VR, and XR are a genuine strength of the browser path.** three.js has built-in support for **WebXR**, the web standard for virtual and augmented reality. In practice:

- An "Enter VR" or "Enter AR" button takes very little code. three.js ships `VRButton` and `ARButton` helpers, and its `renderer.xr` manager handles the headset session and stereo rendering.
- It runs on standalone headsets such as Meta Quest straight from the headset's browser. AR runs on many phones. No app install, the same zero-friction advantage as any web project.
- The agent can write WebXR code like any other three.js code. "Help me make this scene enterable in VR" is a reasonable request.

One setup detail matters for XR: browsers require HTTPS to access XR sensors and cameras. A plain local `http://` server will not grant VR or AR access on a headset or phone. The tunnel and Pages routes above are both HTTPS, so both existing "see it on a device" paths already satisfy this. Knowing it saves the confusion of VR "not turning on" over a local IP.

A testing tip: you do not need a headset for every iteration. The **Immersive Web Emulator**, a browser extension, simulates a headset and controllers on a normal monitor. It is fine for most development. Do a final check on real hardware before showing the work.

## Local applications (Python, Processing, openFrameworks)

Plenty of projects run on your own machine rather than in a browser: a Python data or generative script, a Processing sketch, an openFrameworks app. The general workflow fits these cleanly. The differences are how they run and how the agent verifies its work.

**Python** is the smoothest fit for agent-assisted work, because the agent can run the script itself and read the output directly. A typical loop: the agent edits the script, runs it (`python your_script.py`), reads what it prints or the error it throws, and fixes accordingly. That is genuinely autonomous iteration, since nothing needs a person in the middle to report back what happened. Worth knowing about **virtual environments**: a per-project sandbox for dependencies, so projects do not interfere with each other. Ask the agent to set one up and explain it.

**Processing** and **openFrameworks** are less automatic, because their natural output is a graphics window, not text. Two implications:

- The agent can usually still compile and run, and catch errors. That covers a lot.
- For "does it look right," you are back to visual verification. Either you look at the window yourself, or, with more setup, a screenshot gets fed back to the agent. Processing has a command-line runner, and openFrameworks builds through standard compilers, so the agent can drive builds and surface compile errors even when it cannot judge the visuals.

**What to put in AGENTS.md for these projects:** which language and framework, and which version; how to run or build the project, as the exact command; and where the entry point is. The clearer the "how do I run this and see if it worked" instructions, the more the agent can check its own work instead of guessing.

## TouchDesigner

TouchDesigner is a favorite for interactive and visual work, and it fits this workflow in a way that surprises people. You normally build by wiring nodes by hand, but TouchDesigner is deeply scriptable through Python, so an agent can help generate networks, not just individual snippets.

**Three levels of agent help, roughly by ambition:**

1. **Custom Python inside nodes.** The everyday case. A DAT or a parameter expression needs some Python logic. This is ordinary code help: describe what you want, the agent writes the Python, you paste it into the node. Nothing special beyond knowing TouchDesigner's Python objects (`op()`, `me`, `parent()`).

2. **Generating a whole network via script.** The powerful, less obvious one. TouchDesigner can build operators and wire them together from Python. Describe a network in chat, have the agent write a script that constructs it, and run that script once to generate the whole thing.

   - `parent().create(operatorType, 'name')` (or `op('/project1').create(...)`) creates an operator.
   - Connect them with the operators' connectors, for example `op('a').outputConnectors[0].connect(op('b').inputConnectors[0])`.
   - Set parameters in Python (`op('bg').par.roughness = 0.6`).
   - Run the finished script by pasting it into the **Textport** (TouchDesigner's Python console). It builds the network in one go.

   A realistic loop: describe the network, the agent writes the build script, you paste it into the Textport, a network appears, you refine by describing changes.

   > **Caveat:** models often have outdated knowledge of TouchDesigner's exact operator names and parameters, since the software changes version to version. Ask the agent to verify operator and parameter names against current TouchDesigner documentation rather than trusting recall, and expect some back-and-forth fixing names. This is a known rough edge, not a sign you are doing it wrong.

3. **Custom operators.** The most advanced level: extending TouchDesigner itself with new operator types, via C++ for compiled operators or GLSL for shader-based ones. This is real software development and a bigger commitment. The same plan-then-build workflow applies. It is just a steeper build.

**A note on connected setups:** there are community MCP servers that let an agent talk to a running TouchDesigner instance directly, creating operators and setting parameters live rather than you pasting scripts. That is an advanced, optional setup worth knowing exists once the basics click. Pasting generated scripts into the Textport is the simplest reliable starting point.

## Game development (Unity)

Games are one of the most popular things to build, and Unity is the most common starting point. Agent-assisted Unity work matured a lot in 2026, and it fits the plan-then-build workflow in this guide almost exactly. Unity's own tooling mirrors the Ask / Plan / Agent structure.

**Two things make Unity different from the other channels:**

- A Unity project is not just code. It is C# scripts plus scenes, prefabs, materials, and other assets that live in the editor. An agent editing only text files sees part of the picture. That is why the Unity-specific tooling below matters.
- Verifying "does it work" often means checking the running scene and the editor console, not just whether the code compiled. The strongest setups give the agent a way to see into the editor.

### Two ways to bring an agent to Unity

**Option A: Unity's built-in AI Assistant.** Unity 6 and later include an in-editor assistant (open beta as of 2026) with three modes that map onto this guide's approach:

- **Ask.** Read-only questions grounded in your actual project ("what does this script do," "why is this erroring").
- **Plan.** Turns a loose idea into a structured, step-by-step plan you approve before anything runs. The same plan-first discipline as the Plan agent, built into the editor.
- **Agent.** Makes changes: writes C# scripts, creates and edits GameObjects and prefabs, modifies components, and can roll its own changes back via checkpoints.

Because it is inside the editor, it already knows your scene hierarchy, installed packages, and target platform, so its output is specific to your project rather than generic.

**Option B: an external agent connected via the Unity MCP Server.** If you are already using a harness, Unity's official MCP Server connects it to a running Unity project. This is the more powerful setup for the workflow this guide teaches, because it closes the feedback loop. The agent can read the scene hierarchy, inspect GameObjects and components, read the editor console, and fix errors, all in the same session, without you copy-pasting error text back and forth. A typical loop becomes: the agent writes a script, Unity compiles it, the agent reads the console, sees the null-reference error, and fixes it.

### The cost angle

Unity's built-in AI runs on a credit system. Personal Edition gets a time-limited free trial, then it is a monthly subscription for a credit allowance. That is a real barrier on a budget. The workaround fits this guide's whole philosophy: Unity's **AI Gateway**, and the MCP Server path, let you route work through your own external model subscription instead of consuming Unity's credits. If you are already set up with a cheaper or free agent model, point that at Unity rather than paying twice. Confirm the current terms, since beta pricing shifts. The principle holds: bring your own model, avoid the per-action credit meter.

### Version control note

Everything under Github still applies, with one wrinkle: Unity projects generate a lot of files, and not all of them belong in git. A project needs a proper `.gitignore` (excluding `Library/`, `Temp/`, and other generated folders) or the repo balloons with machine-specific junk. Ask the agent to set up a Unity-appropriate `.gitignore` when you first create the repo. It is a standard, well-known file, so this is a safe one-line request. Large binary assets are their own topic, and git is not ideal for them, but for a small-to-medium project a good `.gitignore` covers most of the pain.

### A realistic starting point

1. Use chat (or Ask and Plan mode) to design the game and produce a `PROJECT-PLAN.md`, same as any other project.
2. Decide which agent path fits: the built-in Assistant if you are happy staying in-editor and have credits or a trial, or an external agent via the MCP Server if you want to reuse your existing cheaper-model setup.
3. Build in small, checked steps, and lean on the console-reading loop. "Compiles cleanly but behaves wrong" is extremely common in game logic, and the agent seeing the runtime error is what makes iteration fast.
4. Commit often, with that `.gitignore` in place from the start.

One caution: an agent can scaffold scripts and wire up scenes impressively fast, but game feel (timing, responsiveness, what is actually fun) is judgment it cannot supply. Treat it as a very fast builder of the parts you specify, not a designer of the experience.

## Hardware (Arduino)

Physical computing is where autonomous agent testing gets genuinely exciting, because the agent can close the loop itself: write code, compile it, upload it to the board, and read what the board sends back, all without you clicking through an IDE each time.

**The key tool is the Arduino CLI** (`arduino-cli`), a command-line version of the Arduino IDE. An agent can run command-line tools directly, which turns "help me write this sketch" into "write, compile, upload, and check it actually ran."

**Installing it:** `arduino-cli` installs via package managers (Homebrew on Mac, the usual package managers on Linux), an install script, or a direct download. After installing, update its index and install the "core" for your board (the AVR core for an Uno, or an ESP32 core). The exact core depends on the hardware. The agent can do this part itself, as described below.

**The CLI and the standard IDE work well together.** A common and comfortable workflow:

- Use the **Arduino IDE** for what it is good at: the Serial Monitor and Plotter for watching output, quick manual tweaks, board and library browsing.
- Use the **CLI, driven by the agent,** for the fast iterative loop: compiling, uploading, and reading serial output programmatically. The IDE is built on the same CLI underneath, so they stay consistent. The same board definitions and libraries work in both.

**The commands the agent will lean on:**

- `arduino-cli board list` finds which port the board is on.
- `arduino-cli compile --fqbn <board> <sketch>` compiles, catching errors before touching hardware.
- `arduino-cli upload -p <port> --fqbn <board> <sketch>` flashes it to the board.
- `arduino-cli monitor -p <port>` reads the serial output the board prints back.

**What the agent can do on its own.** Every step above is a command with clear success or failure output. That is what lets the agent run the whole loop, not just write the code:

1. **Install what the code needs.** The agent reads the `#include` lines in the sketch and the board you named, then installs the pieces itself. `arduino-cli core update-index` refreshes the catalog. `arduino-cli core install arduino:avr` (an Uno) or `arduino-cli core install esp32:esp32` (an ESP32 board) adds the board support. Boards from outside the official index need their board-manager URL added first, with `arduino-cli config add board_manager.additional_urls <url>`. Libraries follow the same pattern: `arduino-cli lib search neopixel` to find the exact name, then `arduino-cli lib install "Adafruit NeoPixel"` to add it. If a compile fails on a missing header, the agent can search for the library, install it, and compile again without asking you. A `sketch.yaml` build profile can record the core and libraries next to the sketch, so the same setup reproduces on another machine.

2. **Test-compile without hardware.** `arduino-cli compile --fqbn <board> <sketch>` after every change. Errors come back as text with a file and line number, so the agent fixes them the same way it fixes a Python traceback. No board needs to be plugged in. This is the cheap, fast half of the loop, and most iterations never need the second half.

3. **Upload and read back.** `arduino-cli upload -p <port> --fqbn <board> <sketch>` flashes the board. Then `arduino-cli monitor -p <port> --config baudrate=115200` reads what it prints. The monitor runs until stopped, so have the agent read for a fixed number of seconds and exit, with a timeout wrapper or a few lines of Python using pyserial. Write the sketch to report over Serial: one line at startup, then the values that matter. That turns the serial monitor into test output the agent can read like any other text and check against what the plan said should happen.

One prompt can drive the whole loop: "This sketch targets an Adafruit Feather ESP32-S3 and uses the Adafruit NeoPixel library. Install whatever core and libraries it needs, compile it, upload it to the connected board, then read the serial output for ten seconds and tell me whether the startup line appears and what values follow." The agent installs, compiles, fixes, uploads, reads, and reports. You look at the report and at the board.

**Handling the serial-port conflict, the clean way.** The serial port can only be used by one thing at a time. If the IDE's Serial Monitor, or any monitor process, is holding the port, an upload fails, and vice versa. The tempting fix is to have the agent kill the monitor before uploading and restart it after. There is a simpler, more robust default: do not have the build script open the monitor at all. Let the script's job be strictly compile, upload, exit, and have it print the `arduino-cli monitor` command for you or the agent to run as a separate, deliberate step afterward. Because the pipeline never holds the port and the monitor is always a distinct action, the conflict cannot happen. No process-killing, no timing races.

**The part that makes it portable: auto-detecting the port.** A hardcoded port like `/dev/ttyACM0` breaks the moment your board enumerates differently or you switch to another OS. The robust move is to have the script discover the port instead of assuming it. `arduino-cli board list --format json` returns every connected port as structured data. A small script can score each one by USB vendor ID, board keywords (esp32, cp210, ch340, feather, and so on), and serial-path patterns to pick the microcontroller out from other devices. That enables three useful modes:

- **auto:** if exactly one likely board is connected, use it. No typing a port at all.
- **all:** upload to every detected board, handy for flashing several devices at once.
- **explicit:** pass a specific port when you need to override.

### Setting up your own upload script

Rather than typing the compile and upload commands by hand every time, have the agent build a small `upload.sh` for your project once. It pays off quickly. It encodes the right board name and settings so you do not have to remember them. It removes the hardcoded-port fragility. It gives the agent a single reliable command to call during its build-test loop. And it works the same wherever you run it. Keep it portable: a shell script runs natively on Mac and, on Windows, through Git Bash, which comes with Git. The port-detection logic is cleanest in Python called from the shell script, which fits since Python is already in the toolchain.

A good starting prompt to hand the agent:

> Write an upload.sh script for this Arduino project. It should: compile the sketch for [my board, e.g. Adafruit Feather ESP32-S3], auto-detect the serial port by parsing `arduino-cli board list --format json` (don't hardcode a port), upload to it, and then *print* the `arduino-cli monitor` command rather than running it. I'll run the monitor separately so it never conflicts with the upload. Add a `--compile` flag for a verify-only pass, and make it work on both macOS and Windows (Git Bash).

Useful refinements to ask for as the project grows:

> Add a `--ports` option that just lists the detected candidate boards and why each was matched, so I can debug when auto-detect picks the wrong one.
>
> Add an `--all` mode that uploads to every detected board at once, for when I'm flashing several devices.
>
> Add a `--baud` override and set a sensible default upload speed for my board.

The transferable part is the real lesson. Wrapping a fiddly, error-prone command sequence in one well-named script, with sensible detection instead of hardcoded assumptions, is the same discipline as writing a good AGENTS.md. You turn something that has to be remembered and retyped into something reliable the agent can just call.

**Why this enables autonomous testing:** the agent can compile to catch syntax and logic errors with no hardware involved, then upload to an auto-detected port and, as a separate step, read the serial output to confirm the code behaves correctly on the real device, feeding that back into its next edit. That is a genuine build-test-fix loop for physical hardware, not just code that looks plausible.

**What to put in AGENTS.md for these projects:** the board and its FQBN, the core and libraries it needs, the upload script and its flags, the serial baud rate, and the rule that the monitor is always run separately from uploads.

# Glossary

**Agent** — An LLM-driven system that pursues a goal by looping: reason → act (tool calls) → observe → repeat.

**Agentic loop** — That core cycle. All the machinery in this guide exists to feed and constrain it.

**AGENTS.md** — Markdown instructions auto-loaded at the start of every session; the persistent project briefing for agents.

**arduino-cli** — The command-line Arduino toolchain. Lets an agent compile, upload, and read serial output without the IDE.

**Autonomy** — How much the agent decides vs. asks. A dial set per task, from approve-everything to fully independent.

**Branch** — A parallel line of history in a git repo. Try an idea on a branch, merge it back if it works, delete it if not.

**Checkpoints / rewind** — Harness snapshots of file state that let you undo an agent's edits step by step.

**Commit / push** — A commit saves a checkpoint in the repo's history. A push sends those checkpoints to GitHub.

**Compaction** — Summarizing a filling session to free up context window; details blur in the process.

**Context window** — Everything a model can consider at once: system prompt, conversation, tool outputs. Its working memory.

**Context engineering** — Deciding what deserves to be in the window now vs. what can be fetched on demand.

**Context rot** — The degradation of reasoning and recall as the context window fills up.

**Core (Arduino)** — The board-support package for a family of boards, installed with `arduino-cli core install`. A sketch will not compile without the right one.

**FQBN** — Fully qualified board name, such as `arduino:avr:uno` or `esp32:esp32:adafruit_feather_esp32s3`. What `arduino-cli` needs to know which board it is compiling for.

**GitHub Pages** — Free static hosting straight from a repo, served over HTTPS at `username.github.io/repo-name`.

**Hallucination** — Confident fabrication — an API that doesn't exist, a made-up command flag. Most common around unfamiliar tools; verification is the antidote.

**Harness** — The application around the model: assembles context, executes tools, enforces permissions, manages sessions and UI.

**Markdown** — Plain text with light formatting (`#` headings, `-` bullets, backticks for code). The default format for plans, AGENTS.md, and skills.

**MCP (Model Context Protocol)** — Open standard for connecting models to external tools and data via servers; the USB-C analogy.

**Modality** — The input types a model accepts (text, images, audio).

**Model** — The LLM doing the reasoning.

**Parameters** — A model's learned weights; a rough proxy for capacity. Rarely published for modern models.

**Permission mode** — Harness setting for what the agent may do without asking (ask / accept edits / plan / full-auto).

**Plan mode** — A read-only mode that explores and produces a plan file. No code changes.

**Prompt** — The text you give the model. The **system prompt** is the harness's standing instructions that shape all behavior.

**Rate limit / usage window** — Subscription metering: a set number of requests per reset window (5 hours, day, week, month), shared across a model lineup by cost tier.

**Sandboxing** — Restricting what an agent's actions can touch (filesystem, network) so autonomy is safer.

**Session / thread** — One continuous conversation with its own context window.

**Skill** — A packaged procedure (SKILL.md + optional scripts) loaded into context only when relevant.

**Slash command** — A typed shortcut that expands into a prewritten prompt or workflow; user-definable.

**Subagent** — An agent spawned by the main agent with a fresh context window; returns a written result.

**Textport** — TouchDesigner's Python console. Paste a generated build script there and it constructs the network.

**Thinking level** — How much reasoning effort the model spends; higher is better on hard problems but slower and costlier.

**Token** — The unit models read, write, and bill in; roughly three-quarters of a word. Context size and cost are both token counts.

**Tool / tool call** — A capability the harness executes at the model's request (read a file, run a command); the structured request is the tool call.

**Tunnel** — A temporary public HTTPS URL that forwards to a local server, so a phone can load what your laptop is serving.

**Virtual environment** — A per-project sandbox for Python dependencies, so projects do not interfere with each other.

**WebXR** — The web standard for VR and AR in the browser. three.js supports it directly; it needs HTTPS.

**Worktree** — `git worktree`: parallel checkouts of one repo so multiple agents can work simultaneously.
