// Claude Certified Architect – Professional (CCAR-P): base object. ORIGINAL study material, NOT official exam content.
// Domains and weights follow Anthropic's CCAR-P Exam Guide v1.0 (July 2026); see review/official-blueprint-architect.md.
// The other content/arch-*.js files add lessons, scenarios, questions and per-option reasons to this object.
window.CCA = window.CCA || {};
window.CCA.domains = [
  { id: "design", name: "Solution Design & Architecture", weight: 17 },
  { id: "models", name: "Claude Models, Prompting & Context Engineering", weight: 13 },
  { id: "integ", name: "Integration", weight: 19 },
  { id: "eval", name: "Evaluation, Testing & Optimization", weight: 16 },
  { id: "gov", name: "Governance, Safety & Risk Management", weight: 14 },
  { id: "comm", name: "Stakeholder Communication & Lifecycle Management", weight: 14 },
  { id: "devprod", name: "Developer Productivity & Operational Enablement", weight: 7 }
];
window.CCA.lessons = window.CCA.lessons || [];
window.CCA.lessonsNew = window.CCA.lessonsNew || [];
window.CCA.questions = window.CCA.questions || [];
window.CCA.cards = window.CCA.cards || [];
window.CCA.scenarios = window.CCA.scenarios || {};
window.CCA.why = window.CCA.why || {};
