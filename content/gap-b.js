(function () {
  window.CC = window.CC || {};
  window.CC.lessonsNew = window.CC.lessonsNew || [];
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  window.CC.lessonsNew.push(
    {
      id: "apps-10", n: 10, domain: "apps",
      title: "Software engineering foundations for Claude applications",
      body: "Claude integrations are ordinary software with a probabilistic component, so classic engineering discipline matters more, not less. The exam checks that you can apply REST, JSON, async, version control, review and refactoring practice to Claude work, and that you treat model output and agent-written code as untrusted until verified.",
      points: [
        "Claude is called over HTTP with JSON bodies and typed errors. Retry only transient failures (429, 5xx, 529) with backoff; fix 400-class errors in code. Official SDKs already retry twice by default, so avoid stacking blind retries.",
        "Some 429s are spend-cap errors: no retry-after header, and they keep failing until access resumes. Treat a missing retry-after as a cue to alert, not loop. Sharp traffic jumps can also trigger acceleration limits, so ramp up gradually.",
        "In async code, bound concurrency with a semaphore or worker pool instead of firing every call at once. Limits cover requests, input tokens and output tokens per minute under a token bucket, so short bursts can trip them.",
        "Make integration idempotent in your own system: a retried Messages call may generate twice, and no deduplication key is documented. Use a stable job ID and dedupe the downstream side effect (write, email, ticket). This is general practice.",
        "Batch results can return in any order, so give each request a unique custom_id and join on it, never on array position. Streaming can also fail after a 200 status, so handle mid-stream error events.",
        "Treat model JSON as untrusted input. Structured outputs constrain decoding, but max_tokens can truncate and refusals may not match the schema, so check stop_reason first. Schemas check shape only; enforce business rules in code.",
        "Keep prompts, tool schemas, model IDs and eval sets in version control and change them by pull request. Review prompt diffs like code and run evals in CI, because a one-word prompt edit can change behaviour with no compile error.",
        "Review agent-written diffs like a junior colleague's work: read the diff, run the checks yourself, and look for weakened tests, hard-coded expected values and unrelated edits. A fresh Claude session makes a useful second reviewer.",
        "For refactoring, pin behaviour with tests first (add characterization tests if missing), then let Claude Code restructure while the suite stays green. Prefer small, revertible steps over big-bang rewrites; for large migrations, trial a few files first."
      ],
      code: "sem = asyncio.Semaphore(8)            # bounded concurrency\nasync def run(job):\n  if await done(job.id): return        # idempotent: dedupe by job id\n  async with sem:\n    r = await client.messages.create(**job.params)  # SDK retries transient errors\n  if r.stop_reason in (\"max_tokens\", \"refusal\"):\n    return park(job, r)                # do not parse blindly\n  data = json.loads(r.content[0].text)\n  check_rules(data)                    # business rules beyond the schema\n  await save_once(job.id, data)",
      traps: [
        "People assume retrying every failed request is safe, but 400-class errors and spend-cap 429s will not succeed on retry, and retried calls can duplicate downstream side effects unless you dedupe them.",
        "People assume structured outputs mean you can skip validation, but truncation, refusals and business rules still require checks in your own code.",
        "People assume green tests prove an agent's diff is correct, but the agent may have edited, skipped or weakened the tests, so the diff itself needs review.",
        "People assume a big-bang refactor is faster, but without incremental steps and tests a failure cannot be isolated or cheaply reverted.",
        "People assume batch or concurrent results arrive in submission order, but order is not guaranteed, so join on a unique id."
      ],
      sources: [
        "https://platform.claude.com/docs/en/api/errors",
        "https://platform.claude.com/docs/en/api/rate-limits",
        "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
        "https://code.claude.com/docs/en/best-practices"
      ]
    }
  );
  window.CC.scenarios.scW1 = { title: "Prompt repository and agent-written changes", text: "A team keeps its prompts, tool schemas and an eval set in a Git repository. Engineers use Claude Code to propose changes, and every change goes through a pull request. The team wants to catch regressions in behaviour as well as in code." };
  window.CC.scenarios.scW2 = { title: "Bulk enrichment workers", text: "A service enriches support tickets by calling the Messages API from many concurrent async workers. Each ticket result is written to a CRM through a side-effecting call. Workers sometimes crash and are restarted, and the job queue redelivers unfinished work." };
  window.CC.questions.push(
    S("w01", "apps", "A nightly job submits a Message Batch of 5,000 requests and merges results into a table by array position. Some rows now hold summaries of the wrong records. What is the right fix?",
      ["Sort the result list by completion time before merging by position", "Tag each request with a unique custom_id and join on it", "Submit smaller batches so that results return in submission order", "Set temperature to 0 so batch processing order becomes deterministic"], 1, "Batch results can arrive in any order, so correlate by custom_id rather than position."),
    S("w02", "apps", "Your async service fans out 500 simultaneous Messages API calls with asyncio.gather and sees bursts of 429 errors. What change best addresses the cause?",
      ["Increase max_tokens so each call finishes faster and frees capacity", "Switch to a synchronous loop and remove all backoff logic", "Cap in-flight calls with a semaphore and honour retry-after", "Wrap gather in a loop that instantly re-sends every failed call"], 2, "Bound concurrency and back off using retry-after; bursts can exceed limits even when the per-minute average is fine.", "scW2"),
    M("w03", "apps", 2, "Workers in the bulk enrichment service may be restarted and the queue redelivers unfinished tickets. Which TWO measures prevent duplicate CRM updates?",
      ["Lower the model's temperature so redelivered tickets produce identical text", "Key each ticket by a stable job ID and skip or upsert if its result was already written", "Retry every 4xx response, since redelivery proves the request was valid", "Make the CRM write idempotent, for example an upsert keyed by ticket ID", "Run a single worker and disable all retries permanently"], [1, 3], "Duplicate side effects are prevented by idempotent writes and dedupe keys in your own system, not by model settings or removing concurrency.", "scW2"),
    S("w04", "apps", "You use structured outputs and parse the first text block with json.loads. Occasionally the parse fails on a response that came back with HTTP 200. Which check should come first?",
      ["Strip markdown fences, since structured outputs always wrap JSON in code blocks", "Re-run the request at a higher temperature to get a cleaner JSON string", "Inspect stop_reason, because max_tokens truncation or a refusal can leave output that does not match the schema", "Check that the HTTP status is 200, which guarantees complete schema-valid JSON"], 2, "Docs list refusal and max_tokens as cases where output may not match the schema; check stop_reason before parsing."),
    S("w05", "apps", "A tool call arrives with input {\"order_id\": \"A-77\", \"refund_amount\": 900}. It matches your JSON schema, but the order total is 120. What does this show?",
      ["The schema is faulty and adding a maximum keyword will fully guarantee refund limits", "The model ignored the tool definition and must be forced with tool_choice", "Strict tool use makes any schema-valid call safe to execute without checks", "Schema validity checks shape, so refund limits and ownership must be enforced in application code"], 3, "A schema cannot know order totals. Always validate semantics and authorisation server-side before acting."),
    S("w06", "apps", "Prompts live in a database table that product staff edit directly. After one edit, answer quality drops and nobody can say what changed. What practice best prevents this?",
      ["Lock the prompt after launch and ban further changes entirely", "Version prompts in Git and change them via reviewed PRs with evals", "Rely on the model's built-in memory to remember the last good prompt", "Add a nightly job that copies the table so edits can be inspected later"], 1, "Prompts are behaviour-defining code; versioning, review and eval gating make changes traceable and reversible.", "scW1"),
    S("w07", "apps", "Claude Code fixed a failing test and the suite is green. In the diff you notice an assertion changed from the expected value to a different number. What is the best reviewer action?",
      ["Re-run the suite twice and merge if both runs pass", "Approve it, because a passing suite is proof the behaviour is correct", "Question the change; the test may have been bent to pass", "Ask Claude to add a comment explaining the new number and merge"], 2, "Green tests mean little if the agent weakened them; check why the expectation changed.", "scW1"),
    M("w08", "apps", 2, "A pull request changes a system prompt. Which TWO CI practices best catch regressions?",
      ["Run only linting, because prompt text cannot affect behaviour", "Raise temperature in CI to expose weaknesses", "Run the eval set against the proposed prompt and compare scores with the main branch", "Merge on a single manual spot check and fix issues in production", "Pin the model identifier in config so the eval result is reproducible"], [2, 4], "Behaviour needs an eval comparison, and a pinned model keeps results comparable. Lint cannot see behaviour, and spot checks are weak evidence."),
    S("w09", "apps", "You asked Claude Code to implement a rate limiter and want a strong review before merging. Which approach is most effective?",
      ["Ask the same session whether it is confident, since it knows the code best", "Only review files Claude lists as modified, ignoring the full diff", "Skip review because the model wrote tests for its own code", "Open a fresh session as reviewer, so it is not biased by the code it just wrote"], 3, "Docs describe a writer and reviewer split: a fresh context reviews without anchoring on its own implementation.", "scW1"),
    S("w10", "apps", "A 600-line module with thin test coverage must be restructured. What should happen before asking Claude Code to refactor it?",
      ["Add tests that pin current behaviour, then refactor while keeping them green", "Ask Claude to rewrite the whole module and write tests afterwards", "Remove the existing tests so they do not block structural changes", "Refactor first, because tests written afterwards describe the new design better"], 0, "Characterization tests are the safety net that makes a refactor verifiable; general practice that Claude Code docs echo via verifying with tests."),
    S("w11", "apps", "You must replace a legacy HTTP client used in 40 places with a new Claude client wrapper. Which strategy lowers risk most?",
      ["Let Claude edit all call sites unreviewed since the compiler would catch mistakes", "Introduce the wrapper behind an interface and migrate callers in small PRs", "Rewrite all 40 call sites in one large change and test at the end", "Freeze feature work for months and rewrite from scratch alongside it"], 1, "Incremental migration keeps each step reviewable and revertible; big-bang changes hide failures. General practice."),
    M("w12", "apps", 2, "You plan a mechanical migration across 300 files using Claude Code with parallel subagents. Which TWO practices fit the documented approach?",
      ["Disable review so the migration finishes faster", "Run all workers in one shared checkout to keep the migration consistent", "Try the change on a few files first, check the result, then run it on all of them", "Skip tests until all 300 files are done, to avoid slowing workers", "Have each parallel worker use its own isolated git worktree so edits do not collide"], [2, 4], "Docs recommend a small trial before scaling and isolated worktrees for parallel work; shared checkouts and deferred verification add risk."),
    S("w13", "apps", "Your streaming endpoint received HTTP 200 and began forwarding tokens. Midway the user sees a silently truncated answer. What was likely missed?",
      ["Setting a lower temperature so that streams cannot be interrupted", "Handling error events that can arrive mid-stream after the 200", "Using a longer anthropic-version header value", "Checking that the initial status code was 200, which would have caught it"], 1, "Docs state errors can occur after a 200 response in SSE, with a separate event shape; treat the stream end state explicitly."),
    S("w14", "apps", "A customer reports a bad answer from your Claude feature, and logs lack any identifier to trace the call. Which habit would have made support and debugging easier?",
      ["Log only the final answer text, because that is what the user saw", "Hash the API key and store it beside each request", "Store nothing, since the API is stateless and replays are impossible", "Record the request-id header with each call"], 3, "Every response carries a request-id, useful for tracing and for support tickets; log it alongside your own correlation ID.")
  );
  Object.assign(window.CC.why, {
    "w01": [
          "Completion time is arbitrary and unrelated to the order requests were submitted, so sorting by it does not restore the mapping.",
          "Unique custom_id values travel with each result, so joining by id stays right regardless of completion order.",
          "Batch size does not affect ordering; results can come back in any order at any size, so position joins still break.",
          "Temperature affects sampling, not scheduling; batch processing is asynchronous and unordered whatever the setting."
    ],
    "w02": [
          "Max_tokens only caps reply length; larger values do not free rate-limit capacity and can increase output-token usage.",
          "Going fully synchronous without backoff gives up throughput and still fails on a 429 if one occurs.",
          "Bounded concurrency avoids burst limits, and honouring retry-after waits as long as the API asks before retrying.",
          "Instant resends add load while the limit is tripped and worsen the burst; retries need backoff and delay."
    ],
    "w03": [
          "Temperature does not make output identical and does nothing about repeated side effects; newer models may also reject non-default values.",
          "A stable job ID with a done-check stops redelivered tickets from being processed and written twice.",
          "4xx errors usually indicate a request problem that will not heal on retry, and redelivery does not prove validity.",
          "An idempotent upsert keyed by ticket ID makes a repeated write harmless even if the dedupe check races.",
          "A single worker without retries loses resilience and still duplicates when the queue redelivers after a crash."
    ],
    "w04": [
          "Structured outputs return JSON in the text content without fences, so stripping them is not the cause.",
          "Higher temperature adds randomness, does not repair truncation, and may be rejected outright by current models.",
          "Docs say max_tokens truncation and refusals can yield output that does not match the schema, so stop_reason tells you whether to parse.",
          "A 200 status does not guarantee completeness; refusals and truncated replies also return 200."
    ],
    "w05": [
          "A maximum keyword cannot compare against a per-order total, and the problem is missing server-side logic, not a faulty schema.",
          "The call followed the definition; tool_choice controls whether a tool is called, not whether its arguments are sensible.",
          "Strict tool use guarantees schema conformance, not business correctness or authorisation, so checks remain necessary.",
          "Schemas validate structure and types; constraints such as refund limits and ownership depend on data only your code has."
    ],
    "w06": [
          "Freezing prompts blocks legitimate improvement and does not address how changes are validated.",
          "Version control with pull-request review and an eval run makes each prompt change attributable, tested and revertible.",
          "The API is stateless and has no memory of earlier prompts; your repository is the only record.",
          "A nightly copy preserves history coarsely but gives no review or regression gate, so bad edits still ship."
    ],
    "w07": [
          "Repeating a run adds no information; the test itself was changed, so determinism is not the issue.",
          "Passing tests only prove the current assertions hold; the agent may have altered the assertions to make them pass.",
          "Changing an expected value can hide the bug; review the diff, since a green suite may reflect weakened tests.",
          "A comment explains the number but does not show that the new expectation is actually correct."
    ],
    "w08": [
          "Linting checks syntax and style, not behaviour; a one-word prompt edit can change outputs with no lint signal.",
          "Raising temperature adds noise and newer models may reject non-default values; it does not measure regressions.",
          "Running the eval set on both branches shows quality differences caused by the prompt change before merge.",
          "A single spot check is anecdotal and ships regressions to users; it is not a regression test.",
          "Pinning the model identifier keeps comparisons reproducible instead of mixing prompt and model changes."
    ],
    "w09": [
          "The same session is anchored on its own implementation, and asked about confidence it tends to defend its work.",
          "Limiting review to a model-supplied file list can miss unrelated edits; the full diff must be read.",
          "Tests the model wrote for its own code share its blind spots and are not an independent review.",
          "A fresh session lacks the writer's context and assumptions, so it reviews edge cases and races with less bias."
    ],
    "w10": [
          "Tests that pin current behaviour let you and Claude verify the structure changed while the behaviour did not.",
          "Rewriting first and testing afterwards removes the safety net and bakes any behaviour change into the new tests.",
          "Deleting tests removes the only automatic check that behaviour is preserved.",
          "Tests written after the refactor describe the new code, so they cannot detect behaviour that changed during it."
    ],
    "w11": [
          "Compilers do not catch behavioural mistakes, and unreviewed bulk edits skip the human check.",
          "An interface plus small PRs keeps each change reviewable and revertible, with the old path working during migration.",
          "One large change makes failures hard to isolate and revert, and defers testing to when it is costliest.",
          "A long freeze delays value, drifts from production behaviour and still has big-bang cutover risk."
    ],
    "w12": [
          "Dropping review removes the human control over large automated changes and does not make the work safer.",
          "A shared checkout lets parallel workers overwrite each other's edits and mix partial changes.",
          "Trying a few files first reveals prompt or pattern flaws cheaply before multiplying them across hundreds of files.",
          "Deferring tests hides failures until after all 300 files change, making the cause hard to find.",
          "Isolated worktrees give each parallel worker its own checkout so concurrent edits do not collide."
    ],
    "w13": [
          "Temperature has no bearing on stream interruptions, and it may not be adjustable on current models.",
          "With SSE the status line is sent first, so later failures arrive as error events you must handle.",
          "The anthropic-version header selects API version behaviour; its length or value does not cause truncated streams.",
          "The initial 200 was received, and it cannot reveal failures that occur later in the stream."
    ],
    "w14": [
          "The answer text alone cannot link a report to a specific call, prompt version or failure.",
          "Storing a key hash does not identify requests and adds a sensitive-data handling concern.",
          "Statelessness concerns conversation memory, not diagnostics; logged identifiers still enable tracing.",
          "Every response includes a request-id that identifies the call for tracing and for Anthropic support."
    ]
  });
})();
