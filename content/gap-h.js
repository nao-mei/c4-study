(function () {
  window.CC = window.CC || {};
  window.CC.lessonsNew = window.CC.lessonsNew || [];
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  window.CC.lessonsNew.push(
    {
      id: "security-4", n: 4, domain: "security", title: "Guardrails, hooks and safe deployment",
      body: "Safe deployment means no single control carries the whole risk. You layer input checks, output checks, human review and monitoring, and you enforce limits in code rather than in prompt text. In Claude Code, hooks are the deterministic layer. The exam focuses on layering, least privilege, and what hook exit codes and decisions actually do.",
      points: [
        "Layer guardrails: screen inputs, harden the system prompt, screen outputs and tool results, require human approval for sensitive actions, and monitor production. Each layer catches what the others miss, and Anthropic's guidance is to combine strategies.",
        "A lightweight model can act as a screen, using structured outputs to return a simple verdict such as a boolean. The docs say to treat a response with stop_reason refusal from the screening call as a harmful verdict.",
        "Prompt text is guidance, not a boundary. Enforce limits, authorisation and approval thresholds in backend code, so a successful jailbreak or injection can only do what credentials and tools allow (least privilege).",
        "Put human review where impact is high or output is irreversible: payments, deletions, outbound messages. Show the reviewer the concrete action and parameters. Monitor outputs for signs of successful injection and feed findings back into controls.",
        "Secure by design for personal data: minimise what reaches the model, redact before prompts and logs, restrict access by role, and consult your Data Privacy Officer before processing personal or regulated data. This is not legal advice.",
        "Claude Code hooks are user-defined handlers that run at lifecycle points. The docs describe them as deterministic control, so actions happen every time, unlike CLAUDE.md instructions, which Claude treats as context rather than enforced configuration.",
        "PreToolUse fires before a tool call and can block it. Exit code 2 blocks, and stderr becomes the reason. Alternatively, exit 0 and print JSON with hookSpecificOutput.permissionDecision of allow, deny, ask or defer.",
        "Exit code 2 is the blocking code. Any other non-zero code, such as 1, is a non-blocking error and the action proceeds. For policy hooks, use exit 2 or deny, or set onFailure to block, as documented.",
        "PreToolUse hooks run before permission-mode checks, so a deny blocks the tool even in bypassPermissions mode. Hook entries merge across settings levels, and managed hooks cannot be disabled from user or project settings."
      ],
      code: "{\n  \"hooks\": {\n    \"PreToolUse\": [{\n      \"matcher\": \"Bash\",\n      \"hooks\": [{\n        \"type\": \"command\",\n        \"if\": \"Bash(rm *)\",\n        \"command\": \"${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh\",\n        \"args\": []\n      }]\n    }]\n  }\n}",
      traps: [
        "People assume a strong system prompt or CLAUDE.md rule is a guardrail, when both are context Claude may not follow and only code, permissions or hooks enforce.",
        "People assume any non-zero exit code from a hook blocks the action, when only exit 2 (or a deny decision) blocks and exit 1 lets it proceed.",
        "People assume a PostToolUse hook can prevent damage, when the tool has already run and the hook can only report afterwards.",
        "People assume input screening alone makes a deployment safe, when injected content can arrive in tool results and outputs need checking too.",
        "People assume permission modes such as bypassPermissions switch off hooks, when a PreToolUse deny still blocks the call."
      ],
      sources: [
        "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks",
        "https://code.claude.com/docs/en/hooks",
        "https://code.claude.com/docs/en/hooks-guide",
        "https://code.claude.com/docs/en/memory"
      ]
    },
    {
      id: "prompt-4", n: 4, domain: "prompt", title: "Output handling and prompt placement",
      body: "Claude's output is a draft your system must validate, not a verified fact. Use schema-constrained outputs for shape, your own checks for meaning, and verification steps for claims. Just as important is putting each instruction where it works: system prompt, user turn, tool descriptions or CLAUDE.md. The exam tests these choices.",
      points: [
        "For format guarantees, prefer structured outputs (a JSON schema in output_config.format) or strict tool use over asking nicely for JSON. Grammar-constrained decoding guarantees valid shape in normal completions.",
        "Prefilled assistant turns are rejected from Claude 4.6 models onward (version-dependent), and prefilling is incompatible with JSON outputs. Use structured outputs, direct instructions or tool calling instead.",
        "Schema compliance has documented exceptions. A refusal (stop_reason refusal) or truncation (stop_reason max_tokens) can leave output that does not match. Enum casing can differ from your schema. Check stop_reason before parsing.",
        "A valid shape is not a true value. Validate business rules yourself: ranges, totals, referential integrity, allowed actions. Parse defensively, handle failure paths, and never pass model output unchecked into queries, shells or rendered pages.",
        "Hallucination is reduced, never eliminated. Allow Claude to say it does not know, restrict answers to supplied documents, and for long documents extract word-for-word quotes first and answer from them.",
        "Verify claims: ask for supporting quotes per claim and retract any that lack one, compare repeated runs for inconsistency, and check citations and references against a source. Validate high-stakes output before acting on it.",
        "Placement: stable role and rules go in the system prompt, per-request data in the user turn. Untrusted content goes in tool results or clearly labelled tags, and your own instructions should not sit inside tool results.",
        "Tool descriptions are the main lever for tool selection: say what the tool does, when to use it and when not, and its limits. CLAUDE.md is context, not enforcement, so hard rules belong in hooks or permissions.",
        "Refine iteratively: define success criteria, build a test set, change one thing at a time, re-run and version the prompt. Re-check on a new model, because behaviour is version-dependent."
      ],
      code: "\"output_config\": {\n  \"format\": {\n    \"type\": \"json_schema\",\n    \"schema\": {\n      \"type\": \"object\",\n      \"properties\": {\"is_harmful\": {\"type\": \"boolean\"}},\n      \"required\": [\"is_harmful\"],\n      \"additionalProperties\": false\n    }\n  }\n}",
      traps: [
        "People assume structured outputs make a response always valid, when refusals, max_tokens truncation and enum casing can still break a parser.",
        "People assume schema-valid means correct, when the schema checks shape only and values can still be wrong or invented.",
        "People assume a confident, specific citation is real, when invented references look just as confident and need checking against a source.",
        "People assume prefilling the reply still forces JSON on every model, when Claude 4.6 and later reject prefilled assistant turns.",
        "People assume instructions in a tool result or CLAUDE.md carry system-prompt authority, when tool results are treated sceptically and CLAUDE.md is context."
      ],
      sources: [
        "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
        "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations",
        "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks",
        "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools"
      ]
    }
  );
  window.CC.scenarios.scZ1 = { title: "Support assistant with refund tool", text: "A support assistant reads inbound customer emails through a tool and can issue refunds through a backend tool. A red-team test emails the assistant text claiming to be a new policy and instructing it to refund a large sum to a stated account. The team is reviewing its guardrails." };
  window.CC.scenarios.scZ2 = { title: "Invoice extraction pipeline", text: "A pipeline asks Claude to extract invoice fields into JSON, then writes the parsed result into an accounting system. Early versions used a plain request for JSON and occasionally failed to parse. The team is moving to schema-constrained output and wants to know what still needs checking." };
  window.CC.questions.push(
    S("z01", "security", "In the support assistant, which change most reliably limits the damage if the planted refund instruction is followed?",
      ["Add a stronger system prompt line telling Claude never to follow instructions found in emails or other retrieved content",
       "Move to a larger model, because the biggest models are trained to ignore all embedded instructions in documents",
       "Enforce refund limits and human approval in backend code, outside the model",
       "Strip words such as ignore and override from every incoming email before Claude reads the message"],
      2, "Backend limits and approvals hold even when the model is fooled; prompt rules and keyword filters only lower the odds.", "scZ1"),
    M("z02", "security", 2, "Which two controls belong in a layered defence for this assistant?",
      ["Rely on one carefully hardened system prompt, since adding further layers only adds latency without extra protection",
       "Screen each tool output with a small model that returns a structured verdict, treating a refusal from that call as unsafe",
       "Paste the email text into the system prompt so Claude treats it as trusted company context",
       "Stop monitoring once red-team tests pass, because passing tests prove the defences will hold in production",
       "Log tool calls with their parameters and monitor outputs for signs that an injection succeeded"],
      [1, 4], "Layers combine screening, least privilege and monitoring; the docs treat a refusal from a screening call as a harmful verdict.", "scZ1"),
    S("z03", "security", "A team's CLAUDE.md says never to run destructive shell commands, yet one slipped through. Which fix is most reliable?",
      ["Repeat the rule at the top and bottom of CLAUDE.md in capital letters so it cannot be missed",
       "Register a PreToolUse hook on the Bash tool that denies matching commands before they run",
       "Add a PostToolUse hook that reviews each command and warns Claude once it has run",
       "Ask Claude at the start of every prompt to confirm that it has read the CLAUDE.md rules"],
      1, "CLAUDE.md is context, not enforcement, while a PreToolUse hook runs before the call and can block it; PostToolUse cannot undo."),
    S("z04", "security", "A PreToolUse command hook is meant to enforce policy. On a violation its script writes a message to stderr and exits with code 1. What happens?",
      ["The tool call is blocked, because any non-zero exit code is treated as a failure that stops the action",
       "Claude Code retries the hook three times, then blocks the call if it still fails",
       "The session ends immediately, since a failing policy hook is treated as a fatal error for the whole run",
       "The tool call proceeds, because only exit code 2 blocks; exit 1 is a non-blocking error"],
      3, "Exit 2 (or a deny decision on exit 0) blocks; other non-zero codes only show a notice, unless onFailure is set to block."),
    S("z05", "security", "A team plans an internal assistant over documents that contain employee personal data. Which pre-launch step fits secure-by-design practice?",
      ["Proceed because the vendor publishes a privacy policy, and raise any concerns with Legal after launch",
       "Log complete prompts and responses indefinitely so any later incident can be fully investigated",
       "Minimise and redact personal data, scope access by role, and consult the Data Privacy Officer first",
       "Grant read access to the entire document store so users never hit permission gaps in the assistant"],
      2, "Minimisation, redaction and least privilege are engineering controls; whether and how to process personal data is for the Data Privacy Officer."),
    S("z06", "security", "Which use of human review best completes a layered guardrail design for an automated email-sending agent?",
      ["Review every low-risk output by hand, but let irreversible actions run unchecked to save the reviewers time",
       "Review only a post-launch sample, since the model's own confidence guarantees that outputs are correct",
       "Use human review alone, so that input screening and output screening can be removed from the pipeline",
       "Send irreversible or high-impact actions to a person for approval before they take effect"],
      3, "Human approval is most valuable before consequential, irreversible actions, in addition to automated layers rather than instead of them."),
    S("z07", "prompt", "The pipeline occasionally fails to parse because Claude prefaces the JSON with a sentence. Which fix best fits current models?",
      ["Prefill the assistant turn with an opening brace, which forces JSON on every current Claude model",
       "Use structured outputs, with a JSON schema in output_config.format, so the response is constrained to the schema",
       "Add a regular expression that strips everything before the first brace and trust the rest",
       "Set temperature to 0 so the model never adds any introductory text to its reply"],
      1, "Structured outputs constrain the response to a schema; prefill is rejected from Claude 4.6 onward and low temperature does not guarantee format.", "scZ2"),
    S("z08", "prompt", "A schema-constrained extraction call returns stop_reason max_tokens. How should the pipeline treat the result?",
      ["As valid, because schema compliance is guaranteed whatever the stop reason turns out to be",
       "As repairable, by closing any open brackets and accepting the patched JSON as the final result",
       "As possibly incomplete: do not trust it, and retry with a higher max_tokens",
       "As a signal to turn on citations for the same request so that the truncation is reported in the output"],
      2, "Truncation can leave output that does not match the schema. Citations also return a 400 error when combined with output_config.format.", "scZ2"),
    M("z09", "prompt", 2, "After moving to structured outputs, which two checks does the pipeline still need?",
      ["A second JSON library to re-parse every reply, because grammar-constrained output can contain syntax errors",
       "Asking Claude to confirm its own JSON is valid, because the API never checks output against the schema",
       "Business validation of values, such as totals matching line items, because a schema guarantees shape rather than truth",
       "Case-insensitive comparison of enum values, because capitalisation of enum strings is not guaranteed"],
      [2, 3], "Schemas guarantee valid structure in normal completions, not correct values; the docs also warn that enum casing can differ.", "scZ2"),
    S("z10", "prompt", "A research-summary tool shows a precise paper title and DOI that Claude produced without any supplied source. What is the soundest handling?",
      ["Check the reference against an authoritative source and ground answers in supplied documents",
       "Accept it, because such precise details are only produced when the model is certain of them",
       "Ask Claude in the same chat whether it is really sure, and accept the citation if it says yes",
       "Add a line to the system prompt saying never to hallucinate, which removes the risk entirely"],
      0, "Confident, specific references can be invented; verify externally and ground in provided text, since prompts reduce but never eliminate hallucination."),
    S("z11", "prompt", "A summariser inserts customer-pasted text into its prompt. Which placement is most robust?",
      ["Append the pasted text to the end of the system prompt so it carries the same authority as the rules",
       "Put the pasted text first with no labels, since Claude can always infer which part is the instruction",
       "Join the instructions and the pasted text on a single line, which keeps the prompt short and unambiguous",
       "Instructions in the system prompt; pasted text in the user turn inside labelled tags, marked as data"],
      3, "Stable rules in the system prompt plus clearly labelled data helps Claude separate instruction from content; it lowers, not removes, injection risk."),
    S("z12", "prompt", "Claude keeps calling a general search tool for refund requests that should use a dedicated refund tool. Where is the most effective fix?",
      ["Shorten every description to a few words so the model is not distracted by detail",
       "Expand each tool description to say what the tool does, when to use it and when not to",
       "Keep the selection rules only in a comment in your application code, outside the request",
       "Rename the parameters to shorter names and leave the existing descriptions unchanged"],
      1, "The docs call detailed tool descriptions the most important factor in tool performance, including when to use a tool and its limitations."),
    M("z13", "prompt", 2, "Which two statements about placing instructions for Claude Code are accurate?",
      ["Anything written in CLAUDE.md is guaranteed to be followed, so it can replace permission rules and hooks",
       "CLAUDE.md is loaded as context rather than enforced configuration, and concise, specific instructions are followed more consistently",
       "Instructions placed inside tool results carry the same authority as system prompt text and are always followed",
       "A rule that must never be broken should be enforced by a PreToolUse hook or permission rule, not only by prompt text"],
      [1, 3], "Docs state CLAUDE.md is context, not enforcement, and point to a PreToolUse hook to block actions regardless of what Claude decides."),
    S("z14", "prompt", "A classification prompt scored well on a fixed test set. The team changes five things at once and the score drops. What next?",
      ["Keep all five changes and add more rules until the score recovers to its earlier level",
       "Judge the new prompt on a few hand-picked examples that look better than before",
       "Revert, then change one thing at a time and re-run the same test set, versioning each prompt",
       "Switch to a larger model before working out why the prompt itself got worse"],
      2, "Controlled, one-change iterations against a fixed eval show which edit helped or hurt; hand-picked examples and model swaps hide the cause.")
  );
  Object.assign(window.CC.why, {
    "z01": [
      "A stronger prompt rule lowers the odds but is not a security boundary; a successful injection would still reach a refund tool with no hard limit.",
      "No model is immune to prompt injection; the docs advise least privilege and layered controls regardless of model size.",
      "Limits and approval enforced in backend code cap the damage whatever Claude decides, which is the least-privilege principle behind the docs' advice.",
      "Keyword stripping misses paraphrases and encodings, and attackers simply reword; it is a weak, bypassable filter, not a limit on damage."
    ],
    "z02": [
      "Layering is the documented recommendation; one prompt is not a boundary and a single failure then leaves nothing else to catch the attack.",
      "Screening tool output with a small model returning a structured verdict is a documented layer, and a refusal from the screen counts as a harmful verdict.",
      "Untrusted email belongs in tool results with its source labelled; placing it in the system prompt gives attacker text the highest authority.",
      "Red-team results are a snapshot; the docs advise continuous monitoring of outputs, because new attack variants appear after launch.",
      "Audit logging and monitoring for signs of successful injection are part of the documented continuous-monitoring layer and feed later improvements."
    ],
    "z03": [
      "CLAUDE.md is context, not enforced configuration, so emphasis and repetition may improve adherence but still cannot guarantee the rule is followed.",
      "A PreToolUse hook runs before the call and can deny it deterministically, which is the docs' recommended way to block actions regardless of Claude's decisions.",
      "PostToolUse fires after the tool has executed, so it cannot undo a destructive command; it can only report afterwards.",
      "Asking Claude to confirm it read the rules is still prompt guidance; nothing stops a later destructive command from running."
    ],
    "z04": [
      "A common Unix assumption, but the docs say exit 1 is a non-blocking error; for enforcement use exit 2 or a deny decision.",
      "The docs describe no automatic retry of a failed hook; the notice appears and the action goes ahead.",
      "A non-blocking hook error shows a notice in the transcript and does not end the session.",
      "Only exit 2 blocks; any other non-zero code is a non-blocking error shown as a notice, so the call proceeds unless onFailure is set to block."
    ],
    "z05": [
      "A vendor privacy policy does not replace your own classification and approvals; compliance questions come before launch, not after.",
      "Indefinite full logging creates another unprotected copy of personal data; log metadata, set retention limits and control access.",
      "Minimisation, redaction and role-based access are secure-by-design controls, and the Data Privacy Officer decides whether and how personal data may be processed.",
      "Whole-store access breaks least privilege; the assistant should reach only the documents each user is entitled to see."
    ],
    "z06": [
      "This inverts risk: low-risk output wastes reviewer time while irreversible actions, which most need a check, run unreviewed.",
      "Model confidence does not guarantee correctness, and post-hoc sampling cannot stop a harmful action that has already happened.",
      "Guardrails are layered; removing automated screening leaves reviewers overloaded and creates a single point of failure.",
      "Human approval before irreversible or high-impact actions is a standard layer; it catches errors that automated screening misses."
    ],
    "z07": [
      "Prefilled assistant turns are rejected from Claude 4.6 models onward, and prefill is incompatible with JSON outputs.",
      "Structured outputs constrain decoding to your JSON schema, so the reply cannot contain preamble; this is the documented replacement for prefill and prompt-only JSON.",
      "A regular expression is brittle defensive patching: it cannot repair malformed or partial JSON and fixes symptoms rather than guaranteeing format.",
      "Temperature affects randomness, not format; a model can still add introductory text at temperature 0."
    ],
    "z08": [
      "Compliance is guaranteed only for normal completions; refusals and max_tokens stops are documented exceptions.",
      "Patching truncated JSON risks silently dropping or inventing fields, so the data written downstream may be wrong.",
      "The docs say max_tokens truncation may leave output incomplete and not matching the schema; retry with a higher max_tokens.",
      "Citations are incompatible with output_config.format and return a 400 error; they do not report truncation."
    ],
    "z09": [
      "Grammar-constrained output is guaranteed to follow the schema in normal completions; syntax errors are not the documented exception.",
      "The API does enforce the schema in normal completions; self-confirmation by Claude is not a validation step and the premise is false.",
      "A schema checks structure, not truth: totals, ranges and cross-field rules still need your own validation before data is written.",
      "The docs warn enum values can differ in capitalisation without an error, so compare case-insensitively and avoid enums differing only in case."
    ],
    "z10": [
      "External verification plus grounding in supplied documents and quotes is the documented approach, since hallucination is reduced but not eliminated.",
      "Hallucinated references are often specific and confident; precision is not evidence the model is certain or the source exists.",
      "Asking the same model whether it is sure is not independent verification; it can confidently repeat an invented citation.",
      "Instructions can reduce hallucination but never eliminate it; the docs say to validate critical information regardless."
    ],
    "z11": [
      "Putting user-supplied text in the system prompt gives attacker-controlled content the highest authority and removes the data boundary.",
      "Unlabelled text blurs instruction and data, so embedded commands in the pasted text may be mistaken for the task.",
      "Merging everything into one line removes the structure that separates instruction from content; brevity is not a boundary.",
      "Stable rules in the system prompt and untrusted text in labelled tags in the user turn, marked as data, gives Claude clear boundaries between instruction and content."
    ],
    "z12": [
      "Terse descriptions remove exactly the information Claude uses to choose between tools, making confusion more likely.",
      "The docs call detailed descriptions, covering purpose, when to use and limits, the single most important factor in tool performance.",
      "Guidance kept only in application code never reaches the model, so it cannot influence which tool Claude selects.",
      "Parameter names do not tell Claude when to use a tool; the unchanged descriptions still leave the selection ambiguity."
    ],
    "z13": [
      "CLAUDE.md is not guaranteed to be followed; the docs direct you to hooks for blocking actions regardless of Claude's choices.",
      "The memory docs state CLAUDE.md is context, not enforced configuration, and that specific, concise instructions are followed more consistently.",
      "Tool results are treated as untrusted data and instructions inside them may be ignored or flagged, not obeyed as system instructions.",
      "The docs point to a PreToolUse hook to block an action regardless of what Claude decides; hard rules belong in deterministic controls."
    ],
    "z14": [
      "Stacking more rules on unknown changes compounds the confusion and can increase prompt length and conflicts without identifying the cause.",
      "A few hand-picked examples invite confirmation bias; a fixed, varied test set shows whether quality actually improved.",
      "Reverting and changing one variable at a time against a fixed eval isolates which edit helped or hurt, and versioning records it.",
      "Changing the model first confounds the problem further; diagnose the prompt change before introducing another variable."
    ]
  });
})();
