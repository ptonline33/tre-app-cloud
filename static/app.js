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

// Recent/history lists always render newest-first. Sort explicitly so the
// display never depends on the order the API happens to return.
// Per-session journal entries: newest session first (by date, then by the
// time the session was started/recorded so several on one day stay ordered).
function sortedSessionsNewest(sessions) {
  return sessions
    .slice()
    .sort((a, b) => {
      const d = String(b.date).localeCompare(String(a.date));
      if (d !== 0) return d;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
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
        <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1&enablejsapi=1"
          title="Guided ${escapeHtml(ex.name)} video" frameborder="0" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen data-video-cat="tre"></iframe>
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
  "https://www.youtube-nocookie.com/embed/" + youtubeId(window.TRE_GUIDED_VIDEO) + "?rel=0&playsinline=1&enablejsapi=1";

// ---------- Fullscreen / landscape (PWA) ----------
// When a video goes fullscreen, auto-rotate the app to landscape so
// YouTube embeds play widescreen in standalone mode. Locks are best-effort:
// browsers without screen.orientation.lock (e.g. iOS) are left untouched.
const onFullscreenChange = () => {
  const fullscreenElement =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null;
  const orientation = screen.orientation;
  try {
    if (fullscreenElement) {
      orientation.lock && orientation.lock("landscape").catch(() => {});
    } else if (orientation.unlock) {
      orientation.unlock();
    }
  } catch {
    /* Orientation lock unavailable (e.g. iOS Safari) */
  }
};
document.addEventListener("fullscreenchange", onFullscreenChange);
document.addEventListener("webkitfullscreenchange", onFullscreenChange);

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
      timerElapsed = 0;
      renderTimer();
      openJournalAt("tre", timerGoal);
      return;
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
  const elapsedMin = Math.round(timerElapsed / 60);
  timerElapsed = 0;
  renderTimer();
  if (elapsedMin > 0) openJournalAt("tre", elapsedMin);
  else timerMsg("Session finished \u2014 log it in your Journal to count toward your stats.");
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
      openJournalAt("qg", qgGoal);
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
  const elapsedMin = Math.round(qgElapsed / 60);
  qgElapsed = 0;
  renderQg();
  if (elapsedMin > 0) openJournalAt("qg", elapsedMin);
  else qgMsg("Practice finished \u2014 log it in your Journal to count toward your stats.");
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
  const elapsedMin = Math.round(medProgress.elapsed / 60);
  setMedPhase("ready");
  syncMedDisplay("00:00");
  if (ambientOn()) stopAmbient();
  playEndingBell();
  exitFocusMode();
  if (elapsedMin > 0) openJournalAt("med", elapsedMin);
  else $("#med-msg").textContent = "Sit finished \u2014 log it in your Journal to count toward your stats.";
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
  exitFocusMode();
  const minutes = medProgress.elapsed > 0
    ? Math.round(medProgress.elapsed / 60)
    : Math.round(medProgress.total / 60);
  openJournalAt("med", minutes);
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
    const m = (data.journalEntries || []).length;
    $("#backup-msg").textContent =
      "Backup downloaded (" + n + " day" + (n === 1 ? "" : "s") +
      ", " + m + " journal entr" + (m === 1 ? "y" : "ies") + ") \u2713";
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
    const entries = payload && payload.entries ? payload.entries : Array.isArray(payload) ? payload : [];
    if (!Array.isArray(entries)) throw new Error("not a valid backup file");
    const out = await api("/api/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: entries, journalEntries: (payload && payload.journalEntries) || [] }),
    });
    if (out.error) throw new Error(out.error);
    $("#backup-msg").textContent = "Restored " + out.restored + " record" + (out.restored === 1 ? "" : "s") + " \u2713";
    resetJournalForms();
    refreshJournalViews();
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


// ---------- Journal (per-session entries) ----------
// Sub-tabs: TRE vs Meditation vs Qi Gong
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

// Each completed practice session is stored as its own journal entry, for
// every category. A journal form always edits exactly ONE session: a new one
// (blank, minutes pre-filled when a timer just finished) or an existing one
// reopened from History. Saving a new session inserts a fresh row — it never
// merges into an earlier entry.
const journalDraft = { tre: null, med: null, qg: null };

function freshDraft(cat) {
  return { id: null, date: todayStr(), category: cat, createdAt: null, mood: "", minutes: null, notes: "" };
}

function journalFormFields(cat) {
  if (cat === "tre") return { mood: "#mood-select", minutes: "#minutes-input", notes: "#notes-input", dateLabel: "#journal-date" };
  if (cat === "med") return { mood: "#med-mood-select", minutes: "#med-minutes-input", notes: "#med-notes-input", dateLabel: "#med-journal-date" };
  return { mood: "#qg-mood-select", minutes: "#qg-minutes-input", notes: "#qg-notes-input", dateLabel: "#qg-journal-date" };
}

function fillJournalForm(cat, draft) {
  const f = journalFormFields(cat);
  $(f.mood).value = draft.mood || "";
  $(f.minutes).value = draft.minutes != null ? draft.minutes : "";
  $(f.notes).value = draft.notes || "";
  $(f.dateLabel).textContent = formatDate(draft.date);
}

function readJournalForm(cat) {
  const f = journalFormFields(cat);
  const minutesRaw = $(f.minutes).value;
  let minutes = minutesRaw !== "" ? parseInt(minutesRaw, 10) : null;
  if (!minutes) minutes = minutesFromNotes($(f.notes).value);
  return { mood: $(f.mood).value || null, minutes, notes: $(f.notes).value };
}

// Reset all three journal forms to a fresh, blank new-session entry.
function resetJournalForms() {
  ["tre", "med", "qg"].forEach((cat) => {
    journalDraft[cat] = freshDraft(cat);
    fillJournalForm(cat, journalDraft[cat]);
  });
}

// Open the Journal at the chosen sub-tab. A fresh session entry is started:
// minutes are pre-filled from the just-ended timer/sit and notes begin blank
// (with a timestamp marker), so this session is recorded as its own new
// journal entry instead of being merged into an earlier one.
function openJournalAt(sub, minutes) {
  activateTab("journal");
  $$(".sub-tab").forEach((t) => t.classList.toggle("active", t.dataset.sub === sub));
  $("#journal-sub-tre").classList.toggle("hidden", sub !== "tre");
  $("#journal-sub-med").classList.toggle("hidden", sub !== "med");
  $("#journal-sub-qg").classList.toggle("hidden", sub !== "qg");
  const addMin = Math.round(minutes) || 0;
  journalDraft[sub] = freshDraft(sub);
  journalDraft[sub].minutes = addMin;
  fillJournalForm(sub, journalDraft[sub]);
  if (sub === "tre") stageJournalNotes($("#notes-input"));
  else if (sub === "med") stageJournalNotes($("#med-notes-input"));
  else stageJournalNotes($("#qg-notes-input"));
}

// Start a fresh journal entry for the just-ended session: notes begin with a
// timestamp marker and the caret is placed at the end, ready for this
// session's notes.
function stageJournalNotes(ta) {
  const existing = ta.value.trim();
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  ta.value = existing ? existing + "\n\n[" + stamp + "] " : "";
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

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

// Save the currently-edited session for `cat` as its own journal entry.
// New sessions insert a fresh row; sessions reopened from History update the
// same row (by id). After saving, the form resets so the next session starts
// as a brand-new, separate entry.
async function saveJournalSession(cat, msgEl) {
  const draft = journalDraft[cat] || freshDraft(cat);
  const form = readJournalForm(cat);
  const payload = {
    id: draft.id,
    date: draft.date || todayStr(),
    category: cat,
    mood: form.mood,
    minutes: form.minutes,
    notes: form.notes,
  };
  await api(API.journalSave, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  journalDraft[cat] = freshDraft(cat);
  fillJournalForm(cat, journalDraft[cat]);
  const label = cat === "tre" ? "TRE" : cat === "med" ? "Meditation" : "Qi Gong";
  msgEl.textContent = label + " journal entry saved \u2713";
  setTimeout(() => (msgEl.textContent = ""), 3200);
  refreshJournalViews();
}

$("#save-journal").addEventListener("click", () => {
  saveJournalSession("tre", $("#journal-msg")).catch((err) => {
    $("#journal-msg").textContent = "Save failed \u2014 " + err.message;
  });
});

$("#save-med-journal").addEventListener("click", () => {
  saveJournalSession("med", $("#med-journal-msg")).catch((err) => {
    $("#med-journal-msg").textContent = "Save failed \u2014 " + err.message;
  });
});

$("#save-qg-journal").addEventListener("click", () => {
  saveJournalSession("qg", $("#qg-journal-msg")).catch((err) => {
    $("#qg-journal-msg").textContent = "Save failed \u2014 " + err.message;
  });
});

// ---------- Auto journal on guided video end ----------
// When any guided video finishes, we automatically add a separate 15-minute
// journal entry for that video's category so the practice counts toward stats
// as its own session.
const GUIDED_VIDEO_NOTE = "Guided Video complete";

function ensureYtJsApi(iframe) {
  try {
    const url = new URL(iframe.src, window.location.href);
    if (!url.searchParams.get("enablejsapi")) {
      url.searchParams.set("enablejsapi", "1");
      iframe.src = url.toString();
    }
  } catch (err) {
    /* Not a parseable URL — leave the embed untouched */
  }
}

async function logGuidedVideo(cat) {
  if (cat !== "tre" && cat !== "med" && cat !== "qg") return;
  try {
    await api(API.journalSave, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: null,
        date: todayStr(),
        category: cat,
        mood: null,
        minutes: 15,
        notes: GUIDED_VIDEO_NOTE,
      }),
    });
    refreshJournalViews();
  } catch (err) {
    console.error("Auto journaling at video end failed:", err);
  }
}

function initVideoEndTracking() {
  if (!(window.YT && window.YT.Player)) return;
  $$("iframe[data-video-cat]").forEach((iframe) => {
    if (!iframe.id) iframe.id = "yt-" + Math.random().toString(36).slice(2, 10);
    ensureYtJsApi(iframe);
    const cat = iframe.dataset.videoCat;
    try {
      const player = new YT.Player(iframe, {
        events: {
          onStateChange: (e) => {
            if (e && e.data === 0) logGuidedVideo(cat);
          },
        },
      });
      window._ytVideoPlayers = window._ytVideoPlayers || [];
      window._ytVideoPlayers.push(player);
    } catch (err) {
      console.error("Could not start video-end tracking:", err);
    }
  });
}

window.onYouTubeIframeAPIReady = function () {
  initVideoEndTracking();
};

function loadYouTubeApi() {
  if (window.YT && window.YT.Player) {
    initVideoEndTracking();
    return;
  }
  if (window._ytApiLoading) return;
  window._ytApiLoading = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

function minutesFromNotes(notes) {
  const m = notes.match(/(\d{1,2})\s*(?:min|mins|minutes?)/i);
  return m ? parseInt(m[1], 10) : null;
}

// ---------- History (per-session entries) ----------
// Every saved session is its own history entry, so several sessions on the
// same day each appear separately — for all categories.
let sessionsCache = [];

async function loadJournalSessions() {
  sessionsCache = await api(API.journal);
  renderJournalHistory();
}

function renderJournalHistory() {
  const tre = sessionsCache.filter((s) => s.category === "tre");
  const med = sessionsCache.filter((s) => s.category === "med");
  const qg = sessionsCache.filter((s) => s.category === "qg");
  renderHistoryList($("#journal-history"), tre, "tre");
  renderHistoryList($("#history-tre-list"), tre, "tre");
  renderHistoryList($("#med-journal-history"), med, "med");
  renderHistoryList($("#history-med-list"), med, "med");
  renderHistoryList($("#qg-journal-history"), qg, "qg");
  renderHistoryList($("#history-qg-list"), qg, "qg");
}

// Session rows already carry their per-session minutes; nothing else to sum.
function sessionTime(s) {
  return s.createdAt
    ? new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
}

function renderHistoryList(container, sessions, kind) {
  const list = container;
  list.innerHTML = "";
  if (!sessions.length) {
    const empty = kind === "tre"
      ? '<p class="muted">No TRE entries yet. Write your first one!</p>'
      : kind === "med"
        ? '<p class="muted">No meditation entries yet. Write your first one!</p>'
        : '<p class="muted">No Qi Gong entries yet &mdash; time a practice to log it.</p>';
    list.innerHTML = empty;
    return;
  }
  sortedSessionsNewest(sessions).forEach((s) => {
    const item = document.createElement("div");
    item.className = "history-item";
    const mood = s.mood ? ` &middot; <span class="mood">${escapeHtml(s.mood)}</span>` : "";
    const mins = s.minutes ? ` &middot; <span class="mood">${s.minutes} min</span>` : "";
    const time = sessionTime(s) ? ` <span class="h-time">${sessionTime(s)}</span>` : "";
    const preview = (s.notes || "").trim();
    item.innerHTML = `
      <div class="h-date">
        <span>${formatDate(s.date)}</span>
        ${time}${mood}${mins}
      </div>
      ${preview ? `<div class="h-preview">${escapeHtml(preview)}</div>` : ""}
    `;
    item.addEventListener("click", () => openHistory(kind, sessions, s.id));
    list.appendChild(item);
  });
}

// ---------- History detail browsing ----------
const historyState = { kind: "tre", sessions: [], index: 0 };

function openHistory(kind, sessions, id) {
  const list = sortedSessionsNewest(sessions); // newest session first
  historyState.kind = kind;
  historyState.sessions = list;
  historyState.index = list.findIndex((s) => s.id === id);
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
  const list = historyState.sessions;
  const idx = historyState.index;
  const s = list[idx];
  if (!s) return;

  $("#history-prev").disabled = idx >= list.length - 1;
  $("#history-next").disabled = idx <= 0;

  const titleKind = kind === "tre" ? "TRE Practice" : kind === "med" ? "Meditation" : "Qi Gong";
  $("#history-title").textContent = titleKind;
  $("#history-title").style.color =
    kind === "tre" ? "var(--accent-dark)" : kind === "med" ? "var(--warm)" : "var(--teal)";

  const pos = `${idx + 1} of ${list.length}`;
  const mood = s.mood ? `<div class="hm-mood"><strong>Mood:</strong> ${escapeHtml(s.mood)}</div>` : "";
  const mins = s.minutes ? `<div class="hm-min"><strong>Minutes:</strong> ${s.minutes}</div>` : "";
  const time = sessionTime(s) ? `<div class="hm-time"><strong>Time:</strong> ${sessionTime(s)}</div>` : "";

  $("#history-meta").innerHTML = `
    <div class="hm-date">${formatDate(s.date)}</div>
    <div class="hm-pos">${pos}</div>
    ${time}${mood}${mins}
  `;

  const notes = (s.notes || "").trim()
    ? `<div class="hm-block"><h4>Notes</h4><p class="hm-notes">${escapeHtml(s.notes).replace(/\n/g, "<br>")}</p></div>`
    : "";
  $("#history-body").innerHTML = `<div class="hm-content">${notes || '<p class="muted">No notes recorded.</p>'}</div>`;
}

$("#history-close").addEventListener("click", closeHistory);
$("#history-overlay").addEventListener("click", (e) => {
  if (e.target.id === "history-overlay") closeHistory();
});
$("#history-prev").addEventListener("click", () => {
  if (historyState.index < historyState.sessions.length - 1) {
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
  const s = historyState.sessions[historyState.index];
  if (!s) return;
  closeHistory();
  loadEntryFromSession(s.id);
});

// Reopen an existing session entry in the journal form so it can be edited.
// Editing updates the same row (by id) — it stays its own separate journal
// entry and is never merged into another session.
async function loadEntryFromSession(id) {
  const s = historyState.sessions.find((x) => x.id === id) || sessionsCache.find((x) => x.id === id);
  if (!s) return;
  const sub = s.category;
  activateTab("journal");
  $$(".sub-tab").forEach((t) => t.classList.toggle("active", t.dataset.sub === sub));
  $("#journal-sub-tre").classList.toggle("hidden", sub !== "tre");
  $("#journal-sub-med").classList.toggle("hidden", sub !== "med");
  $("#journal-sub-qg").classList.toggle("hidden", sub !== "qg");
  journalDraft[sub] = {
    id: s.id,
    date: s.date || todayStr(),
    category: sub,
    createdAt: s.createdAt,
    mood: s.mood || "",
    minutes: s.minutes,
    notes: s.notes || "",
  };
  fillJournalForm(sub, journalDraft[sub]);
  if (sub === "med") $("#med-notes-input").focus();
  else if (sub === "qg") $("#qg-notes-input").focus();
  else $("#notes-input").focus();
}

// ---------- Stats ----------
// Stats are computed from the per-session journal entries only, for every
// category. Multiple sessions on one day each count as separate sessions and
// their minutes add up for that day.
function computeStats(sessions) {
  const daySet = (list) => {
    const m = {};
    list.forEach((s) => (m[s.date] = true));
    return m;
  };
  const sumMinutes = (list) => list.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const todayKey = todayStr();

  const tre = sessions.filter((s) => s.category === "tre");
  const med = sessions.filter((s) => s.category === "med");
  const qg = sessions.filter((s) => s.category === "qg");

  const byDay = daySet(tre);
  const byMedDay = daySet(med);
  const qgByDay = daySet(qg);

  const todaysMed = med.filter((s) => s.date === todayKey);
  const todaysQg = qg.filter((s) => s.date === todayKey);

  return {
    totalSessions: tre.length,
    totalMinutes: sumMinutes(tre),
    currentStreak: currentStreakFor(byDay),
    longest: longestStreakFor(byDay),
    byDay,
    totalPracticeDays: new Set([...Object.keys(byDay), ...Object.keys(byMedDay), ...Object.keys(qgByDay)]).size,
    medMinutes: sumMinutes(med),
    medToday: sumMinutes(todaysMed),
    medRounds: todaysMed.length,
    medStreak: currentStreakFor(byMedDay),
    byMedDay,
    qgMinutes: sumMinutes(qg),
    qgToday: sumMinutes(todaysQg),
    qgRounds: todaysQg.length,
    qgStreak: currentStreakFor(qgByDay),
    qgByDay,
  };
}

function currentStreakFor(byDay) {
  let streak = 0;
  let d = new Date();
  if (!byDay[todayStr()]) d.setDate(d.getDate() - 1);
  while (byDay[dateKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function longestStreakFor(byDay) {
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
  return longest;
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

// Loads all sessions once and refreshes History, Stats, and the Dashboard.
async function refreshJournalViews() {
  await loadJournalSessions();
  const s = computeStats(sessionsCache);
  renderStats(s);
  renderDashboard(sessionsCache, s);
}

function renderStats(s) {
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

function renderDashToday(sessions) {
  const wrap = $("#dash-today");
  const today = todayStr();
  const agg = (list) => {
    const min = list.reduce((sum, s) => sum + (s.minutes || 0), 0);
    const newest = list.length ? sortedSessionsNewest(list)[0] : null;
    return {
      min: min || null,
      mood: newest && newest.mood ? newest.mood : null,
      note: newest && (newest.notes || "").trim() ? newest.notes : "",
    };
  };
  const tre = agg(sessions.filter((s) => s.category === "tre" && s.date === today));
  const med = agg(sessions.filter((s) => s.category === "med" && s.date === today));
  const qg = agg(sessions.filter((s) => s.category === "qg" && s.date === today));
  const hasAny = [tre, med, qg].some((p) => p.min || p.mood || p.note);
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
  const total = (tre.min || 0) + (med.min || 0) + (qg.min || 0);
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

function renderDashWeek(sessions) {
  const wrap = $("#dash-week");
  wrap.innerHTML = "";
  const byDate = {};
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  sessions.forEach((s) => (byDate[s.date] = (byDate[s.date] || []).concat(s)));
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const list = byDate[key] || [];
    const tile = document.createElement("div");
    tile.className = "day-tile";
    if (list.length) tile.classList.add("has-entry");
    if (key === todayStr()) tile.classList.add("today");
    const kinds = { tre: false, med: false, qg: false };
    list.forEach((s) => (kinds[s.category] = true));
    const dots = [];
    if (kinds.tre) dots.push('<span class="dk dk-tre"></span>');
    if (kinds.med) dots.push('<span class="dk dk-med"></span>');
    if (kinds.qg) dots.push('<span class="dk dk-qg"></span>');
    tile.innerHTML =
      `<span class="dash-tile-dots">${dots.join("") || '&nbsp;'}</span>` +
      `<span>${weekdays[d.getDay()]}<br>${d.getDate()}</span>`;
    if (list.length) {
      const practiced = [
        kinds.tre && "TRE",
        kinds.med && "Meditation",
        kinds.qg && "Qi Gong",
      ].filter(Boolean).join(", ");
      tile.title = formatDate(key) + " \u2014 " + practiced;
      tile.addEventListener("click", () => {
        const primary = list.find((s) => s.category === "tre") || list[0];
        if (primary) loadEntryFromSession(primary.id);
      });
    }
    wrap.appendChild(tile);
  }
}

function renderDashRecent(sessions) {
  const wrap = $("#dash-recent");
  const byDate = {};
  sessions.forEach((s) => (byDate[s.date] = (byDate[s.date] || []).concat(s)));
  const days = Object.keys(byDate)
    .map((date) => ({ date, list: byDate[date] }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 4);
  if (!days.length) {
    wrap.innerHTML = '<p class="muted">Nothing logged yet. Start with a practice \u2014 then write a journal entry.</p>';
    return;
  }
  days.forEach(({ date, list }) => {
    const kinds = [];
    if (list.some((s) => s.category === "tre")) kinds.push(["TRE", "dk-b-tre"]);
    if (list.some((s) => s.category === "med")) kinds.push(["Meditation", "dk-b-med"]);
    if (list.some((s) => s.category === "qg")) kinds.push(["Qi Gong", "dk-b-qg"]);
    const badgeHtml = kinds
      .map(([name, cls]) => `<span class="dash-badge ${cls}">${name}</span>`)
      .join(" ");
    const mins = list.reduce((sum, s) => sum + (s.minutes || 0), 0);
    const newest = sortedSessionsNewest(list)[0];
    const mood = newest ? newest.mood : null;
    const note = newest ? (newest.notes || "").trim() : "";
    const item = document.createElement("div");
    item.className = "history-item dash-recent-item";
    item.innerHTML = `
      <div class="h-date">
        <span>${formatDate(date)}</span><span>${badgeHtml}</span>
      </div>
      <div class="h-date">
        <span>${mins ? `${mins} min` : ""}${mood ? `${mins ? " &middot; " : ""}<span class="mood">${escapeHtml(mood)}</span>` : ""}</span>
      </div>
      ${note ? `<div class="h-preview">${escapeHtml(note)}</div>` : ""}
    `;
    item.addEventListener("click", () => {
      const primary = list.find((s) => s.category === "tre") || list[0];
      if (primary) openHistory(primary.category, list, primary.id);
    });
    wrap.appendChild(item);
  });
}

function renderDashboard(sessions, s) {
  dashGreeting();
  renderDashStats(s || computeStats(sessions));
  renderDashToday(sessions);
  renderDashWeek(sessions);
  renderDashRecent(sessions);
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
  resetJournalForms();
  refreshJournalViews();
  loadYouTubeApi();
}
init();
