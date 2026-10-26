(function () {
  var app = document.getElementById("app");
  // ---------- Exams ----------
  // Each exam (content/exams.js) has its own content, saved progress and study plan. The functions below always work on the
  // "current" exam; useExam() switches it. Developer keeps the original storage key, so earlier progress is unchanged.
  var EXAMS = window.CCEXAMS || {}, EXAM_IDS = Object.keys(EXAMS), EXAM_PREF = "certcoach.pref.exam";
  var C, S, KEY, EXAM, DP, RPK, ALL_IDS, WEEK, SHORT, NEW_Q_RE, DS = null, LD = null, RV = null;
  // Fuller lessons (content/lessons-*.js) replace the short seed lessons when present, ordered by section then n.
  function prepare(c) {
    if (c.prepared) return; c.prepared = true;
    if (c.lessonsNew && c.lessonsNew.length) {
      var dOrder = c.domains.map(function (d) { return d.id; });
      c.lessons = c.lessonsNew.slice().sort(function (a, b) { return dOrder.indexOf(a.domain) - dOrder.indexOf(b.domain) || a.n - b.n; });
    }
    c.lessons = c.lessons || []; c.cards = c.cards || []; c.questions = c.questions || [];
  }
  function loadState(key) {
    var s; try { s = JSON.parse(localStorage.getItem(key)); } catch (e) {}
    s = s || {}; s.stats = s.stats || {}; s.cards = s.cards || {};
    if (!Array.isArray(s.mocks)) s.mocks = [];
    s.daily = s.daily || {}; s.plan = s.plan || {}; s.seen = s.seen || {}; s.read = s.read || {}; s.rev = s.rev || {};
    return s;
  }
  function load() { return loadState(KEY); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function currentExam() { var id; try { id = localStorage.getItem(EXAM_PREF); } catch (e) {} return EXAMS[id] ? id : EXAM_IDS[0]; }
  // Points every exam-specific variable at the given exam. Reads saved progress fresh; writes nothing.
  function useExam(id) {
    EXAM = EXAMS[id]; C = window[EXAM.content]; prepare(C);
    KEY = EXAM.stateKey; S = load(); DP = "certcoach.pref.drill" + EXAM.prefSuffix; RPK = "certcoach.pref.review" + EXAM.prefSuffix;
    ALL_IDS = C.domains.map(function (d) { return d.id; }); SHORT = EXAM.shortLabels; NEW_Q_RE = EXAM.newQRe ? new RegExp(EXAM.newQRe) : /^$/;
    WEEK = WEEK_BUILDERS[id](); DS = null; LD = null; RV = null;
  }
  // Runs fn with another exam active, then restores the previous one (used for the hub and backups).
  function withExam(id, fn) { var prev = EXAM.id; useExam(id); try { return fn(); } finally { useExam(prev); } }
  var WEEK_BUILDERS = {};
  function dkey(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function today() { var r = S.daily[dkey()] || (S.daily[dkey()] = { q: 0, c: 0, l: [], m: 0 }); r.d = r.d || {}; r.sn = r.sn || 0; return r; }
  function daysUntil(str) { var p = str.split("-"), t = new Date(+p[0], +p[1] - 1, +p[2]), n = new Date(); n = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((t - n) / 864e5); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dom(id) { return C.domains.filter(function (d) { return d.id === id; })[0]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Records one answered question: domain stats, today's counts (overall, per domain, scenario), and last result per question.
  function record(q, ok) {
    var s = S.stats[q.domain] || (S.stats[q.domain] = { a: 0, c: 0 }); s.a++; if (ok) s.c++;
    var t = today(); t.q++; t.d[q.domain] = (t.d[q.domain] || 0) + 1; if (q.scenario) t.sn++;
    S.seen[q.id] = ok ? 1 : 0; save();
  }
  function mastery(d) { var s = S.stats[d]; return s && s.a ? Math.round(100 * s.c / s.a) : 0; }
  function bar(p) { return '<div class="bar"><i style="width:' + p + '%"></i></div>'; }
  var disclaimer = '<p class="warn">AI-built personal study aid. Not official Anthropic material, and the content is AI-drafted and may contain errors; check it against Anthropic\'s docs.<br><a class="alink" href="#/about">About and caveats</a></p>';
  // ---------- Theme (light / dark / auto) and build version ----------
  var THEME_KEY = "certcoach.pref.theme";
  var BUILD = "2026-10-26 14:14"; // stamped with the build time by scripts/build_site.py and scripts/build_single.py
  function themePref() { try { var t = localStorage.getItem(THEME_KEY); return t === "light" || t === "dark" ? t : "auto"; } catch (e) { return "auto"; } }
  function applyTheme() {
    var t = themePref(), el = document.documentElement;
    if (t === "auto") el.removeAttribute("data-theme"); else el.setAttribute("data-theme", t);
    var dark = t === "dark" || (t === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var m = document.querySelector("meta[name=theme-color]"); if (m) m.setAttribute("content", dark ? "#1b1a19" : "#faf9f5");
  }
  window.CCtheme = function (v) { try { if (v === "auto") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, v); } catch (e) {} applyTheme(); about(); };
  var ABOUT_KEY = "certcoach.pref.about";
  function aboutSeen() { try { return localStorage.getItem(ABOUT_KEY) === "1"; } catch (e) { return true; } }
  window.CCabout = function () { try { localStorage.setItem(ABOUT_KEY, "1"); } catch (e) {} if (location.hash === "#/" || location.hash === "") route(); else location.hash = "#/"; };
  function about() {
    var first = !aboutSeen();
    var li = function (t) { return "<li>" + t + "</li>"; };
    app.innerHTML = "<h1>About C⁴ (CatClaudeCertCoach)</h1><p class='mut'>Please read before you rely on this.</p>" +
      "<div class='card'><b>What it is</b><ul class='pts'>" +
      li("A personal study aid for Anthropic's " + EXAM_IDS.map(function (id) { return "<b>" + esc(EXAMS[id].name) + "</b>"; }).join(" and ") + " exam" + (EXAM_IDS.length > 1 ? "s" : "") + ", built with the help of an AI assistant (Claude).") +
      li("It is <b>not</b> an official resource and has not been produced, reviewed or endorsed by Anthropic.") +
      li("It contains no real exam questions. All questions, lessons and explanations are original drafts.") + "</ul></div>" +
      "<div class='card trap'><b>Caveats</b><ul class='pts'>" +
      li("<b>It can be wrong.</b> All content is AI-drafted from Anthropic's public documentation and may contain mistakes or gaps. Items stay marked as unreviewed unless you tick them off yourself in the Review screen.") +
      li("<b>It goes out of date.</b> The Claude API and tools change quickly. Facts were checked against the docs in October 2026; anything version-dependent is flagged, but always confirm against the current docs.") +
      li("<b>The exam may differ.</b> Exam format and domain weights follow Anthropic's official exam guides (version 1.0, July 2026). Check the current guides, and eligibility and registration, on Anthropic's Partner Academy.") +
      (EXAMS.arch ? li("<b>Some Architect topics rest on general practice.</b> Governance, compliance and stakeholder communication have less public Anthropic documentation, so those questions draw on widely accepted practice. They are not legal or regulatory advice; take compliance questions to your Legal, Compliance or Data Privacy team.") : "") +
      li("<b>No guarantee.</b> Using this does not guarantee a pass, and your score here does not predict your exam score.") + "</ul></div>" +
      "<div class='card'><b>Privacy</b><ul class='pts'>" +
      li("It runs in your browser. Your progress, notes and flags are stored only on this device and are not sent anywhere. There are no accounts.") +
      li("Don't type client names, confidential or personal information into the review notes. Use Backup to move your progress between devices.") +
      li("If you share this with others, follow your organisation's policies, and tell them it is an unofficial AI-built draft.") + "</ul></div>" +
      "<div class='card'><b>Appearance</b><div class='seg'>" + [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]].map(function (o) { return "<button class='" + (themePref() === o[0] ? "sel" : "") + "' onclick=\"CCtheme('" + o[0] + "')\">" + o[1] + "</button>"; }).join("") + "</div><p class='mut'>Auto follows your phone's light or dark setting.</p></div>" +
      "<div class='card'><b>Version</b><p class='mut'>" + (BUILD === "dev" ? "Development copy" : "Built " + esc(BUILD)) + "</p>" + EXAM_IDS.map(function (id) { var c = window[EXAMS[id].content]; prepare(c); return "<p class='mut'>" + esc(EXAMS[id].short) + ": " + c.questions.length + " questions · " + c.lessons.length + " lessons</p>"; }).join("") + "<p class='mut'>If you've uploaded an update, check this line to see whether it has reached this device.</p></div>" +
      (first ? "<button class='pri' onclick='CCabout()'>I understand, continue</button>" : "<button class='pri' onclick=\"location.hash='#/'\">Back to home</button>");
    window.scrollTo(0, 0);
  }

  // C4 logo: a C containing a paw print, with a small superscript 4. Same geometry as icons/c4-logo.svg.
  var MARK = "<svg class='mark' viewBox='0 0 160 160' width='84' height='84' role='img' aria-label='C to the fourth: a C containing a paw print'><g color='#d97757' fill='none'><path d='M101.7 63.7A44 44 0 1 0 101.7 120.3' stroke='currentColor' stroke-width='14' stroke-linecap='round'/><g transform='translate(70 92) scale(0.5) translate(-80 -82)' fill='currentColor'><ellipse cx='38' cy='66' rx='11' ry='15' transform='rotate(-20 38 66)'/><ellipse cx='64' cy='44' rx='12' ry='16' transform='rotate(-8 64 44)'/><ellipse cx='96' cy='44' rx='12' ry='16' transform='rotate(8 96 44)'/><ellipse cx='122' cy='66' rx='11' ry='15' transform='rotate(20 122 66)'/><path d='M80 78C104 78 124 98 124 114C124 130 110 136 97 133C90 131 86 129 80 129C74 129 70 131 63 133C50 136 36 130 36 114C36 98 56 78 80 78Z'/></g><polyline points='111,45.6 124.3,27.4 124.3,54' stroke='currentColor' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'/><line x1='111' y1='45.6' x2='132' y2='45.6' stroke='currentColor' stroke-width='4.5' stroke-linecap='round'/></g></svg>";

  // ---------- Views ----------
  // Small visual helpers: progress ring and paw icon (inline SVG, colours from the theme).
  function ring(pct, size, inner) {
    var sw = size < 60 ? 5 : 9, r = (size - sw - 3) / 2, c = 2 * Math.PI * r, m = size / 2;
    return "<div class='ring" + (size < 60 ? " sm" : "") + "' style='width:" + size + "px;height:" + size + "px'><svg width='" + size + "' height='" + size + "' viewBox='0 0 " + size + " " + size + "' aria-hidden='true'><circle cx='" + m + "' cy='" + m + "' r='" + r + "' fill='none' stroke='var(--bd)' stroke-width='" + sw + "'/><circle cx='" + m + "' cy='" + m + "' r='" + r + "' fill='none' stroke='var(--acc)' stroke-width='" + sw + "' stroke-linecap='round' stroke-dasharray='" + c.toFixed(1) + "' stroke-dashoffset='" + (c * (1 - pct / 100)).toFixed(1) + "' transform='rotate(-90 " + m + " " + m + ")'/></svg><b>" + (inner === undefined ? pct + "%" : inner) + "</b></div>";
  }
  function setNav(r) {
    document.querySelectorAll("nav a").forEach(function (a) { a.className = a.getAttribute("href") === "#/" + r ? "on" : ""; });
    var nav = document.getElementById("nav"); if (nav) nav.style.display = r ? "" : "none"; // the exam hub has no tab bar
  }
  function paw(sz) { return "<svg class='paw' width='" + sz + "' height='" + sz + "' viewBox='0 0 160 160' aria-hidden='true'><use href='#i-paw'/></svg>"; }
  // Paw meter: five pads fill with progress (four toes first, the big pad last, so it is only full when everything is done).
  function pawMeter(done, total) {
    var n = done >= total && total > 0 ? 5 : Math.min(4, Math.floor(5 * done / Math.max(total, 1)));
    var parts = ["<ellipse cx='38' cy='66' rx='11' ry='15' transform='rotate(-20 38 66)'/>", "<ellipse cx='64' cy='44' rx='12' ry='16' transform='rotate(-8 64 44)'/>", "<ellipse cx='96' cy='44' rx='12' ry='16' transform='rotate(8 96 44)'/>", "<ellipse cx='122' cy='66' rx='11' ry='15' transform='rotate(20 122 66)'/>", "<path d='M80 78C104 78 124 98 124 114C124 130 110 136 97 133C90 131 86 129 80 129C74 129 70 131 63 133C50 136 36 130 36 114C36 98 56 78 80 78Z'/>"];
    return "<svg class='pawmeter' width='56' height='56' viewBox='0 0 160 160' role='img' aria-label='" + n + " of 5 paw pads filled'>" + parts.map(function (x, i) { return "<g fill='" + (i < n ? "var(--acc)" : "var(--bd)") + "'>" + x + "</g>"; }).join("") + "</svg>";
  }
  // Sitting cat for the finish screen (own artwork, theme colours): happy closed eyes, rosy cheeks, bow and bell.
  function cat(sz) {
    var ink = "#1f1e1d";
    return "<svg class='cat' width='" + sz + "' height='" + sz + "' viewBox='28 0 128 170' aria-hidden='true'><path d='M112 142C150 142 152 100 128 96' fill='none' stroke='var(--acc)' stroke-width='12' stroke-linecap='round'/><ellipse cx='80' cy='118' rx='36' ry='38' fill='var(--acc)'/><circle cx='80' cy='66' r='30' fill='var(--acc)'/><polygon points='54,50 58,20 80,38' fill='var(--acc)'/><polygon points='106,50 102,20 80,38' fill='var(--acc)'/><polygon points='59,44 61,29 72,38' fill='var(--acc-soft)'/><polygon points='101,44 99,29 88,38' fill='var(--acc-soft)'/><ellipse cx='66' cy='152' rx='11' ry='7' fill='var(--acc-soft)'/><ellipse cx='94' cy='152' rx='11' ry='7' fill='var(--acc-soft)'/>" +
      "<path d='M63 67Q69 61 75 67' fill='none' stroke='" + ink + "' stroke-width='2' stroke-linecap='round'/><path d='M85 67Q91 61 97 67' fill='none' stroke='" + ink + "' stroke-width='2' stroke-linecap='round'/><polygon points='76.5,73 83.5,73 80,77' fill='" + ink + "'/><path d='M73 81Q76.5 85 80 81Q83.5 85 87 81' fill='none' stroke='" + ink + "' stroke-width='1.8' stroke-linecap='round'/><circle cx='56' cy='76' r='5.5' fill='var(--acc-soft)'/><circle cx='104' cy='76' r='5.5' fill='var(--acc-soft)'/><g stroke='" + ink + "' stroke-width='1.2' stroke-linecap='round'><line x1='52' y1='80' x2='37' y2='78'/><line x1='52' y1='85' x2='37' y2='88'/><line x1='108' y1='80' x2='123' y2='78'/><line x1='108' y1='85' x2='123' y2='88'/></g>" +
      "<path d='M56 91Q80 104 104 91' fill='none' stroke='var(--acc-ink)' stroke-width='5' stroke-linecap='round'/><polygon points='80,98 66,90 66,106' fill='var(--acc-ink)'/><polygon points='80,98 94,90 94,106' fill='var(--acc-ink)'/><circle cx='80' cy='98' r='4' fill='var(--acc-ink)'/><circle cx='80' cy='114' r='7' fill='#e8b94a' stroke='var(--acc-ink)' stroke-width='2'/><line x1='76' y1='115' x2='84' y2='115' stroke='var(--acc-ink)' stroke-width='1.5'/></svg>";
  }
  // The single most useful thing to do next, built from the existing planner logic.
  function nextAction() {
    var wd = S.plan.week ? weekDay() : 0, rec = today();
    if (wd >= 1 && wd <= 7) {
      var day = WEEK[wd - 1], todo = day.tasks.map(function (t) { return taskInfo(t, rec); }).filter(function (i) { return i.done < i.target; });
      if (todo.length) return { kicker: "Day " + wd + " of 7", title: day.t, sub: todo.length + " task" + (todo.length === 1 ? "" : "s") + " left today", btn: todo[0].btn || "Open today's plan", act: todo[0].act || "location.hash='#/plan'" };
      return { kicker: "Day " + wd + " of 7", title: "Today's tasks are done", sub: "Nice work. Come back tomorrow, or keep drilling.", btn: "Drill " + drillPrefs().n + " more", act: "location.hash='#/drill'" };
    }
    if (S.plan.date && daysUntil(S.plan.date) >= 0) {
      var days = daysUntil(S.plan.date), p = planFor(days), t = today(), head = days === 0 ? "Exam day" : days + " day" + (days === 1 ? "" : "s") + " to go";
      if (p.mock && !t.m) return { kicker: head, title: "Mock exam day", sub: p.note, btn: "Start today's mock", act: "location.hash='#/mock'" };
      return { kicker: head, title: p.phase + " phase", sub: t.q + " of " + p.q + " practice questions done today", btn: "Start practising", act: "location.hash='#/drill'" };
    }
    return { kicker: "Welcome", title: "Pick how you want to study", sub: "Set a study plan, or just start a drill.", btn: "Set a study plan", act: "location.hash='#/plan'" };
  }
  // Readiness for the current exam: mastery per domain weighted by exam share.
  function readiness() { var tot = 0, w = 0; C.domains.forEach(function (d) { w += d.weight; tot += mastery(d.id) * d.weight; }); return Math.round(tot / w); }
  // Hub: one card per exam with its own progress, so you can pick where to study and see both at a glance.
  function hub() {
    if (EXAM_IDS.length < 2) { location.hash = "#/home"; return; }
    var last = currentExam();
    var h = "<h1 class='sr'>C⁴ – CatClaudeCertCoach</h1><div class='hdr'>" + MARK + "<p class='tag'>CAT · CLAUDE · CERT · COACH</p></div><p class='mut'>Choose an exam to study for. Each one keeps its own progress.</p>";
    EXAM_IDS.forEach(function (id) {
      var x = withExam(id, function () { return { r: readiness(), s: streak(), t: today().q, na: nextAction(), seen: Object.keys(S.seen).length, nq: C.questions.length }; });
      h += "<div class='card hero exam'><p class='kick'>" + esc(EXAMS[id].code) + (id === last ? " · last used" : "") + "</p><h2>" + esc(EXAMS[id].name) + "</h2>" +
        "<div class='examrow'>" + ring(x.r, 72) + "<div class='examstat'><div class='pawn sm'>" + paw(22) + "<b>" + x.s + "</b></div><p class='mut'>day streak</p><p class='mut'>" + x.seen + " of " + x.nq + " questions seen · " + x.t + " today</p></div></div>" +
        "<p class='mut'>" + esc(x.na.kicker) + ": " + esc(x.na.title) + "</p><button class='pri' onclick=\"CCopen('" + id + "')\">" + (id === last ? "Continue" : "Open") + " " + esc(EXAMS[id].short) + "</button></div>";
    });
    h += "<p class='mut'><a class='alink' href='#/about'>About, version and appearance</a></p>" + disclaimer;
    app.innerHTML = h;
  }
  window.CCopen = function (id) { if (!EXAMS[id]) return; try { localStorage.setItem(EXAM_PREF, id); } catch (e) {} useExam(id); location.hash = "#/home"; };
  function home() {
    var h = "<h1 class='sr'>C⁴ – CatClaudeCertCoach</h1><div class='hdr'>" + MARK + "<p class='tag'>CAT · CLAUDE · CERT · COACH</p></div><p class='mut'>" + esc(EXAM.name) + " prep</p>";
    var ready = readiness(), na = nextAction(), n = drillPrefs().n;
    h += "<div class='card hero'><p class='kick'>" + esc(na.kicker) + "</p><h2>" + esc(na.title) + "</h2><p class='mut'>" + esc(na.sub) + "</p><button class='pri' onclick=\"" + na.act + "\">" + esc(na.btn) + "</button></div>";
    h += "<div class='grid2'><div class='card statc'>" + ring(ready, 84) + "<p class='mut'>Readiness, weighted by exam share</p></div>" +
      "<div class='card statc'><div class='pawn'>" + paw(30) + "<b>" + streak() + "</b></div><p class='mut'>day streak</p><p class='mut'>" + today().q + " answered today</p></div></div>";
    h += "<h2>Sections</h2><div class='card list'>";
    C.domains.forEach(function (d) {
      h += "<button class='sec' onclick=\"CCstartDrill('" + d.id + "'," + n + ")\"><span class='row'><span>" + esc(d.name) + "</span><span class='chip'>" + d.weight + "%</span></span><span class='bar' style='display:block;margin-top:8px'><i style='width:" + mastery(d.id) + "%'></i></span></button>";
    });
    h += "</div><p class='mut'>Tap a section to start a " + n + "-question drill on it.</p>";
    h += reviewCard();
    h += "<details class='card more'><summary>More: mock history, backup, reset</summary>" + mockHistory();
    h += "<h2>Backup</h2><div class='card'><p class='mut'>Progress is stored only on this device. Export a backup before clearing Safari data, reinstalling, or if the app's web address changes.</p><button onclick='CCexport()'>Export to file</button><button onclick='CCcopy()'>Copy backup text</button><label class='btn'>Restore from file<input type='file' accept='.json,application/json' hidden onchange='CCimportFile(this)'></label><details><summary>Restore from pasted text</summary><textarea id='bkt' rows='4' placeholder='Paste backup text here'></textarea><button onclick='CCimportText()'>Restore</button></details></div>";
    h += "<button onclick='CCreset()'>Reset progress</button></details>" + disclaimer;
    app.innerHTML = h;
  }

  function lessonWords(l) { return [l.body || ""].concat(l.points || [], l.traps || []).join(" ").split(/\s+/).length; }
  function lessonMins(l) { return Math.max(1, Math.round(lessonWords(l) / 180)); }
  function learn(id) {
    var l = id && C.lessons.filter(function (x) { return x.id === id; })[0];
    if (l) {
      if (today().l.indexOf(l.id) < 0) today().l.push(l.id);
      S.read[l.id] = 1; save();
      var idx = C.lessons.indexOf(l), nxt = C.lessons[idx + 1];
      var h = "<div id='rp' class='rp' aria-hidden='true'><i></i></div><a class='back' href='#/learn'>‹ All lessons</a>";
      h += "<div class='meta'><span class='chip'>" + esc(dom(l.domain).name) + "</span><span class='chip'>about " + lessonMins(l) + " min</span></div><h1>" + esc(l.title) + "</h1><div class='lesson'>";
      h += "<p class='lead'>" + esc(l.body) + "</p>";
      if (l.points && l.points.length) h += "<h2>Key points</h2><div class='card'><ol class='kp'>" + l.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ol></div>";
      if (l.code) h += "<pre>" + esc(l.code) + "</pre>";
      if (l.traps && l.traps.length) h += "<div class='card trap'><div class='trapt'><svg class='ti' viewBox='0 0 24 24' aria-hidden='true'><use href='#i-alert'/></svg><b>Common traps</b></div><ul class='pts'>" + l.traps.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>";
      if (l.sources && l.sources.length) h += "<details><summary>Sources</summary>" + l.sources.filter(function (u) { return /^https:\/\//.test(u); }).map(function (u) { return "<p class='src'><a href='" + esc(u) + "' target='_blank' rel='noopener noreferrer'>" + esc(u.replace(/^https:\/\//, "")) + "</a></p>"; }).join("") + "<p class='mut'>Docs change often; check the source if something here looks out of date.</p></details>";
      h += "</div><button class='pri' onclick=\"location.hash='#/drill/" + l.domain + "'\">Drill this section (" + drillPrefs().n + " questions)</button>";
      if (nxt) h += "<button onclick=\"location.hash='#/learn/" + nxt.id + "'\">Next: " + esc(nxt.title) + "</button>";
      app.innerHTML = h; return;
    }
    var h2 = "<h1>Learn</h1>", total = C.lessons.length, done = C.lessons.filter(function (x) { return S.read[x.id]; }).length;
    h2 += "<div class='card meter'>" + pawMeter(done, total) + "<div class='mt'><div class='row'><span>Lessons read</span><b>" + done + " / " + total + "</b></div><div style='margin-top:10px'>" + bar(Math.round(100 * done / Math.max(total, 1))) + "</div></div></div>";
    C.domains.forEach(function (d) {
      var ls = C.lessons.filter(function (x) { return x.domain === d.id; });
      h2 += "<h2 class='row'><span>" + esc(d.name) + "</span><span class='chip'>" + d.weight + "%</span></h2><div class='card list'>";
      ls.forEach(function (x) { h2 += "<button class='sec lr' onclick=\"location.hash='#/learn/" + x.id + "'\"><span class='tick" + (S.read[x.id] ? " on" : "") + "'>" + (S.read[x.id] ? "✓" : "") + "</span><span class='lt'>" + esc(x.title) + "</span><span class='chip'>" + lessonMins(x) + " min</span></button>"; });
      h2 += "</div>";
    });
    app.innerHTML = h2;
  }

  // ---------- Quiz engine (drill + mock) ----------
  var Q = null, timer = null;
  function startQuiz(list, mode) {
    clearInterval(timer);
    list = list.map(function (q) {
      var order = shuffle(q.options.map(function (_, k) { return k; }));
      var w = C.why && C.why[q.id];
      return Object.assign({}, q, { options: order.map(function (k) { return q.options[k]; }), correct: q.correct.map(function (c) { return order.indexOf(c); }), why: w && w.length === q.options.length ? order.map(function (k) { return w[k].replace(/^(Right|Wrong|Correct|Incorrect):\s*/, ""); }) : null });
    });
    Q = { list: list, i: 0, picks: [], done: false, right: 0, mode: mode, end: mode === "mock" ? Date.now() + EXAM.mockMinutes * 60000 : 0 };
    if (mode === "mock") timer = setInterval(tick, 1000);
    setNav(mode === "mock" ? "mock" : "drill"); setChip(false);
    renderQ();
  }
  function tick() { var el = document.getElementById("t"); if (!el || !Q) return; var s = Math.max(0, Math.round((Q.end - Date.now()) / 1000)); el.textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); if (!s) finish(); }
  function renderQ() {
    var q = Q.list[Q.i], need = q.type === "multi" ? (q.pick || q.correct.length) : 1;
    var total = Q.list.length, h = "<div class='qhead'><div class='row'><span class='chip'>" + esc(dom(q.domain).name) + "</span><span class='mut'>" + (Q.i + 1) + " of " + total + (Q.mode === "mock" ? "" : " · " + Q.right + " correct") + "</span>" + (Q.mode === "mock" ? "<b id='t'></b>" : "") + "</div><div class='pbar'><i style='width:" + Math.round(100 * Q.i / total) + "%'></i></div></div>";
    var sc = q.scenario && C.scenarios && C.scenarios[q.scenario];
    if (sc) h += "<details class='card scn' open><summary><b>Scenario: " + esc(sc.title) + "</b></summary><p>" + esc(sc.text) + "</p></details>";
    h += "<div class='card qcard'><p class='stem'><b>" + esc(q.stem) + "</b></p>" + (need > 1 ? "<p class='mut'>Select " + need + "</p>" : "") + "</div>";
    q.options.forEach(function (o, k) { h += "<button id='o" + k + "' class='" + optCls(need) + "' onclick='CCpick(" + k + ")'><span class='mk'></span><span class='tx'>" + esc(o) + "</span></button>"; });
    h += "<div id='fb'></div><button class='pri' id='go' onclick='CCgo()'>Submit</button>";
    app.innerHTML = h; Q.cur = []; Q.locked = false; tick();
  }
  function needOf(q) { return q.type === "multi" ? (q.pick || q.correct.length) : 1; }
  function optCls(need, state) { return "opt" + (need > 1 ? " multi" : "") + (state ? " " + state : ""); }
  window.CCpick = function (k) {
    if (Q.locked) return; var q = Q.list[Q.i], need = q.type === "multi" ? (q.pick || q.correct.length) : 1, p = Q.cur, ix = p.indexOf(k);
    if (ix >= 0) p.splice(ix, 1); else { if (need === 1) p.length = 0; if (p.length < need) p.push(k); }
    q.options.forEach(function (_, j) { document.getElementById("o" + j).className = optCls(need, p.indexOf(j) >= 0 ? "sel" : ""); });
  };
  window.CCgo = function () {
    var q = Q.list[Q.i], need = q.type === "multi" ? (q.pick || q.correct.length) : 1;
    if (Q.locked) { if (Q.i + 1 < Q.list.length) { Q.i++; renderQ(); } else finish(); return; }
    if (Q.cur.length !== need) { alert("Select " + need + " answer" + (need > 1 ? "s" : "")); return; }
    var ok = q.correct.length === Q.cur.length && q.correct.every(function (c) { return Q.cur.indexOf(c) >= 0; });
    Q.locked = true; if (ok) Q.right++; record(q, ok); Q.picks.push(ok);
    if (Q.mode === "mock" && !mockFeedback()) { document.getElementById("go").textContent = Q.i + 1 < Q.list.length ? "Next" : "Finish"; q.options.forEach(function (_, j) { document.getElementById("o" + j).className = optCls(need, Q.cur.indexOf(j) >= 0 ? "sel" : ""); }); return; }
    showFeedback(q, ok);
    document.getElementById("go").textContent = Q.i + 1 < Q.list.length ? "Next" : "Finish";
  };
  // Marks each option (✓ correct, ✗ your wrong pick) and explains the result.
  function showFeedback(q, ok) {
    var need = needOf(q);
    q.options.forEach(function (o, j) {
      var c = q.correct.indexOf(j) >= 0, s = Q.cur.indexOf(j) >= 0, b = document.getElementById("o" + j);
      b.className = optCls(need, c ? "ok" : (s ? "bad" : "")); b.querySelector(".mk").textContent = c ? "✓" : (s ? "✗" : "");
    });
    function ans(j, kind, label) { return "<div class='ans " + kind + "'><span class='lbl'>" + label + "</span><span class='at'>" + esc(q.options[j]) + "</span>" + (q.why ? "<span class='rsn'>" + esc(q.why[j]) + "</span>" : "") + "</div>"; }
    var h = "<div class='card fbk " + (ok ? "good" : "miss") + "'><div class='banner'><b>" + (ok ? "✓ Correct" : "✗ Incorrect") + "</b></div>";
    h += "<div class='ans why'><span class='lbl'>Why</span><span class='at'>" + esc(q.explanation) + "</span></div>";
    if (!ok) Q.cur.forEach(function (j) { if (q.correct.indexOf(j) < 0) h += ans(j, "bad", "You chose"); });
    q.correct.forEach(function (j) { h += ans(j, "ok", "Correct answer"); });
    var rv = S.rev["q:" + q.id];
    h += "<p class='mut fine'>" + (rv && rv.s === "ok" ? "✓ You marked this question as reviewed." : rv && rv.s === "flag" ? "⚑ You flagged this question for fixing." : "AI-drafted question, not yet reviewed by you.") + "</p>";
    if (q.why) {
      h += "<details><summary>Why each option</summary>";
      q.options.forEach(function (o, j) { h += "<p><b>" + (q.correct.indexOf(j) >= 0 ? "✓ " : "✗ ") + esc(o) + "</b><br><span class='rsn'>" + esc(q.why[j]) + "</span></p>"; });
      h += "</details>";
    }
    var fb = document.getElementById("fb"); fb.innerHTML = h + "</div>";
    if (fb.scrollIntoView) { try { fb.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) { fb.scrollIntoView(); } }
  }
  var MFB = "certcoach.pref.mockfb";
  function mockFeedback() { try { return localStorage.getItem(MFB) !== "0"; } catch (e) { return true; } }
  window.CCmfb = function (on) { try { localStorage.setItem(MFB, on ? "1" : "0"); } catch (e) {} };
  function finish() {
    clearInterval(timer); var n = Q.list.length, r = Q.right, pct = Math.round(100 * r / n);
    var by = {}, brk = "";
    if (Q.mode === "mock") {
      Q.list.forEach(function (q, i) { var b = by[q.domain] || (by[q.domain] = { c: 0, n: 0 }); b.n++; if (Q.picks[i]) b.c++; });
      var compact = {}; Object.keys(by).forEach(function (k) { compact[k] = [by[k].c, by[k].n]; });
      S.mocks.push({ date: new Date().toLocaleDateString(), pct: pct, right: r, n: n, by: compact }); today().m++; save();
      brk = "<h2>By domain</h2>";
      C.domains.forEach(function (d) { var b = by[d.id]; if (b) brk += "<div class='card'><div class='row'><span>" + esc(d.name) + "</span><b>" + b.c + "/" + b.n + "</b></div>" + bar(Math.round(100 * b.c / b.n)) + "</div>"; });
    }
    var btns = "<button class='pri' onclick=\"location.hash='#/home'\">See progress</button>";
    if (Q.mode === "drill") {
      var dd = {}; Q.list.forEach(function (q, i) { var b = dd[q.domain] || (dd[q.domain] = { c: 0, n: 0 }); b.n++; if (Q.picks[i]) b.c++; });
      if (Object.keys(dd).length > 1) { brk = "<h2>By section</h2>"; C.domains.forEach(function (d) { var b = dd[d.id]; if (b) brk += "<div class='card'><div class='row'><span>" + esc(d.name) + "</span><b>" + b.c + "/" + b.n + "</b></div>" + bar(Math.round(100 * b.c / b.n)) + "</div>"; }); }
      btns = "<button class='pri' onclick='CCdrillAgain()'>Another " + LD.n + " questions</button><button onclick='CCdrillMenu()'>Change drill settings</button><button onclick=\"location.hash='#/home'\">See progress</button>";
    }
    var msg = pct >= 90 ? "Brilliant work" : pct >= 70 ? "Nice work" : pct >= 50 ? "Getting there" : "Good practice";
    var sub = r + " of " + n + " correct" + (Q.mode === "mock" ? ". Unanswered questions count as wrong." : pct < 50 ? ". The explanations are where the learning happens." : ".");
    var cel = "<div class='cele" + (pct >= 70 ? " pop" : "") + "' aria-hidden='true'>" + cat(84) + "</div>";
    app.innerHTML = "<div class='fin'>" + cel + ring(pct, 128) + "<h1>" + msg + "</h1><p class='mut'>" + esc(sub) + "</p><p class='mut streakline'>" + paw(18) + " " + streak() + "-day streak</p></div>" + brk + btns;
    window.scrollTo(0, 0);
    Q = null;
  }

  // ---------- Drills: N questions from chosen sections ----------
  function drillPrefs() {
    try {
      var p = JSON.parse(localStorage.getItem(DP));
      if (p && [10, 20, 30, 50].indexOf(p.n) >= 0 && Array.isArray(p.sel)) return { n: p.n, sel: p.sel.filter(function (x) { return ALL_IDS.indexOf(x) >= 0; }), prio: p.prio === true };
    } catch (e) {}
    return { n: 20, sel: ALL_IDS.slice(), prio: false };
  }
  function saveDrillPrefs() { try { localStorage.setItem(DP, JSON.stringify(DS)); } catch (e) {} }
  function tier(q) { var v = S.seen[q.id]; return v === undefined ? 0 : (v === 0 ? 1 : 2); } // unseen, last missed, last correct
  // Random pick; with prio on, questions you haven't seen or last got wrong come first (still random within each group).
  function pickQs(list, k, prio) { var s = shuffle(list); if (prio) s.sort(function (a, b) { return tier(a) - tier(b); }); return s.slice(0, k); }
  function qsIn(id) { return C.questions.filter(function (q) { return q.domain === id; }); }
  // Keeps questions that share a scenario next to each other; standalone questions and scenario groups are shuffled as units.
  function groupScenarios(list) {
    var byScn = {}, units = [];
    shuffle(list).forEach(function (q) {
      if (!q.scenario) { units.push([q]); return; }
      if (!byScn[q.scenario]) { byScn[q.scenario] = []; units.push(byScn[q.scenario]); }
      byScn[q.scenario].push(q);
    });
    return shuffle(units).reduce(function (all, u) { return all.concat(u); }, []);
  }
  // ids = domain ids to draw from (split by exam weight, unseen/missed first); scn = scenario questions only.
  function startDrill(ids, n, scn) {
    var list = [], prio = drillPrefs().prio;
    if (scn) list = pickQs(C.questions.filter(function (q) { return q.scenario && (!ids || ids.indexOf(q.domain) >= 0); }), n, prio);
    else { var a = allocate(n, ids); ids.forEach(function (id) { list = list.concat(pickQs(qsIn(id), a[id] || 0, prio)); }); }
    if (!list.length) { alert("No questions match that selection."); return; }
    LD = { ids: ids, n: n, scn: !!scn };
    startQuiz(groupScenarios(list), "drill"); Q.cfg = LD;
  }
  window.CCstartDrill = function (csv, n) { if (csv === "scenarios") startDrill(null, n, true); else startDrill(csv.split(",").filter(function (x) { return ALL_IDS.indexOf(x) >= 0; }), n, false); };
  window.CCdrillAgain = function () { if (LD) startDrill(LD.ids, LD.n, LD.scn); };
  window.CCdrillMenu = function () { if (location.hash === "#/drill") drillSetup(); else location.hash = "#/drill"; };
  window.CCdn = function (n) { DS.n = n; saveDrillPrefs(); drillSetup(); };
  window.CCdt = function (id) { var i = DS.sel.indexOf(id); if (i >= 0) DS.sel.splice(i, 1); else DS.sel.push(id); saveDrillPrefs(); drillSetup(); };
  window.CCdall = function () { DS.sel = ALL_IDS.slice(); saveDrillPrefs(); drillSetup(); };
  window.CCdnone = function () { DS.sel = []; saveDrillPrefs(); drillSetup(); };
  window.CCdweak = function () { DS.sel = focusDomains().map(function (d) { return d.id; }); saveDrillPrefs(); drillSetup(); };
  window.CCdprio = function (on) { DS.prio = !!on; saveDrillPrefs(); drillSetup(); };
  window.CCdstart = function () { startDrill(DS.sel.slice(), DS.n, false); };
  window.CCdscn = function () { startDrill(null, DS.n, true); };
  function drillSetup() {
    if (!DS) DS = drillPrefs();
    var scnN = C.questions.filter(function (q) { return q.scenario; }).length;
    var h = "<h1>Drill</h1><div class='card'><b>Questions per drill</b><div class='seg'>" + [10, 20, 30, 50].map(function (n) { return "<button class='" + (DS.n === n ? "sel" : "") + "' onclick='CCdn(" + n + ")'>" + n + "</button>"; }).join("") + "</div></div>";
    h += "<div class='card'><div class='row'><b>Sections to drill</b><span class='mut'>" + DS.sel.length + " of " + ALL_IDS.length + "</span></div>";
    var avail = 0, unseen = 0;
    C.domains.forEach(function (d) {
      var qs = qsIn(d.id), on = DS.sel.indexOf(d.id) >= 0, un = qs.filter(function (q) { return S.seen[q.id] === undefined; }).length;
      if (on) { avail += qs.length; unseen += un; }
      h += "<label class='row chk'><span>" + esc(d.name) + "<br><span class='mut'>" + d.weight + "% of exam · " + qs.length + " Qs · " + un + " unseen · " + mastery(d.id) + "% so far</span></span><input type='checkbox' onchange=\"CCdt('" + d.id + "')\"" + (on ? " checked" : "") + "></label>";
    });
    h += "<div class='seg'><button onclick='CCdall()'>All</button><button onclick='CCdweak()'>Weakest 2</button><button onclick='CCdnone()'>None</button></div></div>";
    var n = Math.min(DS.n, avail);
    h += DS.sel.length ? "<button class='pri' onclick='CCdstart()'>Start drill: " + n + " question" + (n === 1 ? "" : "s") + " from " + DS.sel.length + " section" + (DS.sel.length === 1 ? "" : "s") + "</button>" : "<p class='mut'>Tick at least one section to start.</p>";
    h += "<div class='card'><label class='row'><span>Prioritise questions I haven't seen or got wrong</span><input type='checkbox' onchange='CCdprio(this.checked)'" + (DS.prio ? " checked" : "") + "></label><p class='mut'>Off: every drill is a purely random pick from your ticked sections (" + unseen + " of " + avail + " questions there are still unseen). On: unseen and missed questions come first.</p></div>";
    h += "<p class='mut'>With several sections ticked, the questions are split between them by exam weight.</p>";
    h += "<button onclick='CCdscn()'>Scenario questions only (" + Math.min(DS.n, scnN) + " of " + scnN + ")</button>";
    app.innerHTML = h;
  }
  function drill(d) {
    var n = drillPrefs().n;
    if (d === "all") return startDrill(ALL_IDS.slice(), n, false);
    if (d === "scenarios") return startDrill(null, n, true);
    if (d && ALL_IDS.indexOf(d) >= 0) return startDrill([d], n, false);
    drillSetup();
  }

  // Largest-remainder allocation of n slots by domain weight, capped by questions available;
  // any shortfall from a capped domain is redistributed to domains that still have spare questions.
  function allocate(n, ids) {
    var avail = {}, got = {}, doms = ids ? C.domains.filter(function (d) { return ids.indexOf(d.id) >= 0; }) : C.domains, total = 0;
    doms.forEach(function (d) { avail[d.id] = qsIn(d.id).length; got[d.id] = 0; total += avail[d.id]; });
    n = Math.min(n, total);
    var rem = n, pool = doms.slice();
    while (rem > 0 && pool.length) {
      var w = pool.reduce(function (s, d) { return s + d.weight; }, 0), part = [], given = 0;
      pool.forEach(function (d) {
        var exact = rem * d.weight / w, room = avail[d.id] - got[d.id], base = Math.min(Math.floor(exact), room);
        got[d.id] += base; given += base; part.push({ id: d.id, frac: exact - Math.floor(exact) });
      });
      part.sort(function (a, b) { return b.frac - a.frac; });
      for (var i = 0; i < part.length && given < rem; i++) if (got[part[i].id] < avail[part[i].id]) { got[part[i].id]++; given++; }
      rem -= given;
      pool = pool.filter(function (d) { return got[d.id] < avail[d.id]; });
      if (!given) break;
    }
    return got;
  }
  function weightedSample(n) {
    var a = allocate(n), out = [];
    C.domains.forEach(function (d) { out = out.concat(shuffle(qsIn(d.id)).slice(0, a[d.id])); });
    return groupScenarios(out);
  }
  function mock() {
    var a = allocate(EXAM.mockN), n = C.domains.reduce(function (s, d) { return s + a[d.id]; }, 0);
    var h = "<h1>Mock exam</h1><div class='card'><p>" + n + " questions · " + EXAM.mockMinutes + " minutes.</p><label class='row'><span>Show right/wrong and the reason after each question</span><input type='checkbox' id='mfb' onchange='CCmfb(this.checked)'" + (mockFeedback() ? " checked" : "") + "></label><p class='mut'>Turn this off to practise under real exam conditions, with results only at the end.</p><p class='mut'>Questions are sampled by exam domain weight, so each mock mirrors the real exam's mix.</p>";
    C.domains.forEach(function (d) { h += "<div class='row mut'><span>" + esc(d.name) + "</span><span>" + a[d.id] + "</span></div>"; });
    app.innerHTML = h + "</div><button class='pri' onclick='CCmock()'>Start</button>" + mockHistory();
  }
  function mockHistory() {
    if (!S.mocks.length) return "";
    var h = "<h2>Mock history</h2>", withBy = S.mocks.filter(function (m) { return m.by; });
    if (withBy.length) {
      var cols = withBy.slice(-4), tot = {}, rows = [];
      withBy.forEach(function (m) { Object.keys(m.by).forEach(function (k) { var t = tot[k] || (tot[k] = [0, 0]); t[0] += m.by[k][0]; t[1] += m.by[k][1]; }); });
      function cell(c, n) { var p = Math.round(100 * c / n); return "<td class='" + (p < 70 ? "lo" : p >= 80 ? "hi" : "") + "'>" + p + "%</td>"; }
      var t = "<table class='tbl'><tr><th></th>" + cols.map(function (m) { return "<th>#" + (S.mocks.indexOf(m) + 1) + "</th>"; }).join("") + "<th>All</th></tr>";
      C.domains.forEach(function (d) {
        if (!tot[d.id]) return;
        rows.push({ d: d, p: tot[d.id][0] / tot[d.id][1], n: tot[d.id][1] });
        t += "<tr><td>" + SHORT[d.id] + "</td>" + cols.map(function (m) { var b = m.by[d.id]; return b ? cell(b[0], b[1]) : "<td>–</td>"; }).join("") + cell(tot[d.id][0], tot[d.id][1]) + "</tr>";
      });
      t += "</table><p class='mut'>Red under 70%, green 80%+. " + EXAM.smallNote + "</p>";
      rows.sort(function (a, b) { return a.p - b.p; });
      h += "<div class='card'>" + t + "<p><b>Weakest across mocks:</b> " + esc(rows[0].d.name) + " (" + Math.round(100 * rows[0].p) + "%)</p></div>";
    }
    S.mocks.slice(-5).reverse().forEach(function (m) { h += "<div class='card row'><span>#" + (S.mocks.indexOf(m) + 1) + " · " + esc(m.date || "") + "</span><b>" + m.pct + "% (" + m.right + "/" + m.n + ")</b></div>"; });
    return h;
  }
  window.CCmock = function () { startQuiz(weightedSample(EXAM.mockN), "mock"); };

  // ---------- Flashcards (Leitner-style spacing) ----------
  var DAY = 864e5, GAP = [0, 1, 3, 7, 16, 35];
  function cards() {
    var now = Date.now(), due = C.cards.filter(function (c) { var s = S.cards[c.id]; return !s || s.due <= now; });
    if (!due.length) { app.innerHTML = "<h1>Cards</h1><div class='card'>All caught up. Come back tomorrow.</div>"; return; }
    var c = shuffle(due)[0];
    app.innerHTML = "<h1>Cards</h1><p class='mut'>" + due.length + " due · " + esc(dom(c.domain).name) + "</p><div class='card'><b>" + esc(c.front) + "</b></div><button class='pri' onclick='CCflip()' id='fl'>Show answer</button><div id='bk'></div>";
    window.CCflip = function () {
      document.getElementById("fl").style.display = "none";
      document.getElementById("bk").innerHTML = "<div class='card'>" + esc(c.back) + "</div><button class='ok' onclick=\"CCrate('" + c.id + "',1)\">Got it</button><button class='bad' onclick=\"CCrate('" + c.id + "',0)\">Missed it</button>";
    };
  }
  window.CCrate = function (id, ok) {
    var s = S.cards[id] || { box: 0 }; s.box = ok ? Math.min(s.box + 1, GAP.length - 1) : 0; s.due = Date.now() + GAP[s.box] * DAY; S.cards[id] = s; today().c++; save(); cards();
  };

  // ---------- Backup / restore ----------
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  // Version 2 holds every exam's progress; version 1 files (Developer only) are still accepted on restore.
  function backupText() {
    var ex = {}; EXAM_IDS.forEach(function (id) { ex[id] = id === EXAM.id ? S : loadState(EXAMS[id].stateKey); });
    return JSON.stringify({ app: "certcoach", version: 2, exported: new Date().toISOString(), exams: ex });
  }
  function num(v) { return typeof v === "number" && isFinite(v) && v >= 0 ? v : null; }
  // Rebuild state from untrusted input, keeping only known, well-typed fields.
  function cleanState(d) {
    if (!d || typeof d !== "object") return null;
    var o = { stats: {}, cards: {}, mocks: [], daily: {}, plan: {}, seen: {}, read: {}, rev: {} };
    Object.keys(d.rev || {}).forEach(function (k) {
      var r = d.rev[k]; if (!/^[ql]:/.test(k) || !r || typeof r !== "object" || (r.s !== "ok" && r.s !== "flag")) return;
      var kind = k.charAt(0), id = k.slice(2), ok = kind === "q" ? C.questions.some(function (q) { return q.id === id; }) : C.lessons.some(function (l) { return l.id === id; });
      if (ok) o.rev[k] = { s: r.s, note: typeof r.note === "string" ? r.note.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, 500) : "", t: num(r.t) || 0 };
    });
    var qids = C.questions.map(function (q) { return q.id; }), lids = C.lessons.map(function (l) { return l.id; });
    Object.keys(d.read || {}).forEach(function (k) { if (lids.indexOf(k) >= 0 && d.read[k] === 1) o.read[k] = 1; });
    Object.keys(d.seen || {}).forEach(function (k) { if (qids.indexOf(k) >= 0 && (d.seen[k] === 0 || d.seen[k] === 1)) o.seen[k] = d.seen[k]; });
    var doms = C.domains.map(function (x) { return x.id; }), cardIds = C.cards.map(function (c) { return c.id; });
    Object.keys(d.stats || {}).forEach(function (k) { var s = d.stats[k]; if (doms.indexOf(k) >= 0 && s && num(s.a) !== null && num(s.c) !== null && s.c <= s.a) o.stats[k] = { a: s.a, c: s.c }; });
    Object.keys(d.cards || {}).forEach(function (k) { var s = d.cards[k]; if (cardIds.indexOf(k) >= 0 && s && num(s.box) !== null && num(s.due) !== null) o.cards[k] = { box: Math.min(s.box, 5), due: s.due }; });
    (Array.isArray(d.mocks) ? d.mocks : []).forEach(function (m) {
      if (!m || num(m.pct) === null || num(m.right) === null || num(m.n) === null || m.pct > 100 || m.right > m.n) return;
      var r = { date: typeof m.date === "string" && /^[0-9\/.\-, ]{1,20}$/.test(m.date) ? m.date : "", pct: m.pct, right: m.right, n: m.n };
      if (m.by && typeof m.by === "object") { r.by = {}; Object.keys(m.by).forEach(function (k) { var b = m.by[k]; if (doms.indexOf(k) >= 0 && Array.isArray(b) && num(b[0]) !== null && num(b[1]) !== null) r.by[k] = [b[0], b[1]]; }); }
      o.mocks.push(r);
    });
    Object.keys(d.daily || {}).forEach(function (k) {
      var a = d.daily[k]; if (!DATE_RE.test(k) || !a || typeof a !== "object") return;
      var dd = {}; if (a.d && typeof a.d === "object") Object.keys(a.d).forEach(function (id) { if (doms.indexOf(id) >= 0 && num(a.d[id]) !== null) dd[id] = a.d[id]; });
      o.daily[k] = { q: num(a.q) || 0, c: num(a.c) || 0, m: num(a.m) || 0, sn: num(a.sn) || 0, d: dd, l: Array.isArray(a.l) ? a.l.filter(function (x) { return typeof x === "string"; }).slice(0, 50) : [] };
    });
    if (d.plan && typeof d.plan.date === "string" && DATE_RE.test(d.plan.date)) o.plan.date = d.plan.date;
    if (d.plan && typeof d.plan.week === "string" && DATE_RE.test(d.plan.week)) o.plan.week = d.plan.week;
    return o;
  }
  function restore(text) {
    var env; try { env = JSON.parse(text); } catch (e) { alert("That isn't valid backup text. Nothing was changed."); return; }
    var okV1 = env && env.version === 1 && env.data && typeof env.data === "object", okV2 = env && env.version === 2 && env.exams && typeof env.exams === "object";
    if (!env || env.app !== "certcoach" || !(okV1 || okV2)) { alert("That isn't a C⁴ backup. Nothing was changed."); return; }
    var src = okV1 ? { dev: env.data } : env.exams, clean = {}, lines = [];
    Object.keys(src).forEach(function (id) {
      if (!EXAMS[id]) return;
      var n = withExam(id, function () { return cleanState(src[id]); }); if (!n) return;
      clean[id] = n;
      lines.push(EXAMS[id].name + ": " + Object.keys(n.stats).reduce(function (s, k) { return s + n.stats[k].a; }, 0) + " questions answered, " + n.mocks.length + " mock exams, " + Object.keys(n.daily).length + " study days");
    });
    if (!Object.keys(clean).length) { alert("The backup couldn't be read. Nothing was changed."); return; }
    var when = typeof env.exported === "string" ? env.exported.slice(0, 10) : "unknown date";
    if (!confirm("Replace your current progress with this backup?\n\nExported: " + when + "\n" + lines.join("\n") + "\n\nExams not in the backup are left as they are. This can't be undone. Export first if unsure.")) return;
    Object.keys(clean).forEach(function (id) { try { localStorage.setItem(EXAMS[id].stateKey, JSON.stringify(clean[id])); } catch (e) {} });
    useExam(EXAM.id); alert("Backup restored."); location.hash = "#/"; route();
  }
  window.CCexport = function () {
    var blob = new Blob([backupText()], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "certcoach-backup-" + dkey() + ".json";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  function showBackupText(t) { var ta = document.getElementById("bkt"); ta.parentNode.open = true; ta.value = t; ta.focus(); ta.select(); alert("Select all in the box and copy it."); }
  window.CCcopy = function () {
    var t = backupText();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { alert("Backup copied. Paste it somewhere safe, such as a note to yourself."); }, function () { showBackupText(t); });
    else showBackupText(t);
  };
  window.CCimportFile = function (inp) {
    var f = inp.files && inp.files[0]; if (!f) return;
    if (f.size > 1e6) { alert("That file is too large to be a C⁴ backup."); inp.value = ""; return; }
    var r = new FileReader(); r.onload = function () { restore(String(r.result)); inp.value = ""; }; r.readAsText(f);
  };
  window.CCimportText = function () { restore(document.getElementById("bkt").value); };

  // ---------- Content review (sign off questions and lessons) ----------
  // Marks are your own, stored on this device and included in backups. The content files keep reviewed:false.
  var REVISED_Q = ["m07", "m09", "m10", "m20", "m25", "m28", "m37", "c03", "c05", "p05", "p06", "t01", "t11", "t22", "a04", "a22", "a23", "b03", "s2b", "q3", "q10", "q11"];
  var REVISED_L = ["apps-1", "apps-2", "prompt-1"];
  var NEW_L = ["apps-9", "apps-10", "apps-11", "apps-12", "models-5", "models-6", "agents-5", "agents-6", "tools-5", "tools-6", "code-3", "eval-3", "prompt-4", "security-4"];
  function rprefs() {
    var d = { kind: "all", dom: "all", set: "all", status: "todo" };
    try { var p = JSON.parse(localStorage.getItem(RPK)); if (p) { ["kind", "dom", "set", "status"].forEach(function (k) { if (typeof p[k] === "string") d[k] = p[k]; }); } } catch (e) {}
    return d;
  }
  function revItems() {
    return C.questions.map(function (q) { return { k: "q:" + q.id, kind: "q", id: q.id, domain: q.domain, obj: q }; })
      .concat(C.lessons.map(function (l) { return { k: "l:" + l.id, kind: "l", id: l.id, domain: l.domain, obj: l }; }));
  }
  function revMatch(it, f) {
    var st = S.rev[it.k];
    if (f.kind !== "all" && f.kind !== it.kind) return false;
    if (f.dom !== "all" && f.dom !== it.domain) return false;
    if (f.set === "revised" && (it.kind === "q" ? REVISED_Q : REVISED_L).indexOf(it.id) < 0) return false;
    if (f.set === "new" && !(it.kind === "q" ? NEW_Q_RE.test(it.id) : NEW_L.indexOf(it.id) >= 0)) return false;
    if (f.set === "scenario" && !(it.kind === "q" && it.obj.scenario)) return false;
    if (f.status === "todo" && st) return false;
    if (f.status === "flag" && !(st && st.s === "flag")) return false;
    if (f.status === "ok" && !(st && st.s === "ok")) return false;
    return true;
  }
  function revCounts() {
    var c = { q: { n: 0, ok: 0, flag: 0 }, l: { n: 0, ok: 0, flag: 0 }, dom: {} };
    revItems().forEach(function (it) {
      var st = S.rev[it.k], g = c[it.kind], d = c.dom[it.domain] || (c.dom[it.domain] = { n: 0, ok: 0 });
      g.n++; d.n++; if (st && st.s === "ok") { g.ok++; d.ok++; } if (st && st.s === "flag") g.flag++;
    });
    return c;
  }
  function reviewCard() {
    var c = revCounts(), done = c.q.ok + c.l.ok, tot = c.q.n + c.l.n;
    return "<h2>Content review</h2><div class='card'><div class='row'><span>Reviewed by you</span><b>" + done + " / " + tot + "</b></div>" + bar(Math.round(100 * done / tot)) +
      "<p class='mut'>Everything here is an AI-drafted study draft. Work through it and tick off what you've checked." + ((c.q.flag + c.l.flag) ? " " + (c.q.flag + c.l.flag) + " flagged." : "") + "</p><button onclick=\"location.hash='#/review'\">Open review</button></div>";
  }
  function selOpts(list, cur) { return list.map(function (o) { return "<option value='" + o[0] + "'" + (o[0] === cur ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join(""); }
  window.CCrf = function (key, val) { var f = rprefs(); f[key] = val; try { localStorage.setItem(RPK, JSON.stringify(f)); } catch (e) {} review(); };
  function review() {
    var f = rprefs(), c = revCounts(), match = revItems().filter(function (it) { return revMatch(it, f); });
    var h = "<h1>Content review</h1><p class='mut'>Check each question and lesson against Anthropic's docs, then tick it off or flag it with a note. Your marks stay on this device and are included in backups.</p>";
    h += "<div class='card'><div class='row'><span>Questions reviewed</span><b>" + c.q.ok + " / " + c.q.n + "</b></div>" + bar(Math.round(100 * c.q.ok / c.q.n)) +
      "<div class='row' style='margin-top:10px'><span>Lessons reviewed</span><b>" + c.l.ok + " / " + c.l.n + "</b></div>" + bar(Math.round(100 * c.l.ok / c.l.n)) +
      "<p class='mut'>Flagged for fixing: " + (c.q.flag + c.l.flag) + "</p></div>";
    h += "<div class='card'><b>What to review</b>" +
      "<label class='fld'>Type<select onchange=\"CCrf('kind',this.value)\">" + selOpts([["all", "Questions and lessons"], ["q", "Questions only"], ["l", "Lessons only"]], f.kind) + "</select></label>" +
      "<label class='fld'>Section<select onchange=\"CCrf('dom',this.value)\">" + selOpts([["all", "All sections"]].concat(C.domains.map(function (d) { return [d.id, d.name]; })), f.dom) + "</select></label>" +
      "<label class='fld'>Set<select onchange=\"CCrf('set',this.value)\">" + selOpts(EXAM.id === "dev" ? [["all", "Everything"], ["revised", "Revised after the docs fact-check"], ["new", "New in the gap-fill"], ["scenario", "Scenario questions"]] : [["all", "Everything"], ["scenario", "Scenario questions"]], EXAM.id === "dev" || f.set === "scenario" ? f.set : "all") + "</select></label>" +
      "<label class='fld'>Status<select onchange=\"CCrf('status',this.value)\">" + selOpts([["todo", "Not yet reviewed"], ["flag", "Flagged"], ["ok", "Reviewed"], ["all", "Any"]], f.status) + "</select></label>" +
      "<p class='mut'>" + match.length + " item" + (match.length === 1 ? "" : "s") + " match.</p></div>";
    h += match.length ? "<button class='pri' onclick='CCrstart()'>Start reviewing (" + match.length + ")</button>" : "<p class='mut'>Nothing matches these filters.</p>";
    if (c.q.flag + c.l.flag) h += "<button onclick='CCrcopy()'>Copy my flagged items as text</button>";
    h += "<details><summary>Text to copy</summary><textarea id='rvt' rows='5' readonly></textarea></details>";
    h += "<h2>Progress by section</h2><div class='card'>";
    C.domains.forEach(function (d) { var x = c.dom[d.id] || { n: 0, ok: 0 }; h += "<div class='row wk'><span>" + esc(d.name) + "</span><b>" + x.ok + " / " + x.n + "</b></div>"; });
    h += "</div><button onclick=\"if(confirm('Clear all review ticks and flags? This cannot be undone.'))CCrclear()\">Clear all review marks</button>" + disclaimer;
    app.innerHTML = h;
  }
  window.CCrclear = function () { S.rev = {}; save(); review(); };
  window.CCrstart = function () {
    var f = rprefs(), keys = revItems().filter(function (it) { return revMatch(it, f); }).map(function (it) { return it.k; });
    if (!keys.length) return; RV = { list: keys, i: 0 }; revItem();
  };
  function revFind(k) { var kind = k.charAt(0), id = k.slice(2); return kind === "q" ? C.questions.filter(function (q) { return q.id === id; })[0] : C.lessons.filter(function (l) { return l.id === id; })[0]; }
  function revItem() {
    if (!RV) { review(); return; }
    if (RV.i >= RV.list.length) {
      var c = revCounts();
      app.innerHTML = "<h1>All done</h1><div class='card'><p>You've reached the end of this list.</p><p class='mut'>Reviewed: " + (c.q.ok + c.l.ok) + " of " + (c.q.n + c.l.n) + ". Flagged: " + (c.q.flag + c.l.flag) + ".</p></div><button class='pri' onclick='CCrend()'>Back to review</button>";
      return;
    }
    var k = RV.list[RV.i], kind = k.charAt(0), o = revFind(k), st = S.rev[k], W = C.why || {};
    var chip = st ? (st.s === "ok" ? "<span class='chip ok'>✓ reviewed</span>" : "<span class='chip bad'>⚑ flagged</span>") : "<span class='chip'>not reviewed</span>";
    var h = "<div class='row'><span class='mut'>" + (RV.i + 1) + " of " + RV.list.length + " · " + esc(dom(o.domain).name) + "</span>" + chip + "</div>";
    if (kind === "q") {
      var sc = o.scenario && C.scenarios && C.scenarios[o.scenario];
      if (sc) h += "<div class='card scn'><b>Scenario: " + esc(sc.title) + "</b><p>" + esc(sc.text) + "</p></div>";
      h += "<div class='card'><p class='mut'>Question " + esc(o.id) + (o.type === "multi" ? " · select " + (o.pick || o.correct.length) : "") + "</p><p><b>" + esc(o.stem) + "</b></p></div>";
      o.options.forEach(function (opt, i) {
        var right = o.correct.indexOf(i) >= 0, why = W[o.id] && W[o.id][i] ? W[o.id][i].replace(/^(Right|Wrong|Correct|Incorrect):\s*/, "") : "";
        h += "<div class='card " + (right ? "rok" : "") + "'><b>" + (right ? "✓ " : "✗ ") + esc(opt) + "</b>" + (why ? "<br><span class='rsn'>" + esc(why) + "</span>" : "") + "</div>";
      });
      h += "<div class='card'><span class='mut'>Summary:</span> " + esc(o.explanation) + "</div>";
    } else {
      h += "<h1>" + esc(o.title) + "</h1><div class='card'><p>" + esc(o.body) + "</p></div>";
      if (o.points) h += "<h2>Key points</h2><div class='card'><ul class='pts'>" + o.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>";
      if (o.code) h += "<pre>" + esc(o.code) + "</pre>";
      if (o.traps) h += "<h2>Common traps</h2><div class='card trap'><ul class='pts'>" + o.traps.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>";
      if (o.sources) h += "<details open><summary>Sources to check against</summary>" + o.sources.filter(function (u) { return /^https:\/\//.test(u); }).map(function (u) { return "<p class='src'><a href='" + esc(u) + "' target='_blank' rel='noopener noreferrer'>" + esc(u.replace(/^https:\/\//, "")) + "</a></p>"; }).join("") + "</details>";
    }
    h += "<label class='fld'>Note (required to flag)<textarea id='rn' rows='3' placeholder='What is wrong or unclear?'>" + esc(st && st.note ? st.note : "") + "</textarea></label>";
    h += "<button class='pri' onclick='CCrmark(\"ok\")'>✓ Reviewed, next</button><button onclick='CCrmark(\"flag\")'>⚑ Flag for fixing, next</button>";
    h += "<div class='seg'><button onclick='CCrgo(-1)'>◀ Previous</button><button onclick='CCrgo(1)'>Skip ▶</button><button onclick='CCrend()'>Back</button></div>";
    app.innerHTML = h; window.scrollTo(0, 0);
  }
  window.CCrmark = function (s) {
    if (!RV) return; var note = (document.getElementById("rn") || { value: "" }).value.trim().slice(0, 500);
    if (s === "flag" && !note) { alert("Add a short note saying what is wrong, so it can be fixed."); return; }
    S.rev[RV.list[RV.i]] = { s: s, note: note, t: Date.now() }; save(); RV.i++; revItem();
  };
  window.CCrgo = function (d) { if (!RV) return; RV.i = Math.max(0, RV.i + d); revItem(); };
  window.CCrend = function () { RV = null; review(); };
  window.CCrcopy = function () {
    var lines = [], n = 0;
    revItems().forEach(function (it) {
      var st = S.rev[it.k]; if (!st || st.s !== "flag") return; n++;
      var o = it.obj; lines.push("[" + (it.kind === "q" ? "Question " : "Lesson ") + it.id + "] " + (it.kind === "q" ? o.stem : o.title) + "\nNote: " + (st.note || "(no note)"));
    });
    var t = "C4 review: " + n + " flagged item" + (n === 1 ? "" : "s") + "\n\n" + lines.join("\n\n");
    var ta = document.getElementById("rvt");
    function fb() { if (ta) { ta.parentNode.open = true; ta.value = t; ta.focus(); ta.select(); } alert("Select all in the box and copy it."); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { alert("Copied. Paste it into a message to send for fixing."); }, fb); else fb();
  };
  window.CCreset = function () {
    if (!confirm("Reset your study progress for " + EXAM.name + "? Your content review marks are kept, and your other exam is not touched.")) return;
    var keep = S.rev || {}; localStorage.removeItem(KEY);
    try { localStorage.setItem(KEY, JSON.stringify({ rev: keep })); } catch (e) {}
    location.reload();
  };

  // ---------- Study planner ----------
  function streak() { var n = 0, d = new Date(); for (var i = 0; i < 400; i++) { var a = S.daily[dkey(d)]; if (a && (a.q || a.c || a.l.length || a.m)) n++; else if (i > 0) break; d.setDate(d.getDate() - 1); } return n; }
  function planFor(days) {
    var N = C.questions.length, L = C.lessons.length, p;
    if (days <= 0) return { phase: "Exam day", note: "Light review only. Rest and trust your preparation.", q: 0, l: 0, c: 10, mock: false };
    if (days === 1) return { phase: "Eve of exam", note: "No new material. Review flashcards and your weakest domain, then rest.", q: 10, l: 0, c: 15, mock: false };
    var mockDay = days <= 7 && (days === 7 || days === 4 || days === 2);
    if (days <= 7) p = { phase: "Mock and review", note: "Take timed mocks, then fix the weakest domains.", q: mockDay ? EXAM.mockN : 30, l: 0, c: 15, mock: mockDay };
    else if (days <= 21) {
      var pm = days % 7 === 0;
      p = { phase: "Practice", note: "Drill by domain, revisit lessons for weak areas, one mock a week.", q: pm ? EXAM.mockN : Math.min(60, Math.max(20, Math.ceil(N / Math.max(1, days - 5)))), l: 1, c: 15, mock: pm };
    } else p = { phase: "Learn", note: "Work through lessons in weight order, then practise each domain.", q: Math.min(40, Math.max(15, Math.ceil(N / Math.max(1, days - 5)))), l: Math.min(3, Math.max(1, Math.ceil(L / Math.max(1, days * 0.4)))), c: 10, mock: false };
    return p;
  }
  function focusDomains() {
    return C.domains.map(function (d) { return { d: d, gap: (100 - mastery(d.id)) * d.weight }; }).sort(function (a, b) { return b.gap - a.gap; }).slice(0, 2).map(function (x) { return x.d; });
  }
  function prog(label, done, target) {
    var pct = target ? Math.min(100, Math.round(100 * done / target)) : 100;
    return "<div class='card'><div class='row'><span>" + label + "</span><b>" + done + " / " + target + (done >= target ? " ✓" : "") + "</b></div>" + bar(pct) + "</div>";
  }
  window.CCsetDate = function (v) { if (!v) { alert("Pick a date"); return; } if (daysUntil(v) < 0) { alert("Pick a date in the future"); return; } S.plan.date = v; save(); plan(); };
  window.CCclearDate = function () { delete S.plan.date; save(); plan(); };
  window.CCquick = function (weeks) { var d = new Date(); d.setDate(d.getDate() + weeks * 7); CCsetDate(dkey(d)); };
  // ---------- 7-day intensive plan ("learn in a week") ----------
  var T = {
    lesson: function (id) { return { k: "lesson", id: id }; },
    lessons: function (ids) { return { k: "lessons", ids: ids }; },
    drill: function (ids, n) { return { k: "drill", ids: ids, n: n }; },
    weak: function (n) { return { k: "drill", weak: true, n: n }; },
    scn: function (n) { return { k: "scn", n: n }; },
    mock: function () { return { k: "mock" }; },
    cards: function (n) { return { k: "cards", n: n }; }
  };
  function LS(p, n) { var o = []; for (var i = 1; i <= n; i++) o.push(p + "-" + i); return o; }
  WEEK_BUILDERS.dev = function () { return [
    { t: "Applications & Integration, part 1", note: "The biggest section at 33% of the exam: the Messages API, responses and stop reasons, streaming and errors, structured output, requirements and life cycle, software engineering foundations, application design and configuration.", tasks: [T.lessons(LS("apps", 4).concat(["apps-9", "apps-10", "apps-11", "apps-12"])), T.drill(["apps"], 20), T.cards(10)] },
    { t: "Applications & Integration part 2, and Models", note: "Prompt caching, batching, images and PDFs, production architecture, then choosing models, thinking and effort, LLM and technical fundamentals.", tasks: [T.lessons(["apps-5", "apps-6", "apps-7", "apps-8"].concat(LS("models", 6))), T.drill(["apps"], 20), T.drill(["models"], 20), T.cards(10)] },
    { t: "Agents & Workflows, and Prompting", note: "The agentic loop, workflow patterns, reliability, the Agent SDK and frameworks, then prompt and context engineering and output handling.", tasks: [T.lessons(LS("agents", 6).concat(LS("prompt", 4))), T.drill(["agents"], 20), T.drill(["prompt"], 20), T.scn(10), T.cards(10)] },
    { t: "Tools & MCP, and Security", note: "Tool definitions and the tool-use cycle, MCP and building servers, choosing between tools, Skills and MCP, then prompt injection, secrets, data protection and guardrails.", tasks: [T.lessons(LS("tools", 6).concat(LS("security", 4))), T.drill(["tools"], 20), T.drill(["security"], 20), T.cards(10)] },
    { t: "Claude Code and Eval, then scenarios", note: "Claude Code memory, settings, commands, sessions and modes; evals, debugging and error handling. Finish with scenario questions.", tasks: [T.lessons(LS("code", 3).concat(LS("eval", 3))), T.drill(["code", "eval"], 15), T.scn(10), T.cards(10)] },
    { t: "Mixed practice and mock 1", note: "Everything together, scenario questions, then a full mock.", tasks: [T.drill(ALL_IDS, 30), T.scn(20), T.mock(), T.cards(10)] },
    { t: "Final push: mock 2 and weak spots", note: "Take this mock under exam conditions (switch feedback off on the Mock page), then drill your weakest sections.", tasks: [T.mock(), T.weak(20), T.cards(10)] }
  ]; };
  // Architect – Professional: seven days, one per domain (blueprint order), then mixed practice and two mocks.
  WEEK_BUILDERS.arch = function () { return [
    { t: "Solution Design & Architecture", note: "The second-largest domain at 17%: turning business problems into Claude solutions, workflow versus agentic patterns, multi-agent design, decomposition, and tying designs to business value.", tasks: [T.lessons(LS("design", 7)), T.drill(["design"], 20), T.cards(10)] },
    { t: "Models, Prompting & Context, and Developer Productivity", note: "Choosing models by trade-off, system prompts and guardrails, few-shot and chain-of-thought, context and token budgets, caching and Skills; then rolling Claude Code out to teams.", tasks: [T.lessons(LS("models", 6).concat(LS("devprod", 3))), T.drill(["models"], 20), T.drill(["devprod"], 10), T.cards(10)] },
    { t: "Integration", note: "The biggest domain at 19%: capability bloat, authentication and authorization gaps, accuracy-latency trade-offs, observability, RAG design, retrieval strategy, MCP versus API versus agent-to-agent, progressive discovery.", tasks: [T.lessons(LS("integ", 8)), T.drill(["integ"], 25), T.scn(10), T.cards(10)] },
    { t: "Evaluation, Testing & Optimization", note: "Metrics, evaluation datasets and test frameworks, A/B testing, diagnosing prompt failure and hallucination, token and cost-performance optimisation, monitoring.", tasks: [T.lessons(LS("eval", 6)), T.drill(["eval"], 20), T.cards(10)] },
    { t: "Governance, Safety & Risk Management", note: "Guardrails, failure modes and limits, human-in-the-loop validation, regulatory concepts such as GDPR, HIPAA and FedRAMP, and ethical AI. Take regulatory questions to Legal, Compliance or your Data Privacy Officer in real work.", tasks: [T.lessons(LS("gov", 5)), T.drill(["gov"], 20), T.scn(10), T.cards(10)] },
    { t: "Stakeholders & Lifecycle, then mixed practice and mock 1", note: "Discovery, communicating trade-offs, expectations and SLAs, documentation, lifecycle phases. Then a mixed drill and a full mock.", tasks: [T.lessons(LS("comm", 5)), T.drill(ALL_IDS, 20), T.mock(), T.cards(10)] },
    { t: "Final push: mock 2 and weak spots", note: "Take this mock under exam conditions (switch feedback off on the Mock page), then drill your weakest domains.", tasks: [T.mock(), T.weak(20), T.cards(10)] }
  ]; };
  function lessonTitle(id) { var l = C.lessons.filter(function (x) { return x.id === id; })[0]; return l ? l.title : id; }
  function weekDay() { return S.plan.week ? 1 - daysUntil(S.plan.week) : 0; }
  function weekDate(k) { var p = S.plan.week.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2] + k); return d; }
  function taskInfo(t, rec) {
    rec = rec || { q: 0, c: 0, l: [], m: 0, d: {}, sn: 0 };
    var dn = rec.d || {};
    if (t.k === "lesson") return { label: "Lesson: " + esc(lessonTitle(t.id)), done: rec.l.indexOf(t.id) >= 0 ? 1 : 0, target: 1, btn: "Open lesson", act: "location.hash='#/learn/" + t.id + "'" };
    if (t.k === "lessons") {
      var ls = t.ids.map(function (id) { return C.lessons.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
      if (!ls.length) return { label: "Lessons", done: 1, target: 1, btn: "", act: "" };
      var read = ls.filter(function (x) { return rec.l.indexOf(x.id) >= 0; }).length, mins = ls.reduce(function (s, x) { return s + lessonMins(x); }, 0);
      var nxt = ls.filter(function (x) { return rec.l.indexOf(x.id) < 0; })[0];
      var list = ls.map(function (x) { return "<div class='lsn'>" + (rec.l.indexOf(x.id) >= 0 ? "✓ " : "○ ") + esc(x.title) + "</div>"; }).join("");
      return { label: "<details><summary>Read " + ls.length + " lessons · about " + mins + " min</summary>" + list + "</details>", done: read, target: ls.length, btn: "Open next lesson", act: nxt ? "location.hash='#/learn/" + nxt.id + "'" : "" };
    }
    if (t.k === "mock") return { label: "Full mock exam (" + EXAM.mockN + " questions)", done: Math.min(rec.m || 0, 1), target: 1, btn: "Go to mock", act: "location.hash='#/mock'" };
    if (t.k === "cards") {
      // Cap the target at cards actually due (cards you got right aren't due again for a day or more).
      var due = C.cards.filter(function (c) { var s = S.cards[c.id]; return !s || s.due <= Date.now(); }).length, did = rec.c || 0, target = Math.min(t.n, due + did);
      return target ? { label: "Flashcards", done: Math.min(did, target), target: target, btn: "Review cards", act: "location.hash='#/cards'" } : { label: "Flashcards (none due)", done: 1, target: 1, btn: "", act: "" };
    }
    if (t.k === "scn") return { label: "Scenario questions", done: Math.min(rec.sn || 0, t.n), target: t.n, btn: "Start scenarios", act: "CCstartDrill('scenarios'," + t.n + ")" };
    var ids = t.weak ? focusDomains().map(function (d) { return d.id; }) : t.ids;
    var done = ids.reduce(function (s, id) { return s + (dn[id] || 0); }, 0);
    return { label: "Drill: " + ids.map(function (id) { return esc(SHORT[id]); }).join(" + ") + (t.weak ? " (your weakest)" : ""), done: Math.min(done, t.n), target: t.n, btn: "Start drill", act: "CCstartDrill('" + ids.join(",") + "'," + t.n + ")" };
  }
  window.CCweek = function () {
    S.plan.week = dkey();
    if (!S.plan.date || daysUntil(S.plan.date) < 0) { var d = new Date(); d.setDate(d.getDate() + 8); S.plan.date = dkey(d); }
    save(); plan();
  };
  window.CCstopWeek = function () { delete S.plan.week; save(); plan(); };
  // One task row: small progress ring, label, "x of y", and an action button while unfinished.
  function trow(label, done, target, btn, act) {
    if (!target) return "";
    var fin = done >= target, pct = target ? Math.min(100, Math.round(100 * done / target)) : 100;
    return "<div class='trow" + (fin ? " fin" : "") + "'>" + ring(pct, 44, fin ? "✓" : "") + "<div class='tb'><div class='tl'>" + label + "</div><div class='mut'>" + done + " of " + target + "</div></div>" + (!fin && act ? "<button class='mini' onclick=\"" + act + "\">" + esc(btn || "Open") + "</button>" : "") + "</div>";
  }
  // Seven day pills: paw on completed days, outline on today, dashed for missed days.
  function wkStrip(wd) {
    var h = "<div class='strip'>";
    WEEK.forEach(function (dd, k) {
      var r = S.daily[dkey(weekDate(k))], past = k < wd - 1, now = k === wd - 1;
      var full = (past || now) && dd.tasks.every(function (t) { var i = taskInfo(t, r); return i.done >= i.target; });
      h += "<div class='dcol'><div class='dpill" + (now ? " now" : "") + (full ? " done" : "") + (past && !full ? " miss" : "") + "' title='" + esc(dd.t) + "'>" + (full ? paw(18) : (k + 1)) + "</div><span>" + weekDate(k).toLocaleDateString(undefined, { weekday: "narrow" }) + "</span></div>";
    });
    return h + "</div>";
  }
  function planWeek(wd) {
    var day = WEEK[wd - 1], rec = today(), left = 0;
    var h = "<h1 class='sr'>Learn in a week</h1><div class='card hero'><p class='kick'>Day " + wd + " of 7" + (S.plan.date ? " · exam " + esc(S.plan.date) : "") + "</p><h2>" + esc(day.t) + "</h2><p class='mut'>" + esc(day.note) + "</p></div>";
    h += wkStrip(wd) + "<h2>Today's tasks</h2><div class='card list'>";
    day.tasks.forEach(function (t) { var i = taskInfo(t, rec); if (i.done < i.target) left++; h += trow(i.label, i.done, i.target, i.btn, i.act); });
    h += "</div>";
    if (!left) h += "<div class='card soft'><b>✓ Day " + wd + " complete.</b><p class='mut'>" + (wd < 7 ? "Rest, and come back tomorrow." : "Week done. Review anything flagged weak, then rest before the exam.") + "</p></div>";
    h += "<details class='card more'><summary>The whole week</summary>";
    WEEK.forEach(function (dd, k) {
      var r = S.daily[dkey(weekDate(k))], full = k < wd - 1 || k === wd - 1 ? dd.tasks.every(function (t) { var i = taskInfo(t, r); return i.done >= i.target; }) : false;
      var mark = k === wd - 1 ? "▶" : k < wd - 1 ? (full ? "✓" : "–") : "○";
      h += "<div class='row wk" + (k === wd - 1 ? " now" : "") + "'><span>" + mark + " Day " + (k + 1) + " · " + esc(dd.t) + "</span><span class='mut'>" + weekDate(k).toLocaleDateString(undefined, { weekday: "short" }) + "</span></div>";
    });
    h += "<p class='mut'>Streak: " + streak() + " day" + (streak() === 1 ? "" : "s") + "</p></details>";
    h += "<p class='mut'>Heads up: the lessons are short summaries. Most of the teaching comes from the explanations after each drill question, so read those, especially when you get one wrong.</p>";
    h += "<details class='card more'><summary>Plan options</summary><button onclick=\"if(confirm('Restart the week from today?'))CCweek()\">Restart the week from today</button><button onclick=\"if(confirm('Stop the intensive plan?'))CCstopWeek()\">Stop the intensive plan</button></details>" + disclaimer;
    app.innerHTML = h;
  }
  function plan() {
    var h = "<h1>Study plan</h1>", wd = S.plan.week ? weekDay() : 0;
    if (wd >= 1 && wd <= 7) { planWeek(wd); return; }
    if (S.plan.week && wd > 7) h += "<div class='card soft'><b>✓ Your 7-day intensive week is finished.</b><p class='mut'>Showing your standard plan again.</p><button onclick='CCstopWeek()'>Dismiss</button></div>";
    if (!S.plan.date) {
      var def = new Date(); def.setDate(def.getDate() + 28);
      h += "<div class='card hero'><p class='kick'>Fastest</p><h2>Learn in a week</h2><p class='mut'>A day-by-day schedule of lessons, drills, scenarios and two mocks. Sets your exam date to 8 days from now.</p><button class='pri' onclick='CCweek()'>Start the 7-day intensive</button></div>";
      h += "<div class='card'><p>Or pick your exam date and C⁴ builds daily targets from today to that date.</p><input type='date' id='exd' min='" + dkey() + "' value='" + dkey(def) + "'><button class='pri' onclick=\"CCsetDate(document.getElementById('exd').value)\">Create plan</button></div>";
      h += "<p class='mut'>Or start with a standard plan:</p><button onclick='CCquick(2)'>2 weeks (intensive)</button><button onclick='CCquick(4)'>4 weeks (recommended)</button><button onclick='CCquick(8)'>8 weeks (relaxed)</button>" + disclaimer;
      app.innerHTML = h; return;
    }
    var days = daysUntil(S.plan.date), p = planFor(days), t = today(), due = C.cards.filter(function (c) { var s = S.cards[c.id]; return !s || s.due <= Date.now(); }).length;
    if (days < 0) { app.innerHTML = h + "<div class='card'><p>Your exam date (" + esc(S.plan.date) + ") has passed.</p></div><button class='pri' onclick='CCclearDate()'>Set a new exam date</button>"; return; }
    h += "<div class='card hero'><p class='kick'>" + esc(p.phase) + " phase</p>" + (days === 0 ? "<div class='bignum'><span>Exam day</span></div>" : "<div class='bignum'><b>" + days + "</b><span>" + (days === 1 ? "day" : "days") + " to go</span></div>") + "<p class='mut'>" + esc(p.note) + "</p><p class='mut'>Exam " + esc(S.plan.date) + " · streak " + streak() + " day" + (streak() === 1 ? "" : "s") + "</p></div>";
    h += "<h2>Today</h2><div class='card list'>";
    if (p.l) h += trow("Lessons", t.l.length, p.l, "Open Learn", "location.hash='#/learn'");
    h += trow("Practice questions", t.q, p.q, "Start a drill", "location.hash='#/drill'") + trow("Flashcards", t.c, Math.min(p.c, Math.max(due + t.c, 1)), "Review cards", "location.hash='#/cards'");
    if (p.mock) h += trow("Mock exam (recommended today)", t.m, 1, "Go to mock", "location.hash='#/mock'");
    h += "</div><h2>Focus areas</h2><p class='mut'>Biggest gap, weighted by exam share:</p><div class='card list'>";
    focusDomains().forEach(function (d) { h += "<button class='sec' onclick=\"location.hash='#/drill/" + d.id + "'\"><span class='row'><span>" + esc(d.name) + "</span><span class='chip'>" + mastery(d.id) + "% so far</span></span></button>"; });
    h += "</div><button class='pri' onclick=\"location.hash='#/" + (p.mock ? "mock" : "drill") + "'\">" + (p.mock ? "Start today's mock" : "Start practising") + "</button><button class='quiet' onclick='CCclearDate()'>Change exam date</button><button class='quiet' onclick=\"if(confirm('Start the 7-day intensive plan from today?'))CCweek()\">Switch to the 7-day intensive plan</button>" + disclaimer;
    app.innerHTML = h;
  }

  // ---------- Router ----------
  function route() {
    var p = location.hash.replace(/^#\/?/, "").split("/"), r = p[0] || "";
    if (!aboutSeen() || r === "about") { clearInterval(timer); Q = null; setChip(false); about(); return; }
    if (r !== "drill" && r !== "mock") { clearInterval(timer); Q = null; }
    if (["home", "learn", "drill", "mock", "cards", "plan", "review"].indexOf(r) < 0) r = ""; // anything else opens the exam hub
    setNav(r);
    window.scrollTo(0, 0);
    if (r === "") { setChip(false); hub(); return; }
    if (r === "learn") learn(p[1]); else if (r === "drill") drill(p[1]); else if (r === "mock") mock(); else if (r === "cards") cards(); else if (r === "plan") plan(); else if (r === "review") { RV = null; review(); } else home();
    setChip(!Q);
  }
  // Exam chip (outside #app, so it survives screens that re-render themselves): shows which exam you are in and is the way
  // back to the hub. Hidden on the hub, About and during a quiz.
  function setChip(show) {
    var xc = document.getElementById("xc");
    if (!xc) { xc = document.createElement("div"); xc.id = "xc"; app.parentNode.insertBefore(xc, app); }
    if (!show || EXAM_IDS.length < 2) { xc.style.display = "none"; return; }
    xc.style.display = "";
    xc.innerHTML = "<a class='xchip' href='#/' aria-label='Switch exam. Current exam: " + esc(EXAM.name) + "'><b>" + esc(EXAM.short) + "</b><span>" + esc(EXAM.code) + " · switch exam</span></a>";
  }
  useExam(currentExam());
  applyTheme();
  window.addEventListener("scroll", function () {
    var e = document.getElementById("rp"); if (!e) return;
    var d = document.documentElement, max = d.scrollHeight - d.clientHeight, p = max > 0 ? d.scrollTop / max : 0;
    e.firstChild.style.width = Math.min(100, Math.max(0, p * 100)) + "%";
  }, { passive: true });
  if (window.matchMedia) { try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme); } catch (e) {} }
  window.addEventListener("hashchange", route); route();
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("sw.js");
})();
