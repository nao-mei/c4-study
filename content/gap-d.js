(function () {
  window.CC = window.CC || {};
  window.CC.lessonsNew = window.CC.lessonsNew || [];
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  window.CC.lessonsNew.push(
    {
      "id": "models-5",
      "n": 5,
      "domain": "models",
      "title": "LLM fundamentals: tokens, sampling, thinking and prompting shots",
      "body": "Claude reads and writes tokens, not words, inside a finite context window, and each token is sampled from a probability distribution. The exam checks what counts toward the window, what you can still control on current models, how thinking, effort and fast mode differ, and when examples beat instructions.",
      "points": [
        "Text is split into tokens, and tokenizers differ by model. Models from Claude Opus 4.7 onward use a newer tokenizer that yields roughly 30 percent more tokens for the same text, so recount with the exact target model before budgeting.",
        "The context window is working memory for one request: system prompt, messages, tool definitions, images and documents, plus the output Claude generates, including thinking. Many current models offer 1M tokens, but sizes vary, so check the model page.",
        "Generation is next-token prediction: each token is sampled given the prompt and the tokens already produced, and earlier tokens are never revised. Sampling makes output non-deterministic, so evaluate properties and rubrics rather than exact strings.",
        "On Opus 4.7 and later and the 5.x models, non-default temperature, top_p or top_k returns a 400 error even with thinking off. Omit them and steer with prompting, examples and structured outputs. Older models accepted these parameters.",
        "Adaptive thinking is the thinking mode on current models: Claude decides per request whether and how deeply to think. Manual type enabled with budget_tokens returns a 400 on Opus 4.7 and later, and is deprecated on the 4.6 models.",
        "Effort (output_config.effort: low, medium, high, xhigh, max) is the main lever for thinking depth and token spend. The default is medium on Opus 5.5 and Haiku 5.5 and high on most others. Lower effort first.",
        "Fast mode (speed set to fast) runs the same model on a faster inference configuration for up to 2.5x output tokens per second at premium pricing. It targets output speed, not first-token latency, and only some Opus models support it.",
        "Thinking tokens are billed as output tokens and count toward max_tokens, even when the thinking text is omitted from the response. Omitting it can speed up streaming but does not cut cost.",
        "Zero-shot gives instructions only, single-shot adds one example and multi-shot adds several. Three to five relevant, varied examples wrapped in example tags usually steer format and tone best, while a lone example can be copied too literally."
      ],
      "code": "resp = client.messages.create(\n    model=\"claude-sonnet-5-5\", max_tokens=2048,\n    output_config={\"effort\": \"low\"},   # steer thinking depth\n    messages=[{\"role\": \"user\", \"content\": prompt}],\n)\n# No temperature/top_p/top_k: non-default values get a 400\nprint(resp.usage.input_tokens, resp.usage.output_tokens)",
      "traps": [
        "People assume a token is a word or a fixed number of characters, but tokenizers differ by model and the same text can cost about 30 percent more tokens on Claude 4.7 and later.",
        "People assume temperature 0 makes Claude deterministic, but current models reject non-default temperature, and even where accepted it never guaranteed identical output.",
        "People assume budget_tokens caps thinking on every model, but on Opus 4.7 and later it returns a 400; use adaptive thinking with effort instead.",
        "People assume fast mode is a smaller or cheaper model, but it is the same model on faster inference at premium pricing.",
        "People assume more examples are always better, but a few diverse, representative ones beat many near-duplicates that bias the output."
      ],
      "sources": [
        "https://platform.claude.com/docs/en/build-with-claude/thinking",
        "https://platform.claude.com/docs/en/build-with-claude/effort",
        "https://platform.claude.com/docs/en/build-with-claude/fast-mode",
        "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices"
      ]
    },
    {
      "id": "models-6",
      "n": 6,
      "domain": "models",
      "title": "Technical fundamentals: SDKs, REST and real-time",
      "body": "Claude apps sit on plain HTTPS and JSON, and the official SDKs wrap it. The exam checks what the SDK does for you (headers, retries, timeouts, typed errors, streaming accumulation), which status codes to retry, how SSE streaming works, and engineering basics such as key safety, async clients, pagination and rate limits.",
      "points": [
        "A raw call is POST /v1/messages with a JSON body (model, max_tokens, messages) plus Authorization: Bearer key (legacy x-api-key still works), anthropic-version and content-type headers. SDKs set these for you and read ANTHROPIC_API_KEY from the environment.",
        "Status codes carry meaning: 400 bad request, 401 bad key, 403 no permission, 404 missing resource, 413 body too large, 429 rate limit, 500 internal error, 529 overloaded. Errors are JSON with type, message and request_id. Retry only transient ones.",
        "SDKs retry connection errors, 408, 409, 429 and 5xx twice by default with exponential backoff, honouring retry-after, and raise typed exceptions. Tune max_retries, and set it deliberately if you add your own retry loop so attempts do not multiply.",
        "Rate limits are organisation-level, measured in requests, input tokens and output tokens per minute, and replenish continuously (token bucket). A 429 may carry retry-after. A spend-cap 429 has no retry-after, and retrying fails until access resumes.",
        "The SDK default timeout is 10 minutes, and non-streaming requests expected to run longer are rejected. For large max_tokens, stream and take the final message with the SDK helper, because networks may drop idle connections.",
        "With stream true, the Messages API replies with server-sent events over the same HTTPS response: message_start, content blocks (start, deltas, stop), message_delta, message_stop, plus ping events. Tool input arrives as partial JSON to join and parse at block stop.",
        "A stream can fail after a 200 status, as an error event such as overloaded_error. Handle error events inside the loop, ignore unknown event types, and treat usage in message_delta as cumulative. SDK helpers do this accumulation for you.",
        "General practice: SSE is one-way server push over HTTP and is enough to display tokens. Websockets are full-duplex and suit your own browser-to-backend channel when the client sends frequent messages upstream. Claude's documented streaming itself uses SSE.",
        "Keep API keys on a server you control, never in browser code. Use the async client (AsyncAnthropic in Python) with bounded concurrency. List endpoints paginate with page and next_page, or after_id and has_more, and SDK iterators auto-page."
      ],
      "code": "client = anthropic.AsyncAnthropic(max_retries=2, timeout=60.0)\nsem = asyncio.Semaphore(8)            # bound concurrency\nasync def ask(p):\n  async with sem:\n    async with client.messages.stream(model=MODEL, max_tokens=64000,\n        messages=[{\"role\": \"user\", \"content\": p}]) as s:\n      return await s.get_final_message()\n# SDK sets headers, retries 429/5xx, parses SSE events\nresults = await asyncio.gather(*(ask(p) for p in prompts))",
      "traps": [
        "People assume a 200 status means the stream succeeded, but errors such as overloaded_error can arrive as events after the 200.",
        "People assume every 429 is solved by waiting, but a spend-cap 429 has no retry-after and keeps failing until access resumes.",
        "People assume Claude streams over websockets, but the Messages API streams server-sent events over a normal HTTPS response.",
        "People assume a hidden or origin-restricted key is safe in front-end code, but anything shipped to the browser can be read and reused.",
        "People assume the SDK and a custom retry loop cooperate, but they stack, so attempts multiply unless you set max_retries on purpose."
      ],
      "sources": [
        "https://platform.claude.com/docs/en/api/errors",
        "https://platform.claude.com/docs/en/build-with-claude/streaming",
        "https://platform.claude.com/docs/en/api/rate-limits",
        "https://platform.claude.com/docs/en/api/overview"
      ]
    }
  );
  window.CC.scenarios.scL1 = {"title": "Staff chat relay", "text": "Your team is building an internal chat tool. A backend service calls the Messages API with streaming enabled and relays tokens to staff browsers. Some answers include tool calls, and the service must stay reliable when the API is busy."};
  window.CC.questions.push(
    S("l01", "models", "A team measured prompt sizes on a model released before Claude Opus 4.7 and is moving to a current model. Which step best protects their cost and context estimates?", ["Reuse the old counts, because a token is a fixed unit of text that is identical across every Claude model", "Multiply the old word counts by a fixed number of tokens per word for all models", "Recount with the target model, since newer tokenizers can yield more tokens for the same text", "Divide character counts by four, which the docs guarantee for every Claude model"], 2, "Count tokens against the exact model you will call, since the tokenizer changed from Claude Opus 4.7 onward."),
    S("l02", "models", "Which items consume space in the context window of a single request?", ["Everything in the request, plus the output Claude generates, including any thinking", "Only the messages array, since the system prompt and tool definitions are accounted for separately", "Only the input you send, because Claude's reply is counted against a separate output allowance", "Only text tokens, because images and PDF pages are handled outside the window"], 0, "The context window is the model's working memory for the request, input and generated output combined."),
    S("l03", "models", "A developer sets temperature to 0 on Claude Opus 5.5 to get repeatable answers and receives a 400 error. What is the best explanation and fix?", ["Temperature accepts only values from 0.1 to 1, so use 0.1 and the request will succeed", "Temperature is rejected only while thinking is on, so disable thinking and resend the same value", "Sampling controls need a beta header on current models, so add it and retry the request", "Current models reject non-default sampling values, so omit them and steer with prompts instead"], 3, "On current Claude models, non-default sampling parameters return a 400, and even where accepted they never guaranteed identical output."),
    S("l04", "models", "A support bot on Claude Sonnet 5.5 gets mostly trivial questions and a few hard ones. You want trivial turns to spend fewer thinking tokens without hurting the hard ones. What is the recommended approach?", ["Send thinking with type enabled and a small budget_tokens value so every turn stays cheap", "Lower the effort level and let adaptive thinking decide per request how much to think", "Set thinking to disabled on every request so that no thinking tokens are ever generated", "Add a system prompt line saying never to think, which reliably switches thinking off"], 1, "On current models, effort steers how readily and deeply adaptive thinking runs; manual budgets are rejected."),
    S("l05", "models", "What does setting speed to fast on a supported Opus model do?", ["It routes the request to a smaller distilled model that trades some quality for lower latency", "It skips thinking so that the first token arrives sooner, at the same price as standard speed", "The same model served on faster inference, with higher output speed at a premium price", "It is an effort level that makes the model write shorter answers using fewer tokens"], 2, "Fast mode (speed fast) is available only on certain Opus models and speeds up output without changing the model."),
    S("l06", "models", "A zero-shot extraction prompt returns fields in an inconsistent layout. Which change most directly fixes this?", ["Add a few varied examples inside example tags that show the exact layout wanted", "Raise temperature so the model explores more layouts and eventually settles on one", "Repeat the instruction in capital letters ten times at the top of the prompt", "Use a single example, since one sample is guaranteed to cover every edge case"], 0, "Examples (single-shot or, better, multi-shot) steer format and consistency more reliably than extra instructions."),
    M("l07", "models", 2, "Which TWO things do the official Claude SDKs do for you that a hand-written REST client must implement itself?", ["Retry transient failures such as connection errors, 429 and 5xx with exponential backoff, twice by default", "Store the conversation history between calls so earlier turns can be omitted", "Cache identical responses locally so repeated prompts are never billed twice", "Set the authentication, anthropic-version and content-type headers on every request", "Trim messages automatically whenever they exceed the context window"], [0, 3], "SDKs handle headers, retries, timeouts, typed errors and streaming helpers, but not state, caching or context management."),
    S("l08", "models", "In a raw HTTP integration with no SDK, which request creates a Claude response?", ["GET /v1/messages with the prompt in a query string and the key in the URL", "PUT /v1/conversations/{id} with the new turn so the server appends it to stored history", "POST /v1/messages with form-encoded fields, since the endpoint accepts only urlencoded bodies", "POST /v1/messages with required headers and a JSON body of model, max_tokens and messages"], 3, "The Messages API is a JSON-over-HTTPS POST to /v1/messages and is stateless."),
    S("l09", "models", "A prototype web page calls the Messages API straight from browser JavaScript with the API key in the bundle. What is the correct fix?", ["Call it from a backend you control, keeping the key as a server-side secret", "Base64-encode the key in the bundle so scanners and visitors cannot read it", "Restrict allowed origins with CORS so only your site's pages can use the key", "Rotate the key daily but keep it in the bundle, since short-lived keys are safe client-side"], 0, "Keep keys on the server (for example in an environment variable) and let the browser talk only to your backend."),
    M("l10", "models", 2, "Which TWO statuses are usually transient, making automatic retry with exponential backoff appropriate?", ["529 overloaded_error during high traffic", "500 api_error from an internal fault", "400 invalid_request_error for a malformed body", "401 authentication_error for a revoked key", "404 not_found_error for a wrong path or ID"], [0, 1], "Retry 429 (when it has retry-after), 5xx and 529; fix 4xx client errors instead of retrying."),
    S("l11", "models", "Every request suddenly returns 429 rate_limit_error with no retry-after header, and error.details.error_code is enforced_spend_limit_reached. What should the service do?", ["Wait for the retry-after value and then resume normal traffic automatically", "Retry with longer exponential backoff, since the SDK retries will eventually clear it", "Stop retrying, alert an operator, and raise the tier or wait for the cap to reset", "Move traffic to another API key in the same organization to get a fresh allowance"], 2, "Distinguish a spend-cap 429 (error_code enforced_spend_limit_reached, no retry-after) from a normal rate-limit 429."),
    S("l12", "models", "A nightly job fans out 300 parallel requests and sees sporadic 429 responses that carry retry-after. Which handling is best?", ["Retry immediately in a tight loop until a request gets through", "Throttle concurrency, honour retry-after and back off with jitter, since capacity refills continuously", "Wait for the next full clock minute, since limits reset at fixed boundaries", "Create extra API keys to spread the load, because limits are enforced per key"], 1, "Smooth bursts client-side and obey retry-after; the SDK also retries 429 with backoff by default."),
    S("l13", "models", "A Python service sends a non-streaming request with max_tokens 128000 and the SDK raises a ValueError about expected duration. What is the right fix?", ["Set max_retries to 10 so the request eventually succeeds", "Lower the HTTP timeout to a few seconds so the failure surfaces sooner", "Switch to a websocket connection, which has no timeout limit", "Stream the response and take the final message with the SDK helper"], 3, "For large max_tokens, SDKs expect streaming, and idle non-streaming connections risk being dropped by networks."),
    S("l14", "models", "Your backend needs token-by-token output from Claude. How does the Messages API deliver a streamed response?", ["Over a websocket that the client opens after the first request returns a connection ticket", "As server-sent events over the HTTP response when stream is true", "As repeated polling of a response ID until its status field reads complete", "As one chunked plain-text body with raw tokens and no event names or JSON"], 1, "Streaming uses SSE over HTTP: set stream true, or let the SDK helper do it.", "scL1"),
    S("l15", "models", "Treat this as general practice. Your backend relays Claude output to browsers. When is a websocket between browser and backend a better fit than SSE?", ["When the response must be JSON, because SSE can only carry plain text", "When you want fewer tokens billed, because websockets compress model output", "When the browser must send frequent messages upstream, such as cancel signals", "When the browser is behind any proxy, because SSE can never pass through proxies"], 2, "SSE suffices for one-way token display; websockets help when the client also sends frequent messages (general practice).", "scL1"),
    S("l16", "models", "While streaming a tool call, you receive many content_block_delta events of type input_json_delta. How should you build the tool input?", ["Join the partial_json strings and parse at content_block_stop", "Parse every partial_json value as a complete JSON object as soon as it arrives", "Read the final input from message_start, which already holds the complete arguments", "Keep only the last delta, since each one replaces the previous partial value"], 0, "Accumulate input_json_delta fragments and parse at content_block_stop; the final tool_use.input is an object.", "scL1"),
    M("l17", "models", 2, "You are writing your own SSE consumer for Claude streams instead of using an SDK. Which TWO behaviours are correct?", ["Add up the usage figures in every message_delta, because each reports only its own tokens", "Treat an event named error as a failure even though the HTTP status was 200", "Stop reading at the first ping, since it signals that the message is complete", "Ignore ping events and unknown event types rather than crashing, since new types may be added", "Assume a 200 status guarantees the stream will finish without error"], [1, 3], "A hand-rolled SSE reader must handle in-stream error events and tolerate pings and unknown event types.", "scL1"),
    S("l18", "models", "An async web handler calls the synchronous Anthropic client directly, and latency spikes under load. What is the best change?", ["Keep the sync client but raise max_retries so slow calls are retried sooner", "Wrap every call in unbounded threads, since rate limits only apply to sequential traffic", "Switch to the async client and drop concurrency limits, because async calls are not rate limited", "Use the async client with awaited calls and a semaphore to cap concurrent requests"], 3, "Use AsyncAnthropic (Python) with awaited calls and a concurrency cap, while the SDK still retries transient errors."),
    M("l19", "models", 2, "Select two correct statements about listing resources through the Claude API.", ["SDK auto-pagination iterators follow cursors for you, so a simple loop visits every item", "Some list endpoints, such as the Models list and Message Batches, use after_id and has_more instead of page and next_page", "Every list endpoint returns all items in one response, so no paging code is needed", "You paginate by incrementing a numeric offset parameter until the response is empty"], [0, 1], "Use the SDK auto-pagination iterator or follow the endpoint's cursor fields; the cursor scheme varies by endpoint."),
    S("l20", "models", "You need the request ID and rate-limit headers for logging each Messages call from Python. What is the right approach?", ["Read them from the JSON response body, which always repeats every response header as a field", "Bypass the SDK with raw sockets, since it strips all response headers", "Use the SDK's raw-response accessor for headers; the request ID is also on _request_id", "Look them up later in the Console, because the API never exposes them to callers"], 2, "Every response has a request-id header; use the SDK raw-response accessor for other headers such as anthropic-ratelimit-*."),
    S("l21", "models", "A team wraps SDK calls in their own loop of five attempts and leaves the SDK's default retry setting untouched. What problem does this create, and what is the fix?", ["None, because the SDK never retries and only the wrapper loop does", "Attempts multiply, up to 15 calls per task; set max_retries so only one layer retries", "The SDK disables its own retries whenever it detects an outer loop, so attempts stay at five", "Duplicate requests are deduplicated server-side, so extra attempts are free"], 1, "SDK retries stack with custom loops; set max_retries deliberately (for example 0 when you own retry logic).")
  );
  Object.assign(window.CC.why, {
    "l01": [
      "Token boundaries are defined by each model's tokenizer, so identical text can count differently; old counts would understate cost and context use.",
      "No fixed tokens-per-word ratio holds across models or content types; the real figure depends on the tokenizer and the text.",
      "Tokenizers differ by model; models from Opus 4.7 on produce roughly 30 percent more tokens for identical text, so counts must be re-measured on the model you will call.",
      "Characters divided by four is only a rough rule of thumb, not a guarantee, and it ignores tokenizer changes between models."
    ],
    "l02": [
      "The window covers the whole request and the generated output, and thinking tokens count too, so all of these share one limit.",
      "System text and tool definitions are part of the input and occupy window space on every request, just like messages.",
      "Generated output, including thinking, also lands in the same window; max_tokens limits the reply but does not create a separate pool.",
      "Images and PDF pages are converted into tokens and count toward the window, which is why many of them can hit size or token limits."
    ],
    "l03": [
      "The value range is not the problem; non-default temperature is rejected outright on current models, so 0.1 fails the same way.",
      "That restriction applied to older models; on current ones the 400 occurs regardless of thinking, and thinking cannot always be disabled anyway.",
      "No beta header unlocks sampling parameters on these models; they are simply not accepted with non-default values.",
      "Opus 4.7 and later and the 5.x models return 400 for non-default sampling values on every request; remove them and shape behaviour through prompting."
    ],
    "l04": [
      "Manual budget_tokens returns a 400 on current models such as Sonnet 5.5, and a small fixed budget would also starve the hard requests.",
      "Effort is the primary thinking lever; adaptive thinking judges each request, so simple turns think little while hard ones can still reason deeply.",
      "Disabled is rejected on Sonnet 5.5 and would remove reasoning from the hard questions too, which is the opposite of per-request balance.",
      "The docs say prompt wording does not reliably reduce thinking on Sonnet 5.5; lowering effort is the dependable control."
    ],
    "l05": [
      "Fast mode is not a different or smaller model; intelligence and capabilities are unchanged.",
      "The gain targets output tokens per second rather than time to first token, it does not disable thinking, and pricing is higher.",
      "Docs describe fast mode as the same weights and behaviour with up to 2.5x output speed, billed at a premium rate.",
      "Effort is a separate parameter (output_config.effort); speed fast changes inference speed, not answer length or thoroughness."
    ],
    "l06": [
      "Multi-shot prompting with a few diverse, well-structured examples is one of the most reliable ways to pin down format and structure.",
      "Randomness does not converge on a layout, and current Claude models reject non-default temperature anyway.",
      "Repetition and shouting add noise without showing the target format; a concrete example communicates layout far better.",
      "One example cannot cover edge cases and may be copied too literally; a few varied examples generalise better."
    ],
    "l07": [
      "The SDKs retry these automatically, honour retry-after, and let you change max_retries.",
      "The API is stateless and the SDK does not keep history for you; your application must resend all turns.",
      "The SDKs do not memoise responses; each call is a real request, and cost reduction comes from features like prompt caching.",
      "The SDKs add these headers for you, whereas a raw client must send each one correctly.",
      "The SDKs do not truncate or summarise history; an oversized request is simply rejected, so trimming is your job."
    ],
    "l08": [
      "Creation uses POST with a JSON body; prompts do not belong in query strings, and keys must never be placed in URLs.",
      "There is no server-held conversation to append to; the Messages API is stateless and you resend history each call.",
      "The endpoint expects application/json; nested messages and content blocks cannot be expressed as flat form fields.",
      "Messages are created with a POST to /v1/messages carrying a JSON body, plus the key, anthropic-version and content-type headers."
    ],
    "l09": [
      "Anything shipped to a browser can be read, so the key must stay on a server that you control, with your own authenticated endpoint in front.",
      "Base64 is an encoding, not protection; anyone can decode it from the page source in seconds.",
      "CORS is enforced by browsers, not servers' secrets; scripts and curl ignore it, so a leaked key still works anywhere.",
      "A key readable by every visitor is exposed from the first request; rotation only shortens the window and adds operational burden."
    ],
    "l10": [
      "529 means the API is temporarily overloaded, so a delayed retry with backoff commonly succeeds.",
      "500 is an unexpected internal error; the docs recommend retrying with exponential backoff.",
      "The request itself is wrong; resending the same body fails identically, so fix the payload instead.",
      "A bad or revoked key will not heal by waiting; replace the credential rather than retrying.",
      "The resource or endpoint does not exist, so retrying cannot help; correct the URL or identifier."
    ],
    "l11": [
      "There is no retry-after on this response, and an early retry fails; the pause lasts until the cap resets or the tier is raised.",
      "Backoff does not help because access is blocked by the spend cap, not by burst traffic; SDK retries keep failing.",
      "A spend-cap 429 has no retry-after, and retries fail until access resumes, so the right response is escalation, not backoff loops.",
      "The cap applies to the organization, so a second key shares the same blocked allowance."
    ],
    "l12": [
      "Immediate retries land before capacity returns, waste attempts and can deepen the problem; retry-after says how long to wait.",
      "Limits use a token bucket that replenishes continuously, so smoothing request rate and respecting retry-after avoids repeated rejections.",
      "The token bucket replenishes continuously rather than resetting at fixed boundaries, so idling to the minute wastes capacity.",
      "Limits are enforced at the organization level, so more keys do not raise your capacity."
    ],
    "l13": [
      "Retries do not change the expected duration, and a timed-out call just repeats the same long wait.",
      "A shorter timeout makes a long generation fail faster; it does not let the request complete.",
      "The Messages API does not offer this; its documented answer for long outputs is streaming over SSE or the Batches API.",
      "Streaming keeps the connection active with events, and the helper returns the same complete Message as a non-streaming call."
    ],
    "l14": [
      "The documented streaming transport is SSE on the same HTTP request; there is no ticket or separate websocket handshake.",
      "Setting stream true makes the API reply with named SSE events over the same HTTPS response.",
      "Streaming pushes events as they are generated; polling is closer to how batch results are collected.",
      "The stream uses named events (message_start, content_block_delta and so on) with JSON data, not bare text."
    ],
    "l15": [
      "SSE data fields can carry JSON, as the Claude event payloads themselves show.",
      "Billing depends on tokens Claude processes, not on how you deliver them to the browser.",
      "Websockets are full-duplex, so one persistent connection can carry frequent client-to-server messages as well as streamed tokens.",
      "SSE is plain HTTP and typically works through proxies; buffering can need configuration, but it is not blocked outright."
    ],
    "l16": [
      "Deltas are fragments of a JSON string; the full object is valid only once the block is complete.",
      "Each fragment is only part of a string, such as an unfinished key or value, so parsing it alone fails.",
      "message_start carries a Message with empty content; the arguments are not known until the deltas have arrived.",
      "Deltas are appended, not replaced; the last one is usually just a closing fragment."
    ],
    "l17": [
      "Token counts in message_delta are cumulative, so summing them would double count.",
      "Errors such as overloaded_error can arrive mid-stream after a 200, so the loop must handle them explicitly.",
      "A ping is only a keep-alive; completion is signalled by message_stop.",
      "Pings can appear anywhere and new event types may be added under the versioning policy, so tolerate them.",
      "The status is sent before generation finishes, so later failures arrive as error events instead."
    ],
    "l18": [
      "Retries do not stop blocking calls from stalling the event loop; they only repeat slow work.",
      "Rate limits apply to total request and token rates regardless of threading, and unbounded threads invite 429 storms.",
      "Async changes how you wait, not what the API allows; limits still apply and unbounded fan-out triggers 429s.",
      "An awaited async client frees the event loop while waiting, and a bound keeps the burst within rate limits."
    ],
    "l19": [
      "The SDKs offer auto-paging iterators that fetch successive pages while you loop over items.",
      "Pagination schemes differ by endpoint; these use after_id, before_id and has_more, so check each reference page.",
      "Results come in pages controlled by limit, so reading only the first response can silently miss items.",
      "Claude list endpoints use opaque cursors, not numeric offsets, so incrementing a number does not walk the list."
    ],
    "l20": [
      "The body does not mirror headers; request_id appears in error bodies, but rate-limit values arrive only as headers.",
      "The SDK does not discard headers; the raw-response accessor exists precisely to expose them.",
      "with_raw_response exposes headers such as rate-limit values, and the Python SDK also surfaces the request ID on response objects.",
      "Every response carries a request-id header, and rate-limit headers are returned on each response for callers to read."
    ],
    "l21": [
      "The SDK retries connection errors, 408, 409, 429 and 5xx twice by default, so its retries stack beneath the wrapper.",
      "The SDK retries twice by default (three attempts), so five outer attempts can reach fifteen requests; configure a single retry layer.",
      "The SDK cannot detect outer loops; it keeps retrying unless you set max_retries yourself.",
      "Each attempt is a separate request that consumes rate limit and can bill tokens; the API does not merge duplicates."
    ]
  });
})();
