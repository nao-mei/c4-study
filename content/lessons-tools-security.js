window.CC = window.CC || {}; window.CC.lessonsNew = window.CC.lessonsNew || [];
window.CC.lessonsNew.push(
  {
    id: "tools-1", n: 1, domain: "tools", title: "Defining tools",
    body: "A tool definition is the whole interface between your code and the model: Claude sees only the definition, never your implementation. Weak definitions cause wrong tool choices and malformed arguments long before any code bug appears. The exam focuses on the required fields, why descriptions matter most, enums, naming, and keeping the toolset small and distinct.",
    points: [
      "A user-defined tool requires a name and an input_schema (a JSON Schema object). The description is optional in the API, but it is the single most influential factor in whether and how Claude calls the tool.",
      "Names may contain only letters, digits, underscores and hyphens, up to 128 characters. Prefix names with the service or resource (for example github_list_prs) so selection stays unambiguous as the toolset grows.",
      "Write the description like documentation for a new colleague: what the tool does, when to use it and when not to, what each parameter means, and what it does not return. Several sentences beat one line.",
      "Describe every parameter and use enum for closed value sets. Claude then sees the legal values, which reduces invalid arguments far more than hoping a free-text field is filled correctly.",
      "List only truly mandatory parameters in required. Fewer optional parameters means fewer ambiguous calls, and it also keeps schemas simpler if you later enable strict tool use.",
      "Keep the toolset small and distinct. Overlapping tools make selection ambiguous, and every definition costs input tokens on each request. Consolidating related operations behind one tool with an action parameter can reduce confusion.",
      "The optional input_examples field shows format-sensitive inputs. Each example must validate against the schema, examples add prompt tokens, and they are not supported on server tools. Use them to supplement descriptions, never to replace them.",
      "Design the output side too: return stable identifiers and only the fields the next step needs. If tool selection is poor, fix names and descriptions first, before adding tools or lengthening the system prompt.",
      "If a parameter asks for the model's reasoning, ask for a short explanation or supporting evidence instead. The docs note that requesting step-by-step reasoning in a parameter can trigger a refusal."
    ],
    code: "{\n  \"name\": \"get_order_status\",\n  \"description\": \"Looks up the shipping status of one order by ID. Use when the user asks where an order is. Does not modify orders or return payment data.\",\n  \"input_schema\": {\n    \"type\": \"object\",\n    \"properties\": {\n      \"order_id\": {\"type\": \"string\", \"description\": \"Order ID, e.g. ORD-12345\"},\n      \"detail\": {\"type\": \"string\", \"enum\": [\"summary\", \"full\"], \"description\": \"Level of detail\"}\n    },\n    \"required\": [\"order_id\"]\n  }\n}",
    traps: [
      "People assume the description is required by the API, but only name and input_schema are; omitting the description still badly hurts tool selection.",
      "People assume more tools means better coverage, when overlapping tools make wrong selection more likely and add input tokens to every call.",
      "People assume the first fix for wrong tool picks is a bigger system prompt or a forced tool_choice, when clearer names and descriptions come first.",
      "People assume the model runs the function it sees defined, when a definition is only a schema and your code executes client tools.",
      "People assume enums and required fields in the schema are guaranteed to be honoured, but without strict tool use the model can still emit invalid input."
    ],
    sources: [
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
    ]
  },
  {
    id: "tools-2", n: 2, domain: "tools", title: "The tool-use cycle",
    body: "Tool use is a loop and your code owns the middle: Claude requests a call, you execute it, you return the result, and Claude continues. Most runtime bugs and 400 errors come from mismatched IDs, wrong message order or unhandled failures. The exam focuses on block types, tool_use_id, parallel calls, is_error, tool_choice and its limits on current models.",
    points: [
      "For client tools the response has stop_reason tool_use and one or more tool_use blocks, each with a unique id, a name and an input object. Nothing has run yet: your code decides whether and how to execute it.",
      "You answer with a new user message holding a tool_result block per call, whose tool_use_id equals the id of the request it answers. Content can be a string or content blocks, and is_error is optional.",
      "Ordering matters: the result message must directly follow the assistant message containing the tool_use blocks, and tool_result blocks must come before any text in that user message. Violations are rejected with a 400 error.",
      "Claude may return several tool_use blocks in one turn. Run them concurrently or sequentially to suit your tools, but return one tool_result per block, all in a single user message; for a call you skip, return is_error true.",
      "Report failures with is_error true and an instructive message saying what failed and what to try next. Claude can then recover or explain, and it typically retries an invalid call a few times before apologising.",
      "Validate input before executing. Treat model-produced arguments as untrusted: check ranges, existence and authorisation, and return an error result on failure. Without strict tool use even types and required fields can be wrong.",
      "Keep results compact: return only the fields the next step needs, with stable identifiers, and paginate or summarise large payloads. Every result consumes context and bloated results make the relevant facts harder to find.",
      "tool_choice values: auto (the default when tools are present) lets Claude decide, none forbids tools, any requires some tool, and tool requires one named tool. Forcing also prefills the turn, so no explanatory text or thinking precedes the call.",
      "Version-dependent: any and tool return a 400 error on some current models (docs list Opus 5.5, Sonnet 5.5, Fable 5.1, Mythos 5.1) and with manual extended thinking. Use auto with strict tool use, or structured outputs for fixed JSON."
    ],
    code: "{\"role\": \"user\", \"content\": [\n  {\"type\": \"tool_result\", \"tool_use_id\": \"toolu_PLACEHOLDER_1\",\n   \"content\": \"15 C, cloudy\"},\n  {\"type\": \"tool_result\", \"tool_use_id\": \"toolu_PLACEHOLDER_2\",\n   \"content\": \"Error: unknown city. Use City, Country.\", \"is_error\": true}\n]}",
    traps: [
      "People assume the API executes your tools, when for client tools your code runs them and only server tools run on Anthropic's side.",
      "People assume tool results can go in separate messages or after explanatory text, when all results belong together in one user message with results first.",
      "People assume tool_choice any or tool is always available to guarantee a call, but some current models reject it, so strict tool use with auto is the documented route.",
      "People assume is_error true ends the conversation, when it is information Claude uses to retry, adjust or explain.",
      "People assume schema-valid input is safe to execute, when values, permissions and business rules still need checking in your code."
    ],
    sources: [
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools"
    ]
  },
  {
    id: "tools-3", n: 3, domain: "tools", title: "Model Context Protocol",
    body: "MCP is an open protocol that standardises how AI applications connect to external tools and data, so one server can serve many clients instead of every app needing a custom integration. The exam focuses on the primitives, host, client and server roles, transports, authorization, and the trust review before connecting a server. Handshake and transport details change between spec revisions.",
    points: [
      "MCP uses a host, client and server model over JSON-RPC. The host is the AI application, it creates one client per server connection, and each server supplies context. Build a server once and any compatible client can reuse it.",
      "Servers offer three primitives: tools (functions the model can invoke), resources (context data) and prompts (templated messages and workflows). Actions belong in tools, readable data in resources, and reusable user-selected templates in prompts.",
      "stdio: the client launches the server as a local subprocess and exchanges newline-delimited messages over stdin and stdout. Streamable HTTP: a remote server exposes one HTTP endpoint, each message is a POST, and replies are JSON or an event stream.",
      "The older HTTP+SSE transport is deprecated in favour of Streamable HTTP. Local stdio servers typically serve a single client, while remote HTTP servers typically serve many clients, which is why remote servers need authentication.",
      "Revision-dependent: the revision the MCP site currently labels latest is 2026-07-28. It removed the initialize handshake and protocol-level sessions, so every request carries its own version and capabilities. Earlier revisions used a handshake; check which your SDK implements.",
      "Authorization is optional and defined for HTTP transports; stdio servers should read credentials from the environment instead. Remote servers build on OAuth 2.1: they publish protected resource metadata and clients obtain access tokens with scopes.",
      "Scope and audience matter: request minimal scopes, and servers must not accept tokens issued for other services or forward client tokens downstream (token passthrough is forbidden). Client registration is revision-dependent; the latest revision deprecates Dynamic Client Registration.",
      "Treat every server as code with access. Tools can amount to arbitrary code execution, and tool descriptions or annotations are untrusted unless the server is trusted. Review owner, permissions and data access, pin versions, and let humans deny calls.",
      "Anthropic's Messages API MCP connector reaches remote servers only (not local stdio) and, per its docs, currently supports only MCP tool calls; you supply the OAuth token. This is feature-limited and may change, so check the page."
    ],
    traps: [
      "People assume MCP makes tools safe, but it standardises connection, not trust, and tool output can still carry injected instructions.",
      "People assume MCP means only stdio or only HTTP, when the spec defines both stdio and Streamable HTTP, with HTTP+SSE now deprecated.",
      "People assume tools, resources and prompts are interchangeable, when tools perform actions, resources expose data and prompts supply templates.",
      "People assume a server listed in a popular directory has been vetted for your use, when you still review its permissions, data access and maintainers.",
      "People assume the initialize handshake and session ID are permanent parts of MCP, but the latest revision removed them."
    ],
    sources: [
      "https://modelcontextprotocol.io/specification/2026-07-28",
      "https://modelcontextprotocol.io/specification/2026-07-28/basic/transports",
      "https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization",
      "https://modelcontextprotocol.io/specification/2026-07-28/changelog"
    ]
  },
  {
    id: "tools-4", n: 4, domain: "tools", title: "Client tools, server tools and strict tool use",
    body: "Where a tool runs and what is guaranteed about its input are separate questions. Client tools run in your application, server tools run on Anthropic's infrastructure. Strict tool use and structured outputs use constrained generation to guarantee schema-valid structure, not correct meaning. The exam focuses on who executes what, what strict mode guarantees, and what you must still validate.",
    points: [
      "Client tools (your own definitions plus Anthropic-schema tools such as bash and text editor) run in your application: you execute the tool_use block and return a tool_result. You control the code, data access and side effects.",
      "Server tools such as web search, web fetch and code execution run on Anthropic's infrastructure. The response contains a server_tool_use block and its result block; you do not return a tool_result, and Claude handles server tool errors itself.",
      "Mixed turns: if Claude calls a server tool and a client tool together, the response stops with stop_reason tool_use. Return only the client tool_result blocks, keeping the same tools array. A long server-side loop may return pause_turn; resend it unchanged.",
      "Billing: tool definitions, calls and results count as ordinary input and output tokens, plus a small tool-use prompt overhead. Server tools can add usage-based charges on top (web search is charged per search). Check each tool page for current rates.",
      "Strict tool use: set strict true on a tool definition. Grammar-constrained sampling then guarantees the tool name is valid and the input matches your input_schema, removing cases such as a string where an integer is required.",
      "Structured outputs put a JSON schema in output_config.format to constrain the response text itself. Use it for a fixed JSON answer, and strict tools when the structure is the arguments to your function. Both can be combined in one request.",
      "Strict mode supports only a subset of JSON Schema: objects need additionalProperties false, and features such as recursive schemas and numeric or string-length constraints are unsupported. Version-dependent: check the limitations list. Overly complex schemas are rejected.",
      "The guarantee has exceptions: a refusal or a max_tokens cut-off can leave output that does not match the schema, and enum strings may differ in capitalisation. Check stop_reason and compare enum values case-insensitively.",
      "Schema-valid is not correct. Strict mode cannot know that an order exists, a refund is allowed or the user is authorised, so validate business rules and permissions in code. Keep health data out of schema definitions, which are cached separately."
    ],
    code: "{\n  \"name\": \"book_flight\",\n  \"strict\": true,\n  \"description\": \"Books one flight. Call only after the user confirmed.\",\n  \"input_schema\": {\n    \"type\": \"object\",\n    \"properties\": {\"passengers\": {\"type\": \"integer\"}},\n    \"required\": [\"passengers\"],\n    \"additionalProperties\": false\n  }\n}",
    traps: [
      "People assume server tools need a tool_result from you, when Anthropic executes them and the result block is already in the response.",
      "People assume strict tool use makes the model pick the right tool or send correct values, when it only guarantees structure.",
      "People assume forcing tool_choice is the way to guarantee valid input on current models, when the docs point to strict tool use with auto.",
      "People assume server tools are covered by normal token pricing alone, when some add usage-based charges.",
      "People assume structured outputs can never be invalid, when refusals, truncation and enum capitalisation can still break your parser."
    ],
    sources: [
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use",
      "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/server-tools",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
    ]
  },
  {
    id: "security-1", n: 1, domain: "security", title: "Prompt injection and untrusted content",
    body: "Prompt injection tries to make a model follow instructions that neither you nor your user intended. Models read instructions and data in the same channel, so no filter removes the risk entirely. The exam focuses on direct versus indirect injection, treating retrieved content as data, layered defences, human approval for sensitive actions, and safe handling of model output.",
    points: [
      "Direct injection and jailbreaks: the user of your app is the adversary and crafts input to bypass your rules. Indirect injection: the user is trusted, but Claude reads third-party content (web pages, email, documents, tool results) containing hidden instructions.",
      "Treat retrieved and tool content as data, never as instructions. Anthropic's guidance is to deliver untrusted content inside tool_result blocks, not in system prompts or plain user text, because Claude is trained to be sceptical of instructions found there.",
      "Label and delimit: tell Claude what the content is and where it came from, and encode third-party strings as JSON values so quotes or tags cannot break out into an instruction context. Delimiters help but are not a guarantee.",
      "State the policy in the system prompt (tool and document content is untrusted and must not override the user's request). Put your own instructions in a user turn, not inside tool results, where they may be ignored as suspect.",
      "No single control is enough. Layer input and output screening (for example a small model returning a structured verdict), hardened prompts, least-privilege tools, monitoring and review. Treat a refusal from a screening call as an unsafe verdict.",
      "A system prompt is not a security boundary. Enforce authorisation, limits and permitted actions in backend code, so a successful injection can only do what the credentials and tools allow.",
      "Require human confirmation for sensitive or irreversible actions such as payments, deletions, outbound messages and data export. Show the user the concrete action and parameters, not only the model's summary of it.",
      "Model output is untrusted input to downstream systems. Escape or sanitise it before rendering in a page (XSS), use parameterised queries rather than building SQL from model text (SQL injection), and validate arguments before shell or API calls.",
      "Red-team before launch with documents, emails and tool outputs that deliberately contain injection attempts, then monitor production outputs for signs of success and feed what you learn back into your controls."
    ],
    code: "cursor.execute('SELECT * FROM orders WHERE id = %s', (args['order_id'],))\n# Never: f'SELECT * FROM orders WHERE id = {args[\"order_id\"]}'\n# Tool arguments come from the model, so treat them like user input.",
    traps: [
      "People assume a strong system prompt saying to ignore instructions in documents solves injection, when it lowers risk but is not a boundary.",
      "People assume injection only arrives from what the user types, when indirect injection hides in pages, emails, files and tool results.",
      "People assume content from a well-known domain or an internal system is trustworthy, when anyone who can edit that content can plant instructions.",
      "People assume model output is safe because the model is internal, when it must be escaped, parameterised and validated like any untrusted input.",
      "People assume a larger or more safety-trained model removes the need for least privilege and approvals, when those limit damage if a defence fails."
    ],
    sources: [
      "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls",
      "https://code.claude.com/docs/en/security"
    ]
  },
  {
    id: "security-2", n: 2, domain: "security", title: "Secrets, permissions and least privilege",
    body: "Many AI incidents are ordinary security failures: a key in client code, an over-privileged agent, no audit trail. Claude adds one twist: injected content can steer model-driven actions, so the credentials and tools you grant define the worst case. The exam focuses on key storage, rotation and revocation, scoping, allowlists, sandboxing and audit logs.",
    points: [
      "API keys are server-side secrets. Never put them in client apps, browser code, repositories, prompts or logs. A web or mobile app should call your backend, which holds the key and can authenticate and rate-limit each user.",
      "Store keys in a secrets manager or environment variables injected at runtime, not in committed config. Obfuscation inside a client does not protect a key, because anything shipped to a device can be extracted.",
      "Rotate keys periodically and immediately on suspected leakage. Anthropic's docs advise disabling or deleting a suspect key; disabling in the Console is reversible, which suits quick containment. Create and deploy a replacement, then retire the old key.",
      "Use separate keys per environment and service (development, test, production), ideally in separate workspaces. A key can be scoped to one workspace, which limits blast radius, allows targeted revocation and makes usage attributable.",
      "Prefer short-lived credentials where available. Key expiry limits how long a leaked key works, and Workload Identity Federation exchanges your platform identity for short-lived tokens. Both complement, not replace, sound secret hygiene.",
      "Least privilege for agents: grant only the tools, files, networks and credentials the task needs, prefer read-only access, and keep production secrets out of agent environments. Injected instructions can then do limited damage.",
      "Prefer allowlists to blocklists: deny by default and permit only what is explicitly approved (tools, commands, domains). Blocklists miss new variants. In domain lists use ASCII entries only, since look-alike Unicode characters can spoof a domain.",
      "Sandbox agents that run code or commands: isolate filesystem and network, use a container or dedicated environment, and require approval outside the boundary. Claude Code, for example, starts with read-only permissions and asks before edits or commands.",
      "Keep audit logs of which tool was called, with what parameters, by whom and with what outcome. Logs enable investigation and attribution but do not prevent misuse, and they must themselves be redacted and access-controlled."
    ],
    traps: [
      "People assume obfuscating or encrypting a key inside a mobile or web app protects it, when anything shipped to the client can be extracted.",
      "People assume deleting a leaked key from the latest commit fixes the problem, when it stays in history and valid until it is revoked.",
      "People assume a blocklist of dangerous commands is as safe as an allowlist, when default-deny is the stronger posture.",
      "People assume telling the agent in the prompt not to touch secrets is access control, when only credentials and permissions you withhold are enforced.",
      "People assume audit logging replaces preventive controls, when it only supports detection and investigation after the fact."
    ],
    sources: [
      "https://platform.claude.com/docs/en/manage-claude/authentication",
      "https://platform.claude.com/docs/en/manage-claude/workspaces",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/server-tools",
      "https://code.claude.com/docs/en/security"
    ]
  },
  {
    id: "security-3", n: 3, domain: "security", title: "Data protection, logging and compliance basics",
    body: "Prompts, tool results and logs often contain personal or confidential data, so privacy is an engineering concern from day one. This lesson covers technical hygiene only and is not legal or regulatory advice. For personal or regulated data, involve your Data Privacy Officer, Legal and Compliance before processing. The exam focuses on minimisation, redaction, retention and access control.",
    points: [
      "Data minimisation: send the model only what the task needs. Drop unnecessary fields, summarise upstream, and have tools return just the relevant fields instead of whole records.",
      "Redact or pseudonymise personal data, secrets and identifiers before they reach prompts and, separately, before they reach logs. Replace values with tokens that you map back inside your own system only when a legitimate need exists.",
      "Logs, traces, caches, vector stores and error messages are further copies of your data. Prefer logging metadata (IDs, timings, token counts) over full prompts and responses, and never log keys or tokens.",
      "Set retention limits for everything you store, including transcripts, logs, embeddings and uploaded files. Delete on a schedule and on request, and keep nothing longer than its stated purpose requires.",
      "Enforce access controls on stored prompts, transcripts and logs: role-based access, least privilege, environment separation and an audit of who viewed what. A log of conversations is itself sensitive data.",
      "For personal or regulated data (for example GDPR, HIPAA or PCI-DSS scope), do not decide yourself whether processing is permitted. Consult your Data Privacy Officer, Legal and Compliance before using real data, choosing vendors or going live.",
      "Anthropic's docs describe zero data retention and HIPAA readiness as specific arrangements, enabled per organisation, with a per-feature eligibility table. They state that third-party integrations and consumer products fall outside those arrangements. Verify against current terms and your contract.",
      "Also documented: some models require 30-day retention, flagged content may be retained longer even under these arrangements, and protected health information must not appear in JSON schema definitions for structured outputs or strict tools. Check current pages.",
      "Treat all provider data-handling details as time-sensitive. Terms, feature eligibility and retention change, so confirm in the current documentation and with your compliance contacts rather than relying on a study note."
    ],
    traps: [
      "People assume removing names makes data anonymous, when other fields can still identify a person and classification is a question for your Data Privacy Officer.",
      "People assume a well-known vendor with a published privacy policy means any data can be sent, when your own classification and approvals still apply.",
      "People assume zero data retention or HIPAA readiness covers every feature and product automatically, when eligibility is per feature and per arrangement.",
      "People assume logging everything is best practice, when verbose logs create another unprotected copy of sensitive data.",
      "People assume developers decide compliance questions, when GDPR, HIPAA or PCI-DSS scope belongs with the Data Privacy Officer, Legal and Compliance."
    ],
    sources: [
      "https://platform.claude.com/docs/en/manage-claude/api-and-data-retention",
      "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/server-tools"
    ]
  }
);
