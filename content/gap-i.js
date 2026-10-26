(function () {
  window.CC = window.CC || {};
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }

  window.CC.scenarios.scU1 = { title: "Contract review agent over many documents", text: "A team runs a contract review agent through the Messages API. It reads many contract files with search and file-read tools, works for hours across several context windows, and its context fills with raw tool output. The final deliverable is a short list of risky clauses per file." };

  window.CC.questions.push(
    S("u01", "prompt",
      "Most of the agent's context is now old file-read and search results that Claude has already acted on and no longer needs. Which change is the lightest-touch fix?",
      ["Raise max_tokens to the model's maximum, so that the larger output allowance leaves enough room for all of the accumulated tool results",
       "Enable tool result clearing in context editing (beta at the time of writing), so the API swaps the oldest results for placeholders",
       "Delete the oldest messages from the stored history by hand, even though some tool_use blocks may then lose their matching tool_result blocks",
       "Run a full compaction pass after every single tool call, so that each raw result is replaced by a lossy summary before the agent takes its next step"],
      1,
      "Tool result clearing is the documented light form of context curation: old results are replaced server-side by placeholders. Compaction after every call is heavy and lossy, and max_tokens only limits the reply.",
      "scU1"),

    M("u02", "prompt", 2,
      "The team enables tool result clearing on an agent that also uses prompt caching. Which two statements are accurate?",
      ["Cleared results are removed from your client's stored messages list, so your application must resynchronise its local history after every response it receives, or later requests will be rejected as inconsistent",
       "Clearing alters the earlier prompt and invalidates cached prefixes, so clear_at_least helps ensure each clearing frees enough tokens to pay for the rewrite",
       "Cleared results vanish without any marker in the conversation, so Claude cannot tell that anything was ever removed from the earlier turns of the session, even when it needs to refer back to them",
       "The exclude_tools setting lets you name tools, such as a web search tool, whose results should be kept and never cleared by the strategy"],
      [1, 3],
      "Clearing invalidates cached prefixes, so clear_at_least keeps each clearing worthwhile, and exclude_tools protects named tools. Editing happens server-side with placeholder text, and your client history stays intact."),

    S("u03", "prompt",
      "The agent must keep working across several context windows, and each new window starts with no memory of the last one. Which setup best preserves progress?",
      ["Paste the complete transcript of the previous window into the first message of the next one, so that nothing the agent learned is ever lost",
       "Use the largest available context window and never reset it, because accuracy stays constant however many tokens the window contains",
       "Keep a structured status file and short notes under version control, and open each new window by reading them first",
       "Tell Claude in the system prompt to remember its earlier work, since models retain state between separate context windows without any help"],
      2,
      "State kept outside the context (notes, a structured status file, git) lets a fresh window recover quickly. Pasting transcripts recreates the bloat, models keep no state across windows, and accuracy degrades as context grows.",
      "scU1"),

    S("u04", "prompt",
      "For which of these tasks would delegating to a subagent best protect the lead agent's context window?",
      ["Answering a follow-up question whose answer depends on small details scattered across the whole earlier conversation with the user",
       "Applying a three-step edit in which each step depends on exact choices and wording made in the step that came immediately before it",
       "Checking sixty contract files for one clause type, where the lead needs only a short list of file names with the findings for each",
       "Correcting a typo in a single known file that the lead agent already has open and has just been editing in this session"],
      2,
      "Subagents run in their own context and return a condensed result, which suits broad exploration. Tightly coupled steps, trivial edits and tasks needing the full conversation are better done directly.",
      "scU1"),

    S("u05", "prompt",
      "A ticket classifier has clear label definitions, yet it keeps tagging sarcastic complaints as positive while every other ticket type is handled well. What is the most effective next change?",
      ["Move all label definitions from the system prompt into the user turn, so that they sit closer to each ticket being classified",
       "Add a few diverse examples of sarcastic tickets with the correct label, wrapped in example tags",
       "Rewrite the sarcasm rule in capital letters with a warning that errors are unacceptable, so the model gives the rule more weight",
       "Split the classifier into one call per label, so that each prompt carries only a single definition for the model to apply"],
      1,
      "The failure is one judgement boundary that abstract definitions describe poorly, which is where a few diverse examples help most. Emphasis, moving text and splitting calls do not show the model what sarcasm looks like."),

    S("u06", "prompt",
      "A product template adds \"keep every answer to two sentences\" to the user turn, while the platform system prompt says \"always give a full step-by-step walkthrough\". Answer length swings between requests. What is the sound fix?",
      ["Keep both instructions and place the preferred one last, because the model always obeys whichever instruction appears last in the prompt",
       "Wrap the system prompt in extra XML tags, since tagged text gets strict priority over any instruction found in the user turn",
       "Repeat the preferred instruction three times, so that it outweighs the contradicting instruction wherever each of them is placed",
       "Decide which behaviour is intended and remove the contradicting instruction, stating precedence explicitly if an exception is needed"],
      3,
      "Contradictory instructions produce inconsistent behaviour, so resolve the conflict at the source and spell out precedence where needed. Position, repetition and tags give no guaranteed ordering."),

    S("u07", "prompt",
      "A prompt written for an older model says \"CRITICAL: you MUST call the search tool whenever there is any doubt\". After migrating to a recent Claude model, the agent searches even for trivial questions. What adjustment fits current guidance?",
      ["Delete the search tool's description from its definition, since the description is what makes the model overuse the tool",
       "Set the temperature to 0, so the model becomes less inclined to call tools when a question could be answered directly",
       "Add a second capitalised line forbidding unnecessary searches, so that the two emphatic rules balance each other out in the prompt",
       "Dial the emphatic wording back to plain guidance on when search is needed, then re-run your evals"],
      3,
      "Recent models follow the system prompt more closely, so emphasis written to counter undertriggering now overtriggers. Plain wording plus a re-run of your evals is the documented fix.",
      null),

    M("u08", "prompt", 2,
      "A summariser wraps user-submitted text in document tags. A tester submits text containing a closing document tag followed by new instructions. Which two measures harden the design?",
      ["Strip every angle bracket from all submitted text, accepting that legitimate code or markup inside documents will be lost",
       "Move the submitted text into the system prompt, where its higher authority prevents later content from overriding it",
       "Neutralise or escape any occurrence of your own delimiter tags in the submitted text before inserting it",
       "Rely on the tags alone, because the model cannot confuse tagged content with instructions once the tags are in place around it",
       "State in the system prompt that everything inside the document tags is data to summarise and never instructions to follow"],
      [2, 4],
      "Escaping delimiter look-alikes stops tag breakout, and a system rule marking tagged content as data reinforces the boundary. Stripping brackets is lossy, tags alone are not a guarantee, and system text carries the most authority.")
  );

  Object.assign(window.CC.why, {
    "u01": ["The max_tokens setting limits only the generated reply. It does not enlarge the context window or remove old results, so context rot persists.",
      "This documented strategy replaces the oldest tool results with placeholders server-side, curating context lightly while your client retains the complete history.",
      "Manual deletion can orphan tool_use blocks from their tool_result blocks and cause API errors, and it is ad-hoc compared with the managed strategy.",
      "Compacting after every call is heavy-handed: summaries are lossy and add an extra model call each step, when simply clearing stale results suffices."],
    "u02": ["Context editing is applied server-side before the prompt reaches Claude, and your client keeps its full unmodified history, so no resync is needed.",
      "Clearing changes the prompt prefix so cached content is invalidated. clear_at_least ensures each clearing removes enough tokens to justify the rewrite.",
      "The API replaces each cleared result with placeholder text, so Claude is told that content was removed rather than seeing it silently disappear.",
      "The exclude_tools option is documented for naming tools, such as web_search, whose results must be preserved instead of cleared."],
    "u03": ["A pasted transcript refills the new window with the same bloat you were escaping, and long contexts degrade recall through context rot.",
      "Accuracy and recall degrade as the token count grows, so never resetting a huge window is not a free lunch. Curating context still matters.",
      "Progress notes, a structured status file and git live outside the context, so a fresh window can recover state by reading them at startup.",
      "Models keep no memory between context windows. The system prompt cannot make Claude recall work that is stored nowhere it can read."],
    "u04": ["A subagent starts without the parent's history, so a question that needs the whole conversation would be answered with missing context.",
      "Tightly coupled steps depend on exact earlier decisions, which a fresh subagent would not have, so doing them directly keeps continuity.",
      "Broad exploration gives the subagent its own context to fill, and only a condensed result returns, keeping the lead agent's window small.",
      "A trivial single-file fix needs no isolation. Spawning a subagent adds overhead and loses the context the lead already holds."],
    "u05": ["Moving definitions between system and user turns changes placement, not content, and the model still lacks a concrete picture of sarcasm.",
      "Examples of the failing case show the model the boundary the definitions describe only abstractly, and diverse, tagged examples are documented best practice.",
      "Capital letters and warnings add emphasis but no new information, and on recent models emphasis can cause over-application rather than better judgement.",
      "Per-label calls multiply cost and complexity without addressing the actual gap, which is that no example shows what sarcasm looks like."],
    "u06": ["There is no rule that the last instruction always wins. Models weigh both, which is why the output swings between requests.",
      "XML tags organise a prompt but do not assign priority between system and user text, so they cannot settle the contradiction.",
      "Repetition adds noise and still leaves both instructions in force, so behaviour stays unpredictable and the prompt gets longer.",
      "The inconsistency comes from contradicting instructions, so remove one, and where an exception is needed state precedence and the reason explicitly."],
    "u07": ["The description tells the model what the tool is for. Removing it hurts correct use, while the overuse is caused by the aggressive wording.",
      "Sampling temperature does not govern how eagerly a model chooses tools, and the newest models reject non-default sampling values anyway.",
      "A second emphatic rule adds more shouting rather than clarity, and the model has no reason to treat the two lines as cancelling.",
      "Recent models respond more closely to the system prompt, so emphatic anti-undertriggering language overtriggers. Plain wording, verified with evals, fixes it."],
    "u08": ["Removing all angle brackets damages legitimate code and markup, and it does not stop injection written in plain prose.",
      "System prompt text has the highest authority, so putting untrusted text there grants attackers the most power. It belongs in a user turn, labelled.",
      "Escaping or neutralising your own delimiter strings prevents the input from closing the document tag early and smuggling instructions outside it.",
      "Tags reduce misinterpretation but are not a guarantee, and a closing tag in the input can break the structure. Layer defences instead.",
      "Stating that tagged content is data, never instructions, reinforces the boundary, and system-level rules are weighted more than text in the input."]
  });
})();
