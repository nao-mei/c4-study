// Exam registry. Each exam has its own content object, saved-progress key and study-plan settings (see app.js useExam()).
// Developer keeps the original storage key "certcoach.v1" so earlier progress is unchanged.
window.CCEXAMS = {
  dev: {
    id: "dev", name: "Claude Certified Developer – Foundations", short: "Developer", code: "CCDV-F", content: "CC",
    mockN: 53, mockMinutes: 120, stateKey: "certcoach.v1", prefSuffix: "",
    shortLabels: { apps: "Apps", models: "Models", agents: "Agents", prompt: "Prompt", tools: "Tools", security: "Security", code: "Code", eval: "Eval" },
    newQRe: "^[rwdlkxyzuv]\\d\\d$",
    smallNote: "Small domains (Claude Code, Eval) have only 1–2 questions per mock, so read them across several mocks."
  }
};
// Architect – Professional appears only when its content files are loaded.
if (window.CCA && window.CCA.questions && window.CCA.questions.length) {
  window.CCEXAMS.arch = {
    id: "arch", name: "Claude Certified Architect – Professional", short: "Architect", code: "CCAR-P", content: "CCA",
    mockN: 63, mockMinutes: 120, stateKey: "certcoach.v1.arch", prefSuffix: ".arch",
    shortLabels: { design: "Design", models: "Models", integ: "Integration", eval: "Eval", gov: "Governance", comm: "Stakeholders", devprod: "Dev productivity" },
    newQRe: "",
    smallNote: "The smallest domain (Developer Productivity, 7%) has only 4–5 questions per mock, so read it across several mocks."
  };
}
