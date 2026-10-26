window.CC = window.CC || {}; window.CC.why = window.CC.why || {};
Object.assign(window.CC.why, {
  "q4": [
    "At 2 million tickets a day the largest model multiplies cost and latency for simple labelling, where its extra reasoning capability adds little measurable accuracy.",
    "Right-sizing is sensible, but skipping evaluation means you cannot know the smaller model meets your accuracy bar or detect regressions before they reach production.",
    "Simple high-volume classification suits a smaller, faster model, and an eval set confirms it actually clears your accuracy threshold before you commit at scale.",
    "Thinking tokens are billed as output and add latency, so the largest model plus thinking is the most expensive option for a task with no multi-step reasoning to reward it."
  ],
  "q5": [
    "Streaming only changes how output is delivered, improving perceived latency. The 20k-token document is still fully processed and billed at the normal rate on every request.",
    "Stop sequences only end the output earlier. The static 20k-token input is still sent, processed and billed in full each time.",
    "A lower max_tokens caps output only and risks truncated answers. It does nothing about the cost of repeatedly processing the large input document.",
    "Caching the static prefix lets later requests read the already-processed document at a reduced price and lower latency, provided the cached content stays identical and sits at the start."
  ],
  "m01": [
    "Long, high-stakes legal analysis rewards maximum accuracy and depth, which points to a larger model rather than a smaller, faster one.",
    "Multi-step autonomous coding across a large repository is demanding agentic work where stronger models are generally the better fit.",
    "Novel research-level reasoning is the hardest category of task and benefits most from the most capable models, not the smallest.",
    "Intent classification and routing are simple, high-volume, latency-sensitive tasks, exactly where a smaller model delivers good accuracy at far lower cost and latency."
  ],
  "m02": [
    "Public leaderboards measure general tasks, not your prompts, data or constraints, and ignore your latency and cost needs, so they cannot decide the choice alone.",
    "Defaulting to the largest model and only revisiting it when costs bite skips evaluation, so you overpay and never learn whether a cheaper model would have been good enough.",
    "Testing candidates on your own representative data lets you compare quality, latency and cost directly, which is the evidence-based way to pick a model.",
    "What similar products use reflects their requirements and trade-offs, not yours. Popularity is not evidence that a model meets your quality, latency and cost targets."
  ],
  "m03": [
    "Latency scales with model size and with the number of output tokens generated, so a smaller model with shorter output is the biggest lever.",
    "A longer system prompt adds input tokens to process, which adds latency rather than removing it.",
    "Temperature controls randomness in sampling, not generation speed, and current models reject non-default values anyway.",
    "Few-shot examples lengthen the input and add processing time. Fewer retries may help overall, but a single call gets no faster."
  ],
  "m04": [
    "Temperature controls randomness, not response length or price, so raising it does not reduce cost.",
    "A stable repeated prefix is the textbook caching case: later requests read it at a reduced price and with lower latency.",
    "Repeating the prefix in every message adds more input tokens, increasing cost rather than reducing it.",
    "Every input token is billed, so trimming context the task does not need directly cuts cost and often latency."
  ],
  "m05": [
    "Pricing is per token and output tokens usually cost more per token than input, so both the length of prompts and the length of replies shape your bill.",
    "Billing is based on tokens processed and generated, not a flat per-request fee. Token counts drive cost as well as rate limits.",
    "Input and output are priced separately, and output is typically higher. Sharing a context window does not make them cost the same.",
    "Cost depends on the tokens consumed and their direction (input versus output), not simply on how long the conversation is."
  ],
  "m06": [
    "Thinking adds latency and tokens, the opposite of what simple lookups and classification need. A fast, small model suits those better.",
    "Thinking tokens are billed as output, so enabling it raises token spend on high-volume work rather than lowering it.",
    "Thinking spends extra time and tokens on deeper reasoning, which pays off for hard multi-step problems where accuracy matters more than speed.",
    "Streaming is an independent delivery feature that works with or without thinking, so enabling thinking is not how you stream partial responses."
  ],
  "m07": [
    "Thinking tokens are billed as output tokens even if the visible text is summarised or omitted, and they count toward max_tokens. Older manual mode adds a budget_tokens cap.",
    "Thinking is billed even when you only see a summary or nothing at all. Reasoning happening internally does not make it free.",
    "Thinking tokens are generated by the model, so they are billed as output tokens, not input tokens, and they do count toward output usage.",
    "max_tokens remains the hard ceiling on total output, and thinking tokens count toward it. Thinking never replaces that limit."
  ],
  "m08": [
    "Sending everything to the largest model and caching only helps exact repeats. It does no routing and gives no cost-versus-quality balancing across requests.",
    "A fixed schedule ignores request difficulty, so easy cases may hit the expensive model and hard ones the weak one. Routing decides per request.",
    "Running every model on every request multiplies cost, and the longest answer is not the best answer. This is an ensemble, not routing.",
    "A lightweight router classifies each request and dispatches easy cases to a small model and hard ones to a large one, balancing cost and quality."
  ],
  "m09": [
    "Even at temperature 0, identical outputs are not guaranteed, so you should not build logic that depends on byte-identical responses.",
    "Temperature controls randomness in token selection, not thoroughness or length, and sampling is not exhaustive.",
    "Temperature 0 reduces randomness and makes output more deterministic, but identical results are still not guaranteed. Current models reject non-default temperature.",
    "Generation still runs the same forward passes token by token at temperature 0, so there is no meaningful speed gain from it."
  ],
  "m10": [
    "Temperature 0 pushes toward the most likely output each time, which reduces variety. It is the opposite of what brainstorming needs.",
    "A very low max_tokens limits length and truncates ideas. It does not make the ideas more varied.",
    "Explicitly asking for several distinct options and varied approaches steers diversity through the prompt, which works on current models that reject non-default temperature.",
    "Removing the system prompt discards useful framing and does not by itself produce more varied ideas."
  ],
  "m11": [
    "max_tokens does not make the model write more concisely. It cuts generation off at the cap, which can truncate answers mid-sentence.",
    "max_tokens is a hard cap on output, bounding output cost and latency, but a too-tight limit truncates the answer. Thinking tokens also count toward it.",
    "Caching is enabled by marking a stable prefix with cache_control, not by max_tokens, which only limits output length.",
    "max_tokens applies only to generated output. Your prompt is not compressed and input token cost is unchanged."
  ],
  "m12": [
    "Newer is not strictly better for your workload. Behaviour, formatting, tokenizer and supported parameters can change, so switching blindly risks regressions.",
    "Waiting for support tickets means users discover regressions before you do. Validating with evals before the switch is far safer.",
    "A full rewrite is unnecessary effort and may lose behaviour that already works. Adjust prompts only where evals show differences.",
    "Run your eval suite to compare quality, latency and cost on your own data, then roll out gradually so any problem affects few users and is easy to reverse."
  ],
  "m13": [
    "Per-token prices differ between models, so choosing a model changes the rate as well as the volume of calls.",
    "Cheaper models are not always worse per task. On easy tasks they pass first time and cost less, so 'always most expensive' is an overgeneralisation.",
    "Total cost per task includes tokens, retries and post-processing, so a pricier model that succeeds first time with fewer tokens can be cheaper overall.",
    "Each retry is a full billed request, so extra attempts multiply cost rather than being discounted."
  ],
  "m14": [
    "Defining success metrics, building an eval set and comparing quality, latency and cost gives repeatable evidence, then you pick the cheapest model that clears the bar.",
    "Public benchmarks are general and may not predict accuracy on your task, and they say nothing about your latency and cost constraints.",
    "Starting with the largest model skips evidence and may lock in unnecessary cost. 'Optimise later' rarely happens without a baseline to compare against.",
    "A handful of hand-picked prompts is small, unrepresentative and subjective, so it cannot be repeated or show regressions."
  ],
  "m15": [
    "Temperature does not change how much context you send. The tools and system prompt are still transmitted and processed on every call.",
    "Streaming concerns how output is delivered. Turning it off does not shrink the tools block or reduce repeated input.",
    "Stop sequences only end generation early. They never remove the repeated tool definitions from the input you pay for.",
    "Caching targets repeated input directly. The prefix order is tools, then system, then messages, so static tools and system content can be cached and re-read cheaply."
  ],
  "m16": [
    "Oversized images are downscaled anyway, so sending full resolution adds payload and latency without improving what the model sees.",
    "Many tiles mean many images, which multiplies tokens and cost and can lose the overall layout context.",
    "Image token usage scales with size, so cropping to the relevant region and using the resolution the task needs cuts cost and latency while keeping legibility.",
    "Re-attaching the image every turn inflates payload and tokens each time, since the image is already part of the conversation history."
  ],
  "m17": [
    "Streaming changes delivery, not price, and the largest model is the costliest. It does nothing to cut the cost of a non-urgent bulk job.",
    "Batch processing is discounted for asynchronous work, and caching shared instructions stacks savings, though caching in batches is best effort so check compatibility.",
    "Temperature is unrelated to retry rates or cost, and current models reject non-default values.",
    "Thinking adds output tokens and cost for every item, so enabling it everywhere raises the bill rather than lowering it."
  ],
  "m18": [
    "Longer outputs take longer to generate and do not speed up the first token. Time to first token depends on model, prompt and streaming.",
    "Thinking happens before the visible answer, so keeping it always on delays the first visible token rather than speeding it up.",
    "Streaming shows text as it is generated, a faster model starts sooner, and a shorter prompt is processed quicker, all improving time to first token.",
    "Batching is asynchronous and optimised for throughput and cost, so it increases waiting time. It is the opposite of what a chat UI needs."
  ],
  "m19": [
    "Hard multi-step maths benefits from a stronger model with thinking or step-by-step reasoning, and an eval confirms the accuracy gain is real on your problems.",
    "The smallest model with reasoning disabled is the weakest set-up for multi-step calculation, and the 'overthinking' risk is not what limits accuracy here.",
    "Higher randomness works against precise arithmetic, and current models reject non-default temperature anyway.",
    "A tight max_tokens limit can cut off the reasoning or the answer, which hurts accuracy rather than focusing the result."
  ],
  "m20": [
    "Thinking is billed as output tokens and counts toward max_tokens. It is not billed separately and not exempt from the limit.",
    "A thinking budget does not disable tools. Thinking can work alongside tool use, and the restriction applies to forced tool_choice, not to tools generally.",
    "Returns diminish with larger budgets, while cost and latency keep rising, so the budget should be sized to the task.",
    "On manual-mode models the budget counts toward output tokens and cost, must be below max_tokens, and has a minimum of 1,024, so size it deliberately."
  ],
  "m21": [
    "Models also differ in instruction following, verbosity and formatting, so context window size is not the only thing to adjust.",
    "Prompts are plain text, not bound to one tokenizer, and they do not stop parsing. Tokenizer changes affect token counts and cost, not whether the prompt works.",
    "Instruction following, verbosity and formatting habits vary between models, so the same prompt can behave differently and should be re-evaluated and retuned after a switch.",
    "The API sends your prompt as written and does not rewrite it per model, so any behaviour change comes from the model itself."
  ],
  "m22": [
    "The largest model for every tier overspends on free users who generate no revenue, so it ignores the economics of each tier.",
    "Routing by tier lets you spend more where value or revenue justifies it, such as stronger models for paid users and smaller ones for free users.",
    "Prompts cannot add capability a small model lacks, so paid users would get weaker quality on complex tasks with nothing to justify the price.",
    "Random assignment ignores the value of each tier and gives inconsistent experiences, and comparing satisfaction later is confounded by who got which model."
  ],
  "m23": [
    "Models are retired on a published schedule, so you should track deprecations, test replacements early and migrate before the retirement date.",
    "Retired models stop serving requests, and successors can behave differently, so do not count on a silent, identical redirect.",
    "Retirement ends availability and breaks calls. It is a reliability and migration issue, not just a pricing one.",
    "Retirement applies to models in use as well, and active integrations are the ones affected, so there is no exemption for existing callers."
  ],
  "m24": [
    "More context does not always improve answers. Irrelevant text raises cost and latency and can distract the model from what matters.",
    "Good retrieval returns the relevant passages and can be tuned and evaluated. It does not inevitably lose needed information.",
    "Sending alternating halves means each request sees only part of the manual, so answers can miss content located in the other half.",
    "Retrieving only the relevant sections cuts tokens and distraction. Very small corpora can still be included whole, ideally with caching."
  ],
  "m25": [
    "max_tokens always applies. Thinking does not replace it, and thinking tokens count toward it.",
    "Thinking tokens are part of the output limit and are billed as output, so max_tokens is the hard ceiling and you must leave headroom for the visible answer.",
    "Thinking tokens are not counted separately. They share the max_tokens limit with the visible answer.",
    "Equal values would leave no room for the answer, and on manual-mode models the budget must be below max_tokens, so this setting would be rejected or truncate output."
  ],
  "m26": [
    "Averages hide tail failures. Rare inputs can matter a lot, so acceptable averages do not justify ignoring them.",
    "Higher temperature is not a fix for weak handling of unusual inputs, and current models reject non-default temperature.",
    "Adding the failing cases to the eval set makes the problem measurable, and you can then tune the prompt, route hard cases to a stronger model or revert.",
    "Removing rare inputs from monitoring hides exactly the signal you need and leaves users hitting regressions unnoticed."
  ],
  "m27": [
    "Splitting a share of traffic lets you compare quality, cost and latency under real load, and ramping up gradually limits the impact of any problem.",
    "Switching everything at once exposes all users to any regression and gives no baseline, so complaints become your only signal.",
    "Staff usage is unrepresentative of real users' inputs and volume, so extrapolating from it can mislead.",
    "Alternating by hour confounds the model with time-of-day effects, and overall average satisfaction is too blunt to attribute differences."
  ],
  "m28": [
    "Maximising both makes output erratic and low quality, so there is no sound reason to push both to the limit.",
    "They operate on different scales, one flattening the distribution and the other truncating it, so forcing the same value is not meaningful.",
    "Changing one at a time and measuring on evals isolates each effect. Newer models reject non-default values, so there you steer with prompting and effort.",
    "They do change sampling on models that accept them, so claiming they have no effect is false, although newer models reject non-default values."
  ],
  "m29": [
    "Real-time streaming with thinking on every item pays for latency you do not need and adds output-token cost across a large job.",
    "Batch processing is asynchronous and discounted, and a right-sized model keeps per-item cost down, which fits an overnight throughput-focused job.",
    "Real-time calls to the largest model at full price risk rate-limit pressure and retries, paying for speed that has no value here.",
    "A human reviewing each label in chat is slow and does not scale. It defeats the purpose of throughput-oriented bulk labelling."
  ],
  "m30": [
    "Tokenizers can differ between models, so counts for the same text can differ and should be estimated with the counting endpoint for the target model.",
    "Plain text is tokenised too, and different tokenizers can split it differently, so text counts can differ between models.",
    "Temperature affects sampling of output, not how input is tokenised, so it has no bearing on token counts.",
    "Tokenisation differences affect all text, not only source code, so whitespace handling is not the explanation."
  ],
  "m31": [
    "Moving provider is a heavy change and not a first fix. The verbosity would remain unless you also instruct the model to be concise.",
    "Temperature does not control response length, so raising it will not make answers shorter.",
    "Examples of long answers teach the model to produce long answers, which makes verbosity and cost worse.",
    "Asking for concise output in a defined format, sensibly capping max_tokens and testing quality is cheap and usually reduces output tokens without a model change."
  ],
  "m32": [
    "A larger model costs more per token and does not shorten the instructions you still send, so it does not address the repeated static text.",
    "A large, identical static prefix reused thousands of times is the canonical prompt caching case, cutting both cost and latency on each call.",
    "Two requests still process the instructions and double the call count, adding cost and latency rather than removing the repetition.",
    "Temperature has no effect on how input tokens are processed or billed, so it cannot reduce the cost of repeated instructions."
  ],
  "m33": [
    "Being cheaper and faster on a few prompts says nothing about quality, and a small sample can hide failures on harder inputs.",
    "Recency does not equal sufficiency. Whether a model is good enough depends on your task and thresholds, not its release date.",
    "Meeting your accuracy threshold on a representative eval set is direct, measured evidence that the smaller model is sufficient for your task.",
    "General benchmark scores may not reflect your task, so closeness on them does not show the model meets your requirements."
  ],
  "m34": [
    "Steps needing complex judgement, such as planning or final synthesis, are where a larger model's extra capability justifies its cost, while cheaper models handle routine steps.",
    "Using the largest model everywhere pays a premium on easy steps for uniformity that you rarely need.",
    "High-volume extraction and formatting are simple, so a small model suffices and the large model would multiply cost on the heaviest token volume.",
    "A larger model is not guaranteed to be right, so quality still has to be measured with evals."
  ],
  "m35": [
    "Immediate tight-loop retries add load during a burst and trigger more rate limiting, so they worsen the problem.",
    "For most models only uncached input counts toward input-token limits, so disabling caching raises counted usage and also raises cost and latency.",
    "Temperature does not make responses shorter, and current models reject non-default values.",
    "Queueing and smoothing traffic keeps you under limits, and you can request higher limits where the workload justifies it."
  ],
  "m36": [
    "Slow tail requests drive timeouts and poor user experience, and averages hide them, so p95 and p99 reveal what users actually feel.",
    "Latency percentiles describe response time, not output quality, so they cannot measure quality differences between models.",
    "Percentiles help describe tail behaviour but do not replace load testing, which is needed to find real capacity limits.",
    "Billing is based on tokens, not latency percentiles, so percentiles do not reveal the cost of calls."
  ],
  "m37": [
    "High randomness increases variability, which is the opposite of what classification needs, and current models reject non-default temperature.",
    "Open-ended instructions invite varied phrasing and labels, which makes outputs less predictable and harder to parse downstream.",
    "Defined labels with examples and constrained output narrow the outputs, and evals show whether the variance is actually low enough. Older models also benefit from low temperature.",
    "A seed written into the prompt is just text and does not control sampling, so it does not make outputs repeatable."
  ],
  "s2a": [
    "Parallel synchronous calls to the largest model pay full price and strain rate limits for work with no real-time requirement.",
    "Streaming improves perceived latency for interactive use. Nothing here is real-time, so it adds complexity with no benefit.",
    "Non-urgent bulk work suits the discounted asynchronous Batch API, and validating a model on a sample ensures it is accurate enough without overpaying.",
    "One huge prompt risks hitting context limits, loses everything if it fails, and tends to dilute accuracy. Separate requests are easier to batch and retry."
  ],
  "s5c": [
    "Planning and synthesis are the hardest steps and use few tokens, so saving money there with the smallest model risks the quality of the whole report.",
    "Caching helps only repeated prefixes, while agents' searches and outputs are mostly unique, so it cannot offset the largest model's cost across every step.",
    "A stronger model for planning and synthesis, cheaper ones for routine summarising, and evals to verify, matches model cost to step difficulty.",
    "A hard cap on searches limits cost but can degrade research quality, so it controls spend by sacrificing the output you are paying for."
  ],
  "s6d": [
    "Prompt caching only discounts a repeated prefix, which short rewrites barely have, so the largest model stays costly for easy requests.",
    "Routing simple rewrites to a smaller model and escalating complex ones balances cost and quality, and test data confirms the split works.",
    "The smallest model for every request gives weak results on complex rewrites and pushes the quality problem onto users, who must retry.",
    "Users usually lack the information to choose well, quality becomes inconsistent, and you still pay whichever cost they pick."
  ],
  "q15": [
    "A README is written for human readers and is not loaded by Claude Code as persistent instructions.",
    "A .env file holds environment variables and secrets, not instructions, and Claude Code does not read it as project guidance.",
    "The .gitignore lists files Git should ignore. It carries no instructions for Claude Code.",
    "CLAUDE.md at the project root (or .claude/CLAUDE.md) is loaded as persistent project instructions for every session."
  ],
  "c01": [
    "Project root is only one scope. User-level and subdirectory CLAUDE.md files are also supported.",
    "User-level memory lives in the home directory (~/.claude/CLAUDE.md), not an IDE settings panel, and project and subdirectory files exist too.",
    "CLAUDE.md can exist at project root, at user level, and in subdirectories (loaded when Claude works there), as well as in managed policy locations.",
    "Memory files are not tied to the npm configuration, and subdirectory CLAUDE.md files are supported."
  ],
  "c02": [
    "Running edits without asking is the opposite of plan mode, which holds back changes until you approve a plan.",
    "Plan mode lets Claude explore the code and propose an approach for your approval before making any edits.",
    "'Plan' here means an implementation plan for code changes, not a project schedule or milestones for the team.",
    "Model choice is a separate setting. Plan mode changes whether Claude edits, not which model it runs on."
  ],
  "c03": [
    "Hooks are commands triggered at lifecycle events. They do not rewrite what Claude has already read in its earlier messages.",
    "Hooks run commands at events and do not replace CLAUDE.md, which remains the place for persistent instructions.",
    "Hooks run your own deterministic commands at lifecycle events such as before or after a tool call, so behaviour does not depend on the model remembering.",
    "Model selection is configured through settings or commands, not hooks, which do not pick a model per tool call."
  ],
  "c04": [
    "Permission rules in settings.json allow, ask or deny specific tools and commands, controlling what Claude can do without prompting.",
    "Sampling temperature is not a permission setting, and permission rules govern tool and command access.",
    "Session-start prompts belong in CLAUDE.md or hooks, not in permission rules.",
    "Subagent models are set in subagent definitions or configuration, not in permission rules."
  ],
  "c05": [
    "Claude Code does not read custom commands from package.json, so entries there would never appear as slash commands.",
    "A markdown file in .claude/commands or a skill under .claude/skills creates a /name command. Skills are the newer, preferred format.",
    "There is no shared global commands.json that Claude Code loads for all projects.",
    "Shell profile scripts are not slash commands, and Claude Code does not register them at startup."
  ],
  "c06": [
    "Piping keystrokes into the interactive UI is brittle and unnecessary when a supported non-interactive mode exists.",
    "A browser extension in headless Chrome is not the way to run Claude Code in CI. The CLI has its own non-interactive mode.",
    "The -p flag runs one prompt non-interactively and prints the result, which is designed for scripts and CI.",
    "The interactive UI still needs a terminal session, and turning off all permission prompts is unsafe and does not make it non-interactive."
  ],
  "s4a": [
    "A README is for human readers and is not loaded as persistent instructions for Claude Code.",
    "Comments in individual files are scattered, only seen when those files are read, and are not a reliable source of project-wide conventions.",
    "A pull request description applies to a single job and is not persistent project guidance for every run.",
    "CLAUDE.md at the project root is loaded as persistent project instructions, so conventions and test commands apply in every run (unless the --bare flag skips it)."
  ],
  "q16": [
    "A few favourite examples are unrepresentative and subjective, so eyeballing them misses regressions elsewhere.",
    "A representative eval set re-run after each change gives comparable scores and catches regressions systematically.",
    "Claude's explanation of why a prompt should be better is persuasive rather than measured, and it does not show actual performance.",
    "Releasing to a small share and waiting for complaints puts real users at risk, and complaints are slow, sparse and noisy as a signal."
  ],
  "e01": [
    "A representative set that includes edge cases reflects real traffic and exposes failures that matter in production.",
    "Easy examples inflate scores and hide weaknesses, so passing them gives false confidence.",
    "A small set gives noisy results that vary a lot from run to run. More cases give more reliable signals.",
    "Examples already in the prompt measure memorisation rather than generalisation, so scores will look better than real performance."
  ],
  "e02": [
    "Expert review of every output is slow and costly, and is best avoided when a programmatic check is possible.",
    "A rubric-based LLM judge at high temperature adds noise, and is unnecessary when the answer can be checked deterministically.",
    "Code-based grading such as exact match, schema checks or unit tests is the fastest, cheapest and most reliable option when applicable.",
    "Eyeballing a few outputs is unrepresentative and subjective, and cannot be repeated consistently."
  ],
  "e03": [
    "'Rate this' with no criteria produces inconsistent scores that vary by run and by wording.",
    "Grading with the generation prompt and no separate review invites self-confirmation and gives no clear rubric to judge against.",
    "A high temperature adds variation to scores, but a grader should be consistent and repeatable.",
    "A clear rubric makes judgements consistent, and spot checks against human judgement on a sample confirm the grader can be trusted."
  ],
  "e04": [
    "Reproducing the failure from the logged full request and response shows what the model saw, so you can target the real cause.",
    "Rewriting on a hunch may miss the cause or cause new regressions, since you have not confirmed what went wrong.",
    "Switching to a larger model may mask the issue and raises cost without identifying why the failure occurred.",
    "Changing settings and waiting for more reports is guesswork, and current models reject non-default temperature anyway."
  ],
  "s2c": [
    "Reading a few outputs a week is anecdotal, unsystematic and unrepresentative, so it will not reveal accuracy.",
    "A model's self-reported confidence is not guaranteed to be calibrated, and you cannot trust it without checking against ground truth.",
    "Token usage and latency show operational stability but say nothing about whether the extracted values are correct.",
    "Comparing fields in code against a labelled sample that includes messy invoices gives trustworthy, repeatable field-level accuracy numbers."
  ],
  "s3d": [
    "A few employees trying it informally is slow, subjective and unrepeatable, so it cannot reliably catch regressions.",
    "Average answer length is a weak proxy. Answers can stay the same length and still become wrong.",
    "Re-running a fixed question set with expected answers after every change gives a repeatable regression check of retrieval and answer quality.",
    "Retrieval latency and index size are operational metrics and say nothing about whether answers are correct."
  ]
});
