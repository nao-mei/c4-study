window.CC = window.CC || {}; window.CC.why = window.CC.why || {};
Object.assign(window.CC.why, {
  "q6": [
    "tool_use means the model is asking for a tool to be run, not delivering a final answer. Stopping here would leave the request unanswered and the task incomplete.",
    "Correct: the model only requests the call. Your code runs the tool, returns a tool_result in the next user message, and calls the model again so the loop can continue.",
    "tool_use is a normal, expected stop reason, not a failure. Resending the same request unchanged would just make the model ask for the same tool again, with no progress.",
    "Running the tool is right, but starting a fresh conversation drops the history, including the tool_use block the result must answer, so the model loses all task context."
  ],
  "q7": [
    "An open-ended agent adds latency, cost and unpredictability for a task whose steps are already known. Autonomy is only worth it when the steps cannot be predefined.",
    "Orchestrator-workers suits tasks where subtasks cannot be known in advance, so a central model decides them dynamically. Here the three steps are fixed.",
    "Correct: a fixed sequence where each step's output feeds the next is the textbook case for prompt chaining, trading a little latency for higher accuracy per step.",
    "Evaluator-optimizer loops generate and critique until quality criteria are met. Nothing in this extract, summarise, translate pipeline calls for iterative critique."
  ],
  "q8": [
    "Auto-approving every tool call removes human oversight, which is the opposite of a safeguard, and does nothing to stop a loop that runs away.",
    "A better description of the task may improve behaviour but does not bound the loop. A prompt cannot guarantee the agent ever terminates.",
    "Correct: a hard cap on iterations, tokens or time is a stopping condition enforced in code, so a confused agent cannot loop forever or run up unbounded cost.",
    "Unbounded retries are themselves a runaway-loop risk, and a persistent failure will never succeed. Retries should be capped and the error surfaced."
  ],
  "q9": [
    "Correct: an explicit schema or format specification tells the model exactly which fields and structure to produce, which is the baseline for consistent structured output.",
    "Correct: few-shot examples show the exact shape and style expected, which often removes ambiguity that a written description leaves open. Format instructions plus examples is the reliable pairing.",
    "Asking for creativity in layout invites variation, the opposite of consistency. Downstream parsers need a stable structure.",
    "Letting the model choose a natural format gives different structures from run to run, so parsing breaks. Specify the format instead."
  ],
  "q10": [
    "System prompt content is treated as trusted instructions, so untrusted documents placed there could be followed as commands. Document text belongs in the user turn, clearly delimited.",
    "Capital letters add emphasis but no structure, and aggressive emphasis can cause overreaction on current models. It does not tell the model where data ends.",
    "Without markers the model can mistake document text for instructions, or the reverse. Unmarked concatenation is the weakest layout.",
    "Correct: labelled XML-style tags let Claude distinguish instructions from data and reduce misinterpretation. They are not a security boundary, so still treat document content as untrusted."
  ],
  "g01": [
    "This reverses the definitions. Workflows are the ones that follow predefined code paths, while agents decide their own steps.",
    "Correct: workflows orchestrate LLMs and tools through predefined code paths, whereas agents dynamically direct their own process and tool use. That autonomy is the key distinction.",
    "Both can involve many model calls. An agent is not a single call, and the distinction is who controls the flow, not the number of calls.",
    "Parallel versus sequential execution is not the dividing line. Workflows can be sequential chains, and agents can run tools in parallel."
  ],
  "g02": [
    "That describes a fallback or retry strategy. Routing classifies the input and chooses a destination, rather than retrying a failure.",
    "That describes parallelisation (sectioning), where independent subtasks run concurrently. Routing sends one input to one specialised path.",
    "That describes evaluator-optimizer, where a second call critiques and refines the first output. Routing does not iterate on outputs.",
    "Correct: routing classifies an input and directs it to a specialised prompt, model or tool, which lets each path be optimised separately."
  ],
  "g03": [
    "Dependent steps must run in order, which is prompt chaining. Parallel calls cannot start until their inputs exist.",
    "Correct: parallelisation fits independent subtasks (sectioning) or repeated attempts whose results are compared (voting) for higher confidence, finishing faster or more reliably.",
    "A small task that fits one prompt gains nothing from splitting. Parallel calls would only add cost and complexity.",
    "Parallel calls do not make output deterministic, and voting actually combines varied outputs. Auditability needs logging and controls, not parallelism."
  ],
  "g04": [
    "Correct: the orchestrator is an LLM that decides at run time which subtasks are needed, delegates them to workers, and synthesises the results. That dynamic decomposition is the defining feature.",
    "A developer-defined fixed sequence is prompt chaining. In orchestrator-workers the subtasks are not known in advance.",
    "Validation and formatting is far narrower than the orchestrator's role. Its main job is planning and delegating the work, not just tidying the output.",
    "Classifying once and passing to one handler is routing. The orchestrator breaks work into several subtasks and combines the results."
  ],
  "g05": [
    "Independent answers combined by majority is voting, a form of parallelisation. Evaluator-optimizer is a sequential generate-then-critique loop.",
    "Splitting a task across parallel workers is sectioning or orchestrator-workers. It has no critique-and-refine feedback loop.",
    "Correct: one call generates, another evaluates against criteria and gives feedback, and the output is refined iteratively. It works best when criteria are clear and iteration measurably helps.",
    "A fixed one-way chain is prompt chaining. Evaluator-optimizer feeds critique back to the generator, so it loops rather than flowing one way."
  ],
  "g06": [
    "An unhandled exception wastes all progress, and a restart repeats earlier work and may repeat side effects. Tool failures should be caught and handled gracefully.",
    "Silently dropping a failed call leaves the model believing it succeeded, so it may build on missing data and give a wrong answer. Failures must be visible to it.",
    "Unlimited retries can loop forever on a permanent error, burning cost, and may duplicate side effects. Retries should be bounded.",
    "Correct: returning the error as a tool_result with is_error lets the model read what failed and retry differently or choose another approach, with retries still capped."
  ],
  "g07": [
    "Correct: hard limits on iterations, tokens or time are enforced in code, so a looping or confused agent cannot spend without bound. Always bound agent loops.",
    "Temperature controls sampling randomness, not how many steps the agent takes, and current models may reject non-default values anyway. It is not a cost guard.",
    "More tools do not shorten runs and can worsen tool selection and context bloat. They do nothing to cap spend.",
    "A prompt instruction is a request, not an enforced limit. A stuck agent can ignore it, so it cannot guarantee termination."
  ],
  "g08": [
    "Concise tool output does not change sampling determinism. The motive is context economy, not randomness.",
    "Readability for end users is a UI concern. The reason to trim tool results is the model's finite context and attention.",
    "Correct: bulky tool output fills the context window, raises cost and latency and distracts the model from the task. Returning only high-signal information keeps long runs effective.",
    "Output length does not stop the model repeating a tool call. Repetition is controlled with loop limits and good tool design."
  ],
  "g09": [
    "Correct: deleting data or moving money is hard or impossible to undo, so a human should confirm first. Approval gates stop an error or injected instruction becoming irreversible harm.",
    "Logging helps after the fact, but it cannot reverse an irreversible action. Review after the damage is done is not a safeguard.",
    "Running a destructive action twice doubles the harm and compares nothing useful. Repetition is not verification.",
    "A larger model is still fallible and can still be manipulated. Skipping confirmation removes the control that matters for high-impact actions."
  ],
  "g10": [
    "Correct: agents trade latency and cost for flexibility and can compound errors across many steps, so use the simplest pattern that works and add complexity only when it measurably helps.",
    "Overstated. Simple patterns are cheaper and more predictable, but agents can outperform them on open-ended tasks. Complexity is justified only by measured gains.",
    "False: agents can use the same tools as workflows. The difference is who decides when to call them.",
    "Agents run autonomously by design, with human checkpoints used selectively for risky actions. Per-step approval is not inherent."
  ],
  "g11": [
    "Subagents do not change per-token pricing, and total token use usually rises with several contexts. The benefit is context management.",
    "Subagents still need tools defined for their tasks. Delegation does not remove that setup.",
    "Correct: each subagent works in its own clean context and returns a condensed result, so the lead agent's context stays focused, and independent subtasks can run in parallel.",
    "Delegation gives no correctness guarantee. Subagent output can still be wrong or incomplete and needs validation or review."
  ],
  "p01": [
    "Near-identical examples teach one narrow pattern, so the model may copy it and fail on varied inputs. Examples need diversity.",
    "Only easy cases leave the model unprepared for edge cases and harder inputs in production. Examples should reflect the real task spread.",
    "More examples are not always better. Heavy overlap wastes tokens and encourages overfitting to surface wording, so quality and variety beat quantity.",
    "Correct: relevant, diverse and representative examples help the model generalise the underlying pattern, including edge cases, instead of copying one instance."
  ],
  "p02": [
    "For long documents, putting the question first tends to give weaker results. Placing the data before the query tends to perform better.",
    "Correct: longform data goes at the top, with the question or task at the end. Docs report this ordering can noticeably improve response quality, especially with long, complex inputs.",
    "Embedding the question inside the document muddles data and task, and leaves the instruction unclear. Keep them clearly separated.",
    "Splitting the document across turns fragments the context, and placing the question first is the weaker ordering. One coherent prompt with the query last works better."
  ],
  "p03": [
    "Correct: positive instructions say what to do, giving the model a target. A list of prohibitions alone leaves the desired behaviour unspecified, so telling Claude what to do is generally more effective.",
    "Background on goal and audience is helpful, not weaker. Context and motivation improve responses, so this is a complement rather than a worse option.",
    "Specifying output format is a recommended practice and works well alongside positive instructions. It is not the weaker approach.",
    "Examples of ideal responses are among the strongest steering tools. They do not underperform positive instructions."
  ],
  "p04": [
    "A role does not change the maximum output length. That is set by max_tokens and model limits.",
    "Caching is a separate feature enabled with cache controls. Adding a role does not cache anything.",
    "A role does not switch off safety behaviour. Role prompts steer persona and expertise, not policy.",
    "Correct: a role in the system prompt focuses the model's behaviour, tone and domain framing, such as answering as a security auditor, without changing its capabilities."
  ],
  "p05": [
    "Answer-first, justification-later gives the model no chance to reason before committing, so the justification is just rationalising a guess. Reasoning needs to precede the answer.",
    "Forcing a one-line answer cuts off reasoning, which usually hurts accuracy on multi-step problems. Brevity does not prevent errors.",
    "Correct: letting the model reason before answering improves hard tasks. On current models this usually means enabling thinking with a general nudge such as think thoroughly, and step-by-step prompts are a fallback when thinking is off.",
    "A very low max_tokens truncates the output and can remove the answer itself. It does not improve accuracy."
  ],
  "p06": [
    "Prefill does not change the context window, which is a fixed model limit. It only supplies the start of the reply.",
    "Correct on models that support it: starting the assistant turn with an opening token such as an open brace nudges the response into JSON immediately. It is not supported on Claude 4.6 and later, where structured outputs or format instructions are used.",
    "Prefill is not a caching mechanism. Cost savings from reuse come from prompt caching on a stable prefix.",
    "Prefill does not control tool use. Tool availability is configured with tools and tool_choice, not with assistant-turn text."
  ],
  "p07": [
    "Version control does not reduce token cost, and the API does not deduplicate prompt text. Cost savings come from caching and trimming.",
    "The model has no memory of earlier prompt versions between requests, so version history is for your team, not for the model.",
    "Correct: prompts are code-like assets. Versioning lets you track changes, tie them to eval results, compare versions and roll back quickly when a change causes regressions.",
    "Prompts should evolve. Freezing them blocks improvement, whereas versioning with evals makes change safe."
  ],
  "p08": [
    "Correct: relevance beats volume. Passing only the most relevant chunks keeps the context focused, and citations let users and reviewers verify claims against sources.",
    "Filling the window with chunks ordered by date dilutes relevance and adds noise, cost and latency. Date is not a relevance signal.",
    "Removing sources hides provenance, so answers cannot be verified, which increases hallucination risk and lowers trust. Keep attribution.",
    "Reusing the same chunks for every question ignores that each question needs different passages. Retrieval should run per query."
  ],
  "p09": [
    "Resending an ever-growing history is what causes the degradation: long contexts dilute attention and raise cost. More history is not better.",
    "Correct: curate context by summarising earlier turns and keeping key facts in a stable notes block. Compaction and structured notes counter context rot in long conversations.",
    "Moving all turns into the system prompt unchanged keeps the same bulk, just relocated. The context stays long and noisy.",
    "max_tokens limits the reply, not the history. A shorter reply does nothing about a bloated, noisy input context."
  ],
  "p10": [
    "Forcing confident answers pushes the model to guess when it lacks evidence, which increases hallucination. Allowing uncertainty reduces it.",
    "Removing context makes the model rely on memory, where hallucination is most likely. Grounding in sources is the remedy.",
    "Correct: supply source material, tell the model to answer only from it, and explicitly permit I don't know when the sources do not support an answer.",
    "Higher temperature increases randomness and does not improve factuality, and current models may reject non-default values. It makes errors more likely."
  ],
  "p11": [
    "Correct: stating audience, goal and success criteria gives the model the context it would otherwise guess at, reducing ambiguity and improving relevance and fit.",
    "The model cannot reliably infer intent from a bare task. Missing context leads to generic or misaimed output, so being explicit pays off.",
    "Adding context to the user turn does not prevent caching, and stable system content can still be cached. This is not a real trade-off.",
    "Good context improves the quality of the result rather than padding it. Length may change, but the main effect is relevance."
  ],
  "g12": [
    "Correct: writing notes or state to external storage, then reloading what is relevant, gives the agent memory beyond the context window. Structured note-taking supports long-horizon tasks.",
    "Everything in one conversation eventually exceeds the window, and attention degrades as it fills. Relying on retrieval from raw history is unreliable.",
    "Restarting with fresh context discards the findings, and the model cannot recall earlier steps it no longer sees. State must be persisted.",
    "Temperature has nothing to do with retaining information across context limits. Findings the model cannot see cannot be repeated."
  ],
  "g13": [
    "Retrying the whole workflow redoes finished steps, wasting cost and possibly repeating side effects. A crash needs resumption, not repetition.",
    "Duplicate parallel runs double the cost and may duplicate side effects, and both can fail. It does not provide recovery.",
    "Storing only the final answer means nothing is saved if the crash happens before it exists, forcing regeneration of every earlier step.",
    "Correct: checkpointing state after each step lets the workflow resume from the last completed step rather than restarting, saving cost and time."
  ],
  "g14": [
    "Gates are programmatic checks, not delays. Slowing a run does not make errors visible or prevent them.",
    "Choosing a model by difficulty is routing, not a gate. A gate checks the output before the next step proceeds.",
    "Correct: a gate is a programmatic check, such as validating format or required fields, between chain steps. It catches errors early so bad output is not passed down the chain.",
    "Caching reuses results, but a gate verifies them. Caching a bad intermediate output would just propagate the error."
  ],
  "g15": [
    "A short FAQ over a fixed knowledge base is simple and cheap as a single call. Multi-agent overhead would add cost with no benefit.",
    "Correct: multi-agent designs suit breadth-first work with independent subtasks, where parallel agents with separate contexts speed things up. They cost more tokens, so reserve them for high-value tasks.",
    "A sub-second single-step classification is best served by one fast call. Orchestrating several agents adds latency.",
    "A fixed pipeline where steps depend on each other is prompt chaining, not multi-agent. Tightly dependent work is a poor fit for parallel agents."
  ],
  "g16": [
    "Correct: multi-agent runs use several times the tokens of a chat, so reserve them for tasks whose value justifies the spend, and track cost per run to confirm it pays off.",
    "Quality gains do not automatically outweigh cost. Spend must be justified per use case, or the system is not viable.",
    "Overstated: single prompts are cheaper but cannot handle breadth-heavy tasks well. The answer is to weigh cost against value.",
    "Temperature does not control token consumption, and it would not shorten multi-agent runs. Cost is managed through design and budgets."
  ],
  "g17": [
    "Correct: tracking repeated identical calls, capping retries, then forcing a change of strategy or escalating to a human detects and breaks loops before they waste cost.",
    "Removing logging hides the problem from you and does not help the agent. Observability is how loops are detected.",
    "Raising max_tokens only gives a longer response limit. A stuck agent will keep repeating the same action with more room.",
    "Overlapping tools worsen selection and add noise. Alternatives will not help if the agent has no mechanism to notice it is repeating itself."
  ],
  "g18": [
    "A 20,000-token transcript floods the lead agent's context with detail it does not need, raising cost and diluting focus. Keep hand-offs condensed.",
    "Rerunning the subtask wastes the work already done and defeats delegation. The result is useful, just too verbose.",
    "Correct: a concise summary of key facts and sources gives the lead agent what it needs while preserving its context budget. Subagents act as condensing filters.",
    "A bigger context allowance does not remove cost or distraction from bloated input, and context quality still degrades. Condense instead of enlarging."
  ],
  "g19": [
    "Reading a public page is low-risk and reversible, so approval would only slow the agent down. Gates are for consequential actions.",
    "Summarising an internal document is a read-and-write-text task with no irreversible effect, so it does not need mandatory approval.",
    "Reformatting output is harmless and easily redone, so approval adds friction with no safety benefit.",
    "Correct: deleting data or making payments are hard to undo and high impact, so a human should approve first. Gate actions by risk and reversibility."
  ],
  "g20": [
    "Open-ended, context-dependent decisions are where an LLM adds value, since rigid code cannot cover them.",
    "Correct: when a rule is simple, known and testable, such as a numeric threshold, plain code is cheaper, faster, deterministic and verifiable, so spend no LLM call on it.",
    "Widely varying inputs that cannot be enumerated are exactly where fixed rules fail and a model's flexibility helps.",
    "A rapidly changing rule based on live signals still needs a defined logic. This option is weak, but it does not describe a simple, known, testable rule."
  ],
  "g21": [
    "Verification does not replace reasoning. The model still needs to reason to produce and fix code, and tests only judge the result.",
    "A passing run does not replace evals, which cover many cases and catch regressions over time. One pass proves little.",
    "Correct: running tests or similar checks gives the agent objective ground-truth feedback from the environment at each step, so it can detect failures and correct itself.",
    "Verification adds a feedback signal, not fewer tools. Tool needs depend on the task, not on whether outputs are checked."
  ],
  "g22": [
    "Intermediate steps are exactly where agent failures arise, such as a wrong tool call or bad parse. The final answer alone hides the cause.",
    "Correct: a step-level trace of prompts, tool calls, results and decisions shows where a run went wrong, which is why full production tracing is essential for diagnosing agent failures.",
    "Aggregate daily usage shows cost trends, not which step failed in a given run. It cannot pinpoint a specific failure.",
    "Model name and temperature give configuration, not behaviour. Without seeing the steps, you cannot tell what actually happened."
  ],
  "g23": [
    "Judging only the final answer misses agents that reach it through unsafe, wasteful or lucky paths. Process matters, within reason.",
    "One successful run says nothing about reliability across inputs. Agents are variable, so evaluation needs many runs.",
    "Model size and public benchmarks do not predict performance on your task and tools. Evaluate on your own cases.",
    "Correct: judge outcomes first, plus reasonable process such as tool use, step count and cost where useful. End-state evaluation avoids over-constraining the path."
  ],
  "g24": [
    "Correct: overlapping or near-duplicate tools make selection ambiguous and their definitions consume context. Smaller, distinct toolsets improve selection and save tokens.",
    "Overlap makes routing less clear, not more precise, because the model must choose among similar tools. Distinct tools are more reliable.",
    "Every tool definition costs tokens, so duplicates raise cost rather than share it.",
    "More ways to finish do not speed things up. Ambiguity tends to cause wrong calls and extra steps."
  ],
  "g25": [
    "Planning does not replace tools. A plan is a structure for the work, and tools are still needed to act on the world.",
    "No API rule requires a planning step before tool calls. Planning is an optional technique.",
    "Correct: planning lets the agent decompose a complex task, set an approach and surface assumptions before acting, while still adapting as tool results arrive.",
    "A plan should not lock in the number of tool calls. Good agents revise the plan as new information appears."
  ],
  "g26": [
    "Broad admin rights enlarge the blast radius of any mistake or injected instruction. Least privilege is the safer default.",
    "An agent approving its own actions is not an independent control. Self-approval gives no real oversight.",
    "Fixing after incidents accepts avoidable harm. Controls should prevent or limit damage before it happens.",
    "Correct: layered defences, namely reversible actions, sandboxing, scoped permissions and audit logs, limit what a mistake can do and make it traceable."
  ],
  "g27": [
    "A note about frustration gives the human no facts, so the customer must repeat everything. Hand-offs should carry the substance.",
    "Correct: a concise summary of the issue, steps already taken and relevant data lets the human continue immediately without making the customer start over.",
    "Raw logs and every prompt bury the key facts in noise, so the human cannot find what matters quickly. Hand-offs should be curated.",
    "Raw internal reasoning is long, unreliable as a record and not designed for humans. A clear summary of facts and actions is more useful."
  ],
  "g28": [
    "Deleting the system prompt and tool definitions would strip the agent of its instructions and capabilities. Compaction targets conversation history.",
    "Truncating without summarising throws away decisions and facts, so the agent loses information it may need later. Compaction summarises.",
    "Correct: compaction summarises earlier steps, keeping decisions and key facts and discarding noise, so a long run stays within the window and stays focused.",
    "Model switching is a cost or routing decision. It does not reduce context size and would not preserve earlier information."
  ],
  "g29": [
    "More than one tool call does not require an agent. A workflow can orchestrate multiple tool calls through predefined paths.",
    "Correct: move to an autonomous agent only when steps cannot be predefined and the added flexibility measurably improves outcomes, since agents add cost, latency and compounding error.",
    "High cost is a reason to simplify, not to add autonomy. Agents typically cost more than workflows.",
    "Agents are not a maturity stage of workflows. They are a different trade-off, and workflows are often the better solution."
  ],
  "g30": [
    "If the critic's standards must be inferred, its feedback is unreliable and iteration may drift. The pattern needs clear criteria.",
    "If a single pass is enough, the loop adds cost without benefit. The pattern pays off only when iteration measurably improves the output.",
    "A shared prompt makes evaluator and generator agree by construction, defeating independent critique. The evaluator needs its own criteria.",
    "Correct: evaluator-optimizer works when clear evaluation criteria exist and iteration measurably improves the output, as with a human-like refinement loop such as literary translation."
  ],
  "p12": [
    "Phrases like as well as you can and engaging are vague. The model must guess length, audience and structure.",
    "Short and professional does not say how short or what structure. Ambiguity remains about length and format.",
    "Make it as good as you can leaves quality, audience and format to guesswork, so results vary between runs.",
    "Correct: specifying length, language, form and a closing recommendation leaves little ambiguity, so output is consistent and meets the need. Be specific about format and constraints."
  ],
  "p13": [
    "Correct: models do not reliably ask unless told. State when to ask clarifying questions and how, for example only when the ambiguity would change the outcome.",
    "Temperature changes randomness, not whether the model asks questions, and current models may reject non-default values. It leads to more guessing.",
    "Removing context does not prompt clarification. It just gives the model less information and invites worse guesses.",
    "Models often proceed with a best guess rather than ask. Relying on default behaviour is not dependable, so spell out the behaviour you want."
  ],
  "p14": [
    "Correct: clear structure with headings or tags, restating only the truly critical rules, and testing the result keeps important instructions findable without drowning the prompt.",
    "Repeating everything several times bloats the prompt and dilutes priority, so critical rules compete with noise. Targeted emphasis works better than volume.",
    "Heavy capitals can make the model overreact on current models and do not fix poor organisation. Aggressive emphasis is discouraged.",
    "Splitting into separate requests loses the shared context and multiplies cost, and rules may then conflict. Better to structure one prompt."
  ],
  "p15": [
    "Ad hoc concatenation scatters prompt logic through code, making it hard to test, review and secure against mixing data with instructions.",
    "Hard-coding per segment multiplies prompts to maintain and drifts over time. A single parameterised template is easier to manage.",
    "Correct: a template with clearly delimited slots keeps instructions stable, makes variables explicit and testable, and helps keep user data separated from instructions.",
    "Hand-editing long strings is error-prone, hard to version and invites mistakes each time data changes."
  ],
  "p16": [
    "Correct: XML-style tags separate instructions, documents and examples, so the model can tell them apart and misreads less. They are structure, not security.",
    "Tags are plain text and offer no encryption, so the model can read everything inside them. Sensitive data needs real protection, and personal data questions should go to your Data Privacy Officer.",
    "Tags add tokens rather than reduce them, and do not compress text. Their purpose is clarity.",
    "Tags do not enforce or validate output format. Schema enforcement needs structured outputs or your own validation."
  ],
  "p17": [
    "A single example makes the surface wording even more salient, so copying gets worse. Variation across examples helps the model see the pattern.",
    "Repeating the same example reinforces its wording and encourages exact copying. This worsens the overfitting.",
    "max_tokens only caps length. More room does not change whether the model imitates the examples.",
    "Correct: diverse examples, framed as illustrating a pattern rather than text to reuse, steer the model towards the underlying structure instead of copying wording."
  ],
  "p18": [
    "System prompts are not ignored in long chats, and putting everything in the user turn loses the clean separation of persistent rules from changing input.",
    "Correct: persistent role, rules and format belong in the system prompt, while per-request data goes in the user turn. This is clearer and supports caching of the stable part.",
    "This reverses the roles. Variable data in the system prompt changes the prefix each time, hurting caching and clarity, and rules repeated per turn waste tokens.",
    "A first assistant message is not designed for instructions, and it is no more persistent than the system prompt. The system prompt is the right place."
  ],
  "p19": [
    "Shipping after a read-through skips testing on varied inputs, so failures show up in production. Prompts need measured evidence of quality.",
    "Intuition is useful but biased and cannot catch regressions. Even small test sets give objective evidence.",
    "Correct: treat prompts as engineered artefacts. Test on varied inputs, inspect failures, adjust and re-run the eval set to confirm improvements and check for regressions.",
    "Using live traffic as the test bed exposes real users to failures and gives noisy, delayed signal. Test before release."
  ],
  "p20": [
    "Exhaustive and brief pull in opposite directions, so the pair does not set a balanced range. It leaves the model guessing which to prioritise.",
    "This is not few-shot prompting, which teaches by example. Contradictory adjectives teach nothing about target length.",
    "The model will not reliably average the two. Behaviour is unpredictable and varies between runs.",
    "Correct: contradictory instructions create ambiguity. Resolve them, for instance by giving a target length or stating which takes priority."
  ],
  "p21": [
    "Correct: asking the model to first extract relevant quotes, then answer from them, grounds the response in the actual text and reduces drift or invention.",
    "A paraphrase can introduce distortions that the answer then inherits. Quoting the original text is more faithful.",
    "Forbidding quotes and relying on general knowledge detaches the answer from the source, which increases hallucination.",
    "Answering first and citing from memory invites fabricated or mismatched citations. Grounding must come before the answer."
  ],
  "p22": [
    "Early constraints do not stay equally weighted in long chats. Drift is a known effect of long contexts, so ignoring it lets the problem grow.",
    "Correct: restate key constraints in the system prompt or periodically summarise the current state, so important rules stay fresh in a long conversation.",
    "Temperature does not help the model recall constraints, and current models may reject non-default values. It would only add randomness.",
    "Deleting history every turn removes all context, so the assistant forgets the conversation. Curate or summarise rather than discard."
  ],
  "p23": [
    "Correct: defined labels with examples and a rule to output exactly one label remove ambiguity and give consistent, machine-readable results, then validate on evals.",
    "Letting the model invent labels breaks the fixed label set, so downstream code gets unpredictable categories.",
    "A ranked list with reasons is not a single classification and is harder to parse. It does not meet a fixed-label requirement.",
    "Names alone are ambiguous at the boundaries, so different runs interpret them differently. Definitions and examples resolve edge cases."
  ],
  "s1d": [
    "Looping on a refund until it succeeds risks duplicate refunds if a timeout hid a success, and hides delay from the customer. Retries must be bounded.",
    "A timeout means the outcome is unknown, not that it succeeded. Telling the customer it is complete could be false and costs trust.",
    "Raising the exception ends the chat and loses context, and the model cannot recover or explain. Errors should be handled inside the loop.",
    "Correct: report the error as a tool_result so the model can respond, cap retries, and make refunds idempotent so a repeat cannot pay twice."
  ],
  "s2d": [
    "Forcing a number for a missing total makes the model invent one, producing silently wrong data in the accounting system.",
    "A guessed exchange rate gives unreliable, unauditable values. Finance data needs defined conversion rules, not estimates.",
    "Correct: explicit rules and examples for foreign currency and missing totals, plus a null that routes to human review, prevent silent errors. A clear abstain path matters.",
    "Silently dropping invoices loses records and leaves a gap in the accounts. Logging helps, but the invoice should be routed for review rather than discarded."
  ],
  "s3a": [
    "Prioritising general knowledge over passages invites confident but stale or wrong answers, which is the complaint. Grounding in sources should come first.",
    "Correct: restricting answers to the retrieved passages, requiring citations, and allowing an unsupported answer grounds responses and lets the model abstain instead of guessing.",
    "More passages add noise and conflicting content and do not stop the model guessing. Relevance matters more than volume.",
    "Forcing a best-guess answer encourages confident error. Permitting I don't know is a core anti-hallucination technique."
  ],
  "s4c": [
    "Passing tests does not show a deployment change is safe, since tests may not cover configuration. Auto-merging removes human judgement from consequential changes.",
    "Correct: proposing the change as a pull request keeps a human review gate on consequential changes, even when the job runs unattended.",
    "A prompt instruction is not an enforced control. The model may ignore it or be misled, so trust alone is not safe.",
    "Small config changes can still break production, and reverting after the fact accepts avoidable harm. They deserve review."
  ],
  "s5a": [
    "Stop when confident is a soft request with no hard cap, so a looping agent can ignore it. Termination must be enforced in code.",
    "A reviewer agent adds cost and can itself loop, and without a budget the system still has no guaranteed end.",
    "Caching speeds repeated queries but does not stop an agent looping on varied searches. It treats a symptom, not the missing limit.",
    "Correct: hard iteration, token and time budgets bound the loop, and a fallback that reports partial findings means a capped run still delivers something useful."
  ],
  "s5b": [
    "Correct: separate contexts keep noisy search output out of the lead agent's window and let sub-topics be researched in parallel, which suits breadth-heavy research.",
    "Isolation does not guarantee better accuracy. Subagents can still err, and output needs synthesis and checking.",
    "Separate contexts are the point of subagents. Sharing one window would remove the isolation and still fill with noise, and findings are condensed when handed back.",
    "The lead agent still plans and scopes the work. Without clear task descriptions, subagents duplicate effort or leave gaps."
  ]
});
