window.CC = window.CC || {}; window.CC.lessonsNew = window.CC.lessonsNew || [];
window.CC.lessonsNew.push(
  {
    id: "apps-1", n: 1, domain: "apps",
    title: "The Messages API: requests, roles and statelessness",
    body: "Every Claude integration starts with one call: POST /v1/messages. The exam checks that you know the required fields, what each role does, and the single most tested fact: the API is stateless, so your application owns conversation memory. It also tests which parameters have been removed on newer models.",
    points: [
      "A request needs a model, max_tokens and a messages array. max_tokens is a hard ceiling on generated tokens, not a target, and the model may stop earlier. Everything else, including system, is optional.",
      "A raw HTTPS call needs an authentication header, an anthropic-version header (for example 2023-06-01) and content-type: application/json. Authorization: Bearer is the primary scheme; x-api-key is a legacy fallback. SDKs set all of these for you.",
      "The Messages API is stateless: Claude remembers nothing between calls. To continue a conversation you resend the full history in messages on every request, so your application stores, trims and replays it.",
      "Messages carry role user or assistant, and the model expects them to alternate. Consecutive same-role turns are merged into one. Earlier assistant turns do not have to come from Claude, so synthetic ones are allowed.",
      "Put persona, tone and standing rules in the top-level system parameter, not in a message with role system. It accepts a plain string or a list of text blocks, and the block form lets you attach cache_control.",
      "Content can be a plain string or a list of typed blocks. Images and PDFs go in image or document blocks inside a user message, with a base64, url or file source, never as a file path pasted into text.",
      "Because history is resent, input cost and latency grow every turn. Control it by trimming or summarising old turns, retrieving selectively, and caching a stable prefix, rather than raising max_tokens, which only limits the reply.",
      "On Claude 4.7 and later models, sending a non-default temperature, top_p or top_k returns a 400 error. Omit them and steer behaviour through prompting. Older models still accepted them, so read the model page.",
      "Prefilling a final assistant turn is rejected with a 400 on Claude 4.6 and later models. Use structured outputs or system-prompt instructions to shape the reply. On Claude 4.5 and earlier, a trailing assistant message continues from your text."
    ],
    code: "import anthropic\nclient = anthropic.Anthropic()\nhistory = [{\"role\": \"user\", \"content\": \"Hi\"}]\nr = client.messages.create(model=MODEL, max_tokens=1024,\n    system=\"You are a support assistant.\", messages=history)\n# Stateless: append the reply, then resend ALL turns next time\nhistory.append({\"role\": \"assistant\", \"content\": r.content})\nhistory.append({\"role\": \"user\", \"content\": \"Tell me more\"})",
    traps: [
      "People wrongly assume the API keeps the conversation server-side, but it is stateless and a chatbot that forgets earlier turns simply did not resend the history.",
      "People wrongly assume a system prompt line like \"remember our chat\" or a larger max_tokens gives memory, when only resending prior turns does.",
      "People wrongly assume temperature, top_p and top_k can always be tuned, but current models reject non-default values with a 400 error.",
      "People wrongly assume prefilling the assistant turn is a safe way to force a format, but Claude 4.6 and later models reject it.",
      "People wrongly assume max_tokens is optional or a target length, when it is required and acts only as an upper bound."
    ],
    sources: [
      "https://platform.claude.com/docs/en/build-with-claude/working-with-messages",
      "https://platform.claude.com/docs/en/api/messages/create",
      "https://platform.claude.com/docs/en/api/overview",
      "https://platform.claude.com/docs/en/api/errors"
    ]
  },
  {
    id: "apps-2", n: 2, domain: "apps",
    title: "Responses, content blocks and stop reasons",
    body: "A response is not just a string. It is a list of typed content blocks plus a stop_reason that tells your code what to do next. Many production bugs come from reading content[0].text blindly or ignoring stop_reason. The exam tests block types, each stop_reason value, and the correct reaction to each.",
    points: [
      "The response content field is a list of typed blocks, not a string. Common types are text and tool_use. With thinking or server tools you may also see thinking, redacted_thinking and server_tool_use blocks.",
      "Iterate over content and branch on block.type. Reading content[0].text breaks when the first block is a tool_use or thinking block, which can happen even for prompts that usually return plain text.",
      "stop_reason is part of every successful 200 response and says why generation stopped. It is not an error. Errors are 4xx or 5xx HTTP failures, while a stop_reason arrives in a valid response body.",
      "end_turn means a natural finish. stop_sequence means one of your stop_sequences was generated, and the response field stop_sequence says which. Both are normal outcomes you simply use.",
      "max_tokens means output hit your cap and may be cut off mid-sentence or mid-JSON. Treat it as truncated: raise the limit, request shorter output, or continue the response. A cut-off tool_use block needs a retry with a higher limit.",
      "tool_use means Claude wants your code to run a tool. You reply with a user message holding one tool_result per tool_use block, each carrying the matching tool_use_id, and that message should contain only those results.",
      "pause_turn means a server-side tool loop hit its iteration limit. Send the assistant content back unchanged to let Claude continue. refusal is a 200 response from safety classifiers, and stop_details names the category.",
      "model_context_window_exceeded means the response filled the context window, so treat it as truncated. The usage object reports input_tokens, output_tokens and cache token counts, and the total input is the sum of the input fields.",
      "Log the request-id response header, also exposed as request_id in error bodies. It identifies one call precisely and is what support needs when you report a problem."
    ],
    code: "for block in r.content:\n    if block.type == \"text\":\n        show(block.text)\n    elif block.type == \"tool_use\":\n        run_tool(block.name, block.input)  # reply with tool_result\nif r.stop_reason == \"max_tokens\":\n    flag_truncated()  # output may be incomplete\nelif r.stop_reason == \"refusal\":\n    handle_refusal(r.stop_details)",
    traps: [
      "People wrongly assume response.content[0].text is always safe, but the first block can be tool_use or thinking.",
      "People wrongly assume a non-end_turn stop_reason is an error, when stop_reason values are successful 200 responses and errors are 4xx or 5xx.",
      "People wrongly assume max_tokens output is complete, but it may be truncated mid-answer and truncated JSON will not parse.",
      "People wrongly assume a refusal returns an error status, when it comes back as a normal 200 response with stop_reason refusal.",
      "People wrongly assume you can add text after tool_result blocks in the same user message, but extra content after them can end the turn or cause a 400 error."
    ],
    sources: [
      "https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons",
      "https://platform.claude.com/docs/en/api/messages/create",
      "https://platform.claude.com/docs/en/api/errors"
    ]
  },
  {
    id: "apps-3", n: 3, domain: "apps",
    title: "Streaming, errors, retries and rate limits",
    body: "Production integrations must feel fast and survive failure. Streaming cuts perceived latency, but it moves some failures into the event stream. Retrying is only safe for transient errors, and only with backoff. The exam tests the SSE event flow, which HTTP codes to retry, how retry-after works, and what the SDK already does for you.",
    points: [
      "Set stream to true to receive server-sent events (SSE). Streaming improves time to first token and perceived latency. It does not make the model faster overall, cheaper or more accurate.",
      "The event flow is message_start, then for each block a content_block_start, content_block_delta events and content_block_stop, then message_delta and message_stop. Ping events may appear anywhere, and unknown event types should be ignored.",
      "Text arrives in text_delta events. Tool input arrives as input_json_delta fragments of partial JSON: accumulate them and parse only after content_block_stop. stop_reason is null in message_start and appears in message_delta.",
      "A stream returns HTTP 200 before generation finishes, so an overloaded_error or other failure can arrive later as an error event. Check for those events, and treat a dropped connection as possibly incomplete output.",
      "Common codes: 400 invalid request, 401 authentication, 403 permission, 404 not found, 413 request too large, 429 rate limit, 500 api error, 504 timeout, 529 overloaded. 4xx client errors need a fix before any retry.",
      "Retry transient failures (429, 5xx, 529 and connection errors) with exponential backoff, jitter and a retry cap. If a retry-after header is present, wait at least that long. Never retry in a tight loop.",
      "The official SDKs already retry transient errors with exponential backoff, twice by default, and honour retry-after. You can set max_retries. Avoid stacking your own aggressive retries on top.",
      "A 429 can also mean a monthly spend cap was reached. That response has no retry-after header, and retrying fails until access resumes or the limit is raised. Do not treat every 429 as a short wait.",
      "Rate limits cover requests, input tokens and output tokens per minute, using a token bucket that refills continuously. On most models cached reads do not count toward the input limit. Values vary by tier; check the docs."
    ],
    code: "with client.messages.stream(model=MODEL, max_tokens=4096,\n        messages=msgs) as stream:\n    for text in stream.text_stream:\n        send_to_browser(text)\n    final = stream.get_final_message()\n# SDK retries transient errors (default 2); tune it:\nclient = anthropic.Anthropic(max_retries=4)",
    traps: [
      "People wrongly assume a 200 status on a streaming request guarantees a complete answer, but errors can arrive mid-stream as events.",
      "People wrongly assume every 4xx or 5xx should be retried, when 400, 401, 403 and 413 need the request or setup fixed first.",
      "People wrongly assume retrying faster beats a 429, but tight retry loops worsen congestion, so use backoff, jitter and retry-after.",
      "People wrongly assume you must hand-write all retry logic, but the SDKs already retry transient errors by default.",
      "People wrongly assume streaming is only a UX feature, but SDKs also use it to avoid HTTP timeouts on large max_tokens requests."
    ],
    sources: [
      "https://platform.claude.com/docs/en/build-with-claude/streaming",
      "https://platform.claude.com/docs/en/api/errors",
      "https://platform.claude.com/docs/en/api/rate-limits"
    ]
  },
  {
    id: "apps-4", n: 4, domain: "apps",
    title: "Structured output and tool-based extraction",
    body: "Downstream code needs valid, typed data, not prose. Asking nicely for JSON, prefilling a brace, or forcing a tool call used to be the workarounds. Current guidance is schema-constrained structured outputs and strict tool use, with validation still in your code. The exam tests which technique is recommended and why the older ones fail.",
    points: [
      "Prompting for JSON alone gives no guarantee. Output can have syntax errors, missing fields or wrong types, so code that parses it needs error handling and retries.",
      "Structured outputs constrain generation to your JSON Schema through constrained decoding. You pass the schema in output_config.format with type json_schema, and valid, parseable JSON comes back in the text block. This is the recommended route.",
      "Strict tool use sets strict: true on a tool definition. Claude's tool input then follows your input_schema exactly, with correct types and required fields, and the tool name is always valid. Use it when Claude calls your functions.",
      "The two features are independent and can be combined in one request: JSON outputs shape what Claude says, strict tools shape how it calls your functions.",
      "The SDKs offer client.messages.parse() with a Pydantic or Zod model. It sends the schema, validates the response and returns a typed parsed object, so you avoid hand-written parsing.",
      "Schema support is a subset of JSON Schema. Objects need additionalProperties false, recursive schemas and numeric or string-length constraints are not supported, and complexity limits exist. Check the docs for current limits.",
      "Structured outputs are not always valid: a refusal or a max_tokens stop can yield output that does not match the schema. Check stop_reason before parsing, and compare enum values case-insensitively, since capitalisation is not guaranteed.",
      "Schemas guarantee shape, not meaning. Still validate business rules in code, such as totals, ranges and allowed values. If validation fails, retry with the error message fed back, and cap the number of attempts.",
      "Forced tool_choice of any or tool was the older extraction trick. Claude Opus 5.5, Sonnet 5.5, Fable 5.1 and Mythos 5.1 return a 400 for it, as does manual extended thinking. Use auto with strict tools, or structured outputs."
    ],
    code: "r = client.messages.create(model=MODEL, max_tokens=1024,\n    messages=[{\"role\": \"user\", \"content\": \"Extract: \" + text}],\n    output_config={\"format\": {\"type\": \"json_schema\", \"schema\": {\n        \"type\": \"object\",\n        \"properties\": {\"name\": {\"type\": \"string\"}, \"qty\": {\"type\": \"integer\"}},\n        \"required\": [\"name\", \"qty\"], \"additionalProperties\": False}}})\nif r.stop_reason == \"end_turn\":\n    data = json.loads(r.content[0].text)  # then check business rules",
    traps: [
      "People wrongly assume \"respond only in JSON\" in the prompt is enough, but it is not a guarantee and still needs validation.",
      "People wrongly assume prefilling an opening brace forces JSON, but prefill is rejected with a 400 on Claude 4.6 and later models.",
      "People wrongly assume tool_choice any or tool is the recommended extraction route, but several current models reject forced tool use with a 400.",
      "People wrongly assume schema-valid output means correct output, when business rules, refusals and max_tokens truncation still need handling.",
      "People wrongly assume strict tool use can be unlimited, but strict schemas have complexity limits and an unsupported feature returns a 400."
    ],
    sources: [
      "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools",
      "https://platform.claude.com/docs/en/api/errors"
    ]
  }
);
