window.CC = window.CC || {}; window.CC.lessonsNew = window.CC.lessonsNew || [];
window.CC.lessonsNew.push(
  {
    "id": "agents-1",
    "n": 1,
    "domain": "agents",
    "title": "The agentic loop",
    "body": "An agent is a model calling tools in a loop, and that loop is code you own. The exam checks the mechanics: how stop_reason drives control flow, how tool errors flow back to the model, why every loop needs hard budgets, and how an agent differs from a workflow where your code fixes the path.",
    "points": [
      "A workflow orchestrates LLMs and tools through predefined code paths; an agent lets the LLM dynamically direct its own process and tool use. The distinction is who decides the next step: your code or the model.",
      "A practical definition is an LLM using tools in a loop, reading real feedback from the environment (tool results) at each step to judge its progress.",
      "Each turn: send messages plus tool definitions. If stop_reason is tool_use, your code runs the requested client tools and calls again; if it is end_turn, the model has finished. The model only requests tools, it never executes them.",
      "Reply with one user message containing a tool_result block for every tool_use id. Result blocks must come first and immediately follow the assistant turn; text goes after them. Putting text first causes a 400 error.",
      "Branch on the other stop reasons too: max_tokens means a truncated reply, possibly a cut-off tool call; pause_turn means a server-tool loop hit its cap and you resend the content to continue; refusal needs fallback handling.",
      "When a tool fails, return the error as tool_result with is_error true instead of crashing. Make the message actionable (what failed, what to try next) so the model can retry, change approach or report honestly.",
      "end_turn alone is not a safe stopping design. Add a max-iteration cap, a token or cost budget and a wall-clock timeout, and decide what to return when one trips, such as partial findings. SDK tool runners offer a max-iterations option.",
      "Agents trade latency and cost for flexibility, and mistakes can compound across steps. Use one when steps cannot be predicted in advance and you trust the model's decisions; otherwise a workflow or single call is simpler."
    ],
    "code": "messages = [user(task)]\nfor step in range(MAX_STEPS):          # hard cap\n  r = call_model(messages, tools)\n  messages.append(assistant(r.content))\n  if r.stop_reason != \"tool_use\": break  # end_turn, max_tokens, ...\n  results = [run(b) for b in r.content if b.type == \"tool_use\"]\n  messages.append(user(results))        # tool_result first, is_error on failure\nelse: return_partial_result()           # budget exhausted",
    "traps": [
      "People assume the model executes tools itself, but for client tools it only emits a tool_use request and your application runs the code and returns the result.",
      "People assume a prompt line such as 'stop when done' bounds the loop, but only code-level iteration, token and time budgets guarantee termination.",
      "People assume a tool exception should end the run, but returning it as a tool_result with is_error lets the model recover.",
      "People assume any chain of calls that uses tools is an agent, but if your code fixes the sequence it is a workflow.",
      "People assume any stop_reason other than tool_use means success, but max_tokens, refusal and pause_turn each need their own handling."
    ],
    "sources": [
      "https://www.anthropic.com/engineering/building-effective-agents",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls",
      "https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons"
    ]
  },
  {
    "id": "agents-2",
    "n": 2,
    "domain": "agents",
    "title": "Workflow patterns: chaining, routing, parallelisation",
    "body": "Workflows put model calls inside predefined code paths. Three patterns cover most fixed-structure tasks: chaining for dependent steps, routing to classify then specialise, and parallelisation for independent work or repeated attempts. The exam asks you to match a scenario to a pattern, explain gates and voting, and recognise when one optimised call is enough.",
    "points": [
      "Start with the simplest thing: one well-prompted call with retrieval and examples is often enough. Add steps only when measurement shows a gain, because each one adds latency, cost and a new place to fail.",
      "Prompt chaining runs a fixed sequence where each call processes the previous output. It fits tasks that decompose cleanly, trading latency for accuracy by making each call an easier job (outline, check, then write).",
      "A gate is a programmatic check between steps, such as schema, length or required criteria. It catches a bad intermediate result before later steps build on it, then retries, repairs or stops.",
      "Routing classifies an input and sends it to a specialised prompt, tool or model. It helps when tuning for one input type hurts another, and works only if classification is accurate, whether by an LLM or a classic classifier.",
      "Routing can also control cost by sending easy, common requests to a smaller, cheaper model and hard or unusual ones to a more capable model.",
      "Parallelisation has two forms. Sectioning splits a task into independent subtasks run concurrently, for speed or focus. Voting runs the same task several times for diverse outputs, which code aggregates to raise confidence.",
      "Voting multiplies calls and cost, and thresholds let you tune false positives against false negatives, for example how many reviewers must flag a risk. Sectioning gains speed or focus; voting gains confidence.",
      "All three are developer-defined structures. If the model must decide the subtasks at runtime, you are in orchestrator-workers territory. Current guidance says models handle much multistep reasoning internally, so chain explicitly mainly to inspect intermediate outputs or enforce a pipeline.",
      "The agent-patterns post notes that much of its tooling landscape has changed since late 2024. The patterns remain useful vocabulary; check current docs for tooling. Frameworks can hide prompts, so understand the code beneath them."
    ],
    "code": "draft = llm(\"Write an outline for: \" + topic)\nif not passes_gate(draft):        # programmatic check, not vibes\n    draft = llm(\"Fix these problems: \" + problems(draft))\narticle = llm(\"Write the article from this outline: \" + draft)",
    "traps": [
      "People assume more pipeline steps always improve quality, but each step adds latency, cost and error surface, so complexity must earn its place through measurement.",
      "People assume voting speeds things up, but it repeats the same task to raise confidence and costs more; sectioning is the variant used for speed.",
      "People assume routing is robust whatever the classifier, but a misclassified input goes to the wrong specialist, so routing needs accurate classification.",
      "People assume parallelisation and orchestrator-workers are the same, but parallel branches are fixed in advance while an orchestrator chooses subtasks at runtime.",
      "People assume a gate must be another LLM call, but the pattern describes programmatic checks, which are cheaper and deterministic."
    ],
    "sources": [
      "https://www.anthropic.com/engineering/building-effective-agents",
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices"
    ]
  },
  {
    "id": "agents-3",
    "n": 3,
    "domain": "agents",
    "title": "Orchestrator-workers, evaluator-optimizer and multi-agent systems",
    "body": "When subtasks cannot be predicted, a central model must plan them. Orchestrator-workers and multi-agent systems buy breadth and context isolation at a large token cost; evaluator-optimizer buys iterative quality when criteria are clear. Expect questions on when each is justified, what a lead must tell its workers, and why cost and shared-context tasks argue against multi-agent.",
    "points": [
      "Orchestrator-workers: a central LLM breaks the task down at runtime, delegates to workers and synthesises results. It suits tasks like multi-file code changes or multi-source search where the number and nature of subtasks depend on the input.",
      "Evaluator-optimizer: one call generates, another critiques, and the loop repeats. It fits when evaluation criteria are clear and iteration measurably helps, meaning the model can articulate useful feedback. Cap the rounds or require a passing score.",
      "A multi-agent system is several agents, each an LLM using tools in a loop, coordinating. Subagents work in parallel with their own context windows and return condensed findings to the lead, so the lead's context stays focused.",
      "In Anthropic's research system, token usage explained most of the performance variance on a browsing benchmark. Multi-agent designs work largely because they spend more tokens productively across separate contexts, not because of any magic.",
      "The cost is high. Anthropic reported agents using roughly four times the tokens of chat and multi-agent systems roughly fifteen times (their measurements, treat as illustrative). Use it where task value justifies the spend.",
      "Good fits: breadth-first work with independent directions, information exceeding one context window, and many tools. Poor fits: tasks where agents need the same shared context or have many dependencies, such as most coding work.",
      "Teach the orchestrator to delegate: each subagent needs an objective, an output format, guidance on tools and sources, and clear task boundaries. Vague one-line tasks caused duplicated work and gaps in early versions.",
      "Agents misjudge effort, so embed scaling rules in prompts (a simple lookup needs one agent and few tool calls, complex research more). Early systems over-spawned subagents for simple queries.",
      "Evaluate outcomes and a reasonable process rather than one prescribed path, since valid trajectories differ. An LLM judge with a rubric scales well, human review catches what it misses, and you should start with a small set of realistic cases."
    ],
    "traps": [
      "People assume multi-agent is simply better, but it uses far more tokens and is a poor fit when agents depend heavily on shared context.",
      "People assume orchestrator-workers is parallelisation with extra steps, but its defining feature is that the orchestrator decides the subtasks dynamically.",
      "People assume subagents should return full transcripts, but returning condensed findings is what protects the lead agent's context.",
      "People assume evaluator-optimizer improves any output, but without clear evaluation criteria the critic has nothing reliable to optimise against.",
      "People assume short delegation instructions are enough, but unspecific tasks lead to duplicated searches, gaps and misread scope."
    ],
    "sources": [
      "https://www.anthropic.com/engineering/building-effective-agents",
      "https://www.anthropic.com/engineering/multi-agent-research-system",
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices"
    ]
  },
  {
    "id": "agents-4",
    "n": 4,
    "domain": "agents",
    "title": "Reliability: limits, state, guardrails and human oversight",
    "body": "Agents are stateful and their errors compound, so production reliability comes from deterministic safeguards around the model rather than trust in it. The exam covers loop detection, checkpoint and resume, external notes, idempotency, sandboxing, least privilege, human approval for irreversible actions, and tracing and evaluating trajectories.",
    "points": [
      "Combine the model's adaptability with deterministic safeguards. Tell the agent when a tool is failing so it can adapt, and back that with retry logic, budgets and regular checkpoints, because one failed step can derail the whole trajectory.",
      "Detect loops in code: track repeated identical calls or errors, cap retries per action, then change strategy, escalate to a human or stop with partial results. A prompt line asking the model not to loop is not a control.",
      "Checkpoint durable state after each completed step so a crash resumes from the last good point. Restarting from scratch is expensive and, for side-effecting steps, can repeat work.",
      "Keep memory outside the context window: progress notes, JSON status files and git history for restore points, which a fresh session reads to recover state. The memory tool is client-side: your code stores the data and must restrict paths.",
      "Make side-effecting tools idempotent, for example with idempotency keys or check-before-write. Retries and resumes can otherwise repeat a refund or email, and a timeout does not tell you whether the action happened.",
      "Apply least privilege and sandboxing: grant only the tools, scopes and credentials a task needs, run code in isolated environments, and prefer reversible actions. Test extensively in sandboxes before widening autonomy.",
      "Require human approval for destructive, hard-to-reverse or externally visible actions such as deleting data, force-pushing or sending messages. Prompt guidance about reversibility helps, but a code-enforced approval gate is the dependable control.",
      "Treat tool results as untrusted data. Web pages, email and third-party APIs can carry injected instructions, so keep that content in tool_result blocks and never grant it authority over the system prompt or permissions.",
      "Agents are non-deterministic, so trace prompts, tool calls, results and decisions per step to debug. Evaluate end state for agents that change data, check process quality where useful, and keep human testing, which finds edge cases evals miss."
    ],
    "traps": [
      "People assume instructing the model to stop repeating itself prevents loops, but loop detection and retry caps must live in the harness.",
      "People assume restarting a failed run from the beginning is the safe recovery, but it wastes work and can duplicate side effects unless steps are checkpointed and idempotent.",
      "People assume broad permissions let the agent self-recover from mistakes, but least privilege and reversible actions limit the damage instead.",
      "People assume an agent can be graded against one correct sequence of steps, but valid paths vary, so outcomes and reasonable process matter more.",
      "People assume content returned by tools is trustworthy because the agent requested it, but it may carry indirect prompt injection."
    ],
    "sources": [
      "https://www.anthropic.com/engineering/multi-agent-research-system",
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls"
    ]
  },
  {
    "id": "prompt-1",
    "n": 1,
    "domain": "prompt",
    "title": "Prompting fundamentals",
    "body": "Most prompt failures are ambiguity failures. Claude follows clear, explicit instructions and behaves like a capable new colleague who lacks your context. The exam focuses on specificity, audience and success criteria, system-prompt roles, positive phrasing, resolving conflicting instructions, and improving prompts through testing rather than intuition.",
    "points": [
      "Before tuning wording, define success criteria and a way to test them. Prompt engineering is not always the fix; for latency or cost, choosing a different model can be easier.",
      "Be clear and direct about the task, constraints and output format. Golden rule: if a colleague with no context would be confused by the prompt, Claude will be too.",
      "If you want above-and-beyond behaviour, request it explicitly. Vague prompts do not reliably make the model infer a higher bar.",
      "Give the reason behind a rule. Telling Claude the output is read aloud by a speech engine explains why to avoid ellipses, and Claude generalises from the motivation better than from a bare command.",
      "State audience and success criteria: who reads the output, its purpose, and what good looks like (length, tone, structure). This removes guesswork that otherwise shows up as plausible but off-target answers.",
      "Put the role and stable rules in the system prompt and per-request data in the user turn. Even a single-sentence role focuses tone and domain framing, but it steers behaviour; it does not add capabilities or switch off safeguards.",
      "Prefer positive instructions: say what to do (write in flowing prose paragraphs) rather than only what to avoid (no markdown). Use numbered steps when order or completeness matters.",
      "Resolve conflicts. Asking for both exhaustive and brief output forces the model to guess; remove one demand or state a priority. Aim for the right altitude: specific heuristics, not brittle if-else scripts or vague generalities.",
      "Iterate empirically: test on varied inputs, inspect failures, change one thing, re-run your eval set, and version prompts. Techniques measured on one model should be re-checked on another, because guidance is version-dependent."
    ],
    "code": "Weak:   \"Summarise this report.\"\nBetter: \"Summarise this report for a non-technical finance\\n  director in 3 sentences, plain English, ending with one\\n  recommendation. It is pasted into an email, so no markdown.\"",
    "traps": [
      "People assume a longer prompt is a better prompt, but clarity and the minimal sufficient set of information matter more than length.",
      "People assume a list of prohibitions steers the model, but telling it what to do is generally more effective than only what not to do.",
      "People assume a role in the system prompt unlocks new abilities, but it focuses tone and expertise framing without changing capabilities or safety behaviour.",
      "People assume the model will infer unstated audience, length or quality bar, but unstated criteria are guessed, so spell them out.",
      "People assume a prompt that reads well is finished, but only testing on varied inputs against success criteria shows whether it works."
    ],
    "sources": [
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview",
      "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"
    ]
  },
  {
    "id": "prompt-2",
    "n": 2,
    "domain": "prompt",
    "title": "Structure: tags, examples and long context",
    "body": "Structure removes ambiguity. XML-style tags separate instructions from data, a few diverse examples teach format and tone, and for long inputs, placement and quote-first extraction improve accuracy. Format control has also moved on: prefilled assistant turns are rejected on newer models, so know the replacements, namely direct instructions, structured outputs and strict tool use.",
    "points": [
      "Wrap each content type (instructions, context, input, examples) in its own XML-style tag. This helps Claude parse prompts that mix instructions with variable data. Tag names are your convention: choose consistent, descriptive ones and nest when content has hierarchy.",
      "Few-shot examples are among the most reliable ways to steer format, tone and structure. Make them relevant, diverse and wrapped in example tags; three to five is the usual recommendation. Diversity stops the model copying surface patterns.",
      "Curate a few canonical examples rather than stuffing a prompt with every edge-case rule. For the model, examples are the pictures worth a thousand words.",
      "For long inputs, put the long documents near the top, above the query and instructions. Anthropic's tests found that a query at the end can improve quality by up to 30 percent, especially for multi-document inputs.",
      "Give multiple documents explicit structure: a documents wrapper, each document indexed, with source and content subtags. Metadata such as the source name also supports later citation.",
      "Quote-first grounding: for long documents, ask Claude to extract the relevant quotes into tags first, then answer using only those quotes. This focuses attention on relevant passages and away from noise.",
      "Control format by saying what to do, using XML format indicators for sections, and matching your prompt style to the desired output; a markdown-heavy prompt tends to yield markdown-heavy replies.",
      "Version-dependent: starting with Claude 4.6 models, a prefilled last assistant turn is rejected with a 400 error. Earlier models still accept it, and assistant messages elsewhere in the conversation are unaffected.",
      "Current alternatives to prefill: structured outputs (a JSON schema via output_config.format) or strict tool use (strict true) for guaranteed shape; a tool with an enum for classification; direct no-preamble instructions; and a continuation request in the user turn."
    ],
    "code": "<documents>\n  <document index=\"1\">\n    <source>policy.pdf</source>\n    <document_content>...</document_content>\n  </document>\n</documents>\nFirst extract quotes relevant to the question into\n<quotes> tags. Then answer using only those quotes.",
    "traps": [
      "People assume Claude needs special reserved tag names, but any consistent, descriptive tags work because they simply delimit content types.",
      "People assume the question should come before a long document, but long documents go first and the query last.",
      "People assume prefilling the reply is still the way to force JSON on every model, but it is rejected from Claude 4.6 onward; use structured outputs or strict tool use.",
      "People assume asking for JSON in the prompt equals structured outputs, but only structured outputs constrain decoding to a schema; they guarantee valid shape, not factual correctness.",
      "People assume more examples are always better, but a few diverse, representative ones outperform many similar ones."
    ],
    "sources": [
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
      "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls"
    ]
  },
  {
    "id": "prompt-3",
    "n": 3,
    "domain": "prompt",
    "title": "Context management: RAG, grounding and long conversations",
    "body": "Context is a finite resource: more tokens do not mean better answers, because recall degrades as context grows. Good context engineering retrieves only what is relevant, grounds answers in citable sources, allows the model to abstain, and keeps long conversations healthy through summaries, notes and refreshed constraints. The exam tests these trade-offs.",
    "points": [
      "Everything in a request counts toward the context window: system prompt, all messages including tool results, tool definitions, and the model's own output including thinking. The API is stateless, so history grows because you resend it.",
      "Context rot: as token count grows, accuracy and recall degrade, even in very large windows. The aim is the smallest set of high-signal tokens that produces the desired behaviour, not the largest set that fits.",
      "For retrieval-augmented generation, fetch the chunks relevant to each query, not the whole corpus. Agents can also load data just-in-time through tools, holding lightweight references such as file paths or queries; a hybrid of up-front and on-demand retrieval is common.",
      "Pass retrieved chunks with source metadata in tags and ask for citations or supporting quotes. A stronger check is to have Claude find a supporting quote for each claim and retract any claim it cannot support.",
      "Permit abstention and restrict scope: explicitly allow answers like I do not have enough information, and tell Claude to use only the provided documents. This reduces hallucination substantially but does not eliminate it, so validate high-stakes output.",
      "For long conversations, summarise or compact older turns while preserving decisions and key facts, or clear stale tool results as a light-touch option. Server-side compaction exists for newer models and was in beta in the docs read; verify current status.",
      "Compaction is lossy: aggressive summaries can drop details that matter later, so tune the summarising prompt on real traces, recall first. Alternatives are notes or memory files read back later, or a fresh window rediscovering state from files.",
      "Keep durable facts in a stable memory block and refresh persistent constraints, since early instructions can fade in long chats. Re-inject them in the user turn (prefilled reminders are rejected on Claude 4.6 and later) or via tools.",
      "Version-dependent: some models are context-aware and receive their remaining budget automatically, while newer ones use task budgets in beta. If your harness auto-compacts, say so in the prompt so the model does not stop early near the limit."
    ],
    "code": "<memory>\n  <user_preferences>Metric units, formal tone</user_preferences>\n  <open_decisions>Vendor shortlist: A, B</open_decisions>\n</memory>\n<summary_of_earlier_turns>...</summary_of_earlier_turns>\n<latest_message>...</latest_message>",
    "traps": [
      "People assume a bigger context window means you can include everything, but accuracy and recall degrade as context grows, so curation still matters.",
      "People assume prompt caching shrinks the context, but it only changes what you pay for those tokens; they still occupy the window.",
      "People assume asking for citations alone stops hallucination, but you also need to restrict answers to the sources and permit abstention.",
      "People assume a summary of earlier turns loses nothing, but compaction can drop subtle details, so what to keep must be tested.",
      "People assume constraints stated once at the start stay reliably followed across a very long conversation, but they should be refreshed or kept in a stable block."
    ],
    "sources": [
      "https://platform.claude.com/docs/en/build-with-claude/context-windows",
      "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
      "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations",
      "https://platform.claude.com/docs/en/build-with-claude/compaction"
    ]
  }
);
