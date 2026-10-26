(function () {
  window.CC = window.CC || {};
  window.CC.lessonsNew = window.CC.lessonsNew || [];
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }

  window.CC.lessonsNew.push({
    id: "apps-11", n: 11, domain: "apps",
    title: "Claude application design: schemas, sessions and interfaces",
    body: "Good Claude applications keep instructions and data apart, define tight schemas, and manage session lifetime on purpose. Each interface also loads instructions differently: the API reads nothing you do not send, Claude Code adds CLAUDE.md as context, and claude.ai scopes instructions to account or project. Plugins add capability but also standing cost.",
    points: [
      "Keep developer-owned, stable rules in the system prompt. Put per-request data in user turns, wrapped in labelled tags. Deliver third-party content such as emails or web pages in tool_result blocks, never in the system prompt.",
      "For indirect injection, label the content's source, JSON-encode it, and tell Claude in the system prompt that retrieved content is data. Limit tool permissions. Put your own follow-up instructions in a user turn after the tool_result, not inside it.",
      "A hostile user is a different threat model from hostile content. For direct attacks, pre-screen input with a small model that returns a structured verdict, and harden the system prompt with explicit refusal guidance. Neither replaces least privilege.",
      "Tool descriptions are the biggest lever on tool selection: say what the tool does, when to use it, what it returns and its limits. Use service-prefixed names and optional input_examples for complex inputs. Vague or overlapping tools cause wrong calls.",
      "Structured outputs (output_config.format, or strict: true on tools) compile your schema into a grammar. Objects need additionalProperties: false. Recursion and numeric or string-length constraints are unsupported and return a 400. Many optional fields or unions hit complexity limits.",
      "A schema guarantees shape, not truth. Output can still miss the schema on a refusal or a max_tokens stop, and enum capitalisation is not guaranteed. Validate values in code, and check stop_reason before parsing.",
      "The API is stateless and reads no files, so send system and history every call. Claude Code adds CLAUDE.md as a user message: context, not enforcement, so use hooks to block actions. claude.ai project instructions apply only within that project.",
      "Claude Code sessions start with fresh context. Use /clear between unrelated tasks and /compact to summarise a long one. Project-root CLAUDE.md is re-read after compaction, but chat-only instructions can be lost. Resuming does not restore flags like --plugin-dir.",
      "A plugin bundles skills, agents, hooks and MCP servers. While enabled, its descriptions sit in context every turn and its servers run, so disable unused ones. Project scope is committed, but each teammate still installs it. Cloud sessions skip them."
    ],
    code: "output_config: {format: {type: \"json_schema\", schema: {\n  type: \"object\",\n  properties: {\n    priority: {type: \"string\", enum: [\"low\", \"high\"]},\n    summary: {type: \"string\"}\n  },\n  required: [\"priority\", \"summary\"],\n  additionalProperties: false\n}}}\n// No minimum/maxLength or recursion here.\n// Still check stop_reason, then validate in code.",
    traps: [
      "People assume CLAUDE.md is a system prompt that is enforced; it is delivered as a user message and Claude only tries to follow it, so blocking an action needs a hook.",
      "People assume a valid schema means a correct answer; it only guarantees structure, and refusals or max_tokens cut-offs can still return output that does not match.",
      "People assume /compact keeps everything; rules typed only in chat can be lost, while project-root CLAUDE.md is re-read from disk afterwards.",
      "People assume an installed plugin costs nothing until used; enabled plugins add descriptions to context every turn and may run servers and hooks in every session.",
      "People assume Claude remembers across calls, sessions or chats by default; the API is stateless and claude.ai project chats do not share context unless it is in project knowledge."
    ],
    sources: [
      "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
      "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks",
      "https://code.claude.com/docs/en/memory",
      "https://code.claude.com/docs/en/plugins"
    ]
  });

  window.CC.scenarios.scD1 = { title: "Monorepo with long Claude Code sessions", text: "A team shares a monorepo and uses Claude Code daily. The repository has a root CLAUDE.md and a nested CLAUDE.md inside the payments folder. Developers keep one session open all day, and instructions agreed in chat sometimes seem forgotten later." };
  window.CC.scenarios.scD2 = { title: "Supplier email triage service", text: "A triage service reads inbound supplier emails through a fetch_email tool, and Claude returns a structured summary that downstream code parses. The emails come from unknown senders. The team calls the Messages API directly and defines the summary schema themselves." };

  window.CC.questions.push(
    S("d01", "apps", "In the triage service, where should the body of an inbound email from an unknown sender be delivered to Claude?",
      ["Appended to the system prompt so that Claude weights it as trusted, high-priority context",
       "As a source-labelled, JSON-encoded tool result, with the system prompt calling such content data",
       "Pasted into the user turn after your instructions, split off by a row of dashes and a heading",
       "Placed in a second system block marked cache_control, so the sender's text counts as fixed reference material"],
      1, "Third-party content belongs in tool_result blocks, labelled and JSON-encoded, with a system-prompt policy that it is data. System or plain user text gives it instruction-like standing.", "scD2"),

    S("d02", "apps", "After fetch_email returns, the service also needs Claude to reply in exactly three bullet points. Where should that formatting instruction go?",
      ["Inside the tool result text, appended after the email body so it travels with the content",
       "In a final assistant turn that begins the bullet list so that Claude simply continues it",
       "In a user turn placed after the tool_result block",
       "In the fetch_email description, rewritten on every request to carry the current formatting wish"],
      2, "Your instructions go in a user turn after the tool_result. Text inside a tool result is treated as untrusted data and may be ignored or flagged as an injection.", "scD2"),

    S("d03", "apps", "The team sends a raw JSON schema in output_config.format with a priority integer that has minimum 1 and maximum 5. What is the right design response?",
      ["Constrained decoding will enforce the 1 to 5 range, so no application-side check is needed",
       "The constraints are silently ignored, so the request succeeds and the model just guesses the range",
       "Only maximum is rejected, so keep minimum and let the application enforce the upper bound",
       "The API returns a 400 for unsupported constraints; use an enum or describe the range, then validate in code"],
      3, "Numeric constraints such as minimum and maximum are unsupported in structured-output schemas and cause a 400 error. Model the field as an enum or document the range, and validate in your own code.", "scD2"),

    M("d04", "apps", 2, "Which TWO statements about structured output schemas are accurate?",
      ["Every object in the schema needs additionalProperties set to false",
       "Recursive schemas are accepted as long as the nesting depth is capped",
       "A response can still miss the schema when stop_reason is refusal or max_tokens",
       "String enum values are guaranteed to come back with exactly the capitalisation in the schema",
       "Making fields optional costs nothing, because complexity limits count only required fields"],
      [0, 2], "Objects must set additionalProperties to false, and refusals or max_tokens stops can yield non-conforming output. Recursion is unsupported, enum casing is not guaranteed, and optional parameters count toward limits."),

    S("d05", "apps", "An assistant keeps calling search_orders when it should call find_customer_orders. Both descriptions are one short line. What is the most effective fix?",
      ["Set temperature to 0 so that tool selection becomes deterministic across repeated runs",
       "Rewrite both to state what each tool does, when to use it, and what it returns",
       "Add a third wrapper tool that covers both lookups and leave the routing choice to Claude",
       "Shorten both descriptions to a few words so that the parameter names carry the meaning"],
      1, "Detailed descriptions are the main driver of correct tool choice. Lowering temperature does not remove ambiguity (and newest models reject non-default values), and wrappers or terser text add confusion."),

    S("d06", "apps", "A developer finishes a bug fix in a long Claude Code session and now wants to start an unrelated refactor. What is the best session hygiene?",
      ["Carry on in the same session, since earlier context always helps with later work",
       "Run /compact first, because a summary keeps every detail the refactor might need",
       "Edit CLAUDE.md to describe the bug fix, then continue so that the history is documented",
       "Run /clear, after /rename if they may return, so old context is not resent each turn"],
      3, "Clearing between unrelated tasks avoids paying for stale context on every later message. /rename lets them /resume the old session, and /compact would keep a summary of irrelevant work.", "scD1"),

    S("d07", "apps", "A developer said 'always use pnpm' in chat. After a /compact the instruction seems lost. What is the durable fix?",
      ["Add it to the project-root CLAUDE.md, which is re-read from disk after compaction",
       "Compact again without arguments so that Claude regenerates the instruction in its summary",
       "Move the sentence into a nested CLAUDE.md, which stays loaded permanently after any compaction",
       "Restate it in every prompt, because compaction deletes all CLAUDE.md content until restart"],
      0, "Instructions given only in conversation can be dropped by summarising, while project-root CLAUDE.md is re-injected from disk. Nested files reload only on demand, and CLAUDE.md is not deleted.", "scD1"),

    S("d08", "apps", "A team wants a guarantee that Claude Code never edits files under migrations/. Which approach actually provides it?",
      ["Write 'never edit migrations/' at the top of CLAUDE.md, which is loaded as system-prompt text",
       "Put the rule in CLAUDE.local.md, because local instructions are enforced more strictly",
       "A PreToolUse hook that blocks those edits",
       "Repeat the rule in the first prompt of each session so that it stays in recent context"],
      2, "CLAUDE.md is context delivered as a user message, not enforced configuration, so a hook is the way to block an action regardless of what Claude decides.", "scD1"),

    M("d09", "apps", 2, "Which TWO statements about how Claude Code loads CLAUDE.md files are accurate?",
      ["A project CLAUDE.md replaces the user-level one, which is discarded once a project file exists",
       "Files in the working directory and the directories above it are loaded at launch and concatenated",
       "CLAUDE.local.md is meant to be committed so that the whole team shares it",
       "CLAUDE.md files in subdirectories load on demand once Claude reads files in that subdirectory",
       "Imported @files are loaded lazily, so importing them reduces the startup context cost"],
      [1, 3], "Launch-directory and ancestor files are concatenated, and nested files load on demand. Project files do not replace user ones, local files are gitignored, and imports load at launch.", "scD1"),

    S("d10", "apps", "A developer stores persona rules in a CLAUDE.md file and expects their own Messages API backend to pick them up. What actually happens?",
      ["Nothing; the API reads no local files, so send the rules in system on each call",
       "The SDK finds CLAUDE.md in the working directory and adds it to the system prompt automatically",
       "The first request registers the file server-side, and later requests reuse it without resending",
       "The rules load only if the request also sets a memory header that points at the file's path"],
      0, "CLAUDE.md is a Claude Code convention. The API is stateless and reads nothing from disk, so your backend must send the text in system on every request."),

    S("d11", "apps", "A user tells Claude a deadline in one chat inside a claude.ai project and expects a second chat in the same project to know it. What do the help docs say?",
      ["The chats share one running context, so the second chat sees everything from the first",
       "Project instructions rewrite themselves from chat content, so the deadline appears there",
       "Context is not shared between chats unless it is added to project knowledge",
       "Sharing applies only to chats started within the same hour of each other"],
      2, "The projects help article notes that context is not shared across chats in a project unless the information is added to the project knowledge base. Project instructions apply to all chats but are written by you."),

    S("d12", "apps", "A developer has enabled a dozen plugins but rarely uses most of them, and sessions feel crowded. What explains this, and what is the fix?",
      ["Plugins use context only in sessions where one of their skills runs, so the crowding comes from elsewhere",
       "Each enabled plugin adds skill and agent descriptions to every turn and may run servers; disable unused ones",
       "Plugins load once at install time, so only uninstalling and reinstalling them can reduce their footprint",
       "Plugin hooks and servers pause outside the project scope, so the cost belongs to project-scoped plugins"],
      1, "An enabled plugin is part of every session: its descriptions occupy context each turn and its MCP servers and hooks run. Disabling stops this without uninstalling."),

    S("d13", "apps", "A lead installs a plugin at project scope and commits .claude/settings.json. What is true for a teammate who pulls the change?",
      ["The plugin is enabled for them, but they still install it on their own machine",
       "The plugin is downloaded and runs automatically, with nothing further for them to do",
       "The plugin stays off until the lead re-installs it at user scope on the teammate's computer",
       "The plugin loads only in the teammate's cloud sessions and never in local ones"],
      0, "Committing the entry turns the plugin on for collaborators but does not download it, so each person still installs it. User scope is per machine, and cloud sessions do not load local plugins."),

    M("d14", "apps", 2, "A long-running support chat built on the Messages API is nearing the context limit. Which TWO actions are sound?",
      ["Replace older turns with a summary, using server-side compaction (a beta feature at time of writing) or your own summariser",
       "Raise max_tokens so that the context window grows to fit the whole history",
       "Start a fresh conversation, with a short carried-over summary, when the customer moves to an unrelated issue",
       "Send only the newest user message, because the API retains earlier turns on the server",
       "Set temperature to 0 so that replies become shorter and history grows more slowly"],
      [0, 2], "You own the history, so compact or summarise old turns and begin new conversations for unrelated tasks. max_tokens limits the reply, the API retains nothing, and temperature does not shrink history."),

    S("d15", "apps", "A contract-review app has persona and refusal rules, an uploaded contract and the user's question. Which split between system and user turns is best?",
      ["Everything goes in the system prompt, because content there is followed most reliably",
       "Everything goes in the user turn, because the system parameter is optional and rarely needed",
       "Rules go in system, then the contract and question in the user turn, with the contract in a labelled tag",
       "Rules and contract go in system, and only the short question is left in the user turn"],
      2, "Stable developer-owned rules belong in system, while per-request data goes in user turns with labelled tags. Putting uploaded documents in system blurs data with instructions and hurts a cacheable prefix."),

    S("d16", "apps", "A developer installs a plugin at user scope in the terminal. Where will it be available?",
      ["Neither the desktop app nor cloud sessions, since each surface keeps a separate plugin list",
       "Both desktop local sessions and cloud sessions at claude.ai/code, because they share an account",
       "Only cloud sessions, because user scope is stored in the account rather than on the machine",
       "Desktop local sessions on that computer, but not cloud sessions"],
      3, "The terminal, desktop local sessions and the VS Code extension read the same settings files on one computer. Cloud sessions do not load plugins from local settings.")
  );

  Object.assign(window.CC.why, {
    "d01": [
      "System text carries your authority, so an attacker's email placed there could rewrite your rules. Untrusted content must never gain system-level standing.",
      "Tool results are treated skeptically. Labelling the source and JSON-encoding it makes the text clearly data, and the system policy reinforces that it must not override instructions.",
      "Plain user text beside your instructions blurs the boundary, and a dash line is easily imitated inside the email. The sender could close or mimic the separator.",
      "cache_control only affects caching, and a system block still carries instruction-level standing. It does not make the content safe or mark it as data."
    ],
    "d02": [
      "Instructions inside a tool result are treated as untrusted data, so Claude may ignore them or flag them as injection. Your formatting rule would not be reliably honoured.",
      "Prefilling the assistant turn is rejected on Claude 4.6 and later models, and it is not the mechanism for adding instructions after tool output.",
      "Your own instructions belong in a user turn that follows the tool_result block, which keeps them separate from the untrusted email content.",
      "Tool descriptions say what a tool does and when to use it. They are not the place for a per-reply formatting rule, and rewriting them each request breaks caching."
    ],
    "d03": [
      "Numeric constraints are not enforced by constrained decoding. They are unsupported in the schema, so relying on them leaves you without validation.",
      "Unsupported features are not silently ignored. The API rejects them with a 400 error that explains the problem.",
      "Neither minimum nor maximum is supported, so the request fails regardless of which one you keep.",
      "Unsupported constraints produce a 400. Using an enum or describing the range in the field description, plus validation in your own code, is the documented approach."
    ],
    "d04": [
      "Structured outputs require additionalProperties to be false on objects. Other values are not supported.",
      "Recursive schemas are unsupported, and capping depth does not change that. The API returns a 400 error.",
      "A refusal or a max_tokens cut-off can return output that does not match the schema, so check stop_reason before parsing.",
      "Casing of enum and const strings is not guaranteed. Compare case-insensitively and avoid values that differ only in capitalisation.",
      "Every parameter not in required counts toward an optional-parameter limit, and optionals also enlarge the compiled grammar, so they are not free."
    ],
    "d05": [
      "Temperature does not resolve vague descriptions, and the newest models reject non-default temperature values. Selection stays ambiguous because Claude lacks guidance on when each tool applies.",
      "Descriptions stating purpose, when to use the tool and what it returns are the most important factor in tool performance. This directly resolves the confusion between the two tools.",
      "A broad wrapper adds another overlapping option and hides routing logic. It makes the ambiguity worse rather than clarifying when each lookup applies.",
      "Shorter descriptions remove the context Claude uses to choose. Parameter names alone rarely explain when or why to call a tool."
    ],
    "d06": [
      "Stale context is resent and costs tokens every message, and it can distract from the new task. Earlier work is not automatically relevant.",
      "Compaction keeps a summary of the old task, so irrelevant detail still occupies context, and summaries are lossy rather than complete.",
      "CLAUDE.md is for facts held in every session, not a log of one bug fix. Adding it just consumes context in all future sessions.",
      "Clearing starts fresh at no cost, and renaming first lets them resume the old session later. This avoids paying for stale context on each turn."
    ],
    "d07": [
      "Project-root CLAUDE.md is re-read from disk and re-injected after compaction, so writing the rule there makes it persist, unlike conversation-only instructions.",
      "A summary may omit chat-only rules, so compacting again does not reliably restore them. The instruction must live in a file.",
      "Nested CLAUDE.md files reload only on demand when Claude touches files in that folder, so this would not hold the rule consistently.",
      "CLAUDE.md is not deleted by compaction. The root file is re-injected, so restating every prompt is unnecessary effort."
    ],
    "d08": [
      "CLAUDE.md is delivered as a user message after the system prompt and is treated as context, so Claude tries but is not forced to follow it.",
      "CLAUDE.local.md is treated the same way as CLAUDE.md. It is personal and gitignored, not stricter or enforced.",
      "A PreToolUse hook runs outside the model's decisions and can block matching tool calls, so it guarantees the rule where instructions cannot.",
      "Repeating a rule in a prompt is still just context. It can be overlooked or compacted away, and nothing enforces it."
    ],
    "d09": [
      "Memory files are concatenated, not replaced. The user-level file stays in context alongside the project file.",
      "Claude Code loads CLAUDE.md files from the working directory and every directory above it at launch, concatenating them rather than overriding.",
      "CLAUDE.local.md holds personal, project-specific preferences and should be gitignored. Committing it would defeat its purpose.",
      "Subdirectory files are not loaded at launch. Each loads once Claude reads or edits a file in that subdirectory.",
      "Imported files are expanded and loaded at launch with the importing file, so imports help organise but do not reduce context cost."
    ],
    "d10": [
      "The API is stateless and does not read files from your disk. The persona text must be included in the system parameter of every request.",
      "SDKs are thin API clients and do not discover CLAUDE.md. That file convention belongs to Claude Code, not the Messages API.",
      "Nothing is registered or remembered server-side between requests, so each call must carry its own system prompt and history.",
      "No memory header points the API at local file paths. The API only sees what you put in the request body."
    ],
    "d11": [
      "Chats are separate conversations with their own history. Being in the same project does not merge their context.",
      "Project instructions are written by you in project settings. They do not rewrite themselves from chat content.",
      "The projects help article states that context is not shared across chats in a project unless the information is added to the project knowledge base.",
      "There is no time-window rule for sharing. Information carries between chats only through project knowledge or instructions you add."
    ],
    "d12": [
      "Enabled plugins add skill and agent names and descriptions to context on every turn, even when nothing from the plugin runs, so they do contribute to crowding.",
      "Descriptions stay in context each turn and MCP servers and hooks run per session. Disabling with /plugin or claude plugin disable stops the footprint without uninstalling.",
      "Plugins are not one-off installs. Their components are present in every session while enabled, and disabling already removes the footprint without reinstalling.",
      "Scope decides who gets a plugin, not whether its costs apply. An enabled plugin adds context and processes in every session it is enabled for."
    ],
    "d13": [
      "Committed settings enable it for collaborators, but nothing is fetched to their machine, so each person still runs the install on their own computer.",
      "Committing the settings entry does not download the plugin, so it does not run automatically until the teammate installs it.",
      "A user-scope install is per machine and unrelated to the lead's. Teammates install the project-scoped plugin themselves rather than waiting for a re-install.",
      "Project scope applies to local sessions in that repository. Cloud sessions do not load local-settings plugins and do not install ones the repo declares."
    ],
    "d14": [
      "Compaction replaces older turns with a summary, whether server-side (beta, version-dependent) or built yourself, keeping the active context small while preserving the key facts.",
      "max_tokens limits only the generated reply. It does not enlarge the context window, so the history would still overflow.",
      "Unrelated tasks should not drag the old history along. A fresh conversation with a brief carried-over summary keeps context lean.",
      "The API is stateless and retains no earlier turns, so sending only the newest message would make Claude lose the conversation.",
      "Temperature affects sampling randomness, not reply length or history size, and the newest models reject non-default values anyway."
    ],
    "d15": [
      "System is for stable developer rules. Placing a changing uploaded document there mixes data with instructions and gives untrusted text instruction-level standing.",
      "System is the right home for persona and standing rules. Omitting it forces repeated rules into each user turn and weakens the separation.",
      "Stable rules in system, with the document and question in the user turn and the document in a labelled tag, keeps instructions apart from data.",
      "The contract varies per request and is data. Putting it in system blurs the boundary and breaks a stable, cacheable system prefix."
    ],
    "d16": [
      "These surfaces are not fully separate. The terminal, desktop local sessions and VS Code extension read the same settings files on one computer.",
      "Cloud sessions, including claude.ai/code, do not load plugins from your local settings, so a terminal install does not reach them.",
      "User scope is recorded in a settings file on your machine, not in the account, and cloud sessions do not read it.",
      "User scope is written to your local user settings, which the desktop app's local sessions also read. Cloud sessions do not load them."
    ]
  });
})();
