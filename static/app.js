"use strict";

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

// `API` (path map) and `api()` come from api.js (Supabase-backed).

function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

// ---------- Tabs ----------
function activateTab(name) {
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  $$(".panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
  // Reset scroll so the app never "lands" mid-page when switching sections.
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo(0, 0);
}
$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activateTab(tab.dataset.tab);
    tab.blur();
  });
});

// ---------- Exercises ----------
const exerciseList = $("#exercise-list");
// These YouTube videos are no longer available, so their cards are hidden.
const BROKEN_VIDEOS = new Set(["https://www.youtube.com/watch?v=NKfFpMwMnyE"]);
function buildExerciseCards() {
  exerciseList.innerHTML = "";
  window.TRE_EXERCISES.forEach((ex) => {
    if (BROKEN_VIDEOS.has(ex.video)) return;
    const card = document.createElement("article");
    card.className = "card exercise-card";
    const videoId = youtubeId(ex.video);
    card.innerHTML = `
      <h3 class="ex-card-name">${ex.name}</h3>
      <div class="video-wrap">
        <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0"
          title="Guided ${escapeHtml(ex.name)} video" frameborder="0" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
    `;
    exerciseList.appendChild(card);
  });
}

function youtubeId(url) {
  const m = url.match(/[?&]v=([\w-]+)/);
  return m ? m[1] : url.split("/").pop();
}

// ---------- Guided session ----------
$("#session-video").src =
  "https://www.youtube-nocookie.com/embed/" + youtubeId(window.TRE_GUIDED_VIDEO) + "?rel=0";

// ---------- Timer ----------
let timerInterval = null;
let timerElapsed = 0;
let timerGoal = 10;
function renderTimer() {
  const s = timerElapsed % 60;
  const m = Math.floor(timerElapsed / 60);
  $("#timer-display").textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
$("#timer-min").addEventListener("input", (e) => {
  timerGoal = Math.max(1, parseInt(e.target.value, 10) || 1);
});
$("#timer-start").addEventListener("click", () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    $("#timer-start").textContent = "Start";
    return;
  }
  if (timerElapsed >= timerGoal * 60) timerElapsed = 0;
  $("#timer-start").textContent = "Pause";
  timerInterval = setInterval(() => {
    timerElapsed++;
    if (timerElapsed >= timerGoal * 60) {
      clearInterval(timerInterval);
      timerInterval = null;
      $("#timer-start").textContent = "Start";
    }
renderTimer();
  }, 1000);
});
function timerMsg(text) {
  const el = $("#timer-msg");
  el.textContent = text;
  clearTimeout(timerMsg._t);
  timerMsg._t = setTimeout(() => (el.textContent = ""), 4500);
}
$("#timer-reset").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timerElapsed = 0;
  $("#timer-start").textContent = "Start";
  renderTimer();
  timerMsg("Timer reset \u2014 nothing recorded.");
});
$("#timer-end").addEventListener("click", endGuidedSession);
function endGuidedSession() {
  clearInterval(timerInterval);
  timerInterval = null;
  $("#timer-start").textContent = "Start";
  timerElapsed = 0;
  renderTimer();
  timerMsg("Session finished \u2014 log it in your Journal to count toward your stats.");
}
renderTimer();

// ---------- Qi Gong timer ----------
let qgInterval = null;
let qgElapsed = 0;
let qgGoal = 10;
function renderQg() {
  const s = qgElapsed % 60;
  const m = Math.floor(qgElapsed / 60);
  $("#qg-display").textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
function qgMsg(text) {
  const el = $("#qg-msg");
  el.textContent = text;
  clearTimeout(qgMsg._t);
  qgMsg._t = setTimeout(() => (el.textContent = ""), 4000);
}
$("#qg-min").addEventListener("input", (e) => {
  qgGoal = Math.max(1, parseInt(e.target.value, 10) || 1);
});
$("#qg-start").addEventListener("click", () => {
  if (qgInterval) {
    clearInterval(qgInterval);
    qgInterval = null;
    $("#qg-start").textContent = "Start";
    return;
  }
  if (qgElapsed >= qgGoal * 60) qgElapsed = 0;
  $("#qg-start").textContent = "Pause";
  $("#qg-end").hidden = false;
  qgInterval = setInterval(() => {
    qgElapsed++;
    if (qgElapsed >= qgGoal * 60) {
      clearInterval(qgInterval);
      qgInterval = null;
      $("#qg-start").textContent = "Start";
      $("#qg-end").hidden = true;
      qgElapsed = 0;
      renderQg();
      qgMsg("Goal reached \u2014 log it in your Journal to count toward your stats.");
      return;
    }
    renderQg();
  }, 1000);
});
$("#qg-end").addEventListener("click", () => {
  clearInterval(qgInterval);
  qgInterval = null;
  $("#qg-start").textContent = "Start";
  $("#qg-end").hidden = true;
  qgElapsed = 0;
  renderQg();
  qgMsg("Practice finished \u2014 log it in your Journal to count toward your stats.");
});
$("#qg-reset").addEventListener("click", () => {
  clearInterval(qgInterval);
  qgInterval = null;
  qgElapsed = 0;
  $("#qg-start").textContent = "Start";
  $("#qg-end").hidden = true;
  renderQg();
  $("#qg-msg").textContent = "";
});
renderQg();

// ---------- Meditation timer ----------
const MED_TYPES = [
  "Breath", "Self-Inquiry", "Vipassana", "Mantra",
  "Detachment", "Walking", "Sound", "Muse",
];
const medType = $("#med-type");
const customWrap = $("#med-custom-wrap");
const medProgress = { interval: null, remaining: 0, total: 0, elapsed: 0, phase: "ready", settleLeft: 0 };

function currentMedType() {
  return medType.value === "Other"
    ? ($("#med-type-custom").value.trim() || "Other")
    : medType.value;
}

medType.addEventListener("change", () => {
  customWrap.classList.toggle("hidden", medType.value !== "Other");
});

$$("#med-presets .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    $$("#med-presets .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const m = parseInt(chip.dataset.min, 10);
    $("#med-minutes").value = m;
    $("#med-min-label").textContent = `Custom minutes (currently ${m})`;
    $("#med-min-label").classList.add("compact-note");
  });
});

$("#med-minutes").addEventListener("input", (e) => {
  const v = parseInt(e.target.value, 10);
  if (!v || v <= 0) return;
  $$("#med-presets .chip").forEach((c) => {
    c.classList.toggle("active", parseInt(c.dataset.min, 10) === v);
  });
});

// Web Audio bell (no external files)
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playBell(volume = 1) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const dur = 3;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  // Rich bell: fundamental + harmonics
  [1, 2.76, 5.4, 8.9].forEach((partial, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 528 * partial;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(volume / (i + 1.5), t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.1);
  });
  osc.connect(gain).connect(ctx.destination);
}

// Distinct multi-chime ending bell so the end of the sit is unmistakable.
function playEndingBell() {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const chimes = [0, 0.8, 1.6, 3.0];
  chimes.forEach((offset, ci) => {
    const at = t0 + offset;
    const dur = 2.6;
    // Fundamental + harmonics for a rich bell
    [1, 2.76, 5.4, 8.9].forEach((partial, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 528 * partial;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(ci === chimes.length - 1 ? 0.9 : 0.55 / (i + 1.5), at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(ctx.destination);
      o.start(at);
      o.stop(at + dur + 0.1);
    });
  });
}

function playTick() {
  const ctx = ensureAudio();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = 880;
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.45);
}

function fmtMed(sec) {
  if (sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function medDuration() {
  return Math.max(1, parseInt($("#med-minutes").value, 10) || 1) * 60;
}

function setMedPhase(phase) {
  medProgress.phase = phase;
  const status = $("#med-status");
  const startBtn = $("#med-start");
  const pauseBtn = $("#med-pause");
  const resumeBtn = $("#med-resume");
  const endBtn = $("#med-end");
  switch (phase) {
    case "ready":
      status.textContent = "Ready";
      startBtn.hidden = false;
      pauseBtn.hidden = true;
      resumeBtn.hidden = true;
      endBtn.hidden = true;
      $("#med-display").classList.remove("running");
      break;
    case "settle":
      status.textContent = "Settling in &hellip;";
      startBtn.hidden = true;
      pauseBtn.hidden = true;
      resumeBtn.hidden = true;
      endBtn.hidden = false;
      $("#med-display").classList.add("running");
      break;
    case "running":
      status.textContent = "Meditating &mdash; be with the present moment";
      startBtn.hidden = true;
      pauseBtn.hidden = false;
      resumeBtn.hidden = true;
      endBtn.hidden = false;
      $("#med-display").classList.add("running");
      break;
    case "paused":
      status.textContent = "Paused";
      startBtn.hidden = true;
      pauseBtn.hidden = true;
      resumeBtn.hidden = false;
      endBtn.hidden = false;
      break;
  }
  syncFocusControls(phase);
}

function syncFocusControls(phase) {
  const st = $("#focus-status");
  const startBtn = $("#focus-start");
  const pauseBtn = $("#focus-pause");
  const resumeBtn = $("#focus-resume");
  const endBtn = $("#focus-end");
  switch (phase) {
    case "ready":
      st.textContent = "Ready";
      startBtn.hidden = false;
      pauseBtn.hidden = true;
      resumeBtn.hidden = true;
      endBtn.hidden = true;
      break;
    case "settle":
      st.textContent = "Settling in &hellip;";
      startBtn.hidden = true;
      pauseBtn.hidden = true;
      resumeBtn.hidden = true;
      endBtn.hidden = false;
      break;
    case "running":
      st.textContent = "Meditating &mdash; be with the present moment";
      startBtn.hidden = true;
      pauseBtn.hidden = false;
      resumeBtn.hidden = true;
      endBtn.hidden = false;
      break;
    case "paused":
      st.textContent = "Paused";
      startBtn.hidden = true;
      pauseBtn.hidden = true;
      resumeBtn.hidden = false;
      endBtn.hidden = false;
      break;
  }
}

function syncMedDisplay(text) {
  $("#med-display").textContent = text;
  $("#focus-display").textContent = text;
}

function startMeditation() {
  if (medProgress.phase === "paused") {
    resumeMeditation();
    return;
  }
  if (medProgress.phase === "running") return;
  ensureAudio();
  const total = medDuration();
  medProgress.total = total;
  medProgress.elapsed = 0;
  const settle = $("#med-settle").checked ? 30 : 0;
  if (ambientOn()) startAmbient();

  if (settle > 0) {
    medProgress.phase = "settle";
    medProgress.settleLeft = settle;
    medProgress.interval = setInterval(() => {
      medProgress.settleLeft--;
      syncMedDisplay(fmtMed(medProgress.settleLeft));
      if (medProgress.settleLeft <= 0) {
        clearInterval(medProgress.interval);
        beginRunningPhase(total);
      }
    }, 1000);
  } else {
    beginRunningPhase(total);
  }
  playBell();
  setMedPhase("settle");
  $("#med-msg").textContent = "";
}

function beginRunningPhase(total) {
  medProgress.remaining = total;
  setMedPhase("running");
  const intervalMin = $("#med-interval").checked ? 5 * 60 : 0;
  const lastTotal = total;

  medProgress.interval = setInterval(() => {
    medProgress.remaining--;
    medProgress.elapsed++;
    syncMedDisplay(fmtMed(medProgress.remaining));
    const rem = medProgress.remaining;
    if ($("#med-last").checked && rem > 0 && rem <= 10) playTick();
    if (intervalMin && rem > 0 && rem % intervalMin === 0 && rem !== lastTotal) playBell(0.5);
    if (rem <= 0) {
      clearInterval(medProgress.interval);
      finishMeditation();
    }
  }, 1000);
}

function pauseMeditation() {
  if (medProgress.phase === "running") {
    clearInterval(medProgress.interval);
    medProgress.phase = "paused";
    setMedPhase("paused");
  }
}

function resumeMeditation() {
  if (medProgress.phase !== "paused") return;
  medProgress.phase = "running";
  setMedPhase("running");
  const intervalMin = $("#med-interval").checked ? 5 * 60 : 0;
  medProgress.interval = setInterval(() => {
    medProgress.remaining--;
    medProgress.elapsed++;
    syncMedDisplay(fmtMed(medProgress.remaining));
    const rem = medProgress.remaining;
    if ($("#med-last").checked && rem > 0 && rem <= 10) playTick();
    if (intervalMin && rem > 0 && rem % intervalMin === 0) playBell(0.5);
    if (rem <= 0) {
      clearInterval(medProgress.interval);
      finishMeditation();
    }
  }, 1000);
}

function endMeditation() {
  const active = medProgress.phase === "running" || medProgress.phase === "paused";
  if (!active) {
    resetMeditation();
    return;
  }
  clearInterval(medProgress.interval);
  medProgress.interval = null;
  setMedPhase("ready");
  syncMedDisplay("00:00");
  if (ambientOn()) stopAmbient();
  playEndingBell();
  $("#med-msg").textContent = "Sit finished \u2014 log it in your Journal to count toward your stats.";
  setTimeout(() => ($("#med-msg").textContent = ""), 5000);
}

function resetMeditation() {
  clearInterval(medProgress.interval);
  medProgress.interval = null;
  medProgress.phase = "ready";
  setMedPhase("ready");
  syncMedDisplay("00:00");
  if (ambientOn()) stopAmbient();
  $("#med-msg").textContent = "";
  $("#focus-status").textContent = "Ready";
}

function finishMeditation() {
  medProgress.interval = null;
  setMedPhase("ready");
  syncMedDisplay("00:00");
  playEndingBell();
  if (ambientOn()) stopAmbient();
  $("#med-msg").textContent = "Sit complete \u2014 log it in your Journal to count toward your stats.";
  setTimeout(() => ($("#med-msg").textContent = ""), 5000);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Ambient sound (brown noise, in-browser, no files) ----------
let ambientSrc = null;
let ambientCtx = null;
function ambientOn() {
  return $("#med-ambient").checked || $("#focus-ambient").checked;
}
function startAmbient() {
  if (ambientSrc || !audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ambientCtx = audioCtx;
  const bufferSize = audioCtx.sampleRate * 2;
  const buf = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 240;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.16;
  src.connect(filter).connect(gain).connect(audioCtx.destination);
  src.start();
  ambientSrc = src;
}
function stopAmbient() {
  if (ambientSrc) {
    try {
      ambientSrc.stop();
    } catch (e) {}
    ambientSrc.disconnect && ambientSrc.disconnect();
    ambientSrc = null;
  }
}
function syncAmbientCheckboxes() {
  const both = ambientOn();
  $("#med-ambient").checked = both;
  $("#focus-ambient").checked = both;
}

// ---------- Focus (low-distraction) mode ----------
function enterFocusMode() {
  const overlay = $("#med-focus-overlay");
  $("#focus-type").textContent = "Meditation \u2014 " + currentMedType();
  syncFocusControls(medProgress.phase);
  syncMedDisplay(medProgress.phase === "ready" ? "00:00" : $("#med-display").textContent);
  syncAmbientCheckboxes();
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function exitFocusMode() {
  $("#med-focus-overlay").classList.add("hidden");
  document.body.style.overflow = "";
}

// ---------- Data backup / restore ----------
async function downloadBackup() {
  try {
    const data = await api(API.backup);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tre-practice-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    const n = (data.entries || []).length;
    $("#backup-msg").textContent = "Backup downloaded (" + n + " day" + (n === 1 ? "" : "s") + ") \u2713";
  } catch (e) {
    $("#backup-msg").textContent = "Backup failed \u2014 " + e.message;
  }
  setTimeout(() => ($("#backup-msg").textContent = ""), 4000);
}

async function importBackup(file) {
  $("#backup-msg").textContent = "Restoring \u2026";
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const entries = (payload && payload.entries) || payload;
    if (!Array.isArray(entries)) throw new Error("not a valid backup file");
    const out = await api("/api/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: entries }),
    });
    if (out.error) throw new Error(out.error);
    $("#backup-msg").textContent = "Restored " + out.restored + " day" + (out.restored === 1 ? "" : "s") + " \u2713";
    refreshStats();
    loadHistory();
    loadMedHistory();
    loadToday();
  } catch (e) {
    $("#backup-msg").textContent = "Import failed \u2014 " + e.message;
  }
  setTimeout(() => ($("#backup-msg").textContent = ""), 4000);
}

$("#med-end").addEventListener("click", endMeditation);
$("#med-start").addEventListener("click", startMeditation);
$("#med-pause").addEventListener("click", pauseMeditation);
$("#med-resume").addEventListener("click", resumeMeditation);
$("#med-reset").addEventListener("click", resetMeditation);
$("#med-focus").addEventListener("click", enterFocusMode);
$("#focus-exit").addEventListener("click", exitFocusMode);
$("#focus-start").addEventListener("click", startMeditation);
$("#focus-pause").addEventListener("click", pauseMeditation);
$("#focus-resume").addEventListener("click", resumeMeditation);
$("#focus-end").addEventListener("click", endMeditation);
$("#focus-reset").addEventListener("click", resetMeditation);
$("#med-ambient").addEventListener("change", () => {
  syncAmbientCheckboxes();
  if (medProgress.phase === "running" || medProgress.phase === "paused" || medProgress.phase === "settle") {
    if (ambientOn()) {
      ensureAudio();
      startAmbient();
    } else {
      stopAmbient();
    }
  }
});
$("#focus-ambient").addEventListener("change", () => {
  syncAmbientCheckboxes();
  if (medProgress.phase === "running" || medProgress.phase === "paused" || medProgress.phase === "settle") {
    if (ambientOn()) {
      ensureAudio();
      startAmbient();
    } else {
      stopAmbient();
    }
  }
});
$("#backup-download").addEventListener("click", downloadBackup);
$("#backup-file").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) importBackup(file);
  e.target.value = "";
});


// ---------- Journal ----------
// Sub-tabs: TRE vs Meditation
$$(".sub-tab").forEach((st) => {
  st.addEventListener("click", () => {
    $$(".sub-tab").forEach((t) => t.classList.remove("active"));
    st.classList.add("active");
    const sub = st.dataset.sub;
    $("#journal-sub-tre").classList.toggle("hidden", sub !== "tre");
    $("#journal-sub-med").classList.toggle("hidden", sub !== "med");
    $("#journal-sub-qg").classList.toggle("hidden", sub !== "qg");
  });
});

// Jump from a hint/link to another tab (event delegation so dynamically
// rendered links work too).
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-go-tab]");
  if (!link) return;
  e.preventDefault();
  activateTab(link.dataset.goTab);
});

// ---------- Pop-out notes editor ----------
let notesModalTarget = null;
$$("[data-pop-notes]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const ta = document.getElementById(btn.dataset.popNotes);
    if (!ta) return;
    notesModalTarget = ta;
    $("#notes-modal-title").textContent = btn.dataset.notesLabel || "Journal";
    $("#notes-modal-input").value = ta.value;
    $("#notes-overlay").classList.remove("hidden");
    $("#notes-modal-input").focus();
  });
});
function closeNotesEditor() {
  $("#notes-overlay").classList.add("hidden");
  if (notesModalTarget) notesModalTarget.focus();
  notesModalTarget = null;
}
$("#notes-close").addEventListener("click", closeNotesEditor);
$("#notes-cancel").addEventListener("click", closeNotesEditor);
$("#notes-save").addEventListener("click", () => {
  const target = notesModalTarget;
  const label = $("#notes-modal-title").textContent;
  if (target) target.value = $("#notes-modal-input").value;
  closeNotesEditor();
  if (!target) return;
  const msgEl =
    target.id === "notes-input"
      ? $("#journal-msg")
      : target.id === "med-notes-input"
        ? $("#med-journal-msg")
        : $("#qg-journal-msg");
  msgEl.textContent = label + " notes updated \u2713";
  setTimeout(() => (msgEl.textContent = ""), 2500);
});
$("#notes-overlay").addEventListener("click", (e) => {
  if (e.target.id === "notes-overlay") closeNotesEditor();
});
document.addEventListener("keydown", (e) => {
  if ($("#notes-overlay").classList.contains("hidden")) return;
  if (e.key === "Escape") closeNotesEditor();
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") $("#notes-save").click();
});

async function loadToday() {
  const entry = await api(API.today);
  $("#journal-date").textContent = formatDate(entry.date);
  $("#mood-select").value = entry.mood || "";
  $("#minutes-input").value = entry.minutes != null ? entry.minutes : "";
  $("#notes-input").value = entry.notes || "";
  // Meditation journal fields
  $("#med-journal-date").textContent = formatDate(entry.date);
  $("#med-mood-select").value = entry.medMood || "";
  // The journal minutes field records minutes entered by hand; these feed
  // your stats alongside the mood and notes.
  const journalMin = entry.medMinutes != null && entry.medMinutes > 0 ? entry.medMinutes : 0;
  $("#med-minutes-input").value = journalMin || "";
  $("#med-notes-input").value = entry.medNotes || "";
  // Qi Gong journal fields
  $("#qg-journal-date").textContent = formatDate(entry.date);
  $("#qg-mood-select").value = entry.qgMood || "";
  const qgJournalMin = entry.qgMinutes != null && entry.qgMinutes > 0 ? entry.qgMinutes : 0;
  $("#qg-minutes-input").value = qgJournalMin || "";
  $("#qg-notes-input").value = entry.qgNotes || "";
}

$("#save-journal").addEventListener("click", async () => {
  const entry = await api(API.today);
  const mood = $("#mood-select").value;
  const minutesValue = $("#minutes-input").value;
  entry.mood = mood || null;
  entry.minutes = minutesValue !== "" ? parseInt(minutesValue, 10) : null;
  entry.notes = $("#notes-input").value;
  if (entry.minutes === null) entry.minutes = minutesFromNotes(entry.notes);
  const saved = await api(API.save, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  $("#journal-msg").textContent = "TRE journal saved \u2713";
  setTimeout(() => ($("#journal-msg").textContent = ""), 2500);
  loadToday();
  refreshStats();
  loadHistory();
  loadMedHistory();
});

$("#save-med-journal").addEventListener("click", async () => {
  const entry = await api(API.today);
  entry.medMood = $("#med-mood-select").value || null;
  entry.medNotes = $("#med-notes-input").value;
  const medMinRaw = $("#med-minutes-input").value;
  entry.medMinutes = medMinRaw !== "" ? parseInt(medMinRaw, 10) : null;
  if (!entry.medMinutes) entry.medMinutes = minutesFromNotes(entry.medNotes);
  const saved = await api(API.save, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  // Clear the form so the fields are ready for a fresh entry.
  $("#med-mood-select").value = "";
  $("#med-minutes-input").value = "";
  $("#med-notes-input").value = "";
  const where = formatDate(entry.date);
  $("#med-journal-msg").textContent = "Meditation journal saved for " + where + " \u2713";
  setTimeout(() => ($("#med-journal-msg").textContent = ""), 3200);
  refreshStats();
  loadHistory();
  loadMedHistory();
});

$("#save-qg-journal").addEventListener("click", async () => {
  const entry = await api(API.today);
  entry.qgMood = $("#qg-mood-select").value || null;
  entry.qgNotes = $("#qg-notes-input").value;
  const qgMinRaw = $("#qg-minutes-input").value;
  entry.qgMinutes = qgMinRaw !== "" ? parseInt(qgMinRaw, 10) : null;
  const saved = await api(API.save, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const where = formatDate(entry.date);
  $("#qg-journal-msg").textContent = "Qi Gong journal saved for " + where + " \u2713";
  setTimeout(() => ($("#qg-journal-msg").textContent = ""), 3200);
  refreshStats();
  loadHistory();
  loadMedHistory();
  loadQgHistory();
});

function minutesFromNotes(notes) {
  const m = notes.match(/(\d{1,2})\s*(?:min|mins|minutes?)/i);
  return m ? parseInt(m[1], 10) : null;
}

function isTreEntry(e) {
  return (e.exercises && e.exercises.length) || e.minutes || e.hasNotes || !!e.mood;
}
function isMedEntry(e) {
  return (e.meditations && e.meditations.length) || e.hasMedNotes || e.medMood ||
    (e.medMinutes != null && e.medMinutes > 0);
}
function isQgEntry(e) {
  return (e.qigongs && e.qigongs.length > 0) ||
    (e.qgMinutes != null && e.qgMinutes > 0) ||
    e.hasQgNotes || !!e.qgMood;
}

async function loadHistory() {
  const entries = await api(API.entries);
  const treEntries = entries.filter(isTreEntry);
  renderHistoryList($("#journal-history"), treEntries, "tre");
  renderHistoryList($("#history-tre-list"), treEntries, "tre");
}

async function loadMedHistory() {
  const entries = await api(API.entries);
  const medEntries = entries.filter(isMedEntry);
  renderHistoryList($("#med-journal-history"), medEntries, "med");
  renderHistoryList($("#history-med-list"), medEntries, "med");
}

async function loadQgHistory() {
  const entries = await api(API.entries);
  const qgEntries = entries.filter(isQgEntry);
  renderHistoryList($("#qg-journal-history"), qgEntries, "qg");
  renderHistoryList($("#history-qg-list"), qgEntries, "qg");
}

function renderHistoryList(container, entries, kind) {
  const list = container;
  list.innerHTML = "";
  if (!entries.length) {
    const empty = kind === "tre"
      ? '<p class="muted">No TRE entries yet. Write your first one!</p>'
      : kind === "med"
        ? '<p class="muted">No meditation entries yet. Write your first one!</p>'
        : '<p class="muted">No Qi Gong entries yet &mdash; time a practice to log it.</p>';
    list.innerHTML = empty;
    return;
  }
  entries.slice().reverse().forEach((e) => {
    const item = document.createElement("div");
    item.className = "history-item";
    if (kind === "qg") {
      const qgSessionTotal = (e.qigongs || []).reduce((s, q) => s + (q.minutes || 0), 0);
      const qgJournalMin = e.qgMinutes != null && e.qgMinutes > 0 ? e.qgMinutes : 0;
      const qgMin = qgSessionTotal + qgJournalMin;
      const mins = qgMin ? ` &middot; <span class="mood">${qgMin} min</span>` : "";
      const sessionCount = (e.qigongs || []).length;
      const journalRound = e.qgMinutes != null && e.qgMinutes > 0 ? 1 : 0;
      const rounds = sessionCount + journalRound;
      const countInfo = rounds ? ` &middot; <span class="mood">${rounds} round${rounds > 1 ? "s" : ""}</span>` : "";
      const mood = e.qgMood ? ` &middot; <span class="mood">${e.qgMood}</span>` : "";
      const preview = e.hasQgNotes ? e.qgNotes : "";
      item.innerHTML = `
        <div class="h-date">
          <span>${formatDate(e.date)}</span>
          ${mood}${mins}${countInfo}
        </div>
        ${preview ? `<div class="h-preview">${escapeHtml(preview)}</div>` : ""}
      `;
    } else if (kind === "tre") {
      const mood = e.mood ? ` &middot; <span class="mood">${e.mood}</span>` : "";
      const mins = e.minutes ? ` &middot; <span class="mood">${e.minutes} min</span>` : "";
      const exCount = e.exercises ? e.exercises.length : 0;
      const exInfo = exCount ? ` &middot; <span class="mood">${exCount} exercise${exCount > 1 ? "s" : ""}</span>` : "";
      const preview = e.hasNotes ? e.notes : "";
      item.innerHTML = `
        <div class="h-date">
          <span>${formatDate(e.date)}</span>
          ${mood}${mins}${exInfo}
        </div>
        ${preview ? `<div class="h-preview">${escapeHtml(preview)}</div>` : ""}
      `;
    } else {
      const mood = e.medMood ? ` &middot; <span class="mood">${e.medMood}</span>` : "";
      const medSessionTotal = (e.meditations || []).reduce((s, m) => s + (m.minutes || 0), 0);
      const journalMin = e.medMinutes != null && e.medMinutes > 0 ? e.medMinutes : 0;
      const medMin = medSessionTotal + journalMin;
      const mins = medMin ? ` &middot; <span class="mood">${medMin} min</span>` : "";
      const sessionRounds = e.meditations ? e.meditations.length : 0;
      const journalRound = e.medMinutes != null && e.medMinutes > 0 ? 1 : 0;
      const rounds = sessionRounds + journalRound;
      const roundInfo = rounds ? ` &middot; <span class="mood">${rounds} sit${rounds > 1 ? "s" : ""}</span>` : "";
      const preview = e.hasMedNotes ? e.medNotes : "";
      item.innerHTML = `
        <div class="h-date">
          <span>${formatDate(e.date)}</span>
          ${mood}${mins}${roundInfo}
        </div>
        ${preview ? `<div class="h-preview">${escapeHtml(preview)}</div>` : ""}
      `;
    }
    item.addEventListener("click", () => openHistory(kind, entries, e.date));
    list.appendChild(item);
  });
}

// ---------- History detail browsing ----------
const historyState = { kind: "tre", entries: [], index: 0 };

function openHistory(kind, entries, dateStr) {
  const list = entries.slice().reverse(); // newest first
  historyState.kind = kind;
  historyState.entries = list;
  historyState.index = list.findIndex((e) => e.date === dateStr);
  if (historyState.index < 0) historyState.index = 0;
  renderHistoryEntry();
  $("#history-overlay").classList.remove("hidden");
  $("#history-close").focus();
}

function closeHistory() {
  $("#history-overlay").classList.add("hidden");
}

function renderHistoryEntry() {
  const kind = historyState.kind;
  const list = historyState.entries;
  const idx = historyState.index;
  const e = list[idx];
  if (!e) return;

  $("#history-prev").disabled = idx >= list.length - 1;
  $("#history-next").disabled = idx <= 0;

  const titleKind = kind === "tre" ? "TRE Practice" : kind === "med" ? "Meditation" : "Qi Gong";
  $("#history-title").textContent = titleKind;
  $("#history-title").style.color =
    kind === "tre" ? "var(--accent-dark)" : kind === "med" ? "var(--warm)" : "var(--teal)";

  const pos = `${idx + 1} of ${list.length}`;
  let meta;
  if (kind === "tre") {
    const mood = e.mood ? `<div class="hm-mood"><strong>Mood:</strong> ${escapeHtml(e.mood)}</div>` : "";
    const mins = e.minutes ? `<div class="hm-min"><strong>Minutes:</strong> ${e.minutes}</div>` : "";
    const exNames = (e.exercises || []).map((id) => {
      const ex = window.TRE_EXERCISES.find((x) => x.id === id);
      return ex ? ex.name : id;
    });
    const exercises = exNames.length
      ? `<div class="hm-ex"><strong>Exercises:</strong> <span class="ex-tags">${exNames.map((n) => `<span class="ex-tag">${escapeHtml(n)}</span>`).join("")}</span></div>`
      : "";
    meta = ` ${mood}${mins}${exercises}`;
  } else if (kind === "qg") {
    const qgSessionTotal = (e.qigongs || []).reduce((s, q) => s + (q.minutes || 0), 0);
    const qgJournalMin = e.qgMinutes != null && e.qgMinutes > 0 ? e.qgMinutes : 0;
    const qgMin = qgSessionTotal + qgJournalMin;
    const mins = qgMin ? `<div class="hm-min"><strong>Minutes:</strong> ${qgMin}</div>` : "";
    const mood = e.qgMood ? `<div class="hm-mood"><strong>Mood:</strong> ${escapeHtml(e.qgMood)}</div>` : "";
    const sessionCount = (e.qigongs || []).length;
    const journalRound = e.qgMinutes != null && e.qgMinutes > 0 ? 1 : 0;
    const totalRounds = sessionCount + journalRound;
    const rounds = totalRounds ? `<div class="hm-rounds"><strong>Rounds:</strong> ${totalRounds}</div>` : "";
    meta = `${mood}${mins}${rounds}`;
  } else {
    const mood = e.medMood ? `<div class="hm-mood"><strong>Mood:</strong> ${escapeHtml(e.medMood)}</div>` : "";
    const medSessionTotal = (e.meditations || []).reduce((s, m) => s + (m.minutes || 0), 0);
    const journalMin = e.medMinutes != null && e.medMinutes > 0 ? e.medMinutes : 0;
    const medMin = medSessionTotal + journalMin;
    const mins = medMin ? `<div class="hm-min"><strong>Minutes:</strong> ${medMin}</div>` : "";
    const sessionRounds = (e.meditations || []).length;
    const journalRound = e.medMinutes != null && e.medMinutes > 0 ? 1 : 0;
    const totalRounds = sessionRounds + journalRound;
    const rounds = totalRounds
      ? `<div class="hm-rounds"><strong>Sits:</strong> ${totalRounds}</div>`
      : "";
    meta = `${mood}${mins}${rounds}`;
  }

  $("#history-meta").innerHTML = `
    <div class="hm-date">${formatDate(e.date)}</div>
    <div class="hm-pos">${pos}</div>
    ${meta}
  `;

  let body;
  if (kind === "tre") {
    const notes = e.notes
      ? `<div class="hm-block"><h4>Notes</h4><p class="hm-notes">${escapeHtml(e.notes).replace(/\n/g, "<br>")}</p></div>`
      : "";
    const exNotes = Object.keys(e.exerciseNotes || {}).length
      ? `<div class="hm-block"><h4>Exercise Notes</h4>${Object.keys(e.exerciseNotes).map((id) => {
          const ex = window.TRE_EXERCISES.find((x) => x.id === id);
          const name = ex ? ex.name : id;
          return `<p class="hm-notes"><strong>${escapeHtml(name)}:</strong><br>${escapeHtml(e.exerciseNotes[id]).replace(/\n/g, "<br>")}</p>`;
        }).join("")}</div>`
      : "";
    body = `<div class="hm-content">${notes || '<p class="muted">No notes recorded.</p>'}${exNotes}</div>`;
  } else if (kind === "qg") {
    const notes = e.qgNotes
      ? `<div class="hm-block"><h4>Notes</h4><p class="hm-notes">${escapeHtml(e.qgNotes).replace(/\n/g, "<br>")}</p></div>`
      : "";
    const sessions = (e.qigongs || []).length
      ? `<div class="hm-block"><h4>Qi Gong Sessions</h4>${e.qigongs.slice().reverse().map((q) =>
          `<div class="hm-sit"><span class="med-s-type">Qi Gong</span><span>${q.minutes} min</span>${q.time ? `<span class="med-s-time">${new Date(q.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>` : ""}</div>`
        ).join("")}</div>`
      : "";
    body = `<div class="hm-content">${notes}${sessions}</div>`;
  } else {
    const notes = e.medNotes
      ? `<div class="hm-block"><h4>Notes</h4><p class="hm-notes">${escapeHtml(e.medNotes).replace(/\n/g, "<br>")}</p></div>`
      : "";
    const sits = (e.meditations || []).length
      ? `<div class="hm-block"><h4>Sits</h4>${e.meditations.slice().reverse().map((m) =>
          `<div class="hm-sit"><span class="med-s-type">${escapeHtml(m.type)}</span><span>${m.minutes} min</span>${m.time ? `<span class="med-s-time">${new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>` : ""}</div>`
        ).join("")}</div>`
      : "";
    body = `<div class="hm-content">${notes || '<p class="muted">No notes recorded.</p>'}${sits}</div>`;
  }

  $("#history-body").innerHTML = body;
}

$("#history-close").addEventListener("click", closeHistory);
$("#history-overlay").addEventListener("click", (e) => {
  if (e.target.id === "history-overlay") closeHistory();
});
$("#history-prev").addEventListener("click", () => {
  if (historyState.index < historyState.entries.length - 1) {
    historyState.index++;
    renderHistoryEntry();
  }
});
$("#history-next").addEventListener("click", () => {
  if (historyState.index > 0) {
    historyState.index--;
    renderHistoryEntry();
  }
});
$("#history-edit").addEventListener("click", () => {
  const e = historyState.entries[historyState.index];
  if (!e) return;
  closeHistory();
  loadEntryIntoForm(e.date, historyState.kind);
});

async function loadEntryIntoForm(dateStr, sub) {
  await loadToday();
  const entry = await api(API.entryFor(dateStr));
  // switch to journal tab
  activateTab("journal");
  // switch sub-tab
  $$(".sub-tab").forEach((t) => t.classList.toggle("active", t.dataset.sub === sub));
  $("#journal-sub-tre").classList.toggle("hidden", sub !== "tre");
  $("#journal-sub-med").classList.toggle("hidden", sub !== "med");
  $("#journal-sub-qg").classList.toggle("hidden", sub !== "qg");
  // load forms
  $("#journal-date").textContent = formatDate(entry.date);
  $("#mood-select").value = entry.mood || "";
  $("#minutes-input").value = entry.minutes != null ? entry.minutes : "";
  $("#notes-input").value = entry.notes || "";
  $("#med-journal-date").textContent = formatDate(entry.date);
  $("#med-mood-select").value = entry.medMood || "";
  const journalMin = entry.medMinutes != null && entry.medMinutes > 0 ? entry.medMinutes : 0;
  $("#med-minutes-input").value = journalMin || "";
  $("#med-notes-input").value = entry.medNotes || "";
  // Qi Gong journal fields
  $("#qg-journal-date").textContent = formatDate(entry.date);
  $("#qg-mood-select").value = entry.qgMood || "";
  const qgJournalMin = entry.qgMinutes != null && entry.qgMinutes > 0 ? entry.qgMinutes : 0;
  $("#qg-minutes-input").value = qgJournalMin || "";
  $("#qg-notes-input").value = entry.qgNotes || "";
  if (sub === "med") $("#med-notes-input").focus();
  else if (sub === "qg") $("#qg-notes-input").focus();
  else $("#notes-input").focus();
}

// ---------- Stats ----------
function computeStats(entries) {
  const activeDays = entries.filter(
    (e) =>
      (e.exercises && e.exercises.length) ||
      e.hasNotes ||
      !!e.mood ||
      e.minutes
  );
  const totalSessions = activeDays.length;
  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || 0), 0);

  const dates = new Set(activeDays.map((e) => e.date));

  // Streak calculation (consecutive days ending today or yesterday).
  const byDay = {};
  activeDays.forEach((e) => (byDay[e.date] = true));

  let currentStreak = 0;
  let d = new Date();
  if (!byDay[todayStr()]) d.setDate(d.getDate() - 1);
  while (byDay[dateKey(d)]) {
    currentStreak++;
    d.setDate(d.getDate() - 1);
  }

  let longest = 0;
  let run = 0;
  let prev = null;
  const sortedDates = Object.keys(byDay).sort();
  for (const ds of sortedDates) {
    if (prev && dayDiff(prev, ds) === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = ds;
  }

  // Meditation stats — journal entries only.
  const medMinForDay = (e) => typeof e.medMinutes === "number" && e.medMinutes > 0 ? e.medMinutes : 0;
  const isMedDay = (e) => typeof e.medMinutes === "number" && e.medMinutes > 0;

  const medMinutes = entries.reduce((sum, e) => sum + medMinForDay(e), 0);
  const todaysEntry = entries.find((e) => e.date === todayStr());
  const medToday = todaysEntry ? medMinForDay(todaysEntry) : 0;
  const medRounds = medToday > 0 ? 1 : 0;
  const byMedDay = {};
  entries.forEach((e) => {
    if (isMedDay(e)) byMedDay[e.date] = true;
  });
  let medStreak = 0;
  let md = new Date();
  if (!byMedDay[todayStr()]) md.setDate(md.getDate() - 1);
  while (byMedDay[dateKey(md)]) {
    medStreak++;
    md.setDate(md.getDate() - 1);
  }

  // Qi Gong stats — journal entries only.
  const qgMinForDay = (e) => typeof e.qgMinutes === "number" && e.qgMinutes > 0 ? e.qgMinutes : 0;
  const isQgDay = (e) => typeof e.qgMinutes === "number" && e.qgMinutes > 0;
  const qgMinutes = entries.reduce((sum, e) => sum + qgMinForDay(e), 0);
  const todaysQg = todaysEntry ? qgMinForDay(todaysEntry) : 0;
  const qgRounds = todaysQg > 0 ? 1 : 0;
  const qgByDay = {};
  entries.forEach((e) => {
    if (isQgDay(e)) qgByDay[e.date] = true;
  });
  let qgStreak = 0;
  let qd = new Date();
  if (!qgByDay[todayStr()]) qd.setDate(qd.getDate() - 1);
  while (qgByDay[dateKey(qd)]) {
    qgStreak++;
    qd.setDate(qd.getDate() - 1);
  }

  return {
    totalSessions,
    totalMinutes,
    currentStreak,
    longest,
    byDay,
    totalPracticeDays:
      new Set([...activeDays.map((e) => e.date), ...Object.keys(byMedDay), ...Object.keys(qgByDay)]).size,
    medMinutes,
    medRounds,
    medStreak,
    byMedDay,
    medToday,
    qgMinutes,
    qgToday: todaysQg,
    qgRounds,
    qgStreak,
    qgByDay,
  };
}

function dateKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function dayDiff(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = new Date(ay, am - 1, ad);
  const db = new Date(by, bm - 1, bd);
  return Math.round((db - da) / 86400000);
}

function refreshStats() {
  return api(API.entries).then((entries) => {
    const s = computeStats(entries);
    $("#stat-sessions").textContent = s.totalSessions;
    $("#stat-streak").textContent = s.currentStreak;
    $("#stat-streak-sub").textContent = s.currentStreak === 1 ? "day" : "days";
    $("#stat-longest").textContent = s.longest;
    $("#stat-minutes").textContent = s.totalMinutes;
    $("#stat-med-minutes").textContent = s.medMinutes;
    $("#stat-med-today").textContent = s.medToday;
    $("#stat-med-sessions").textContent = s.medRounds;
    $("#stat-med-streak").textContent = s.medStreak;
    renderWeek(s.byDay, $("#week-view"));
    renderWeek(s.byMedDay || {}, $("#med-week-view"));
    $("#stat-qg-minutes").textContent = s.qgMinutes;
    $("#stat-qg-today").textContent = s.qgToday;
    $("#stat-qg-sessions").textContent = s.qgRounds;
    $("#stat-qg-streak").textContent = s.qgStreak;
    renderWeek(s.qgByDay || {}, $("#qg-week-view"));
    return renderDashboard();
  });
}

function renderWeek(byDay, container) {
  const wrap = container || $("#week-view");
  wrap.innerHTML = "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const tile = document.createElement("div");
    tile.className = "day-tile";
    if (byDay[key]) tile.classList.add("active");
    if (key === todayStr()) tile.classList.add("today");
    tile.innerHTML = `<span class="dot"></span><span>${weekdays[d.getDay()]}<br>${d.getDate()}</span>`;
    tile.title = formatDate(key) + (byDay[key] ? " \u2014 practiced" : "");
    wrap.appendChild(tile);
  }
}

// ---------- Dashboard ----------
const DASH_QUOTES = [
  "Small daily practice, repeated gently, reshapes everything.",
  "You are always in control \u2014 go at your own pace.",
  "The body knows how to release. Your only job is to slow down and let it.",
  "A few conscious minutes beat an hour of autopilot.",
  "Breath is the thread between effort and ease.",
  "Notice, don't judge. Practice, don't measure yourself.",
  "Nervous system, day by day \u2014 steadier, softer, stronger.",
  "Consistency over intensity, always.",
  "Be kind to the body that carries you.",
  "Today, one small practice is enough.",
];

function dashGreeting() {
  const h = new Date().getHours();
  const base =
    h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  $("#dash-greeting").textContent = base;
  const day = Math.floor(Date.now() / 86400000);
  $("#dash-sub").textContent = DASH_QUOTES[day % DASH_QUOTES.length];
}

function renderDashToday(e) {
  const wrap = $("#dash-today");
  const tre = e ? { min: e.minutes, mood: e.mood, note: e.hasNotes ? e.notes : "" } : null;
  const med = e ? { min: e.medMinutes, mood: e.medMood, note: e.hasMedNotes ? e.medNotes : "" } : null;
  const qg = e ? { min: e.qgMinutes, mood: e.qgMood, note: e.hasQgNotes ? e.qgNotes : "" } : null;
  const hasAny = [tre, med, qg].some((p) => p && (p.min || p.mood || p.note));
  if (!hasAny) {
    wrap.innerHTML =
      '<p class="muted">Nothing recorded yet today.</p>' +
      '<p class="hint">Take a few minutes for yourself \u2014 then log it in the <a href="#" data-go-tab="journal">Journal</a>.</p>';
    return;
  }
  const row = (name, cls, p) => {
    const val = [p.min ? `${p.min} min` : "", p.mood ? `Mood: ${p.mood}` : ""].filter(Boolean).join(" &middot; ");
    const noteHtml = p.note ? `<div class="h-preview">${escapeHtml(p.note)}</div>` : "";
    return `<div class="dash-row"><span class="dash-row-name"><span class="dk ${cls}"></span>${name}</span><span class="dash-row-val">${val || "not logged"}</span></div>${noteHtml}`;
  };
  const total = (tre ? tre.min || 0 : 0) + (med ? med.min || 0 : 0) + (qg ? qg.min || 0 : 0);
  wrap.innerHTML =
    row("TRE", "dk-tre", tre) +
    row("Meditation", "dk-med", med) +
    row("Qi Gong", "dk-qg", qg) +
    (total ? `<div class="dash-total">${total} total minutes today</div>` : "");
}

function renderDashStats(s) {
  const cards = [
    ["Total practice days", s.totalPracticeDays, "", ""],
    ["TRE streak", s.currentStreak, "days", ""],
    ["TRE minutes", s.totalMinutes, "", ""],
    ["Meditation minutes", s.medMinutes, "", "med-stat"],
    ["Meditation streak", s.medStreak, "days", "med-stat"],
    ["Qi Gong minutes", s.qgMinutes, "", "qg-stat"],
    ["Qi Gong streak", s.qgStreak, "days", "qg-stat"],
  ];
  $("#dash-stats").innerHTML = cards
    .map(
      ([label, num, sub, cls]) => `
      <div class="card stat ${cls}">
        <span class="stat-label">${label}</span>
        <span class="stat-num">${num}</span>
        ${sub ? `<span class="stat-sub">${sub}</span>` : ""}
      </div>`
    )
    .join("");
}

function renderDashWeek(entries) {
  const wrap = $("#dash-week");
  wrap.innerHTML = "";
  const byDate = {};
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  entries.forEach((e) => (byDate[e.date] = e));
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const e = byDate[key];
    const tile = document.createElement("div");
    tile.className = "day-tile";
    if (e) tile.classList.add("has-entry");
    if (key === todayStr()) tile.classList.add("today");
    const dots = [];
    if (e && isTreEntry(e)) dots.push('<span class="dk dk-tre"></span>');
    if (e && isMedEntry(e)) dots.push('<span class="dk dk-med"></span>');
    if (e && isQgEntry(e)) dots.push('<span class="dk dk-qg"></span>');
    tile.innerHTML =
      `<span class="dash-tile-dots">${dots.join("") || '&nbsp;'}</span>` +
      `<span>${weekdays[d.getDay()]}<br>${d.getDate()}</span>`;
    if (e) {
      const practiced = [
        isTreEntry(e) && "TRE",
        isMedEntry(e) && "Meditation",
        isQgEntry(e) && "Qi Gong",
      ].filter(Boolean).join(", ");
      tile.title = formatDate(key) + " \u2014 " + practiced;
      tile.addEventListener("click", () => loadEntryIntoForm(key, "tre"));
    }
    wrap.appendChild(tile);
  }
}

function renderDashRecent(entries) {
  const wrap = $("#dash-recent");
  const active = entries.filter((e) => isTreEntry(e) || isMedEntry(e) || isQgEntry(e));
  const recent = active.slice().reverse().slice(0, 4);
  if (!recent.length) {
    wrap.innerHTML = '<p class="muted">Nothing logged yet. Start with a practice \u2014 then write a journal entry.</p>';
    return;
  }
  recent.forEach((e) => {
    const kinds = [];
    if (isTreEntry(e)) kinds.push(["TRE", "dk-b-tre"]);
    if (isMedEntry(e)) kinds.push(["Meditation", "dk-b-med"]);
    if (isQgEntry(e)) kinds.push(["Qi Gong", "dk-b-qg"]);
    const badgeHtml = kinds
      .map(([name, cls]) => `<span class="dash-badge ${cls}">${name}</span>`)
      .join(" ");
    const mins = (e.minutes || 0) + (e.medMinutes || 0) + (e.qgMinutes || 0);
    const mood = e.mood || e.medMood || e.qgMood;
    const note = e.notes || e.medNotes || e.qgNotes || "";
    const item = document.createElement("div");
    item.className = "history-item dash-recent-item";
    item.innerHTML = `
      <div class="h-date">
        <span>${formatDate(e.date)}</span><span>${badgeHtml}</span>
      </div>
      <div class="h-date">
        <span>${mins ? `${mins} min` : ""}${mood ? `${mins ? " &middot; " : ""}<span class="mood">${escapeHtml(mood)}</span>` : ""}</span>
      </div>
      ${note ? `<div class="h-preview">${escapeHtml(note)}</div>` : ""}
    `;
    item.addEventListener("click", () => {
      const kind = isTreEntry(e) ? "tre" : isMedEntry(e) ? "med" : "qg";
      const filtered = entries.filter(kind === "tre" ? isTreEntry : kind === "med" ? isMedEntry : isQgEntry);
      openHistory(kind, filtered, e.date);
    });
    wrap.appendChild(item);
  });
}

function renderDashboard() {
  return api(API.entries).then((entries) => {
    dashGreeting();
    renderDashStats(computeStats(entries));
    renderDashToday(entries.find((x) => x.date === todayStr()));
    renderDashWeek(entries);
    renderDashRecent(entries);
  });
}

// ---------- Install (PWA) ----------
let deferredInstallPrompt = null;
const installBtn = $("#install-btn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === "accepted") installBtn.hidden = true;
  deferredInstallPrompt = null;
});

window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  deferredInstallPrompt = null;
});

// ---------- Init ----------
function init() {
  dashGreeting();
  buildExerciseCards();
  loadToday();
  loadHistory();
  loadMedHistory();
  loadQgHistory();
  refreshStats();
}
init();
