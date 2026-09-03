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
$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    $$(".panel").forEach((p) => p.classList.remove("active"));
    $("#tab-" + tab.dataset.tab).classList.add("active");
  });
});

// ---------- Exercises ----------
const exerciseList = $("#exercise-list");
function buildExerciseCards() {
  exerciseList.innerHTML = "";
  window.TRE_EXERCISES.forEach((ex) => {
    const card = document.createElement("article");
    card.className = "card exercise-card";
    card.innerHTML = `
      <div class="thumb">${ex.svg}</div>
      <div class="ex-meta"><span class="ex-num">${ex.number}</span><span class="ex-type">${ex.type} &middot; ${ex.duration}</span></div>
      <h3 class="ex-card-name">${ex.name}</h3>
      ${ex.note ? `<p class="ex-duration">${ex.note}</p>` : ""}
    `;
    card.addEventListener("click", () => openModal(ex.id));
    exerciseList.appendChild(card);
  });
}

function openModal(exId) {
  const ex = window.TRE_EXERCISES.find((e) => e.id === exId);
  if (!ex) return;
  const steps = ex.steps.map((s) => `<li>${s}</li>`).join("");
  const videoId = youtubeId(ex.video);
  $("#modal-body").innerHTML = `
    ${ex.svg.replace('<svg', '<svg class="ex-modal-svg"')}
    <h2><span class="ex-num">${ex.number}</span> ${ex.name} <span class="ex-type">(${ex.type})</span></h2>
    <p class="purpose"><strong>Purpose:</strong> ${ex.purpose}</p>
    ${ex.note ? `<p class="hint">${ex.note}</p>` : ""}
    <h3>Steps</h3>
    <ol>${steps}</ol>
    <h3>Guided Video</h3>
    <iframe class="modal-video" src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0"
      title="Guided TRE video" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>
    <p class="hint">${ex.videoTitle} &mdash; <a href="${ex.video}" target="_blank" rel="noopener">watch on YouTube</a></p>
    <h3>My Notes for Today</h3>
    <textarea id="ex-note-input" rows="4" placeholder="How did this one feel today? What did you notice?"></textarea>
    <div class="ex-note-actions">
      <button class="btn primary" id="save-ex-note">Save Note</button>
      <span class="save-msg" id="ex-note-msg" aria-live="polite"></span>
    </div>
    <details class="stop-ref">
      <summary>How to stop the tremors</summary>
      <ul>
        <li>Straighten your legs out flat along the floor.</li>
        <li>Sit up, or get up and walk around.</li>
        <li>Press your feet firmly into the ground.</li>
        <li>Breathe slowly and relaxed. Drink water if you need to.</li>
      </ul>
    </details>
  `;
  $("#modal-overlay").classList.remove("hidden");
  $("#modal-close").focus();

  // Load today's saved note for this exercise
  api(API.today).then((entry) => {
    const saved = (entry.exerciseNotes || {})[exId] || "";
    $("#ex-note-input").value = saved;
  });

  $("#save-ex-note").addEventListener("click", async () => {
    const entry = await api(API.today);
    entry.exerciseNotes = entry.exerciseNotes || {};
    entry.exerciseNotes[exId] = $("#ex-note-input").value;
    const saved = await api(API.save, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const msg = $("#ex-note-msg");
    msg.textContent = "Note saved \u2713";
    setTimeout(() => (msg.textContent = ""), 2500);
    $("#notes-input").value = saved.notes || "";
  });
}

function youtubeId(url) {
  const m = url.match(/[?&]v=([\w-]+)/);
  return m ? m[1] : url.split("/").pop();
}

$("#modal-close").addEventListener("click", closeModal);
$("#modal-overlay").addEventListener("click", (e) => {
  if (e.target.id === "modal-overlay") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
function closeModal() {
  $("#modal-overlay").classList.add("hidden");
  $("#modal-body").innerHTML = "";
}

function openQuickModal() {
  const q = window.TRE_QUICK;
  const videoId = youtubeId(q.video);
  const md = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const stepsHtml = q.steps.map((s) => `<li>${md(s)}</li>`).join("");
  const exInfo = q.exercises
    .map((id) => {
      const ex = window.TRE_EXERCISES.find((e) => e.id === id);
      return ex ? `<li><strong>${ex.name}</strong> &mdash; ${ex.purpose}</li>` : "";
    })
    .join("");
  $("#modal-body").innerHTML = `
    <h2>&#9889; ${q.name}</h2>
    <p class="purpose">${q.blurb}</p>
    <h3>Why these two?</h3>
    <ul>${exInfo}</ul>
    <h3>Quick Routine</h3>
    <div class="quick-steps"><ol>${stepsHtml}</ol></div>
    <h3>Guided Video</h3>
    <iframe class="modal-video" src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0"
      title="Quick TRE routine video" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>
    <p class="hint">${q.videoTitle} &mdash; <a href="${q.video}" target="_blank" rel="noopener">watch on YouTube</a></p>
    <details class="stop-ref">
      <summary>How to stop the tremors</summary>
      <ul>
        <li>Straighten your legs out flat along the floor.</li>
        <li>Sit up, or get up and walk around.</li>
        <li>Press your feet firmly into the ground.</li>
        <li>Breathe slowly and relaxed. Drink water if you need to.</li>
      </ul>
    </details>
  `;
  $("#modal-overlay").classList.remove("hidden");
  $("#modal-close").focus();
}

$("#quick-open").addEventListener("click", openQuickModal);

// ---------- Guided session ----------
$("#session-video").src =
  "https://www.youtube-nocookie.com/embed/" + youtubeId(window.TRE_GUIDED_VIDEO) + "?rel=0";

function buildChecklist(selected) {
  const wrap = $("#today-checklist");
  wrap.innerHTML = "";
  const box = document.createElement("div");
  box.className = "checklist";
  window.TRE_EXERCISES.forEach((ex) => {
    const item = document.createElement("label");
    item.className = "check-item";
    const checked = selected.includes(ex.id);
    if (checked) item.classList.add("done");
    item.innerHTML = `
      <input type="checkbox" value="${ex.id}" ${checked ? "checked" : ""} />
      <span>${ex.number}. ${ex.name}</span>
    `;
    item.querySelector("input").addEventListener("change", (ev) => {
      item.classList.toggle("done", ev.target.checked);
    });
    box.appendChild(item);
  });
  wrap.appendChild(box);
}

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
  qgInterval = setInterval(() => {
    qgElapsed++;
    if (qgElapsed >= qgGoal * 60) {
      clearInterval(qgInterval);
      qgInterval = null;
      $("#qg-start").textContent = "Start";
      const m = $("#qg-msg");
      m.textContent = "Qi Gong complete \u2713";
      setTimeout(() => (m.textContent = ""), 3500);
    }
    renderQg();
  }, 1000);
});
$("#qg-reset").addEventListener("click", () => {
  clearInterval(qgInterval);
  qgInterval = null;
  qgElapsed = 0;
  $("#qg-start").textContent = "Start";
  renderQg();
  $("#qg-msg").textContent = "";
});
renderQg();

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
async function endGuidedSession() {
  clearInterval(timerInterval);
  timerInterval = null;
  $("#timer-start").textContent = "Start";
  const elapsed = timerElapsed;
  timerElapsed = 0;
  renderTimer();
  if (elapsed <= 0) {
    timerMsg("Session ended before it began \u2014 nothing recorded.");
    return;
  }
  const mins = Math.round(elapsed / 60) || 1;
  const entry = await api(API.today);
  entry.minutes = (entry.minutes || 0) + mins;
  const saved = await api(API.save, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  timerMsg("Session logged \u2014 " + mins + " min added to today's TRE practice \u2713");
  loadToday();
  refreshStats();
  loadHistory();
  loadMedHistory();
}
renderTimer();

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
  const elapsed = medProgress.elapsed;
  setMedPhase("ready");
  syncMedDisplay("00:00");
  if (ambientOn()) stopAmbient();
  if (elapsed <= 0) {
    $("#med-msg").textContent = "Ended before the sit began &mdash; nothing logged.";
    setTimeout(() => ($("#med-msg").textContent = ""), 4000);
    return;
  }
  const mins = Math.round(elapsed / 60) || 1;
  logMeditation(mins, false, "Ended early");
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

async function finishMeditation() {
  medProgress.interval = null;
  setMedPhase("ready");
  syncMedDisplay("00:00");
  const mins = Math.round(medProgress.elapsed / 60) || 1;
  logMeditation(mins, true);
}

async function logMeditation(mins, completed, note) {
  playEndingBell();
  if (ambientOn()) stopAmbient();
  const type = currentMedType();
  const entry = await api(API.today);
  entry.meditations = entry.meditations || [];
  entry.meditations.push({
    type: type,
    minutes: mins,
    time: new Date().toISOString(),
  });
  const saved = await api(API.save, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const suffix = note ? " (" + note + ")" : "";
  $("#med-msg").textContent = "Session logged \u2014 " + mins + " min " + type + " \u2713" + suffix;
  setTimeout(() => ($("#med-msg").textContent = ""), 4000);
  renderMedSessions(saved.meditations || []);
  refreshStats();
  loadHistory();
  loadMedHistory();
}

function renderMedSessions(meds) {
  const wrap = $("#med-sessions");
  wrap.innerHTML = "";
  if (!meds.length) {
    wrap.innerHTML = '<p class="muted">No sits logged yet today.</p>';
    return;
  }
  const total = meds.reduce((s, m) => s + (m.minutes || 0), 0);
  const p = document.createElement("p");
  p.className = "med-session-total";
  p.textContent = meds.length + " sit" + (meds.length > 1 ? "s" : "") + " \u00b7 " + total + " min today";
  wrap.appendChild(p);
  meds.slice().reverse().forEach((m) => {
    const item = document.createElement("div");
    item.className = "med-session";
    const when = m.time ? new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    item.innerHTML = `<span class="med-s-type">${escapeHtml(m.type || "Other")}</span><span class="med-s-min">${m.minutes} min</span>${when ? `<span class="med-s-time">${when}</span>` : ""}`;
    wrap.appendChild(item);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadTodayMedSessions() {
  const entry = await api(API.today);
  renderMedSessions(entry.meditations || []);
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
    loadTodayMedSessions();
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


// ---------- Save today's practice ----------
async function savePractice() {
  const selected = $$("#today-checklist input:checked").map((i) => i.value);
  const entry = await api(API.today);
  entry.exercises = selected;
  if (!entry.exercises.length && !entry.minutes) {
    // still allow saving; just checks
  }
  const saved = await api(API.save, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  $("#save-msg").textContent = "Saved \u2713";
  setTimeout(() => ($("#save-msg").textContent = ""), 2500);
  loadToday();
  refreshStats();
  loadHistory();
  loadMedHistory();
  return saved;
}
$("#save-practice").addEventListener("click", savePractice);

// ---------- Journal ----------
// Sub-tabs: TRE vs Meditation
$$(".sub-tab").forEach((st) => {
  st.addEventListener("click", () => {
    $$(".sub-tab").forEach((t) => t.classList.remove("active"));
    st.classList.add("active");
    const sub = st.dataset.sub;
    $("#journal-sub-tre").classList.toggle("hidden", sub !== "tre");
    $("#journal-sub-med").classList.toggle("hidden", sub !== "med");
  });
});

async function loadToday() {
  const entry = await api(API.today);
  $("#journal-date").textContent = formatDate(entry.date);
  $("#mood-select").value = entry.mood || "";
  $("#minutes-input").value = entry.minutes != null ? entry.minutes : "";
  $("#notes-input").value = entry.notes || "";
  buildChecklist(entry.exercises || []);
  renderMedSessions(entry.meditations || []);
  // Meditation journal fields
  $("#med-journal-date").textContent = formatDate(entry.date);
  $("#med-mood-select").value = entry.medMood || "";
  const medTotal = entry.medMinutes != null && entry.medMinutes > 0
    ? entry.medMinutes
    : (entry.meditations || []).reduce((s, m) => s + (m.minutes || 0), 0);
  $("#med-minutes-input").value = medTotal || "";
  $("#med-notes-input").value = entry.medNotes || "";
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

function renderHistoryList(container, entries, kind) {
  const list = container;
  list.innerHTML = "";
  if (!entries.length) {
    list.innerHTML = kind === "tre"
      ? '<p class="muted">No TRE entries yet. Write your first one!</p>'
      : '<p class="muted">No meditation entries yet. Write your first one!</p>';
    return;
  }
  entries.slice().reverse().forEach((e) => {
    const item = document.createElement("div");
    item.className = "history-item";
    if (kind === "tre") {
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
      const medMin = e.medMinutes != null && e.medMinutes > 0
        ? e.medMinutes
        : (e.meditations || []).reduce((s, m) => s + (m.minutes || 0), 0);
      const mins = medMin ? ` &middot; <span class="mood">${medMin} min</span>` : "";
      const rounds = e.meditations ? e.meditations.length : 0;
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

  const titleKind = kind === "tre" ? "TRE Practice" : "Meditation";
  $("#history-title").textContent = titleKind;
  $("#history-title").style.color = kind === "tre" ? "var(--accent-dark)" : "var(--warm)";

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
  } else {
    const mood = e.medMood ? `<div class="hm-mood"><strong>Mood:</strong> ${escapeHtml(e.medMood)}</div>` : "";
    const medMin = e.medMinutes != null && e.medMinutes > 0
      ? e.medMinutes
      : (e.meditations || []).reduce((s, m) => s + (m.minutes || 0), 0);
    const mins = medMin ? `<div class="hm-min"><strong>Minutes:</strong> ${medMin}</div>` : "";
    const rounds = (e.meditations || []).length
      ? `<div class="hm-rounds"><strong>Sits:</strong> ${e.meditations.length}</div>`
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
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === "journal"));
  $$(".panel").forEach((p) => p.classList.toggle("active", p.id === "tab-journal"));
  // switch sub-tab
  $$(".sub-tab").forEach((t) => t.classList.toggle("active", t.dataset.sub === sub));
  $("#journal-sub-tre").classList.toggle("hidden", sub !== "tre");
  $("#journal-sub-med").classList.toggle("hidden", sub !== "med");
  // load both forms
  $("#journal-date").textContent = formatDate(entry.date);
  $("#mood-select").value = entry.mood || "";
  $("#minutes-input").value = entry.minutes != null ? entry.minutes : "";
  $("#notes-input").value = entry.notes || "";
  buildChecklist(entry.exercises || []);
  renderMedSessions(entry.meditations || []);
  $("#med-journal-date").textContent = formatDate(entry.date);
  $("#med-mood-select").value = entry.medMood || "";
  const medTotal = entry.medMinutes != null && entry.medMinutes > 0
    ? entry.medMinutes
    : (entry.meditations || []).reduce((s, m) => s + (m.minutes || 0), 0);
  $("#med-minutes-input").value = medTotal || "";
  $("#med-notes-input").value = entry.medNotes || "";
  if (sub === "med") $("#med-notes-input").focus();
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

  let uniqueEx = new Set();
  entries.forEach((e) => (e.exercises || []).forEach((x) => uniqueEx.add(x)));

  const dates = new Set(activeDays.map((e) => e.date));

  // Streak calculation (consecutive days ending today or yesterday).
  // Only days with an actual TRE practice count (exercises, notes, mood, or
  // minutes). Meditation-only days must never show up in the TRE stats.
  const byDay = {};
  activeDays.forEach((e) => (byDay[e.date] = true));

  let currentStreak = 0;
  let d = new Date();
  if (!byDay[todayStr()]) d.setDate(d.getDate() - 1); // allow streak to persist if missed today
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

  // Meditation stats
  // Per-day meditation minutes: the journal minutes field (medMinutes) is the
  // authoritative total when set; otherwise fall back to the sum of logged sits.
  const medMinForDay = (e) => {
    if (typeof e.medMinutes === "number" && e.medMinutes > 0) return e.medMinutes;
    return (e.meditations || []).reduce((s, m) => s + (m.minutes || 0), 0);
  };
  // A day counts as a meditation day if it has logged sits OR a medMinutes total
  // (so journal-only entries still register in stats and the week view).
  const isMedDay = (e) =>
    (e.meditations && e.meditations.length > 0) ||
    (typeof e.medMinutes === "number" && e.medMinutes > 0);

  const medMinutes = entries.reduce((sum, e) => sum + medMinForDay(e), 0);
  // Meditation minutes logged today (per-day records reset naturally because
  // each day has its own entry; today's sit(s) appear in today's record).
  const todaysEntry = entries.find((e) => e.date === todayStr());
  const medToday = todaysEntry ? medMinForDay(todaysEntry) : 0;
  const medRounds = todaysEntry ? (todaysEntry.meditations || []).length : 0;
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
  const medByType = {};
  entries.forEach((e) =>
    (e.meditations || []).forEach((m) => {
      const t = m.type && m.type !== "Other" ? m.type : "Other";
      medByType[t] = (medByType[t] || 0) + (m.minutes || 0);
    })
  );

  return {
    totalSessions,
    totalMinutes,
    currentStreak,
    longest,
    uniqueEx: uniqueEx.size,
    byDay,
    medMinutes,
    medRounds,
    medStreak,
    medByType,
    byMedDay,
    medToday,
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
    $("#stat-excount").textContent = s.uniqueEx;
    $("#stat-med-minutes").textContent = s.medMinutes;
    $("#stat-med-today").textContent = s.medToday;
    $("#stat-med-sessions").textContent = s.medRounds;
    $("#stat-med-streak").textContent = s.medStreak;
    renderMedBreakdown(s.medByType);
    renderWeek(s.byDay, $("#week-view"));
    renderWeek(s.byMedDay || {}, $("#med-week-view"));
  });
}

function renderMedBreakdown(medByType) {
  const wrap = $("#med-breakdown");
  wrap.innerHTML = "";
  const names = Object.keys(medByType);
  if (!names.length) {
    wrap.innerHTML = '<p class="muted">No meditation logged yet.</p>';
    return;
  }
  const total = Object.values(medByType).reduce((a, b) => a + b, 0);
  const entries = names
    .map((n) => ({ name: n, min: medByType[n] }))
    .sort((a, b) => b.min - a.min);
  entries.forEach((e) => {
    const pct = Math.round((e.min / total) * 100);
    const row = document.createElement("div");
    row.className = "med-bar-row";
    row.innerHTML = `
      <span class="med-bar-name">${escapeHtml(e.name)}</span>
      <div class="med-bar-track"><div class="med-bar-fill" style="width:${pct}%"></div></div>
      <span class="med-bar-val">${e.min}m</span>
    `;
    wrap.appendChild(row);
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
  buildExerciseCards();
  loadToday();
  loadHistory();
  loadMedHistory();
  refreshStats();
}
init();
