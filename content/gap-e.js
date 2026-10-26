(function () {
  window.CC = window.CC || {};
  window.CC.lessonsNew = window.CC.lessonsNew || [];
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  window.CC.lessonsNew.push(
    {
      "id": "agents-5",
      "n": 5,
      "domain": "agents",
      "title": "Claude Agent SDK, custom harnesses and managed agents",
      "body": "There are four ways to run a Claude agent: your own loop on the Messages API, the Agent SDK in your process, Claude Managed Agents hosted by Anthropic, and third-party frameworks. The exam tests who runs the loop, what comes built in, and where deterministic control belongs.",
      "points": [
        "The Agent SDK (Python and TypeScript) embeds Claude Code's agent loop, built-in tools, permissions, sessions, subagents, MCP and hooks in a process you operate. You supply the prompt, configuration and hosting.",
        "The loop: Claude evaluates, requests tool calls, the SDK runs them, results feed back. One cycle is a turn. It ends when a response has no tool calls, and a final ResultMessage carries result, cost and session ID.",
        "Bound the loop. max_turns (maxTurns) counts tool-use turns and max_budget_usd caps estimated spend; both default to no limit. Hitting one returns an error subtype with no result text, so always check the subtype first.",
        "allowed_tools auto-approves the tools you list, disallowed_tools blocks them regardless, and permission_mode sets overall oversight. Reserve bypassPermissions for isolated environments such as CI or containers.",
        "Hooks are callbacks at lifecycle points such as PreToolUse, PostToolUse, Stop and PreCompact. They run in your process, outside the context window. A PreToolUse deny stops the call, and Claude receives the rejection message.",
        "Use hooks for guarantees a prompt cannot give, like blocking, auditing or rewriting tool input. Version-dependent: TypeScript supports more hook events than Python, and an async hook output cannot block or modify the call.",
        "A custom harness on the Messages API loops while stop_reason is tool_use: run each tool, return tool_result blocks. The beta SDK tool runner automates this, but for human approval, custom logging or conditional execution use the manual loop.",
        "Claude Managed Agents (beta, requires the managed-agents-2026-04-01 header) is an Anthropic-hosted harness: you define an agent, an environment and sessions, then exchange events. It suits long-running, asynchronous work with minimal infrastructure.",
        "Environments are an Anthropic-run cloud sandbox or your own self-hosted worker. History and tool results still reach the service, and the docs say it is not currently eligible for Zero Data Retention or HIPAA BAA; check with your privacy team."
      ],
      "code": "async def block_env(input_data, tool_use_id, context):\n    path = input_data[\"tool_input\"].get(\"file_path\", \"\")\n    if path.endswith(\".env\"):\n        return {\"hookSpecificOutput\": {\n            \"hookEventName\": input_data[\"hook_event_name\"],\n            \"permissionDecision\": \"deny\",\n            \"permissionDecisionReason\": \"No .env edits\"}}\n    return {}\n\noptions = ClaudeAgentOptions(max_turns=30, hooks={\n    \"PreToolUse\": [HookMatcher(matcher=\"Write|Edit\", hooks=[block_env])]})",
      "traps": [
        "People assume the Agent SDK is a hosted service, but it is a library that runs in a process you operate; Managed Agents is the Anthropic-hosted option.",
        "People assume a system-prompt rule guarantees an action is blocked, but only a hook or a deny rule is enforced deterministically.",
        "People assume the loop has a default turn or cost limit, but both max_turns and max_budget_usd default to no limit.",
        "People assume listing a tool in allowed_tools restricts the agent to it, but it only auto-approves those tools; other tools stay available.",
        "People assume a self-hosted sandbox keeps everything local, but conversation history and tool results still go to the Managed Agents service."
      ],
      "sources": [
        "https://code.claude.com/docs/en/agent-sdk/overview",
        "https://code.claude.com/docs/en/agent-sdk/agent-loop",
        "https://code.claude.com/docs/en/agent-sdk/hooks",
        "https://platform.claude.com/docs/en/managed-agents/overview"
      ]
    },
    {
      "id": "agents-6",
      "n": 6,
      "domain": "agents",
      "title": "Agent frameworks and choosing how to build",
      "body": "Frameworks package agent patterns so you write less loop code, at the cost of abstraction, lock-in and harder debugging. The exam tests what LangGraph, Strands and PydanticAI are for, how patterns map across them, and when a custom loop or the Agent SDK is the better choice.",
      "points": [
        "The options form a spectrum: your own loop on the Messages API (most control), the SDK tool runner (loop automated), the Claude Agent SDK (Claude Code's loop and tools), Managed Agents (hosted), and third-party frameworks.",
        "Anthropic's guidance says successful implementations used simple, composable patterns, not complex frameworks. Frameworks speed up starting, but extra layers can obscure prompts and responses and hinder debugging. The post notes tooling has since changed.",
        "Core patterns are framework-independent: a tool-use loop, sub-agents with their own context, memory, compaction and human approval gates. Frameworks differ only in how they expose them, so learn the pattern first and the API second.",
        "LangGraph is a low-level orchestration framework and runtime. You build a graph of steps over shared state, mixing deterministic and LLM steps, with persistence, streaming and human-in-the-loop. It abstracts neither prompts nor architecture; LangChain is optional.",
        "Strands Agents is an open-source Python and TypeScript SDK with a model-driven approach. The loop runs in your process with no hosted control plane, with hooks, tracing and several model providers including Anthropic. Its packaging is evolving.",
        "Pydantic AI is a typed agent loop. You give an agent tools and an output type so runs return validated data, and switch models by changing a model string. Memory and sub-agents are optional add-ons.",
        "Trade-offs: abstraction buys speed but hides detail; lock-in comes from framework-specific state, graphs and session formats; debuggability needs every prompt, tool call and result visible. Keep tools and prompts as plain functions behind a thin adapter.",
        "Match the tool to the need: a fixed, auditable, resumable pipeline suits an explicit graph; open-ended file or code tasks suit the Agent SDK; hosted long-running work suits Managed Agents; a simple task may need one call."
      ],
      "traps": [
        "People assume a framework removes the need to understand the prompts and tool calls, but you still must inspect them to debug behaviour.",
        "People assume LangGraph is a high-level prebuilt agent, but it is a low-level orchestration runtime where you design the graph yourself.",
        "People assume you need a framework to build an agent, but a plain tool-use loop is often enough and easiest to debug.",
        "People assume the Agent SDK, Managed Agents and the tool runner are the same thing, but they differ in who runs the loop and what is built in.",
        "People assume switching frameworks later is cheap, but state objects, graph definitions and tool wrappers tie your code to the framework."
      ],
      "sources": [
        "https://www.anthropic.com/engineering/building-effective-agents",
        "https://docs.langchain.com/oss/python/langgraph/overview",
        "https://github.com/strands-agents/sdk-python",
        "https://github.com/pydantic/pydantic-ai"
      ]
    }
  );
  window.CC.scenarios.scK1 = { title: "Internal operations agent", text: "A platform team builds an internal operations agent with the Claude Agent SDK. It runs shell commands and edits files in a working directory, handles open-ended requests from engineers, and runs unattended overnight. Reviewers want hard guarantees on what it may do and a predictable cost ceiling." };
  window.CC.scenarios.scK2 = { title: "Choosing a build approach", text: "A delivery team must ship an agent that adjusts customer orders. The process has fixed checks that auditors must be able to trace, a human sign-off step, and a need to resume after infrastructure failures. Another squad in the same team wants a quick prototype that answers open-ended research questions." };
  window.CC.questions.push(
    S("k01", "agents", "Which statement about the Claude Agent SDK is accurate?",
      ["A hosted service where Anthropic runs your agent loop in a cloud sandbox you configure over REST", "A thin wrapper over the Messages API with no built-in tools, so every tool and the loop are yours to write", "A library for Python and TypeScript that embeds Claude Code's agent loop and tools in your own process", "An interactive command-line program for terminal use that application code has no way to call or configure"], 2,
      "The Agent SDK is a library that brings Claude Code's loop, tools, permissions, sessions and hooks into your own process.",
      "scK1"),
    S("k02", "agents", "Reviewers require that destructive shell commands are never run and that every command is logged, whatever the model decides. Which mechanism is the most reliable?",
      ["A PreToolUse hook on Bash that logs each call and returns a deny decision for destructive patterns", "A system prompt rule telling the agent to avoid destructive commands and to report each command it runs", "Listing Bash in allowed_tools so that the SDK checks every shell call against that list before running it", "A low max_turns value, so the agent has few chances to reach a destructive command at all"], 0,
      "Hooks run your code deterministically at the PreToolUse point, so a deny or log happens regardless of model behaviour.",
      "scK1"),
    M("k03", "agents", 2, "Which two statements about hooks in the Agent SDK are accurate?",
      ["They run in your application process, so they do not consume context-window tokens", "Every hook event is available in both the Python SDK and the TypeScript SDK", "An asynchronous hook output can still block or modify the tool call it is observing", "A PreToolUse hook that denies a call stops it, and Claude receives the rejection message", "They are advisory, so the model may skip them when it judges them unnecessary"], [0, 3],
      "Hooks are your code, outside the context window, and a PreToolUse deny prevents execution. Event coverage differs by SDK, and async output cannot influence the call."),
    S("k04", "agents", "Before deploying the agent for open-ended prompts, which configuration is a sound default?",
      ["Leave limits unset, because the loop always stops by itself once the model decides it is done", "Add a prompt rule to stop after five steps instead of setting any SDK option for it", "Set effort to low, which guarantees that the loop finishes within a few turns", "Set max turns and a budget cap, and check the result subtype before reading the text"], 3,
      "Both limits default to none; hitting one yields an error subtype without result text, so production code must branch on the subtype.",
      "scK1"),
    S("k05", "agents", "A team needs agents for hours-long asynchronous jobs and does not want to build or host a loop, sandbox or tool-execution layer. Which option fits best?",
      ["The Agent SDK, which moves its agent loop onto Anthropic's servers once your code has been deployed", "Claude Managed Agents, a hosted harness configured through the API (beta, so version-dependent)", "The beta tool runner, which also provisions an isolated sandbox for each tool call", "The Claude Code CLI kept open in an interactive terminal for the length of each job"], 1,
      "Managed Agents provides the hosted harness, sandbox and persisted sessions; the Agent SDK and tool runner leave hosting to you."),
    S("k06", "agents", "A team picks a self-hosted sandbox for Managed Agents so file contents stay inside its network. What still reaches the Anthropic-operated service?",
      ["Conversation history and tool results, while the sandbox's files and processes stay on your worker", "Nothing, because the worker keeps both the conversation history and every tool result locally", "The sandbox's whole filesystem, synced after each tool call so the model can read it", "Only the final answer, since tool calls and their outputs are summarised locally first"], 0,
      "The model still needs each tool result, so history and results reach the service; only the sandbox files and processes stay on your worker."),
    S("k07", "agents", "On the Messages API, your agent must wait for human approval before each tool runs and must log every call. What is the recommended approach?",
      ["Use the beta tool runner, which has a built-in approval prompt for each tool call", "Tell Claude in the system prompt to request permission and trust it to wait before calling tools", "Write the manual loop: on stop_reason tool_use get approval, run the tool, return a tool_result", "Switch to Managed Agents, because the Messages API cannot return tool calls to your own code"], 2,
      "Docs point to the manual loop when you need approval, custom logging or conditional execution; the tool runner automates the loop instead."),
    M("k08", "agents", 2, "Which two practices help keep a long-running Agent SDK agent's context efficient?",
      ["Put every standing rule in the first prompt, since compaction always preserves it word for word", "Delegate focused subtasks to subagents, because only their final message returns to the parent", "Give each subagent every available tool so that it never needs to ask the parent for help", "Raise max turns so that the loop can finish before the context window fills up", "Keep rules that must survive compaction in CLAUDE.md rather than only in the first prompt"], [1, 4],
      "Subagents keep intermediate work out of the parent, and CLAUDE.md is re-injected each request. Compaction may summarise early prompts, and max turns does not shrink context."),
    S("k09", "agents", "In a hand-written tool-use loop, how should you handle a response whose stop reason is tool_use?",
      ["Treat it as the final answer and return its text, since the model has chosen to stop here", "Append the tool output to the system prompt and resend, so the model treats it as more trusted", "Resend the same request unchanged until the stop reason becomes end_turn", "Run each requested tool, then send the results back as tool_result blocks that reference the matching tool_use ids"], 3,
      "tool_use means Claude wants results; you execute the tools and return tool_result blocks tied to each id so the loop can continue."),
    S("k10", "agents", "A lead agent delegates to a subagent, which fails because it lacks facts the lead found earlier. Why?",
      ["Subagents inherit the parent's full history, but only after the parent has been compacted at least once", "The parent hands over mainly a delegation prompt, so needed paths, errors and decisions must go in it", "Subagents are not allowed to use tools, so they cannot rediscover the facts for themselves", "The lead's tool results are shared automatically, but only if both agents run the same model"], 1,
      "A fresh subagent context holds its own system prompt and the delegation prompt, not the parent's history, so include what it needs explicitly."),
    S("k11", "agents", "A framework-built agent behaves unpredictably and the team cannot see what prompt reaches the model. Which response matches Anthropic's published guidance?",
      ["Assume the framework is correct and keep rewording the task description until the output changes", "Add more subagents so that individual failures are averaged out across several agents", "Inspect the prompts, tool calls and responses, and cut abstraction layers that hide them", "Move to a larger context window, since unpredictable behaviour is mainly caused by truncation"], 2,
      "The guidance warns that framework layers can obscure prompts and responses, and advises understanding the underlying code and reducing abstraction as you move to production.",
      "scK2"),
    M("k12", "agents", 2, "Which two statements about LangGraph are accurate?",
      ["It is hosted by Anthropic as part of Claude Managed Agents", "It requires LangChain components, so it cannot be used on its own", "It models an agent as a graph of steps over shared state, mixing deterministic and LLM-driven steps", "It is a high-level prebuilt agent that chooses prompts and architecture for you", "It offers runtime features such as persistence for resuming runs and human-in-the-loop interrupts"], [2, 4],
      "LangGraph is a low-level orchestration framework and runtime with persistence and interrupts; it does not abstract prompts or architecture, and LangChain is optional."),
    S("k13", "agents", "What is the core idea of the Strands Agents SDK?",
      ["An open-source, model-driven SDK whose agent loop runs in your own process, with hooks and tracing", "A visual drag-and-drop builder for assembling agent workflows without writing any code", "A vendor-hosted runtime that executes your agent loop and sandbox on its own servers", "A graph library where every state transition must be defined before any model call"], 0,
      "Strands favours a model-driven approach, runs in your process with no hosted control plane, and exposes hooks and tracing for control."),
    S("k14", "agents", "A team wants each agent run to return a validated, typed Python object and to switch model providers by changing a model string. Whose headline design matches?",
      ["LangGraph, built around graphs of steps that mix deterministic and agentic logic over shared state", "A hand-written Messages API loop, which validates and types every result automatically", "Claude Managed Agents, built around hosted sessions in a managed sandbox that you configure", "Pydantic AI, a typed agent loop where an output type makes every run return validated data"], 3,
      "Pydantic AI centres on typed outputs and tools and lets you swap models by string; the other options are built around graphs, hosting, or leave validation to you."),
    S("k15", "agents", "The order-adjustment agent needs a fixed sequence of auditable checks, a human sign-off step, and recovery after infrastructure failures. Which build approach fits best?",
      ["One open-ended agent loop with a long system prompt that lists every step in the required order", "An explicit graph runtime that mixes deterministic and LLM steps and persists state", "A team of peer subagents that decide among themselves which checks to run and when", "A single Messages API call with every rule in the prompt and no tools or state"], 1,
      "A fixed, traceable, resumable process suits an explicit graph with deterministic steps, persistence and interrupts, as in LangGraph; a prompt alone gives no guarantees.",
      "scK2"),
    S("k16", "agents", "Which practice best limits framework lock-in when you still use a framework in production?",
      ["Store all state in the framework's own classes so that every component shares a single common format", "Copy the framework's internal prompts into your code so its behaviour can never change", "Keep tools, prompts and rules in plain functions behind a thin adapter, and run end-to-end evals", "Avoid tracing, because observability hooks tie your code to the vendor's tooling"], 2,
      "Framework-neutral logic with a thin adapter and behaviour-level evals makes swapping or removing the framework cheap. This is design judgement, not an official rule.",
      "scK2")
  );
  Object.assign(window.CC.why, {
    "k01": [
      "Describes Managed Agents, not the SDK. The Agent SDK runs inside a process you operate, and hosting is your responsibility.",
      "The SDK ships with built-in tools, permissions, sessions and hooks from Claude Code, so you do not write the loop or the basic tools.",
      "Correct. It brings Claude Code's loop, built-in tools, permissions, sessions and hooks into your own Python or TypeScript application.",
      "The CLI is a separate product for interactive use. The SDK is programmable, and the CLI can also run headless for other languages."
    ],
    "k02": [
      "Correct. Hooks run your code at PreToolUse, so logging and a deny decision happen deterministically whatever the model decides to attempt.",
      "Prompt instructions are context the model usually follows but can ignore or misjudge, so they are not an enforcement mechanism.",
      "allowed_tools auto-approves the listed tools, so it removes checks rather than adding them; it does not inspect command content.",
      "A turn limit bounds length, not behaviour. One turn can still run a destructive command, and it logs nothing."
    ],
    "k03": [
      "Correct. Hooks execute in your application process, outside the agent's context window, so they cost no context tokens.",
      "Wrong. TypeScript supports additional events, such as session start and end, that the Python SDK does not yet support.",
      "Wrong. Async output tells the agent to continue immediately, so it cannot block, modify or inject context; use it only for side effects.",
      "Correct. A deny from a PreToolUse hook prevents execution, and Claude receives the rejection message and usually tries another approach.",
      "Wrong. Hooks are code the SDK runs at lifecycle events, not suggestions. The model does not decide whether they fire."
    ],
    "k04": [
      "Both limits default to none, so an open-ended prompt can run long and expensively. Loops do not guarantee early stops.",
      "A prompt rule is not enforced, and the model can ignore or miscount it. Limits belong in SDK options, not text.",
      "Effort controls reasoning depth per response, not loop length, so it gives no termination or cost guarantee.",
      "Correct. max_turns and max_budget_usd bound the loop, and the result field exists only on success, so check the subtype first."
    ],
    "k05": [
      "The Agent SDK runs in a process you operate, so you still host and scale it. It does not move onto Anthropic's servers.",
      "Correct. Managed Agents is a hosted harness with sandboxes and persisted sessions, suited to long-running asynchronous work with minimal infrastructure.",
      "The tool runner automates the request loop in your code but does not provision sandboxes; you still run and host tools.",
      "The CLI is built for interactive daily use, not for unattended asynchronous jobs, and it would still need your own hosting."
    ],
    "k06": [
      "Correct. The model needs each tool result, so history and results reach the service, while sandbox files and processes stay on your worker.",
      "Wrong. Conversation history and tool results always go to the Managed Agents service, which is how the model receives them.",
      "Wrong. The sandbox filesystem stays on your worker in a self-hosted setup; only what tools return is sent to the service.",
      "Wrong. Tool outputs are sent as they occur, not summarised locally. Claude decides the next tool call on Anthropic's side."
    ],
    "k07": [
      "The docs recommend the manual loop for approval, since the tool runner is designed to run tools automatically without pausing.",
      "A prompt instruction is not an enforced gate; the model may call tools anyway, and nothing is logged by your code.",
      "Correct. A manual loop lets you intercept each tool_use block, ask a human, log it, run the tool and return a tool_result.",
      "The Messages API does return tool_use blocks to your code. Managed Agents is unnecessary for approval and is a different hosting model."
    ],
    "k08": [
      "Wrong. Compaction summarises older history, so early instructions may be lost; persistent rules belong in CLAUDE.md.",
      "Correct. A subagent starts fresh and only its final message returns, so the parent's context grows by a summary rather than a transcript.",
      "Wrong. Every tool definition uses context; scoping each subagent's tools to the minimum it needs saves space.",
      "Wrong. Max turns caps iterations but does not reduce context. More turns can fill the window sooner and trigger compaction.",
      "Correct. CLAUDE.md content is re-injected on every request, so those rules survive compaction, unlike text only in the first prompt."
    ],
    "k09": [
      "tool_use means the model wants tool results before continuing. Returning its text would drop the pending tool calls.",
      "Tool output belongs in tool_result blocks in a user message, not the system prompt, which would also mix untrusted data into trusted instructions.",
      "Resending unchanged ignores the requested tools and just repeats the same request, so the loop would never progress.",
      "Correct. Execute each tool_use block, then send tool_result blocks with matching tool_use ids so the model can continue or finish."
    ],
    "k10": [
      "Subagents do not inherit the parent's history, compacted or not. A fork is the exception, not the default behaviour.",
      "Correct. The delegation prompt is the main channel from parent to subagent, so paths, errors and decisions must be included in it.",
      "Subagents can use tools, which you scope with the tools field. Having tools does not give them the parent's findings.",
      "Results are not shared automatically between agents, and model choice has no effect on what context a subagent starts with."
    ],
    "k11": [
      "Rewording without visibility is guesswork. The guidance is to understand what the framework actually sends to the model.",
      "Extra subagents add cost and complexity and do not reveal the prompt problem; failures are not averaged out.",
      "Correct. Anthropic notes frameworks can obscure prompts and responses and suggests understanding the underlying code and reducing abstraction for production.",
      "Truncation is one possible cause, but it is not the main explanation, and a larger window does not reveal the prompt."
    ],
    "k12": [
      "Wrong. LangGraph is an independent open-source orchestration framework, not part of Claude Managed Agents.",
      "Wrong. The docs say you do not need LangChain to use LangGraph, although its components are commonly used with it.",
      "Correct. LangGraph builds agents as graphs, letting you mix hand-coded deterministic steps with LLM-driven steps in one graph.",
      "Wrong. It is very low-level and does not abstract prompts or architecture; prebuilt architectures are a higher-level LangChain feature.",
      "Correct. Durable execution, persistence, streaming and human-in-the-loop are the runtime capabilities LangGraph focuses on."
    ],
    "k13": [
      "Correct. Strands is an open-source SDK with a model-driven approach, no hosted control plane, and hooks and tracing to inspect and steer the loop.",
      "That describes GUI workflow builders such as the drag-and-drop tools Anthropic's guidance mentions, not Strands, which is code-first.",
      "Strands runs in your process with no hosted control plane, so the vendor does not execute the loop for you.",
      "Graph definition describes LangGraph. Strands is model-driven, so the model decides steps rather than a predefined transition graph."
    ],
    "k14": [
      "LangGraph's headline idea is orchestration with graphs and persistence; typed validated outputs and model-string swapping are not its core design.",
      "A hand-written loop gives full control but nothing is validated or typed automatically; you would write the parsing and checks yourself.",
      "Managed Agents is about hosted sessions and sandboxes; typed Python outputs and model-string swapping are not its headline design.",
      "Correct. Pydantic AI is a typed agent loop where an output type makes runs return validated data and models are one string swap away."
    ],
    "k15": [
      "A prompt-listed sequence is only followed probabilistically, so it cannot give auditors guaranteed steps, resumability or an explicit approval gate.",
      "Correct. An explicit graph runs deterministic checks, interrupts for human sign-off and persists state so a run can resume after failure.",
      "Peer subagents choosing their own checks make the sequence unpredictable and hard to audit, the opposite of what is required.",
      "One call with no tools or state cannot execute checks, pause for a human, or resume after a failure."
    ],
    "k16": [
      "Coupling all state to framework classes deepens lock-in, because leaving the framework then means rewriting every component.",
      "Copied internal prompts may stop matching updates and hide what you actually depend on; they do not remove the dependency.",
      "Correct. Framework-neutral logic behind a thin adapter, plus evals of end-to-end behaviour, makes changing or dropping the framework cheap.",
      "Tracing is how you debug agents; avoiding it hurts debuggability and does not meaningfully reduce framework lock-in."
    ]
  });
})();
