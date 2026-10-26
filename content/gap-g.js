(function () {
  window.CC = window.CC || {};
  window.CC.lessonsNew = window.CC.lessonsNew || [];
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  window.CC.lessonsNew.push(
    {
      "id": "code-3",
      "n": 3,
      "domain": "code",
      "title": "Claude Code in practice: sessions, rules, agents and modes",
      "body": "Beyond the basics, the exam rewards knowing how Claude Code state behaves over time. Sessions can be resumed, branched, cleared or compacted, and each choice changes what the model still sees. Rules, agent memory and auto memory decide what persists, while auto mode and print output modes decide how unattended runs behave.",
      "points": [
        "claude --continue reopens the most recent session in the current directory. claude --resume opens a picker, or takes a name or session ID. /resume switches sessions from inside a running one. Name sessions with -n at startup or /rename.",
        "A resumed session restores history, model, agent and, for terminal resumes without -p, the permission mode. /branch or --fork-session copies the conversation and leaves the original intact. Resuming one session in two terminals without forking interleaves both into one transcript.",
        "/clear starts an empty context but saves the previous session, so /resume can bring it back. /compact [instructions] replaces history with a summary, optionally focused. /context shows what consumes space. Clear for unrelated work, compact to keep the thread.",
        "After compaction, project-root CLAUDE.md, unscoped rules and auto memory are re-injected from disk. Rules with paths frontmatter and nested CLAUDE.md files reload only on demand, and instructions given only in conversation can be summarised away. Put must-keep rules in CLAUDE.md.",
        "Rules are markdown files in .claude/rules/, one topic per file. A paths frontmatter field (glob list) scopes a rule to matching files, loading when Claude reads, writes or edits one. Without paths it loads every session.",
        "A subagent gets persistent memory from the memory frontmatter field: user (~/.claude/agent-memory/), project (.claude/agent-memory/, git-shareable, recommended) or local (.claude/agent-memory-local/). Off if auto memory is off. Main-session auto memory loads the first 200 lines or 25KB of MEMORY.md.",
        "/init generates a starting CLAUDE.md from your codebase; if one exists it suggests improvements rather than overwriting. Setting CLAUDE_CODE_NEW_INIT=1 switches /init to an interactive multi-phase flow covering CLAUDE.md files, skills and hooks, ending with a reviewable proposal. Behaviour is version-dependent.",
        "In auto mode a classifier model reviews actions instead of you. After 3 blocks in a row or 20 in total it resumes prompting. A claude -p run has no prompt, so the action is skipped. Availability varies by version.",
        "claude -p runs non-interactively; --output-format takes text (default), json or stream-json. For token-by-token output use stream-json with --verbose and --include-partial-messages; the last line is a result message. --bare skips hooks, auto memory and CLAUDE.md discovery, and is recommended for scripts."
      ],
      "code": "claude -n auth-refactor            # name a session at startup\nclaude --resume auth-refactor      # resume it by name\nclaude --continue --fork-session   # branch instead of reusing\n\n# Streaming output for scripts\nclaude -p \"Explain recursion\" --output-format stream-json --verbose --include-partial-messages\n\n# .claude/rules/api.md (path-scoped rule)\n---\npaths:\n  - \"src/api/**/*.ts\"\n---",
      "traps": [
        "People assume /clear destroys the conversation, when the previous session is saved and can be reopened with /resume.",
        "People assume compaction keeps every instruction equally, when only root CLAUDE.md, unscoped rules and auto memory are re-injected and path-scoped rules wait for a matching file.",
        "People assume a subagent inherits the main session's auto memory, when its memory field creates a separate directory and the main memory is not loaded into it.",
        "People assume auto mode stops a scripted run after repeated blocks, when in a claude -p run the blocked action is skipped and Claude keeps working.",
        "People assume /init overwrites an existing CLAUDE.md, when it proposes improvements, and the interactive multi-phase flow needs CLAUDE_CODE_NEW_INIT=1."
      ],
      "sources": [
        "https://code.claude.com/docs/en/sessions",
        "https://code.claude.com/docs/en/memory",
        "https://code.claude.com/docs/en/sub-agents",
        "https://code.claude.com/docs/en/permission-modes"
      ]
    },
    {
      "id": "eval-3",
      "n": 3,
      "domain": "eval",
      "title": "Error handling and trace analysis",
      "body": "Good error handling starts with classification: is this a request problem, a transient platform problem, a truncated response, a tool failure or bad model output? Each class has a different recovery. Trace analysis then locates the first bad step and tells you whether the integration layer or the model is the origin.",
      "points": [
        "Classify by status first. 4xx means the request, credentials or limits (400, 401, 402, 403, 404, 409, 413, 429). 5xx means the platform (500, 504, 529). Stop reasons arrive on successful 200 responses, so they are a separate signal.",
        "Retry only transient failures (429 with retry-after, 500, 504, 529, connection errors) using exponential backoff and honouring retry-after. The official SDK retries twice by default. Do not retry 400, 401, 403, 404 or 413; the same request fails again.",
        "Not every 429 is retryable. A tier spend-cap 429 has no retry-after header and fails until access resumes. Recognise it, alert and stop. Sudden traffic spikes can also trigger acceleration limits, so ramp traffic up gradually.",
        "Streaming can fail after a 200 status: the stream may carry an error event such as overloaded_error, the counterpart of 529. Handle error events and unknown event types, and decide what to do with partial output.",
        "Read stop_reason on every success. max_tokens means truncation (an incomplete tool_use block needs a retry with higher max_tokens). model_context_window_exceeded is also truncated. refusal is a 200 with stop_details, retried on a fallback model. pause_turn means send the content back.",
        "Tool failures go back to the model as a tool_result with is_error true and an instructive message saying what failed and what to try. Never swallow them as empty success. Text placed before tool_result blocks causes a 400.",
        "Validation failures need a bounded repair loop. Validate output against your schema, and on failure make one or two repair calls that include the specific error. Then fall back or route to a human. Unbounded retries burn cost.",
        "Trace analysis: log a trace ID per run and, per step, the request-id, model, parameters, messages, tool results, stop_reason and usage. Walk forward to find the first step where state went wrong. Errors usually start upstream of the visible symptom.",
        "To isolate the origin, replay the logged request alone. If the input was already wrong (swallowed tool error, truncated context), the integration layer is at fault. If correct input still gives bad output, suspect the prompt or model."
      ],
      "code": "{\n  \"type\": \"tool_result\",\n  \"tool_use_id\": \"toolu_01\",\n  \"content\": \"Rate limit exceeded. Retry after 60 seconds.\",\n  \"is_error\": true\n}\n\n# pseudocode recovery policy\n# 429 (with retry-after), 500, 504, 529 -> backoff, retry\n# 400, 401, 403, 404, 413              -> fail fast, fix cause",
      "traps": [
        "People assume every error deserves a retry, when 4xx request, credential and permission errors fail identically until the cause is fixed.",
        "People assume every 429 carries a retry-after header and clears with backoff, when a spend-cap 429 has none and persists until access resumes.",
        "People assume HTTP 200 means everything worked, when a stream can still end in an error event and stop_reason may signal truncation or refusal.",
        "People assume a wrong final answer means the model is at fault, when a swallowed tool error or truncated input earlier in the trace is often the real origin.",
        "People assume a repair loop should run until the output parses, when it needs an attempt cap and a fallback path, since the model can repeat the same mistake."
      ],
      "sources": [
        "https://platform.claude.com/docs/en/api/errors",
        "https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons",
        "https://platform.claude.com/docs/en/build-with-claude/streaming",
        "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls"
      ]
    }
  );
  window.CC.scenarios.scY1 = { "title": "Scheduled CI triage jobs", "text": "A team runs scheduled claude -p jobs in CI to triage a repository. The jobs run in auto mode and no --permission-prompt-tool is configured. A progress dashboard consumes the output of each run." };
  window.CC.scenarios.scY2 = { "title": "Support agent gives a wrong answer", "text": "A support agent told a customer that order 4471 had shipped, but it never did. The trace shows the model calling get_order with a valid ID. The tool wrapper caught a database timeout and returned an empty JSON object as a normal tool_result. Every API call returned HTTP 200, with stop_reason tool_use and then end_turn." };
  window.CC.scenarios.scY3 = { "title": "Invoice extraction parse failures", "text": "An extraction service asks Claude to reply with JSON and parses it in application code. About 2% of responses fail to parse. The traces for those cases show HTTP 200, stop_reason end_turn, and a short sentence of prose before the JSON." };
  window.CC.questions.push(
    S("y01", "code", "You ran /clear by mistake in the middle of a long refactor, in the same terminal. How do you get the earlier conversation back?",
      ["Run /compact, which rebuilds the cleared history from a stored summary of the session",
       "Exit and run claude --continue, which reopens the session that existed before the clear",
       "Open /resume and choose the earlier session, which /clear saved first",
       "Nothing can be done, because /clear deletes the transcript and the history cannot be reopened"],
      2, "/clear starts an empty context but saves the previous session, so it appears in the /resume picker."),
    S("y02", "code", "A rule file in .claude/rules has paths frontmatter for src/api/**. After /compact, Claude stops applying it, although conventions in the root CLAUDE.md still hold. What explains this and how do you make the rule persist?",
      ["Path-scoped rules load on demand into history, so compaction summarizes them; remove paths or move the rule into the root CLAUDE.md file",
       "Compaction removes every instruction file from context, so the root CLAUDE.md only appeared to work and will fail on the next turn too",
       "Rules with a paths field are dropped once the summary passes a token budget, so you must shorten the rule text until it fits that budget",
       "Path-scoped rules load only in headless runs, so the interactive session never applied this rule before compaction"],
      0, "Root CLAUDE.md and unscoped rules are re-injected from disk after compaction, while path-scoped rules reload only when a matching file is touched again."),
    S("y03", "code", "You want a code-reviewer subagent to build up knowledge of this repository over time, and teammates should be able to share those notes through version control. Which configuration fits?",
      ["memory: user in its frontmatter, which stores notes under ~/.claude/agent-memory across all projects",
       "memory: project in its frontmatter, which stores notes under .claude/agent-memory in the repo",
       "memory: local in its frontmatter, which keeps notes under .claude/agent-memory-local out of version control",
       "No setting needed, because a subagent reads the main session's MEMORY.md and writes its notes back into it"],
      1, "The project scope stores subagent notes inside the repository where they can be committed, and the docs recommend it as the default."),
    M("y04", "code", 2, "Select the TWO statements about /init that are accurate.",
      ["In a repository that already has a CLAUDE.md, /init suggests improvements instead of overwriting the file",
       "With CLAUDE_CODE_NEW_INIT set to 1, /init runs a multi-phase flow that asks which artifacts to set up, such as CLAUDE.md, skills and hooks",
       "/init writes a settings.json permission allowlist and nothing else, leaving all written instructions to you",
       "/init must be re-run at the start of each session, because the generated file is held only in that session",
       "/init always replaces an existing CLAUDE.md with a fresh scan, so the file never drifts from the codebase"],
      [0, 1], "/init improves rather than overwrites an existing file, and the CLAUDE_CODE_NEW_INIT variable switches it to the interactive multi-phase flow."),
    S("y05", "code", "One nightly run reaches the repeated-block threshold: the auto mode classifier blocks three actions in a row. What happens in this run?",
      ["The blocked action is skipped and Claude keeps working, because a -p run has no prompt to fall back to",
       "Claude Code ends the run at once with a non-zero exit status so the scheduler can raise an alert",
       "Claude Code waits on standard input for someone to approve the blocked action, so the job hangs until it times out",
       "Claude Code silently switches the run to bypassPermissions so the remaining steps can still finish"],
      0, "In interactive sessions auto mode pauses and prompts again, but a non-interactive run without a prompt tool simply does not run the action.", "scY1"),
    S("y06", "code", "The dashboard needs text as it is generated, plus cost and session metadata at the end of each run. Which invocation fits best?",
      ["claude -p --output-format stream-json --verbose --include-partial-messages; the last line is a final result message",
       "claude -p with --output-format json, which emits one event per line as the model writes and ends with cost totals",
       "claude -p with --output-format text, then poll the session transcript file on disk for new tokens as they appear",
       "claude -p --resume with the session ID, called repeatedly, since each resumed call returns the next chunk of the answer"],
      0, "stream-json with --verbose and --include-partial-messages streams events, and its final result message carries the final text, cost and session metadata.", "scY1"),
    S("y07", "eval", "A batch job starts receiving HTTP 429 rate_limit_error. Every SDK retry fails, the responses carry no retry-after header, and your request rate is far below the documented limits. What is the likely cause and best response?",
      ["A spend cap was reached; retries fail until access resumes, so stop retrying and alert",
       "An acceleration limit from a sharp traffic ramp; keep the same pace and let exponential backoff absorb it",
       "Transient platform overload disguised as a 429; widen the retry loop and add jitter until it clears",
       "A request exceeding the size limit; shrink the prompts under the cap and the 429 will clear on the next call"],
      0, "A tier spend-cap 429 has no retry-after header and keeps failing until access resumes, so backoff cannot help and the right action is to stop and escalate."),
    M("y08", "eval", 2, "Your streaming integration sometimes receives HTTP 200 and then an overloaded_error event partway through the stream. Select the TWO sound practices.",
      ["Watch the stream for error events, because a failure can arrive after the 200 status was already returned",
       "Handle an overloaded_error event like a 529: retry with backoff and decide explicitly what to do with partial output",
       "Rely on the HTTP status alone, since a 200 on a streaming response guarantees the full message will arrive",
       "Treat any mid-stream error as invalid_request_error and fix the request body before sending it again",
       "Switch long requests to non-streaming calls, since streaming is the documented cause of overload errors"],
      [0, 1], "Errors can follow a 200 in the event stream, and overloaded_error is the streaming counterpart of 529, which is transient and suits backoff."),
    S("y09", "eval", "After moving to a newer Claude model, a request whose last turn is a partial assistant message fails with HTTP 400 invalid_request_error about assistant message prefill. Which recovery fits?",
      ["Retry with exponential backoff and jitter, since 4xx responses from the API are usually transient and clear on their own",
       "Fail fast and change the request: end with a user turn, and steer format with structured outputs or system instructions",
       "Retry with a higher max_tokens, since prefill is rejected when the continuation budget is too small for the response",
       "Switch the call to streaming, which accepts prefilled assistant turns on every model regardless of version"],
      1, "A 400 means the request itself is invalid for that model, so retrying the same body fails again; the fix is to change the request."),
    S("y10", "eval", "Where did the failure in this trace originate, and what is the first fix?",
      ["The model invented a status, so add a never-guess line to the prompt and treat the integration layer as correct",
       "The integration layer: the wrapper reported a timeout as success, so return is_error true with a message saying what failed and what to try",
       "The API: the 200 responses reveal a transient outage, so add retries around the messages call and monitor status",
       "The stop reason: end_turn on the last step shows the answer was verified, so no step in the trace needs changes"],
      1, "The model reasoned over an empty result that looked like success; surfacing the failure with is_error lets it retry or report honestly.", "scY2"),
    S("y11", "eval", "What is the best recovery design for these failures?",
      ["Retry the identical request in a loop until one response parses, with no limit on the number of attempts",
       "Validate each output; on failure make one bounded repair call with the parse error, then route to review",
       "Raise max_tokens, because parse failures show the JSON was being cut off before it could finish",
       "Catch the parse exception and return an empty object so the downstream pipeline keeps flowing without errors"],
      1, "The traces show complete responses with extra prose, not truncation, so a bounded repair attempt with the specific error followed by a fallback is the sound path.", "scY3")
  );
  Object.assign(window.CC.why, {
    "y01": [
      "/compact summarizes the current context; it cannot rebuild a conversation that was already cleared, and it would not bring back the saved earlier session.",
      "--continue opens the most recent session in the directory, which after a clear is the new empty one, so it is not a dependable route back.",
      "Correct: /clear saves the previous session, and the /resume picker lists it so you can switch back to it.",
      "Clearing does not delete the earlier transcript; it is stored locally and can be reopened until normal retention cleanup removes it."
    ],
    "y02": [
      "Correct: path-scoped rules and nested CLAUDE.md files enter message history on demand, so compaction summarizes them. Dropping paths or using root CLAUDE.md makes them persist.",
      "Root CLAUDE.md is re-read from disk and re-injected after compaction, so it does not fail; the premise contradicts the observed behaviour.",
      "No token-budget rule drops rules that have a paths field; the cause is on-demand loading into history, not summary size.",
      "Path-scoped rules apply in interactive sessions too, whenever Claude reads, writes or edits a matching file; they are not limited to headless runs."
    ],
    "y03": [
      "The user scope stores notes in your home directory across all projects, so teammates cannot share them through the repository.",
      "Correct: project scope keeps the notes in .claude/agent-memory inside the repo, so they can be committed and shared. It is the recommended default.",
      "The local scope is project-specific but deliberately not meant for version control, so teammates would not receive the notes.",
      "The main session's auto memory is not loaded into subagents; a subagent's own memory is a separate directory enabled by the memory field."
    ],
    "y04": [
      "Correct: with an existing CLAUDE.md, /init proposes improvements rather than overwriting it.",
      "Correct: setting CLAUDE_CODE_NEW_INIT=1 turns /init into an interactive flow that asks which artifacts to create and shows a reviewable proposal first.",
      "/init generates a CLAUDE.md with build commands, tests and conventions; it is not a permissions allowlist generator.",
      "The generated CLAUDE.md is a file on disk that loads every session, so there is no need to re-run /init each time.",
      "/init does not blindly replace an existing file, because that could discard hand-written instructions."
    ],
    "y05": [
      "Correct: with no prompt to fall back to, the action does not run and Claude keeps working. The run is not stopped.",
      "The docs say Claude Code does not stop the run at the threshold, so a non-zero exit is not triggered by repeated blocks.",
      "A non-interactive run has no prompt to wait on, and the behaviour described is not a stdin approval step.",
      "Auto mode never escalates itself to bypassPermissions; blocks stand and the action is skipped."
    ],
    "y06": [
      "Correct: stream-json with --verbose and --include-partial-messages emits events as tokens arrive, and the final line is a result message with text, cost and session metadata.",
      "The json format returns a single structured result at the end of the run, not events line by line while generating.",
      "The text format prints the final answer, and polling transcript files is brittle and not a documented streaming interface.",
      "Resuming a session sends a new prompt into the conversation; it does not return the next chunk of an earlier answer."
    ],
    "y07": [
      "Correct: a tier spend-cap 429 lacks retry-after and persists until access resumes. Retrying, including SDK retries, keeps failing, so stop, alert and raise the limit.",
      "Acceleration limits do follow sharp ramps, but the cure is gradual ramping, not holding the pace; this does not explain failures with no retry-after that persist across every retry.",
      "Overload is reported as 529, not a 429, and widening retries would only repeat failing calls against a cap.",
      "Oversized requests return 413 request_too_large, not 429, and resizing prompts does not address a rate or spend limit."
    ],
    "y08": [
      "Correct: once the 200 is sent, later failures can only appear as error events in the stream, so the consumer must watch for them.",
      "Correct: overloaded_error is the streaming form of 529, which is transient, so retry with backoff and handle partial output deliberately.",
      "A 200 only means the stream started; it does not guarantee completion, and the docs describe errors after a 200.",
      "overloaded_error signals platform load, not a malformed request, so editing the request body does not help.",
      "The docs recommend streaming for long requests; it is not the cause of overload, and non-streaming adds idle-connection risk."
    ],
    "y09": [
      "A 400 invalid_request_error is a client problem; the identical request fails every time, so backoff only wastes calls.",
      "Correct: the 400 says the model rejects prefill, so retrying cannot succeed. End with a user message and use structured outputs or system instructions.",
      "max_tokens is unrelated to prefill support; raising it leaves the rejected final assistant turn in place and the 400 persists.",
      "Streaming does not change model support; the models that reject prefill reject it with or without streaming."
    ],
    "y10": [
      "The model only saw an empty result presented as success; a prompt tweak leaves the swallowed error in place and the same wrong answer can recur.",
      "Correct: the wrapper turned a timeout into a normal result. Returning is_error true with an actionable message lets the model retry or report honestly.",
      "Every API call returned 200 and the model replied; nothing shows a platform fault, so wrapping the messages call in retries targets the wrong layer.",
      "end_turn only means the model finished generating; it says nothing about whether the answer was correct or its inputs were sound."
    ],
    "y11": [
      "Unbounded retries burn cost and latency, and the model can repeat the same prose-plus-JSON pattern without ever converging.",
      "Correct: validate, give the model the specific parse error once or twice, then fall back or send to review so failures stay visible.",
      "The stop reason is end_turn, not max_tokens, so the output was not truncated; a larger limit would not remove the leading prose.",
      "Returning an empty object hides the failure and pushes bad data downstream, which breaks the fail-visible principle."
    ]
  });
})();
