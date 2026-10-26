// Batch gap-j: 6 new Security & Safety questions (AI application security x3, identity/secrets/keys x3). Original, AI-drafted, reviewed:false.
(function () {
  window.CC = window.CC || {};
  window.CC.scenarios = window.CC.scenarios || {};
  window.CC.why = window.CC.why || {};
  function S(id, d, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "single", stem: stem, options: options, correct: [correct], explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }
  function M(id, d, pick, stem, options, correct, explanation, scenario) { var q = { id: id, domain: d, type: "multi", pick: pick, stem: stem, options: options, correct: correct, explanation: explanation, reviewed: false }; if (scenario) q.scenario = scenario; return q; }

  window.CC.scenarios.scV1 = { title: "Multi-tenant invoice assistant", text: "A software vendor runs one Claude-based support assistant for many customer companies. Claude can call a get_invoice tool with customer_id and invoice_id parameters. The vendor's backend executes the tool using a single database credential that can read every tenant's invoices." };

  window.CC.questions.push(
    S("v01", "security", "A tester asks the assistant for an invoice using another company's customer_id and receives it. Which fix is most robust?",
      ["Add a system prompt rule that Claude may only request invoices for the company the user names in the chat",
       "Screen each final answer for the names of other customer companies before it is shown to the user",
       "Take the tenant from the authenticated session in backend code, check access there, and ignore any customer_id the model supplies",
       "Remove the customer_id parameter description from the tool definition so the model cannot guess other values"],
      2, "Tool arguments come from the model, so identity and authorisation must be enforced server-side from the authenticated session, never from model-supplied values.", "scV1"),
    M("v02", "security", 2, "Which two practices reduce the risk of leaking confidential data through this assistant's prompt and context?",
      ["Keep credentials and other customers' data out of the system prompt, and assume a determined user may extract its wording",
       "Tell Claude never to reveal the system prompt under any circumstances, because an explicit instruction guarantees that the text can never be extracted",
       "Build each request's context only from the authenticated user's own records, with nothing shared across users",
       "Base64-encode the system prompt so that anyone who extracts it cannot read the instructions inside",
       "Keep one rolling memory of recent chats across all customers so Claude can answer common questions faster"],
      [0, 2], "A system prompt is not a secret store and a refusal instruction is not a guarantee; strict per-user context assembly prevents cross-user leakage.", "scV1"),
    S("v03", "security", "An email-triage agent reads inbound mail and can fetch URLs; its replies render markdown in a web page that loads images automatically. A planted email tells Claude to put the inbox summary into an image URL on an attacker's domain. Which control best closes this path?",
      ["Turn on TLS for every connection, so that the data carried inside the image request is encrypted while it is in transit",
       "Ask Claude in the system prompt to avoid including links in its replies, and rely on it to comply every single time",
       "Scan inbound emails for the phrase ignore previous instructions and drop any message that contains that exact phrase",
       "Allow outbound fetches and rendered images only for approved domains, deny the rest"],
      3, "Exfiltration needs an outbound channel; a default-deny egress and rendering allowlist removes it even if the injection succeeds. TLS protects transport, not the destination.", null),
    S("v04", "security", "A team uses one API key for development, staging and production, kept in a shared vault. A developer's test script exhausts the key's spend and rate limits and production calls start failing. Which structure best prevents this?",
      ["Keep the single key but add an environment label to every request's metadata so that usage can be separated and reviewed later",
       "Create a workspace per environment, scope each key to one workspace, and set spend and rate limits on each",
       "Give each developer a copy of the production key so that test traffic is spread across more holders",
       "Issue several differently named keys in the Default Workspace and share each one with the matching environment"],
      1, "Workspace-scoped keys only work in their own workspace, and spend and rate limits are configured per workspace, so test traffic cannot starve production.", null),
    S("v05", "security", "A deployment pipeline on a cloud platform calls Claude with a static key in a CI secret that has never been rotated. The security team wants to remove the long-lived secret. Which option fits Anthropic's documented authentication methods?",
      ["Use Workload Identity Federation, exchanging the pipeline's platform identity token for a short-lived access token tied to a service account",
       "Rotate the static key every hour from a scheduled job and keep storing it in the same CI secret",
       "Replace it with a personal key owned by the pipeline's maintainer, because personal keys stop working when the person leaves",
       "Split the key into two halves stored in separate variables and join them only when the job runs"],
      0, "Federation replaces the static key with tokens that expire in minutes. Hourly rotation still leaves a static secret, a personal key ties a pipeline to one person, and splitting a key adds no real protection.", null),
    M("v06", "security", 2, "Which two measures fit approval and monitoring for elevated access to the Claude Console and API?",
      ["Give every developer the organisation admin role so they can create workspaces and keys themselves without waiting for any approval step",
       "Default members to a developer role; require a named approver before granting workspace admin or an Admin API key",
       "Review monthly invoices for unusual totals, since usage cannot be examined per key or workspace before billing",
       "Pull usage and cost reports by key and workspace, and set spend limits with alerts, to spot unusual consumption",
       "Share a single Admin API key in the team channel so anyone can disable a leaked key immediately"],
      [1, 3], "Elevated roles and Admin API keys need an approval step, and the Usage and Cost API plus spend limits give per-key and per-workspace anomaly signals.", null)
  );

  Object.assign(window.CC.why, {
    "v01": [
      "A prompt rule is not an access boundary, and the user chooses the company named in chat, so a crafted or injected request can still pass another tenant's id.",
      "Output screening happens after the data was already retrieved, and name matching misses invoices that do not mention another company by name.",
      "Correct: the backend derives the tenant from the authenticated session and enforces authorisation, so a model-supplied or injected customer_id cannot widen access. General practice, matching least privilege.",
      "Obscurity is not authorisation: the model or an attacker can still supply any customer_id value, and the backend would execute it with its broad credential."
    ],
    "v02": [
      "Correct: system prompts can be extracted, so secrets and other users' data do not belong there; treat the wording as discoverable and enforce rules in backend code.",
      "Instructions lower the chance of disclosure but are not a guarantee; determined users can still extract or infer prompt text, so it cannot hold secrets.",
      "Correct: assembling context strictly per authenticated user prevents one customer's records or conversation from appearing in another's session. General multi-tenant practice.",
      "Encoding is not protection: the model must read the instructions, so users can ask it to decode them, and Base64 is trivially reversible.",
      "A shared cross-customer memory is itself the leak: details from one customer's chats can surface in another customer's answers."
    ],
    "v03": [
      "TLS protects data in transit from third parties, but here the agent itself sends the data to the attacker's server, which receives it fully decrypted.",
      "A prompt request lowers the odds but is not enforcement; an injection that overrides it still gets Claude to emit the link and the client loads it.",
      "Phrase filters are easily bypassed by rewording or encoding, and they do nothing about other channels, so the exfiltration path stays open.",
      "Correct: egress and image rendering restricted to an allowlist remove the outbound channel, so even a successful injection cannot send data out. Matches the sandbox and network-isolation guidance."
    ],
    "v04": [
      "Metadata labels do not restrict anything: the one key still has full reach in every environment and still shares the same limits and the same blast radius.",
      "Correct: per-environment workspaces with single-workspace keys isolate access, allow targeted revocation, and carry their own spend and rate limits, so test traffic cannot starve production.",
      "Copying the production key to every developer widens exposure and makes test traffic hit production limits; it is the opposite of least privilege.",
      "Keys in one workspace share its limits and access, so naming alone gives no isolation, and a leaked key still sits next to everything else."
    ],
    "v05": [
      "Correct: federation removes the static key from the pipeline; tokens expire in minutes. Current documented method (verify details), and only as strong as the upstream identity provider.",
      "Frequent rotation automates handling of a static secret but the key remains a long-lived credential stored in CI, so the underlying exposure remains.",
      "A personal key acts as one person and stops when they leave, which breaks the pipeline; shared or automated workloads should use a service account identity.",
      "Splitting a key is obfuscation: the job reassembles it at run time, so anyone with access to both variables or the job output has the full secret."
    ],
    "v06": [
      "Broad admin rights for everyone removes any approval step and maximises the damage a single compromised account or mistake can cause.",
      "Correct: least-privilege defaults with a named approver for workspace admin or Admin API keys give an auditable approval flow. General practice, aligned with documented roles.",
      "Waiting for the invoice detects abuse late; the Usage and Cost API can report by key and workspace, and spend limits and alerts exist.",
      "Correct: per-key and per-workspace usage reports plus spend limits and alerts surface anomalies early so a suspect key can be disabled quickly.",
      "Posting an Admin API key in a chat channel exposes a powerful secret to everyone and leaves no accountability for who used it."
    ]
  });
})();
