window.CC = window.CC || {}; window.CC.lessonsNew = window.CC.lessonsNew || [];
window.CC.lessonsNew.push(
  {
    id: "models-1", n: 1, domain: "models", title: "Choosing a model",
    body: "Model choice is a trade-off between capability, speed and cost, and the exam expects an evidence-based process rather than brand loyalty or leaderboard scores. Know the current tiers and what each is for, the two starting strategies (efficiency-first and capability-first), why your own eval set decides, and why effort is often a better lever than switching models.",
    points: [
      "Weigh four criteria: needed capabilities, response speed, cost at your volume, and the effort setting. Write them down first, because they decide which tier you test first.",
      "The lineup is tiered. At the time of writing: Haiku 5.5 for lowest latency and price, Sonnet 5.5 for balanced speed and intelligence, Opus 5.5 for long agentic coding and knowledge work, Fable 5.1 for the hardest long-horizon work.",
      "Efficiency-first: start with the small, fast model, test thoroughly, and upgrade only for a measured capability gap. It suits prototyping, tight latency budgets, cost-sensitive work and high-volume simple tasks such as classification, extraction and routing.",
      "Capability-first: start with a strong model, optimise prompts for it, confirm it meets the bar, then reduce cost by lowering effort or moving down a tier. Use this for complex reasoning and autonomous agentic work where accuracy outweighs cost.",
      "Effort trades intelligence for latency and cost inside one model. The docs say tuning it is often better than switching models. Defaults differ by model (high on some, medium on Opus 5.5 and Haiku 5.5), so check the model page.",
      "Decide on your own benchmark: build an eval set from real inputs, run your actual prompts, and compare accuracy, response quality, edge-case handling, latency and cost. The docs call a good evaluation set the most important step.",
      "Compare on cost per completed task, not per token. A pricier model that needs fewer retries, fewer tokens or less post-processing can be cheaper overall, and Anthropic reports that cost per solved task is the metric to track.",
      "Combine models by step difficulty: a cheap model handles bulk or routine work, and a stronger model handles planning or hard decisions. Common shapes are an orchestrator delegating to workers, or an executor escalating to an advisor.",
      "Token counts differ between models because tokenizers differ (models from Opus 4.7 on use a newer tokenizer that yields more tokens for the same text). Count tokens for the exact model before you budget."
    ],
    traps: [
      "People assume the newest or largest model is always the right choice, but the docs recommend testing a smaller model first and escalating only when your evals show a gap.",
      "People assume public benchmark rankings pick the model for them, when only results on your own representative test set show whether a model meets your bar.",
      "People assume the per-token price decides the cheapest option, when retries, output length, thinking tokens and escalations make cost per completed task the real measure.",
      "People assume switching tiers is the only way to cut cost or latency, overlooking that lowering effort, caching and shorter output are cheaper first moves.",
      "People assume a model choice made once stays valid, but models are retired on a schedule and new releases change the cost-quality frontier, so re-evaluate periodically."
    ],
    sources: [
      "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model",
      "https://platform.claude.com/docs/en/about-claude/models/overview",
      "https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence"
    ]
  },
  {
    id: "models-2", n: 2, domain: "models", title: "Cost and latency levers",
    body: "Cost and latency are driven by input tokens, output tokens, model tier and how you call the API. The exam tests which lever fits which situation: caching for repeated prefixes, batching for non-urgent bulk work, output limits and concise prompts, routing to smaller models, and streaming for perceived (not actual) speed.",
    points: [
      "Prompt caching reuses a stable prefix (tools, system prompt, examples, documents). Cached reads cost a fraction of normal input price and cut latency. Anthropic's guidance ranks it as usually the largest lever.",
      "Caching works on exact prefix matches: put static content first and variable content last. Any change earlier in the prefix, including a change to the thinking or effort configuration, starts a new cache entry.",
      "The default cache lifetime is 5 minutes, refreshed on each use. A 1-hour lifetime exists at a higher write cost. Prompts below a model-specific minimum size are not cached and no error is returned, so check cache_read_input_tokens in usage.",
      "The Message Batches API processes requests asynchronously at a 50% discount on token prices (verify on the pricing page, since prices change). Most batches finish within an hour, but a batch expires if it has not completed within 24 hours.",
      "Use batching for non-urgent bulk work such as overnight labelling, bulk evals or backfills. Never use it for interactive features, because you cannot control when individual results arrive.",
      "Output tokens cost more than input tokens and dominate generation time. Ask for concise, structured output, set a sensible max_tokens as a hard ceiling, and test that quality survives. A cap that is too tight truncates answers (stop_reason max_tokens).",
      "Route by difficulty: send simple, high-volume work (classification, extraction, routing) to a small fast model and escalate hard cases to a stronger one. Validate the router and each tier on an eval set before shipping.",
      "Streaming does not shorten total generation time; it lowers time to first token so users see output sooner. Use it for chat and long outputs, and as a safeguard for long requests that risk timeouts.",
      "Trim what you send: retrieve only relevant passages instead of whole documents, resize images to what the task needs, and avoid resending content the task does not use. Fewer input tokens means lower cost and faster prefill."
    ],
    traps: [
      "People assume streaming reduces cost or total latency, when it only changes when the first tokens arrive.",
      "People assume lowering temperature makes responses cheaper or faster, but current models reject non-default temperature; use effort, concise prompts and max_tokens instead.",
      "People assume batching combines with real-time needs, when batch results can take up to 24 hours and suit only work that can wait.",
      "People assume caching is automatic for any repeated text, but it needs cache_control or automatic caching, a stable prefix and a minimum prompt size, and it is verified only through the usage fields.",
      "People assume a smaller max_tokens makes answers more concise and accurate, when it merely truncates output at the limit and can cut off thinking or structured data."
    ],
    code: "response = client.messages.create(\n  model=\"claude-sonnet-5-5\",\n  max_tokens=1024,\n  cache_control={\"type\": \"ephemeral\"},\n  system=LONG_STATIC_INSTRUCTIONS,\n  messages=msgs,\n)\nu = response.usage\nprint(u.cache_creation_input_tokens, u.cache_read_input_tokens)",
    sources: [
      "https://platform.claude.com/docs/en/build-with-claude/prompt-caching",
      "https://platform.claude.com/docs/en/build-with-claude/batch-processing",
      "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency",
      "https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence"
    ]
  },
  {
    id: "models-3", n: 3, domain: "models", title: "Thinking and effort",
    body: "Thinking lets Claude reason before answering, at the price of extra output tokens and latency. Current models use adaptive thinking steered by the effort parameter, while older models used manual extended thinking with budget_tokens. The exam tests which mode applies where, what effort controls, and how thinking tokens are billed and bounded by max_tokens.",
    points: [
      "Thinking arrives as thinking content blocks before the text blocks. Read the answer by block type, never by position such as content[0], because thinking blocks can come first.",
      "Adaptive thinking (thinking type adaptive) lets the model decide whether and how deeply to think per request. On Opus 5.5 it is always on, and omitting the thinking field is equivalent to adaptive.",
      "Effort (output_config.effort: low, medium, high, xhigh, max, with availability varying by model) is the recommended control for depth. It affects all output tokens, including text, tool calls and thinking, and works as soft guidance rather than a token budget.",
      "Defaults differ by model: Opus 5.5 and Haiku 5.5 default to medium, while Sonnet 5.5 and Fable 5.1 default to high. Setting the default value explicitly behaves exactly like omitting it. Check the effort page for your model.",
      "Thinking tokens are billed as output tokens and count toward max_tokens, even when the thinking text is summarised or omitted. The billed output count can therefore exceed the visible text, and max_tokens remains a hard ceiling on thinking plus answer.",
      "Size max_tokens for thinking plus answer. If you see stop_reason max_tokens, raise max_tokens when the reasoning mattered, or lower effort when the model over-thought. Anthropic suggests starting large (for example 64k) at xhigh or max.",
      "Manual extended thinking (type enabled, budget_tokens below max_tokens) is for older models: deprecated on Opus 4.6 and Sonnet 4.6, a 400 error on Claude 4.7 and later. Opus 4.5, Sonnet 4.5 and Haiku 4.5 support only this mode.",
      "Whether you can turn thinking off depends on the model: some reject type disabled with a 400 error, and some allow it only at effort high or below. Check the per-model table on the thinking page before relying on it.",
      "In tool loops, return thinking blocks unmodified with the tool results. Editing, reordering or dropping them can cause a 400 error. Changing the thinking or effort configuration between requests invalidates cached prefixes."
    ],
    traps: [
      "People assume thinking tokens are free or billed separately from output, when they are billed as output tokens and consume max_tokens even if the thinking text is omitted.",
      "People assume budget_tokens is how you control thinking everywhere, but on Claude 4.7 and later it is rejected with a 400 error and effort replaces it.",
      "People assume effort is a strict token budget, when the docs describe it as soft guidance; max_tokens is the only strict ceiling.",
      "People assume the visible thinking text is the raw chain of thought and its length matches the bill, but it is a summary (or omitted) while billing uses the full thinking tokens.",
      "People assume you can pass adaptive as an effort value, when adaptive is a thinking mode and effort uses low, medium, high, xhigh or max."
    ],
    code: "response = client.messages.create(\n  model=\"claude-opus-5-5\",\n  max_tokens=16000,\n  output_config={\"effort\": \"medium\"},\n  messages=msgs,\n)\nfor b in response.content:\n  if b.type == \"text\":\n    print(b.text)",
    sources: [
      "https://platform.claude.com/docs/en/build-with-claude/thinking",
      "https://platform.claude.com/docs/en/build-with-claude/effort",
      "https://platform.claude.com/docs/en/build-with-claude/extended-thinking",
      "https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost"
    ]
  },
  {
    id: "models-4", n: 4, domain: "models", title: "Model changes: parameters, versions and deprecation",
    body: "Models change underneath production code: parameters get rejected, IDs are pinned, and old models are retired. The exam tests what current models reject, how model IDs and aliases behave, the deprecation lifecycle, and the safe upgrade routine: read the migration guide, run your eval suite, then roll out gradually.",
    points: [
      "On Opus 4.7 and later, Sonnet 5 and 5.5, Haiku 5.5 and Fable, non-default temperature, top_p or top_k returns a 400 error. Omit them; use prompting and effort. Older models accept them, though not temperature or top_k with thinking.",
      "Also rejected: a prefilled final assistant turn (Claude 4.6 and later), manual budget_tokens thinking, and on Opus 5.5, Sonnet 5.5 and Fable 5.1 forced tool_choice (any or tool). Use structured outputs, strict tool use or system instructions instead.",
      "A 400 error after a model swap usually means a removed parameter, so read the target model's migration guide. The /claude-api migrate skill in Claude Code can apply many changes, but you still verify the result.",
      "Model IDs are pinned snapshots. From the 4.6 generation on, dateless IDs such as claude-sonnet-4-6 are not evergreen pointers: weights never change under an ID, and updates ship under a new ID. Serving infrastructure can still shift behaviour slightly.",
      "Before the 4.6 generation, IDs carry a snapshot date and the API also accepts a shorter alias pointing to the latest snapshot of that version. Pin the exact ID in production so behaviour changes only by deliberate decision.",
      "Lifecycle states are Active, Legacy, Deprecated and Retired. Retired models fail on requests. Anthropic gives at least 60 days notice before retiring a publicly released model, announced by email and on the deprecations page.",
      "Each model ID has its own retirement schedule, and Bedrock and Google Cloud set their own dates. To find deprecated models still in use, export usage by API key and model from the Console Usage page.",
      "Upgrade routine: read the migration guide, update the ID and breaking parameters, re-tune prompts written for the old model, run your eval suite on quality, cost and latency, then roll out gradually with a rollback path.",
      "Behaviour differs between models even with identical prompts (verbosity, formatting, default effort, tokenizer), so a new model needs eval results, not an assumption that newer means drop-in."
    ],
    traps: [
      "People assume setting temperature to 0 is the standard way to get consistent output, but on current models any non-default value is rejected and consistency comes from clear prompts, constrained output and evals.",
      "People assume a dateless model ID such as claude-opus-5-5 floats to the latest version, when it is a fixed snapshot and updates ship under a new ID.",
      "People assume a deprecated model is silently redirected to its successor, when it keeps working until the retirement date and then requests simply fail.",
      "People assume a newer model is a drop-in replacement, overlooking rejected parameters, different defaults and prompt behaviour that only an eval run exposes.",
      "People assume the partner clouds follow the same retirement dates, but Amazon Bedrock and Google Cloud set their own schedules."
    ],
    code: "# 400 on current models:\n#   temperature=0.2, top_p=0.9\n#   thinking={\"type\": \"enabled\", \"budget_tokens\": 8000}\n#   messages ending with an assistant prefill\nresponse = client.messages.create(\n  model=\"claude-opus-5-5\",  # pinned snapshot\n  max_tokens=4096,\n  output_config={\"effort\": \"low\"},\n  messages=msgs,\n)",
    sources: [
      "https://platform.claude.com/docs/en/models/opus-5-5/migration-guide",
      "https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions",
      "https://platform.claude.com/docs/en/about-claude/model-deprecations",
      "https://platform.claude.com/docs/en/build-with-claude/thinking"
    ]
  },
  {
    id: "code-1", n: 1, domain: "code", title: "CLAUDE.md, memory and settings",
    body: "Claude Code starts every session with a fresh context, so persistent knowledge comes from CLAUDE.md files, auto memory and settings. The exam tests where memory files live, what belongs in them, how settings files and precedence work, how allow, ask and deny rules are evaluated, and what permission modes and plan mode do.",
    points: [
      "CLAUDE.md holds instructions you write; auto memory holds notes Claude writes itself from your corrections. Both load at session start as context, not as enforced configuration, so for guaranteed blocking use permission rules or a PreToolUse hook.",
      "CLAUDE.md scopes: managed policy (organisation-wide, system path), user (~/.claude/CLAUDE.md), project (./CLAUDE.md or ./.claude/CLAUDE.md, shared via git) and local (./CLAUDE.local.md, personal and gitignored). Files in parent directories load at launch; subdirectory files load on demand.",
      "All discovered files are concatenated, not overridden, ordered from broad to specific. Contradictory instructions across files can lead Claude to pick one arbitrarily, so audit them periodically.",
      "Put in CLAUDE.md what you would otherwise re-explain: build and test commands, conventions, project layout, always-do rules. Write them concretely and verifiably, and aim for under about 200 lines. Run /init to generate a starting file.",
      "Move multi-step procedures or single-area rules out of CLAUDE.md into a skill or a path-scoped rule in .claude/rules, since a skill body loads only when used. @path imports organise files but do not reduce context cost.",
      "settings.json controls behaviour rather than instructions: permissions, hooks, environment variables, model. Scopes are user (~/.claude/settings.json), shared project (.claude/settings.json), project local (.claude/settings.local.json) and managed.",
      "Precedence, highest first: managed, command-line --settings, project local, shared project, user. List settings such as permissions.allow merge across files instead of overriding. Managed settings cannot be overridden by any user file.",
      "Permission rules are Tool or Tool(specifier), such as Bash(git push *). They are evaluated deny first, then ask, then allow, and the first match wins, so an allow rule cannot carve an exception out of a broader deny rule.",
      "Permission modes include default (Manual), acceptEdits, plan, auto, dontAsk and bypassPermissions; Shift+Tab cycles them. Plan mode researches and proposes without editing source until you approve the plan. Use bypassPermissions only in isolated containers or VMs."
    ],
    traps: [
      "People assume CLAUDE.md instructions are enforced like a rule engine, when they are context Claude usually follows; enforcement comes from deny rules, modes or hooks.",
      "People assume a more specific allow rule overrides a broader deny rule, but deny is evaluated first and always wins.",
      "People assume CLAUDE.md exists only at the repository root, when it also exists at user, local, managed and subdirectory levels.",
      "People assume the longer and more detailed the CLAUDE.md, the better, but long files consume context and reduce adherence, so keep it short and move procedures to skills.",
      "People assume personal approvals belong in the committed settings file, when they go to .claude/settings.local.json or user settings so teammates are unaffected."
    ],
    code: "{\n  \"permissions\": {\n    \"allow\": [\"Bash(npm run test *)\"],\n    \"ask\": [\"Bash(git push *)\"],\n    \"deny\": [\"Read(./.env)\"],\n    \"defaultMode\": \"plan\"\n  }\n}",
    sources: [
      "https://code.claude.com/docs/en/memory",
      "https://code.claude.com/docs/en/settings",
      "https://code.claude.com/docs/en/permissions",
      "https://code.claude.com/docs/en/permission-modes"
    ]
  },
  {
    id: "code-2", n: 2, domain: "code", title: "Commands, skills, hooks, subagents and headless mode",
    body: "Claude Code is extended through skills, hooks, subagents and MCP servers, and automated through print mode. The exam tests which mechanism fits which need: skills for reusable procedures, hooks for deterministic enforcement, subagents for context isolation, MCP for external tools, and claude -p for CI with least-privilege permissions.",
    points: [
      "Custom commands have been merged into skills. A file at .claude/commands/deploy.md and a skill at .claude/skills/deploy/SKILL.md both create /deploy. Existing command files keep working; skills add supporting files and invocation control.",
      "Skill descriptions load into context so Claude knows what exists, but the full body loads only when the skill is invoked. Set disable-model-invocation: true for side-effecting workflows you want to trigger only by typing /name.",
      "Hooks are user-defined commands that run at lifecycle events, giving deterministic control instead of relying on the model. Common events: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, SubagentStop and SessionEnd.",
      "Hook exit codes: 0 is success, 2 is a blocking error on events that can block (PreToolUse blocks the tool call, UserPromptSubmit rejects the prompt), other codes are non-blocking errors. Hooks live in settings files, plugins, skills or agents.",
      "A subagent runs in its own context window with its own system prompt, tools and permissions, and returns only a summary. Use it for noisy side tasks, to restrict tools, and to route routine work to a cheaper model.",
      "Subagent definitions live in .claude/agents/ (project) or ~/.claude/agents/ (user), with managed settings and the --agents flag taking precedence. Keep descriptions short, because they sit in context and Claude uses them to decide when to delegate.",
      "MCP servers connect Claude Code to external tools and data via claude mcp add (http or stdio transports). Scopes: local (default, private), project (.mcp.json, shared) and user. Vet servers first, since fetched content can carry prompt injection.",
      "claude -p runs one prompt non-interactively and exits with a status code. Use --output-format json for structured results and cost, --allowedTools or --permission-mode to pre-approve actions, and --max-turns or --max-budget-usd to bound runs.",
      "Least privilege in CI: grant only the specific tools needed, withhold production secrets, run isolated, and keep a human review gate on consequential changes. Use --bare for reproducible runs that skip hooks, MCP servers and CLAUDE.md auto-discovery."
    ],
    traps: [
      "People assume skills and custom commands are separate systems, when commands were merged into skills and the old command files still work.",
      "People assume a CLAUDE.md instruction guarantees something always happens, when only a hook runs deterministically every time its event fires.",
      "People assume subagents share the main conversation's context, but each has its own window and only its summary returns to the parent.",
      "People assume claude -p needs --dangerously-skip-permissions to work in CI, when a narrow --allowedTools list or a suitable permission mode is the safer pattern.",
      "People assume a project-scoped MCP server is private, when .mcp.json is committed and shared, while the default local scope is the private one."
    ],
    code: "# CI: read-only review, bounded, structured output\nclaude --bare -p \"Review this diff for bugs\" \\\n  --allowedTools \"Read,Grep\" \\\n  --max-turns 5 \\\n  --output-format json | jq -r '.result'",
    sources: [
      "https://code.claude.com/docs/en/skills",
      "https://code.claude.com/docs/en/hooks",
      "https://code.claude.com/docs/en/sub-agents",
      "https://code.claude.com/docs/en/mcp",
      "https://code.claude.com/docs/en/headless"
    ]
  },
  {
    id: "eval-1", n: 1, domain: "eval", title: "Building evals",
    body: "Evals turn prompt and model changes from guesswork into measurement. The exam tests how to define measurable success criteria, build a representative test set with edge cases, pick the right grading method (code, model or human), write clear rubrics, and re-run the suite on every prompt or model change to catch regressions.",
    points: [
      "Start with success criteria that are specific, measurable, achievable and relevant. 'Classifies sentiment well' is not testable; a target such as an F1 score on a held-out set is. Even safety can be quantified as a flagged-output rate.",
      "Mirror your real task distribution in the test set, including edge cases: missing or irrelevant input, very long input, malformed input, and ambiguous cases where humans disagree. A set of easy examples inflates scores.",
      "Keep a held-out set separate from the examples you used while tuning the prompt, otherwise you measure memorisation of your examples rather than generalisation.",
      "Prefer volume over polish: the docs favour many automatically gradable cases with slightly lower individual signal over a few hand-graded ones, because automation is what makes frequent re-runs possible.",
      "Choose the fastest, most reliable, most scalable grader that works. Code-based grading (exact or string match, schema validation, unit tests) is fastest and most reliable but lacks nuance for judgments that are not rule-based.",
      "Model-based grading (LLM-as-judge) is fast, flexible and scalable for complex judgments. Use a detailed rubric, a constrained output (correct or incorrect, or a 1 to 5 score), let the grader reason first, and validate it before scaling.",
      "Human grading is the most flexible and highest quality but slow and expensive, so use it to calibrate model graders on a sample and to review hard cases, not for every run.",
      "A grader prompt is itself a prompt: test it against human labels, and use a different, clearly written rubric per criterion because one use case can need several rubrics.",
      "Run the suite on every prompt, model, effort or parameter change, and before upgrades. Track quality, cost and latency together, add every production failure to the set, and compare scores to a baseline."
    ],
    traps: [
      "People assume a few hand-picked examples are enough, when a representative set with edge cases and enough volume is what exposes regressions.",
      "People assume LLM-as-judge needs no calibration, but vague criteria give unreliable scores, so use a clear rubric and compare against human judgment on a sample.",
      "People assume human review is the gold standard to use everywhere, when the docs say to avoid it where code or model grading works, since it does not scale.",
      "People assume an eval is a one-off launch gate, when it is a regression suite re-run on every change.",
      "People assume asking the model to explain why a new prompt is better counts as evidence, when only measured scores on a test set do."
    ],
    code: "def grade(output, golden):\n  # code-based: exact match\n  return output.strip() == golden\n\nscores = [grade(run(c.input), c.golden) for c in cases]\nprint(sum(scores) / len(scores))",
    sources: [
      "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests",
      "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model",
      "https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence"
    ]
  },
  {
    id: "eval-2", n: 2, domain: "eval", title: "Debugging and observability",
    body: "When an LLM feature misbehaves in production you need the evidence to reproduce it. The exam tests what to log (full requests and responses, with redaction), how request IDs and stop reasons guide diagnosis, how to trace multi-step agent runs, how to monitor usage, cost and latency percentiles, and how to turn each failure into a test case.",
    points: [
      "Log the full request and response for each call: model ID, system prompt, messages, tool definitions, effort and other parameters, content blocks, stop_reason and usage. Without the exact input you cannot reproduce a failure.",
      "Redact before storing: strip or mask credentials and personal or regulated data, apply retention limits and access controls, and involve your privacy or compliance team where regulated data is involved. Never log API keys.",
      "Every API response carries a request-id header, and error bodies include request_id. SDKs expose it (for example a _request_id property). Log it with each call and include it when contacting support.",
      "Read stop_reason first when output looks wrong: max_tokens means truncation (thinking tokens count toward it), tool_use means your code must run a tool, refusal means a declined response, and end_turn means a natural finish.",
      "Reproduce from the log: replay the exact stored request against the same pinned model ID, then change one variable at a time (prompt, model, effort, context). Outputs can vary between runs, so test several times and judge by rates.",
      "Handle error classes differently: 429 and 529 need backoff and retries (the official SDK retries transient failures by default), 400 means fix the request, 401 and 403 are credentials or permissions, and 504 suggests streaming for long requests.",
      "For multi-step or agent runs, give each run a trace ID and log every step: model call, tool call with arguments and result, retries, token usage. Failures often start at an early bad tool result, not the final answer.",
      "Monitor usage and cost from response usage fields (input, output, cache read and cache creation tokens) and from the Console Usage and Cost pages or the Usage and Cost Admin API. Alert on sudden changes and set spend limits.",
      "Track latency as percentiles (p50, p95, p99) and time to first token, not averages. Slow outliers drive timeouts and user experience. Turn every confirmed production failure into a permanent regression case in your eval set."
    ],
    traps: [
      "People assume a failing prompt should be rewritten first, when the first step is to find the logged request and reproduce the failure.",
      "People assume logging everything verbatim is harmless, overlooking that prompts and outputs can contain personal or secret data that must be redacted and retained carefully.",
      "People assume average latency is enough, but averages hide the slow tail that causes timeouts and complaints.",
      "People assume a truncated answer means the model failed, when stop_reason max_tokens often means the limit was too low, especially with thinking tokens counting toward it.",
      "People assume the thinking text explains the model's cost or reasoning exactly, but it is a summary or omitted, and billing counts the full thinking tokens."
    ],
    sources: [
      "https://platform.claude.com/docs/en/api/errors",
      "https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons",
      "https://platform.claude.com/docs/en/manage-claude/usage-cost-api",
      "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency"
    ]
  }
);
