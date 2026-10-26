window.CC = window.CC || {}; window.CC.why = window.CC.why || {};
Object.assign(window.CC.why, {
  "q1": [
    "A system prompt line cannot create memory. Claude only sees the tokens in the current request, so it has nothing to remember unless the earlier turns are actually sent.",
    "max_tokens only caps the length of the reply. It does not carry any earlier turns into the request, so context is still missing.",
    "The API key identifies your account, not a conversation. Requests are independent, so reusing a key links nothing together.",
    "The Messages API is stateless, so the app must store the conversation and send the full prior history in messages on every call to give Claude context."
  ],
  "q2": [
    "stop_reason max_tokens means generation hit the cap set in the request, so the answer may be truncated mid-sentence. Raise the limit or ask for shorter output.",
    "A natural finish is reported as end_turn. With max_tokens the model was stopped by the limit, not because it considered the answer complete.",
    "A tool request is reported as tool_use, signalling your code should run the tool and return a tool_result. It is a different stop reason.",
    "A matched custom stop sequence is reported as stop_sequence. It requires you to have supplied stop_sequences, and it is not the same as hitting the token cap."
  ],
  "q3": [
    "Exponential backoff with jitter spreads retries out over time and avoids synchronised retry storms, giving a rate-limited or overloaded service room to recover.",
    "A tight retry loop adds load exactly when the service is rate limiting or overloaded, so it keeps failing and can worsen the congestion.",
    "A retry cap stops a persistent failure from looping forever. After the cap, fail gracefully, queue the work or fall back rather than hammering the API.",
    "max_tokens limits output length and has no bearing on rate limits or capacity. The same request would still be rejected with 429 or 529."
  ],
  "a01": [
    "temperature is optional (and newer models reject non-default values). The API applies defaults, so the request is valid without it.",
    "system is optional. A request with only model, messages and max_tokens is valid.",
    "max_tokens is a required body field alongside model and messages, because you must state the maximum number of tokens to generate. The request is rejected without it.",
    "top_k is an optional sampling parameter, and newer models reject non-default values. It is not needed for a valid request."
  ],
  "a02": [
    "stop_sequences only tell the model when to halt generation. They carry no persona or behavioural instructions.",
    "metadata holds request-level information such as an end-user identifier. It is not read as instructions that shape behaviour.",
    "The model parameter only selects which model handles the request. It cannot hold instructions.",
    "The top-level system parameter is the place for role, tone and standing rules. It stays separate from user and assistant turns, so instructions are not mixed with conversation data."
  ],
  "a03": [
    "The client builds the messages array of user and assistant turns and supplies it on each request. The API is stateless and stores nothing between calls.",
    "The server does not keep or append anything. If your app omits earlier turns, Claude will not see them.",
    "messages holds a whole multi-turn history of alternating turns. A single message is only the first request of a conversation.",
    "The system prompt goes in the separate top-level system field. messages holds only user and assistant turns."
  ],
  "a04": [
    "anthropic-version is required so the API knows which API version contract to apply. SDKs add it automatically, but a raw HTTP call must set it.",
    "A JSON body is sent, so content-type: application/json is required. Without it the body cannot be parsed correctly.",
    "There is no such header. Sampling settings, where supported, are body parameters, and newer models reject non-default values anyway.",
    "The API is authenticated with an API-key header, not browser cookies. A session cookie is not a required header and does not authenticate requests."
  ],
  "a05": [
    "Exceeding a rate limit returns 429 rate_limit_error. Authentication failures are a separate class, and 401 is the authentication error.",
    "401 is authentication_error: the API key is missing, malformed, revoked or otherwise invalid. Check the key and the header it is sent in.",
    "Temporary overload is reported as 529 overloaded_error, which is a server-side, transient condition. A bad key does not return it.",
    "An oversized request returns 413 request_too_large. That is a different status code from 401."
  ],
  "a06": [
    "413 is a client-side size problem, not a transient fault. Retrying the identical oversized request will fail every time.",
    "The key is not at fault. A bad key returns 401, whereas 413 is about the payload size.",
    "max_tokens limits output, not input. Raising it makes the total demand larger, and it cannot shrink an oversized request body.",
    "413 means the request exceeds the size limit, so shrink it by trimming documents, dropping old history or using other input methods. Only a smaller request can succeed."
  ],
  "a07": [
    "400 means the request itself is invalid. Resending the same malformed body fails identically, so fix the request instead.",
    "401 means the key is missing or invalid. Retrying does not change the credentials, so fix authentication first.",
    "404 means the resource or endpoint does not exist. It is a permanent client error, so correct the URL rather than retry.",
    "429 is a transient capacity condition. Waiting with exponential backoff and jitter (and honouring retry-after) lets the limit window recover, so a retry can succeed."
  ],
  "a08": [
    "retry-after tells you how long the server asks you to wait. Waiting at least that long avoids another rejection, then backoff with jitter if failures persist.",
    "max_tokens does not affect request-rate limits. Retrying immediately ignores the server's guidance and is likely to be rejected again.",
    "More connections increase request volume against a limit you have already exceeded, so you would hit 429 more often.",
    "An immediate retry disregards the retry-after instruction and will likely fail again. Wait for the indicated time first, then back off if errors continue."
  ],
  "a09": [
    "Streaming does not change pricing. Tokens are billed at the same rate whether streamed or returned in one response.",
    "Tokens appear as they are generated, so users see output sooner without waiting for the full response. This improves perceived latency, especially for long outputs.",
    "Quality is unaffected. The model generates the same way, and streamed text cannot be revised after it has been emitted.",
    "Streaming does not add retries or delivery guarantees. A dropped stream still needs handling in your code, as partial output may have been received."
  ],
  "a10": [
    "The Messages API does not stream over WebSockets. Streaming is one-way from server to client, so a bidirectional channel is not needed.",
    "The API is HTTP/JSON, not gRPC with protobuf. Streaming events are text-based JSON payloads.",
    "Streaming uses server-sent events (SSE) over HTTP, where the server pushes typed events such as content_block_delta to the client as generation proceeds.",
    "Long polling would mean repeated requests. Streaming holds one HTTP response open and pushes events through it."
  ],
  "a11": [
    "In streaming, tool input is not delivered whole in the first event. It is built up over several events.",
    "The tool input is JSON text, not base64. Nothing needs to be decoded at the end beyond parsing the JSON.",
    "Tool inputs are JSON matching the input_schema, not XML tags.",
    "Tool input arrives as partial JSON fragments in input_json_delta events. A fragment alone is usually invalid JSON, so concatenate them and parse only after the content block stops."
  ],
  "a12": [
    "end_turn means the model decided its response was complete. Nothing was cut off, which distinguishes it from a truncation.",
    "A response truncated at the token cap reports max_tokens, not end_turn. With end_turn nothing was cut off.",
    "A tool request reports tool_use. end_turn means the model finished and does not want a tool run.",
    "A stop sequence match is reported as stop_sequence. end_turn is the natural completion reason."
  ],
  "a13": [
    "The model does not carry on past the stop sequence. Generation halts, and the stop sequence itself is not included in the returned text.",
    "Generation stops when the model would emit the sequence, and stop_reason is stop_sequence. The matched string is reported in the stop_sequence field of the response.",
    "Stop sequences are a normal, valid feature, so no 400 error is returned. They do not make the request invalid.",
    "The sequence is a halting signal, not a repetition trigger. The model stops rather than repeating anything."
  ],
  "a14": [
    "Character counts are only rough guesses. The response already gives the exact figures, so estimation is unnecessary and imprecise.",
    "A dashboard is aggregated and delayed, which is impractical for per-request accounting. Exact counts are available in each response.",
    "Each response includes a usage object with input_tokens and output_tokens, plus cache-related counts where caching is used. Log it for cost tracking and monitoring.",
    "Latency depends on load, model and output length rather than a precise token count, so it cannot be turned into reliable token usage."
  ],
  "a15": [
    "A fixed ratio is only a rough guess. Tokenisation varies with language and content, so the result may be badly off.",
    "Stop sequences end generation, not input processing. They do not report prompt size, and the request would still be processed and billed.",
    "The context window is only a ceiling. Knowing it does not tell you how many tokens your prompt uses, so it could overflow or be larger than expected.",
    "The token counting endpoint returns the input token count for a request without generating a reply. It is intended for pre-flight checks, though the figure should be treated as an estimate."
  ],
  "a16": [
    "Batches are asynchronous and discounted (documented as 50 percent off standard pricing), which suits a large, non-urgent overnight job. Results come back after the batch ends.",
    "A tight loop of synchronous calls pays full price and keeps hitting rate limits, giving a slower, costlier and more fragile pipeline.",
    "Streaming improves perceived latency, which does not matter for an overnight job. It does not reduce cost.",
    "Parallel real-time calls pay full price and risk running into rate limits. Real-time capacity is wasted when nobody is waiting for results."
  ],
  "a17": [
    "A batch is asynchronous, so the submit call only returns a batch object. Individual results are not available until processing finishes.",
    "Once the batch has ended, you retrieve the results, which may come back in any order, and match each one to its request through the custom_id you assigned.",
    "Batch results are not pushed over SSE. You poll the batch status and fetch the results afterwards.",
    "Batches do not write anything into conversations. Results are retrieved through the batch results endpoint and your code uses them."
  ],
  "a18": [
    "temperature controls sampling, not caching. Identical requests do not get cached by being deterministic, and newer models reject non-default values anyway.",
    "stop_sequences only control when generation halts and have no effect on caching.",
    "cache_control breakpoints mark the end of a prefix that can be cached, so later requests with the same prefix are read from the cache at a lower cost.",
    "tool_choice controls whether and which tool is called. It is not a caching mechanism."
  ],
  "a19": [
    "Caching matches an exact prefix from the start. Content placed after dynamic text changes with each request, so the prefix never matches.",
    "Dynamic sections in between alter the prefix on every request, so nothing after the first change can be matched.",
    "Tool results are generated mid-conversation and normally vary. Static material such as system prompt and reference documents is where caching pays off.",
    "Caching works on an exact prefix, in the order tools, system, messages. Putting stable content first and variable content last maximises how much of the prefix is reused."
  ],
  "a20": [
    "The cache is keyed on an exact prefix, so one changed early character invalidates that point and everything after it. The content is reprocessed and written to the cache again.",
    "Matching is exact, not fuzzy. Even a tiny edit changes the prefix, so small differences do not reuse the cache.",
    "Because the prefix is cumulative, later content depends on everything before it. A change early on breaks the match for all content after it.",
    "The API does not ignore the change. It treats the edited prefix as new content and simply gets a cache miss."
  ],
  "a21": [
    "Cache entries are short-lived and not tied to the calendar day. The default lifetime is measured in minutes.",
    "The default ephemeral lifetime is a few minutes (5 minutes), and each cache hit refreshes it. A longer 1-hour option is available at extra cost.",
    "Cache lifetime is not tied to API key rotation. It expires through time-to-live and is refreshed by use.",
    "The point of caching is reuse across requests. An entry lasts beyond a single request, otherwise later requests could not read from it."
  ],
  "a22": [
    "A polite request and regex extraction can fail whenever the reply includes extra text or malformed JSON. Nothing enforces valid JSON.",
    "A system prompt instruction improves compliance but does not guarantee it. Passing output downstream unvalidated risks parse errors and bad data.",
    "Structured outputs constrain generation to a JSON schema, and strict tool use does the same for tool inputs. Validating business rules in code is still sensible even when the schema is guaranteed.",
    "Prefilling is rejected on Claude 4.6 and later models, and on older ones it does not guarantee valid JSON. Skipping validation is risky either way."
  ],
  "a23": [
    "That describes auto behaviour at best. 'any' removes the choice and forces a tool call.",
    "Forcing one named tool uses type 'tool' with a name. 'any' lets the model pick which tool, but it must pick one.",
    "There is no refuse-first behaviour. Tool availability is not gated on refusals.",
    "With type 'any' the model must call one of the supplied tools and cannot reply with plain text only. This forcing is not supported on every model or setting."
  ],
  "a24": [
    "auto is the default setting. The model decides whether a tool call is useful for the request, and may answer directly in text.",
    "'any' forces some tool call rather than letting the model decide, so it removes the choice.",
    "'tool' forces one specific named tool, so the model has no discretion.",
    "'none' stops the model from using tools at all. It also removes the decision, in the opposite direction."
  ],
  "a25": [
    "Failing the request hurts the user experience and loses the conversation. Context limits can be managed in the design.",
    "Summarising or trimming older turns while keeping recent turns and key facts keeps the conversation within the window. Retrieval, context editing and compaction are other options.",
    "max_tokens limits output only. It does not shrink the input, and more output room cannot fix an input that is already too long.",
    "temperature affects sampling randomness, not how much context is used. It has no effect on context size, and newer models reject non-default values."
  ],
  "a26": [
    "Obfuscation does not protect a key. Anyone can extract it from a compiled bundle or from traffic and then run up your spend.",
    "An IP restriction is not a dependable control here, since users' IPs vary and requests can be proxied. The key still ships inside the client.",
    "Calls from your own backend keep the key server-side. The backend can authenticate users, apply per-user rate limits and cost caps, and log usage.",
    "Rotating nightly does not stop abuse during the day. The shared key is still exposed in the client, so the problem remains."
  ],
  "a27": [
    "Speed does not depend on whether you use a pinned ID or an alias. They differ in what they resolve to over time.",
    "Aliases can be used with tool calling. Tools are not a reason to pin.",
    "Pinning fixes which model snapshot you get, but sampling means outputs for the same prompt can still vary. It does not guarantee identical outputs.",
    "A pinned model ID keeps behaviour stable, so you can run evals on a newer model and upgrade deliberately instead of being surprised by a silent change."
  ],
  "a28": [
    "Using Claude through a cloud provider lets you fit existing billing, IAM, networking and compliance controls. This is a common reason for enterprise adoption.",
    "These are cloud-hosted services and still need a cloud account. They do not run in your own data centre.",
    "Feature availability can differ by platform and over time, so no platform can be assumed to get every new feature first. Check each platform's docs.",
    "Prompt design remains your responsibility on any platform. The platform does not tune your prompts."
  ],
  "a29": [
    "Removing timeouts leaves connections hanging and resources tied up, and gateways may still cut the connection. It hides the problem.",
    "Streaming keeps the connection active as tokens arrive, and an async job with a completion notification avoids a long blocking request. Both avoid HTTP timeouts.",
    "A tiny max_tokens truncates the output, which breaks the feature instead of fixing latency.",
    "Retrying the same call adds load and can hit the same timeout every time. The cause, a long blocking request, remains."
  ],
  "a30": [
    "Encryption helps, but logging everything indefinitely violates data minimisation and increases breach exposure. Retention limits are needed. Check regulated data with your Data Privacy Officer.",
    "Logging nothing makes debugging and audit very hard. The goal is useful logs with sensible controls, not none at all.",
    "Redacting or minimising sensitive data and setting retention limits keeps logs useful for debugging while reducing privacy risk. For regulated data, consult your Data Privacy Officer.",
    "Without any logs you cannot diagnose failures or investigate incidents, and you depend on users to report problems."
  ],
  "a31": [
    "system carries instructions, not images. Image data belongs in a content block within the messages.",
    "metadata is for request-level information such as a user identifier. It cannot carry image input.",
    "stop_sequences are strings that halt generation and have nothing to do with inputs.",
    "Images are sent as image content blocks (base64 or URL source) inside the content of a user message, alongside any text blocks."
  ],
  "a32": [
    "529 overloaded is transient capacity pressure. Backing off with exponential delay and jitter lets it clear, and a fallback model or graceful degradation keeps the app usable meanwhile.",
    "Overload is temporary. Treating it as permanent turns a short blip into a long outage for users.",
    "The key is not the problem, since overload is not an authentication error. Rotating it does nothing and may break other things.",
    "A tight loop adds load to an already overloaded service and invites further rejection. It makes recovery slower."
  ],
  "s1a": [
    "Moving the policy to the end of each message changes the prefix every turn, so nothing can be cached. It also keeps resending the document in full at full price.",
    "A stable policy prefix with cache_control lets later turns read the repeated tokens from the cache at a lower cost and latency, with no change to behaviour.",
    "A shorter summary may lose rules the model needs, which changes behaviour. Resending it uncached also still costs more than reading from cache.",
    "Dropping earlier turns loses conversation context, which changes behaviour. Without caching, the full policy is still reprocessed every time."
  ],
  "s1c": [
    "Backoff with jitter spaces retries out, and honouring retry-after respects the server's own guidance on when to try again.",
    "Immediate parallel resends add load while you are already over the limit, which prolongs the 429 errors rather than getting ahead of them.",
    "Queueing and rate limiting on the backend smooth traffic to fit capacity, and graceful degradation keeps users informed during a spike.",
    "Temperature has no effect on rate limits. A retry changed in that way is still counted and may produce a different answer, while newer models reject non-default values."
  ],
  "s2b": [
    "Structured outputs constrain generation to a JSON schema, and strict tool use does the same for tool inputs, so the fields are parseable and typed. Validate business rules downstream in code.",
    "Prompt instructions and an example improve compliance but give no guarantee, so occasional malformed output will break json.loads in production at this volume.",
    "Markdown tables need fragile parsing and lose types and nesting, such as line items. Formatting drift can break the conversion.",
    "CSV is not easier to make reliable. It handles nested line items and embedded commas poorly, and nothing enforces the format."
  ],
  "s3c": [
    "Retrieving fewer, better-ranked chunks and trimming them to what the question needs keeps the most relevant evidence within the window, and cuts cost and noise too.",
    "Blindly truncating at the limit can cut off relevant passages, or the end of the context, based on position rather than relevance.",
    "Separate per-page questions lose cross-document context and concatenated answers may conflict or repeat. The approach also multiplies calls and cost.",
    "A larger window does not fix irrelevance. Sending every match adds cost, latency and noise, and can still overflow on big queries."
  ],
  "s6b": [
    "An alert after the budget is passed is reactive and global. It does not stop one user from running up spend in the meantime.",
    "Client-side checks are easily bypassed by anyone who calls your backend or the API directly, so they do not enforce limits.",
    "A global cap is a blunt control. One heavy or abusive user can use up the whole allowance and block everyone else.",
    "Per-user quotas and rate limits enforced on the backend cap each user's request volume, and a max_tokens limit bounds the cost of each request."
  ],
  "s6c": [
    "A larger model is usually slower per token and costs more. It does not make long drafts finish sooner.",
    "Waiting for the whole response keeps users staring at a spinner for the full generation time, which is exactly what they dislike.",
    "Streaming displays text as it is generated, so users see output within moments. Total generation time is unchanged, but perceived latency drops sharply.",
    "A very low max_tokens truncates drafts, which makes the feature worse. It trades quality for speed that users did not ask for."
  ]
});
