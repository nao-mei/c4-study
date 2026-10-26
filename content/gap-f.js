(function () {
  window.CC = window.CC || {};
  window.CC.lessonsNew = window.CC.lessonsNew || [];
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }

  window.CC.lessonsNew.push(
    {
      id: "tools-5", n: 5, domain: "tools", title: "Choosing between built-in tools, custom tools, Skills and MCP",
      body: "Claude can be extended four ways, and they solve different problems. Built-in tools and custom tools give Claude actions, MCP standardises how capabilities are shared across applications, and Skills package instructions and procedures. The exam focuses on matching the mechanism to the gap: reuse, ownership, context cost, where code runs, and security surface.",
      points: [
        "Built-in tools come in two kinds. Server tools (web search, web fetch, code execution) run on Anthropic's infrastructure with no handler code from you. Anthropic-schema client tools (bash, text editor, memory) use a trained schema, but your application executes them.",
        "Custom client tools suit a capability used by one application. You write the schema and the handler, so you control data access, latency and side effects. The cost is reuse: a second application means copying or sharing that code.",
        "An MCP server exposes tools, resources and prompts to any compatible client. One owner maintains it once and many applications reuse it. The trade-off is a process or endpoint to run, secure and version, plus tool definitions that consume context.",
        "A Skill is a folder with a SKILL.md file (required name and description) plus optional scripts and reference files. It packages know-how such as a checklist, house style or procedure. It does not open a connection to any system.",
        "Progressive disclosure keeps Skills cheap. Name and description always load (the docs cite roughly 100 tokens each), the SKILL.md body loads when triggered, and bundled files load only when read. Script code stays out of context; only output enters.",
        "Match the mechanism to the gap. Lacking know-how, write a Skill. Lacking access to a system or an action, use a tool or MCP server. They compose: a Skill can teach Claude to use an MCP server's tools.",
        "Where code runs matters. In-process tools and local stdio servers avoid network hops. Remote MCP servers give shared access and central updates but need authentication. Skills on the Claude API have no network; in Claude Code they use the host's.",
        "Skills do not sync across surfaces. claude.ai uploads belong to the individual user, API uploads are workspace-wide, and Claude Code Skills live on the filesystem or in plugins. Version-dependent: check the Skills docs for current sharing rules.",
        "Both Skills and MCP servers are code with access, so use only trusted sources and audit every bundled file. In Claude Code, disable-model-invocation stops automatic triggering of side-effect workflows, and allowed-tools pre-approves tools, so review it in shared Skills."
      ],
      code: "---\nname: code-review\ndescription: Applies the team review checklist and report template. Use when asked to review a pull request or diff.\n---\n# Code review\n1. Follow the checklist in CHECKLIST.md.\n2. Fill the template in REPORT.md.\n3. Run scripts/lint_summary.py for a deterministic summary.",
      traps: [
        "People assume a Skill is a server or connector, when it is a folder of instructions and optional scripts that Claude reads on demand.",
        "People assume installed Skills cost their full text in every request, when only name and description load until one is triggered.",
        "People assume MCP is always the right way to share a capability, when a single-application tool or a Skill can be simpler and cheaper to run.",
        "People assume a Skill uploaded in one product appears everywhere, when claude.ai, the API and Claude Code each manage Skills separately.",
        "People assume Skills are safe because they are mostly text, when bundled scripts and instructions can direct Claude to misuse tools."
      ],
      sources: [
        "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview",
        "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
        "https://code.claude.com/docs/en/skills",
        "https://code.claude.com/docs/en/mcp"
      ]
    },
    {
      id: "tools-6", n: 6, domain: "tools", title: "Building MCP servers",
      body: "An MCP server exposes capabilities to any compatible client. Building one means choosing the right primitive, reporting errors in a way the model can act on, picking a transport, and wiring the server into a Claude application. Transport and handshake details changed in the latest revision, so know which revision your SDK and client implement.",
      points: [
        "Choose the primitive by who decides. Tools are model-controlled actions, resources are application-controlled context data identified by URI, and prompts are user-controlled templates, often shown as slash commands. The spec does not force a particular user interface.",
        "Declare each capability you support (tools, resources, prompts), with optional listChanged. A list may vary by the authorization on the request but not per connection. Returning tools in a deterministic order helps client caching and prompt cache hits.",
        "Tool errors have two channels. Protocol errors (unknown tool, malformed request) are JSON-RPC errors. Execution errors (API failure, invalid input, business rule) are returned in the result with isError true and an actionable message so the model can self-correct.",
        "stdio: the client launches your server as a subprocess and exchanges newline-delimited JSON-RPC over stdin and stdout. Never write non-protocol output to stdout; log to stderr. Exit promptly when stdin closes, which is the portable shutdown signal.",
        "Streamable HTTP: one MCP endpoint, every message is a POST, and each reply is a JSON object or a request-scoped event stream. Validate the Origin header, bind to localhost when local, and authenticate. One remote server can serve many clients.",
        "Custom transports, including sockets, are allowed if they preserve the JSON-RPC format, message patterns and per-request metadata. Transports over a reliable byte stream, such as Unix domain sockets or TCP, should reuse the stdio newline framing.",
        "Revision-dependent: the 2026-07-28 revision removed the initialize handshake, protocol-level sessions and the Streamable HTTP GET stream. Each request carries its version and capabilities in _meta, and servers no longer send independent requests. Check your SDK and client.",
        "Integration: in Claude Code, claude mcp add --transport http name url adds a remote server; stdio commands follow a double-dash. Scopes: local (default), project (.mcp.json, shared) and user. Claude for Desktop reads mcpServers from its config, using absolute paths.",
        "Servers must validate inputs, enforce access control, rate limit and sanitise outputs. Clients should keep a human able to deny calls, and tool annotations are untrusted from untrusted servers. Never pass secrets through tool arguments or logs."
      ],
      code: "from mcp.server import MCPServer\n\nmcp = MCPServer(\"weather\")\n\n@mcp.tool()\nasync def get_alerts(state: str) -> str:\n    \"\"\"Get weather alerts for a US state.\"\"\"\n    return \"No active alerts\"\n\nif __name__ == \"__main__\":\n    mcp.run(transport=\"stdio\")",
      traps: [
        "People assume print() debugging is harmless in a stdio server, when anything on stdout that is not a protocol message corrupts the stream.",
        "People assume every failure should be a protocol error, when input and business-rule failures belong in the result with isError true.",
        "People assume MCP allows only stdio, when Streamable HTTP is standard and custom transports such as sockets are permitted.",
        "People assume the initialize handshake and session IDs are permanent, when the latest revision removed them and clients fall back for older servers.",
        "People assume a server in a directory or registry is safe to connect, when you must still review its permissions, data access and maintainers."
      ],
      sources: [
        "https://modelcontextprotocol.io/docs/develop/build-server",
        "https://modelcontextprotocol.io/specification/2026-07-28/basic/transports",
        "https://modelcontextprotocol.io/specification/2026-07-28/server/tools",
        "https://code.claude.com/docs/en/mcp"
      ]
    }
  );

  window.CC.scenarios.scX1 = { title: "Packaging team guidance in Claude Code", text: "A platform team uses Claude Code. They want to package two things as reusable guidance: a code-review checklist and report template used only when someone asks for a review, and a production deployment procedure that has real side effects. Neither needs access to an outside system." };
  window.CC.scenarios.scX2 = { title: "One ticketing integration, three applications", text: "Three internal applications (a Claude Code workflow, a desktop assistant and a custom agent) each need to create and search tickets in the same remote ticketing system, which requires OAuth. A central platform team will own and maintain the integration." };

  window.CC.questions.push(
    S("x01", "tools", "Which mechanism fits the review checklist and report template best?",
      ["A custom tool that returns the checklist text each time Claude calls it", "A Skill folder whose SKILL.md carries the checklist and report template, loaded only when a review is requested", "An MCP server, hosted centrally, that serves the checklist as a prompt and resource", "Always-on text added to every session's instructions so the checklist is never missed"], 1,
      "The gap is know-how needed only on request, which is what a Skill packages and loads on demand.", "scX1"),
    S("x02", "tools", "An agent has 40 Skills installed. Before any Skill is triggered, what from them occupies context?",
      ["The full SKILL.md body of each Skill, so requests can be matched quickly", "Only the name and description from each Skill's frontmatter", "Nothing at all, because Skills are loaded only after a user types a slash command", "The bundled scripts and reference files, preloaded so they are ready to run"], 1,
      "Progressive disclosure loads metadata first, the body when triggered, and bundled files only when read."),
    M("x03", "tools", 2, "Select 2 statements that correctly contrast Skills with MCP servers.",
      ["A Skill is a folder with SKILL.md plus optional scripts and resources that Claude reads on demand", "An MCP server is a separate process or endpoint exposing tools, resources and prompts to compatible clients", "A Skill is a network service that clients reach over stdio or Streamable HTTP", "An MCP server's tool definitions stay out of context until Claude reads a SKILL.md file", "A Skill and an MCP server cannot be used in the same agent because both define capabilities"], [0, 1],
      "Skills package instructions and files; MCP servers expose live capabilities, and the two can be combined."),
    S("x04", "tools", "What is the best way to expose the ticketing capability to all three applications?",
      ["A remote MCP server that the platform team owns and each application uses", "A custom client tool copied into each application, each with its own API handler and credentials", "A Skill that documents the ticket API and stores the OAuth credentials in SKILL.md", "The web fetch server tool, pointed at the ticketing system's URLs"], 0,
      "MCP gives reuse across clients with one owner, and a remote server can handle OAuth centrally.", "scX2"),
    S("x05", "tools", "A prototype needs current public web information with cited sources, and the team does not want to write or host handler code. Which fits best?",
      ["The web search server tool, executed by Anthropic with cited results", "A custom client tool that wraps a search API, with the handler hosted inside the application", "The bash tool, letting Claude run curl commands in the application's own shell", "A Skill describing how to search the web, since Skills run on Anthropic's servers"], 0,
      "Server tools run on Anthropic's infrastructure, so no handler is needed; check the tool page for usage charges."),
    S("x06", "tools", "A custom Skill used through the Claude API includes a script that must call an external REST endpoint at runtime. What should the team expect?",
      ["The call is blocked, because Skills cannot bundle executable code, only markdown", "It fails: the API sandbox has no outbound network access, so use a tool or MCP server", "The call works, because network access is open for custom Skills but closed for pre-built ones", "The call works once the script installs its own HTTP client package at runtime"], 1,
      "Skills on the API run in a sandbox with no network access and no runtime package installation."),
    S("x07", "tools", "A team finds a popular public Skill in an unfamiliar repository and wants it in an agent that can reach production data. What is the sound first step?",
      ["Audit every bundled file, including scripts, as you would before installing software", "Install it directly, because a Skill is only text instructions and cannot cause side effects", "Read only the description line, since that is the one part Claude acts on", "Rely on its popularity as evidence that someone has already audited it thoroughly"], 0,
      "Skills bring instructions and code, so a malicious one can misuse tools or exfiltrate data; audit before use."),
    M("x08", "tools", 2, "Select 2 situations where a custom client tool is a better fit than an MCP server.",
      ["The capability is used by one application and needs direct access to that application's in-process state", "Many unrelated MCP clients should reuse the capability without any code changes", "The team wants to avoid running and securing a separate server process", "Anthropic should execute the code on its own infrastructure", "The goal is to package a multi-step writing style guide for Claude to follow"], [0, 2],
      "A single-app, in-process capability is simplest as a client tool, with the handler shipping inside the application."),
    S("x09", "tools", "For the deployment procedure, which frontmatter setting stops Claude from starting it on its own?",
      ["disable-model-invocation: true", "user-invocable: false, which hides it from the slash menu", "context: fork, which runs it in a separate subagent", "allowed-tools: Read Grep, which pre-approves read-only tools"], 0,
      "Side-effect workflows should run only when a person invokes them; this setting removes Claude's ability to trigger them.", "scX1"),
    S("x10", "tools", "An engineer uploads a custom Skill in claude.ai settings and expects it to appear in the team's Claude API integration and for all colleagues. What is accurate?",
      ["Uploads do not sync across surfaces, and claude.ai Skills are per user", "Uploads sync to the API automatically, but only for users on the same paid plan", "The Skill is shared organisation-wide because admins centrally manage claude.ai Skills", "The Skill also appears in Claude Code, since every surface reads one shared Skills registry"], 0,
      "Each surface manages Skills separately, and claude.ai uploads are per user (version-dependent; check the docs)."),
    S("x11", "tools", "A developer registers a local stdio MCP server in a Claude application's config. Run by hand it starts, but in the app the connection fails with parse errors. The tool code uses print() for debug output. What is the cause?",
      ["Non-protocol output on stdout corrupts the JSON-RPC stream, so log to stderr", "stdio servers must wrap each message in HTTP headers, and print() output lacks them", "The client reads stderr as the message channel, so debug output belongs on stdout", "The client allows one line of output per request, and print() exceeded that limit"], 0,
      "In stdio, stdout is reserved for protocol messages; diagnostics belong on stderr."),
    S("x12", "tools", "A server author wants a reusable release-notes template that users pick from a menu or slash command, filling in a version argument. Which primitive fits?",
      ["A tool, because the model should decide on its own when to run it", "A resource, because the host application decides what context to attach", "A sampling request, because the server asks the client's model to draft the notes", "A prompt, because prompts are user-selected templates that accept arguments"], 3,
      "Prompts are user-controlled templates; tools are model-controlled and resources are application-controlled."),
    S("x13", "tools", "A tool receives a departure date in the past. How should the server report this so the model can fix its next call?",
      ["Return a JSON-RPC protocol error, because any invalid input is a malformed request", "Close the connection so the client restarts the server and Claude retries", "Return a normal result flagged isError true, with an actionable message saying the date must be in the future", "Return an empty successful result and let Claude infer the input was wrong"], 2,
      "Input validation and business errors belong in the result with isError true; protocol errors are for unknown tools and malformed requests."),
    S("x14", "tools", "A platform team builds an MCP server over an internal API that must serve many users' clients across the network, and it will be added with claude mcp add. Which transport fits?",
      ["stdio, where each client launches the server as a local subprocess", "The older HTTP+SSE transport, which the current specification recommends for remote servers", "Streamable HTTP: one endpoint accepting POSTs, protected by authentication", "A WebSocket transport, which the specification lists as a standard transport"], 2,
      "Streamable HTTP is the standard remote transport; stdio is local and HTTP+SSE is the older, replaced design."),
    M("x15", "tools", 2, "Select 2 changes introduced by the MCP revision labelled latest (2026-07-28). Revision-dependent.",
      ["Requests carry protocol version and client capabilities in per-request metadata instead of relying on an initialize handshake", "Protocol-level sessions and the Streamable HTTP GET stream endpoint were removed", "The stdio transport was removed in favour of Streamable HTTP only", "Servers now send independent JSON-RPC requests to clients over event streams", "Every server, including local stdio ones, must now require OAuth"], [0, 1],
      "The latest revision made protocol state per-request and dropped sessions; stdio remains and servers use input-required results."),
    S("x16", "tools", "A team wants clients on the same host to reach an MCP server over a Unix domain socket. What does the specification say?",
      ["Custom transports are allowed; byte-stream ones should reuse the stdio message framing", "Only stdio and Streamable HTTP are permitted, so sockets cannot be used with MCP", "A socket transport must define its own length-prefixed framing instead of newline delimiting", "Socket transports must wrap every message in an HTTP POST to remain compliant"], 0,
      "The spec permits custom transports that preserve JSON-RPC and the message patterns, and recommends stdio framing over byte streams.")
  );

  Object.assign(window.CC.why, {
    "x01": [
      "A custom tool gives Claude an action, not procedure, and its definition is sent on every request. It also leaves the checklist's maintenance buried in application code.",
      "The need is know-how used on request with no outside system. A Skill loads only its description until triggered, then the SKILL.md body, keeping cost low.",
      "Overbuilt: it needs a server to run, secure and version for text only. MCP prompts are also user-selected, so Claude would not apply the checklist on its own.",
      "Always-on instructions spend context in every session, including those that never do a review. Progressive disclosure avoids that cost."
    ],
    "x02": [
      "Bodies are not preloaded. The SKILL.md body enters context only after the Skill is triggered, so 40 full bodies would waste context.",
      "Name and description load at startup, and Claude matches requests against the description. Body and bundled files load later.",
      "Claude can trigger Skills itself by matching descriptions, so slash commands are not required. Descriptions are in context from the start.",
      "Scripts and references stay on the filesystem until read or run. Script code never enters context; only its output does."
    ],
    "x03": [
      "A Skill is a filesystem folder with a required SKILL.md. Claude reads the body and other files with bash only when needed.",
      "An MCP server is a separate process or endpoint serving tools, resources and prompts, so any compatible client can reuse it.",
      "Skills are not services and have no transport. They are files read from the environment, unlike MCP servers, which clients connect to.",
      "This mixes the two mechanisms. SKILL.md belongs to Skills; MCP tool definitions come from the server and are not gated by reading that file.",
      "They compose well. A Skill can tell Claude how to use an MCP server's tools, so nothing prevents using both in one agent."
    ],
    "x04": [
      "MCP lets one owner maintain the integration once, and every compatible client reuses it. A remote server can also handle the OAuth flow centrally.",
      "Copying the tool into three applications triples maintenance and drifts over time. It fails the reuse and single-owner requirements.",
      "A Skill carries instructions, not a connection. It cannot perform the calls itself, and credentials stored in SKILL.md would be exposed.",
      "Web fetch retrieves public pages and is not an authenticated ticketing client. It cannot create tickets or complete the OAuth flow."
    ],
    "x05": [
      "Web search is a server tool that Anthropic executes, returning cited results. No handler is needed; it may carry usage-based charges, so check the docs.",
      "This works but requires you to write, host and maintain the handler, which the team explicitly wants to avoid.",
      "Bash is a client tool: your application runs the commands, so you must host a shell, and results lack managed citations.",
      "Skills do not run on Anthropic's servers as a search service. They are instructions, and cannot fetch web data unless a tool exists."
    ],
    "x06": [
      "Skills can bundle scripts that Claude runs through bash, and only the output enters context. The restriction is about the network, not code.",
      "Per the docs, Skills on the API run with no network access and no runtime package installation, so external calls need a tool or MCP server.",
      "The restriction applies to Skills on the API generally, not by authorship. Pre-built and custom Skills share the same sandbox.",
      "Runtime package installation is also unavailable on the API, and the lack of network access would block the install anyway."
    ],
    "x07": [
      "Skills carry instructions and code. Reviewing SKILL.md, scripts and resources for odd network calls or tool use mirrors the docs' guidance.",
      "Skills can bundle scripts and direct tool use, so they can cause side effects and data exposure. Treating them as inert text is the mistake.",
      "Claude follows the whole SKILL.md body and may run bundled scripts, so a harmless description can hide harmful instructions or code.",
      "Popularity is not an audit. Even trusted Skills can change when external dependencies change, so you must review them yourself."
    ],
    "x08": [
      "A single-application capability that needs in-process state is simplest as a client tool, with the handler inside the app.",
      "That favours MCP: one server reused unchanged by many clients is exactly what the protocol standardises.",
      "A client tool ships inside your application, so there is no separate server to deploy, authenticate and monitor.",
      "That describes server tools such as web search or code execution. Custom client tools run in your application, not on Anthropic's infrastructure.",
      "Packaging instructions is a Skill's job. Neither a tool nor an MCP server is the natural container for a style guide."
    ],
    "x09": [
      "This setting prevents Claude from triggering the Skill automatically, so a deploy runs only when someone invokes it with a slash command.",
      "This does the opposite: it hides the Skill from the user and leaves Claude able to invoke it, which suits background knowledge.",
      "context fork runs the Skill in a separate subagent for isolation. It does not stop Claude from deciding to invoke it.",
      "allowed-tools pre-approves listed tools during the invoking turn. It grants permissions and does not control who may trigger the Skill."
    ],
    "x10": [
      "Per the docs, custom Skills do not sync across surfaces, and claude.ai uploads are individual to each user, not shared by default.",
      "The docs describe no automatic sync to the API, and plan type does not create one. API Skills must be uploaded separately.",
      "claude.ai does not offer centralised admin management or organisation-wide distribution of custom Skills, so each person uploads separately.",
      "Claude Code Skills are filesystem-based and separate from both claude.ai and the API. There is no single shared registry."
    ],
    "x11": [
      "Stdout carries the JSON-RPC stream, so stray prints break parsing. Write diagnostics to stderr or a log file instead.",
      "stdio has no HTTP layer. Messages are newline-delimited JSON-RPC over stdin and stdout, with no headers involved.",
      "Reversed: the client reads protocol messages from stdout. Stderr is optional logging that clients may capture or ignore.",
      "No such output limit exists in the spec. The fault is the non-protocol content on stdout, not its volume."
    ],
    "x12": [
      "Tools are model-controlled: Claude decides when to call them. This template is meant for explicit user selection.",
      "Resources are application-controlled context data attached by the host. They are not parameterised templates users invoke.",
      "Sampling lets a server request a completion from the client's model. It is not a user-facing template mechanism.",
      "Prompts are user-controlled templates, commonly surfaced as slash commands or menu entries, and accept arguments such as a version."
    ],
    "x13": [
      "Protocol errors cover unknown tools and malformed requests. A well-formed call with a bad date is a tool execution error.",
      "Dropping the connection hides the cause and loses the message. The model gets nothing it can use to correct the date.",
      "Execution errors go in the result with isError true and clear text, so clients can show them to the model to retry.",
      "An empty success tells Claude the call worked. It cannot reliably infer what went wrong, so the retry would repeat the mistake."
    ],
    "x14": [
      "stdio is for client-launched local subprocesses and typically serves one client. It does not suit many remote users.",
      "HTTP+SSE is the older transport that Streamable HTTP replaced. The current spec does not recommend it for new servers.",
      "Streamable HTTP uses one POST endpoint with JSON or event-stream replies, serving many clients, and needs authentication. Claude Code adds it with --transport http.",
      "The spec defines stdio and Streamable HTTP as standard transports. A WebSocket binding is not among them, though some clients support extras."
    ],
    "x15": [
      "Per-request metadata replaced the initialize handshake in this revision, so each request states its version and capabilities.",
      "The revision removed protocol-level sessions and the Streamable HTTP GET stream endpoint, so clients handle compatibility with older servers.",
      "stdio remains a standard transport. Only the HTTP binding changed in these ways, and the spec still defines both.",
      "Reversed: servers no longer send independent requests. Server-to-client needs travel inside input-required results returned to the client.",
      "Authorization stays optional and is defined for HTTP transports. Stdio servers should take credentials from the environment instead."
    ],
    "x16": [
      "Custom transports are permitted if they preserve JSON-RPC, message patterns and per-request metadata, and byte-stream ones should reuse stdio framing.",
      "The spec explicitly allows custom transports. Stdio and Streamable HTTP are the standard bindings, not the only permitted ones.",
      "The spec recommends reusing stdio framing over reliable byte streams such as Unix sockets or TCP, rather than inventing new framing.",
      "HTTP POST is the Streamable HTTP binding. A socket transport has no need to wrap messages in HTTP."
    ]
  });
})();
