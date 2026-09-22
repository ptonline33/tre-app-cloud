// TRE Practice — Supabase-backed API layer.
// Replaces the local server.py /api/* endpoints with direct Supabase REST
// (PostgREST) calls so the same frontend works on any device.
// It exposes the same two globals app.js expects: `API` (path map) and `api`.

"use strict";

const SB = window.SUPABASE || { url: "", anon: "", table: "entries", journalTable: "journal_entries" };
const SB_TABLE = SB.table || "entries";
const SB_JOURNAL = SB.journalTable || "journal_entries";
const SB_REST = SB.url.replace(/\/+$/, "") + "/rest/v1/" + SB_TABLE;
const SB_JOURNAL_REST = SB.url.replace(/\/+$/, "") + "/rest/v1/" + SB_JOURNAL;

const API = {
  today: "/api/today",
  entries: "/api/entries",
  entryFor: (date) => `/api/entry/${date}`,
  save: "/api/save",
  backup: "/api/backup",
  journal: "/api/journal",
  journalSave: "/api/journal/save",
};

function sbToday() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function defaultEntry(date) {
  return {
    date,
    mood: null,
    notes: "",
    medMood: null,
    medNotes: "",
    exercises: [],
    exerciseNotes: {},
    minutes: null,
    medMinutes: null,
    meditations: [],
    qigongs: [],
    qgMood: null,
    qgMinutes: null,
    qgNotes: "",
  };
}

// Normalize any row/object into the app's full entry shape (mirrors server.py).
function cleanEntry(e) {
  const out = defaultEntry((e && e.date) || sbToday());
  if (!e || typeof e !== "object") return out;
  out.date = e.date || out.date;
  if (e.mood !== undefined && e.mood !== null) out.mood = e.mood;
  if (typeof e.notes === "string") out.notes = e.notes.trim();
  if (e.medMood !== undefined && e.medMood !== null) out.medMood = e.medMood;
  if (typeof e.medNotes === "string") out.medNotes = e.medNotes.trim();
  if (typeof e.minutes === "number" && Number.isFinite(e.minutes)) out.minutes = Math.max(0, Math.round(e.minutes));
  if (typeof e.medMinutes === "number" && Number.isFinite(e.medMinutes)) out.medMinutes = Math.max(0, Math.round(e.medMinutes));
  if (Array.isArray(e.exercises)) {
    const seen = {};
    out.exercises = [];
    for (const x of e.exercises) {
      const id = String(x);
      if (!seen[id]) { seen[id] = true; out.exercises.push(id); }
    }
  }
  if (e.exerciseNotes && typeof e.exerciseNotes === "object" && !Array.isArray(e.exerciseNotes)) {
    out.exerciseNotes = {};
    for (const k of Object.keys(e.exerciseNotes)) {
      const v = e.exerciseNotes[k];
      if (typeof v === "string") out.exerciseNotes[k] = v.trim();
    }
  }
  if (Array.isArray(e.meditations)) {
    out.meditations = [];
    for (const m of e.meditations) {
      if (!m || typeof m !== "object") continue;
      const mins = m.minutes;
      if (typeof mins !== "number" || !Number.isFinite(mins) || !(mins > 0)) continue;
      const type = typeof m.type === "string" && m.type.trim() ? m.type.trim() : "Other";
      out.meditations.push({ type, minutes: Math.round(mins), time: m.time || null });
    }
  }
  if (Array.isArray(e.qigongs)) {
    out.qigongs = [];
    for (const q of e.qigongs) {
      if (!q || typeof q !== "object") continue;
      const mins = q.minutes;
      if (typeof mins !== "number" || !Number.isFinite(mins) || !(mins > 0)) continue;
      out.qigongs.push({ minutes: Math.round(mins), time: q.time || null });
    }
  }
  if (e.qgMood !== undefined && e.qgMood !== null) out.qgMood = e.qgMood;
  if (typeof e.qgNotes === "string") out.qgNotes = e.qgNotes.trim();
  if (typeof e.qgMinutes === "number" && Number.isFinite(e.qgMinutes)) out.qgMinutes = Math.max(0, Math.round(e.qgMinutes));
  return out;
}

// Normalize a per-session journal entry into the app's session shape.
function cleanSession(e) {
  const out = {
    id: e && e.id ? String(e.id) : null,
    date: (e && e.date) || sbToday(),
    category: e && e.category === "med" ? "med" : e && e.category === "qg" ? "qg" : "tre",
    createdAt: (e && e.createdAt) || null,
    mood: null,
    minutes: null,
    notes: "",
  };
  if (!e || typeof e !== "object") return out;
  if (e.mood !== undefined && e.mood !== null && String(e.mood).trim() !== "") out.mood = e.mood;
  if (typeof e.minutes === "number" && Number.isFinite(e.minutes)) out.minutes = Math.max(0, Math.round(e.minutes));
  if (typeof e.notes === "string") out.notes = e.notes.trim();
  return out;
}

// Shape sent to Supabase for an insert/update of one session entry.
function sessionRow(s) {
  const clean = cleanSession(s);
  return {
    date: clean.date,
    category: clean.category,
    mood: clean.mood,
    minutes: clean.minutes,
    notes: clean.notes,
  };
}

// Compact shape used by History/Stats/Dashboard lists.
function listEntry(e) {
  return {
    date: e.date,
    mood: e.mood,
    exercises: e.exercises || [],
    minutes: e.minutes,
    medMinutes: e.medMinutes,
    meditations: e.meditations || [],
    qigongs: e.qigongs || [],
    hasNotes: !!(e.notes || "").trim(),
    notes: e.notes || "",
    medMood: e.medMood,
    hasMedNotes: !!(e.medNotes || "").trim(),
    medNotes: e.medNotes || "",
    exerciseNotes: e.exerciseNotes || {},
    qgMood: e.qgMood,
    qgMinutes: e.qgMinutes,
    hasQgNotes: !!(e.qgNotes || "").trim(),
    qgNotes: e.qgNotes || "",
  };
}

function sbHeaders(extra) {
  return Object.assign(
    {
      apikey: SB.anon,
      Authorization: "Bearer " + SB.anon,
      "Content-Type": "application/json",
      "X-App-Key": SB.appKey || "", // required by Realtime security/RLS
    },
    extra || {}
  );
}

// Small wrapper that turns HTTP/network failures into readable Errors.
async function sbFetch(path, opts) {
  opts = opts || {};
  const base = opts.base || SB_REST;
  const fetchOpts = Object.assign({ cache: "no-store" }, opts);
  delete fetchOpts.base;
  let resp;
  try {
    resp = await fetch(base + path, fetchOpts);
  } catch (err) {
    throw new Error("Cannot reach Supabase: " + err.message);
  }
  if (!resp.ok) {
    let msg = "Supabase error " + resp.status;
    try {
      const j = await resp.json();
      if (j && j.message) msg = j.message;
    } catch (_) {}
    throw new Error(msg);
  }
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

// Translates the app's /api/* calls into Supabase REST.
async function api(path, options) {
  options = options || {};
  const p = String(path);

  let body = null;
  if (options.body) {
    try { body = JSON.parse(options.body); } catch (_) { body = null; }
  }

  // GET /api/today
  if (p === API.today) {
    const rows = await sbFetch("?select=*&date=eq." + sbToday() + "&limit=1", { method: "GET", headers: sbHeaders() });
    return cleanEntry(rows && rows[0]);
  }

  // GET /api/entry/:date
  const entryMatch = p.match(/^\/api\/entry\/(\d{4}-\d{2}-\d{2})$/);
  if (entryMatch) {
    const rows = await sbFetch("?select=*&date=eq." + entryMatch[1] + "&limit=1", { method: "GET", headers: sbHeaders() });
    return cleanEntry(rows && rows[0]);
  }

  // GET /api/entries
  if (p === API.entries) {
    const rows = await sbFetch("?select=*&order=date.asc", { method: "GET", headers: sbHeaders() });
    return (rows || []).map(listEntry);
  }

  // GET /api/backup
  if (p === API.backup) {
    const [rows, sessions] = await Promise.all([
      sbFetch("?select=*&order=date.asc", { method: "GET", headers: sbHeaders() }),
      sbFetch("?select=*&order=createdAt.asc", { method: "GET", headers: sbHeaders(), base: SB_JOURNAL_REST }),
    ]);
    return {
      type: "omarchy-tre-practice",
      version: 2,
      exported: new Date().toISOString(),
      entries: (rows || []).map(cleanEntry),
      journalEntries: (sessions || []).map(cleanSession),
    };
  }

  // GET /api/journal — every per-session journal entry, newest first.
  if (p === API.journal) {
    const rows = await sbFetch("?select=*&order=createdAt.desc", { method: "GET", headers: sbHeaders(), base: SB_JOURNAL_REST });
    return (rows || []).map(cleanSession);
  }

  // POST /api/journal/save — insert a new session entry, or update it when
  // an id is provided (editing an existing session from History). A new
  // session always creates a separate row; nothing is merged.
  if (p === API.journalSave) {
    const clean = cleanSession(body || {});
    const payload = sessionRow(clean);
    if (clean.id) {
      payload.createdAt = clean.createdAt || new Date().toISOString();
      const saved = await sbFetch("?id=eq." + encodeURIComponent(clean.id), {
        method: "PATCH",
        headers: sbHeaders({ Prefer: "return=representation" }),
        body: JSON.stringify(payload),
      });
      return cleanSession(Array.isArray(saved) ? saved[0] : saved);
    }
    payload.createdAt = new Date().toISOString();
    const saved = await sbFetch("", {
      method: "POST",
      headers: sbHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(payload),
    });
    return cleanSession(Array.isArray(saved) ? saved[0] : saved);
  }

  // POST /api/restore — bulk upsert from a backup (legacy daily rows + per-session entries)
  if (p === "/api/restore") {
    const items = (body && body.entries) || [];
    const sessionsIn = (body && body.journalEntries) || [];
    const rows = items
      .filter((i) => i && /^\d{4}-\d{2}-\d{2}$/.test(String(i.date)))
      .map(cleanEntry);
    if (rows.length) {
      await sbFetch("?on_conflict=date", {
        method: "POST",
        headers: sbHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(rows),
      });
    }

    // Session rows from a current backup. For an older backup that only has
    // combined daily entries, convert each category block into its own
    // session entry so the data is visible in the per-session journal.
    let sessionRows = sessionsIn
      .filter((s) => s && s.id && /^\d{4}-\d{2}-\d{2}$/.test(String(s.date)))
      .map(cleanSession);
    if (!sessionRows.length && rows.length) {
      rows.forEach((e) => {
        if (e.mood || e.minutes || (e.notes || "").trim()) {
          sessionRows.push(cleanSession({ date: e.date, category: "tre", mood: e.mood, minutes: e.minutes, notes: e.notes }));
        }
        if (e.medMood || e.medMinutes || (e.medNotes || "").trim()) {
          sessionRows.push(cleanSession({ date: e.date, category: "med", mood: e.medMood, minutes: e.medMinutes, notes: e.medNotes }));
        }
        if (e.qgMood || e.qgMinutes || (e.qgNotes || "").trim()) {
          sessionRows.push(cleanSession({ date: e.date, category: "qg", mood: e.qgMood, minutes: e.qgMinutes, notes: e.qgNotes }));
        }
      });
    }
    const withIds = sessionRows.filter((s) => s.id);
    if (withIds.length) {
      await sbFetch("?on_conflict=id", {
        method: "POST",
        headers: sbHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(withIds.map((s) => Object.assign({ id: s.id }, sessionRow(s), { createdAt: s.createdAt || new Date().toISOString() }))),
      });
    }
    const withoutIds = sessionRows.filter((s) => !s.id);
    if (withoutIds.length) {
      await sbFetch("", {
        method: "POST",
        headers: sbHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify(withoutIds.map((s) => Object.assign(sessionRow(s), { createdAt: s.createdAt || new Date().toISOString() }))),
      });
    }
    return { restored: rows.length + sessionRows.length };
  }

  // POST /api/save — upsert a single day's entry
  if (p === API.save) {
    const row = cleanEntry(body || {});
    const saved = await sbFetch("?on_conflict=date", {
      method: "POST",
      headers: sbHeaders({ Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify(row),
    });
    return cleanEntry(Array.isArray(saved) ? saved[0] : saved);
  }

  throw new Error("unknown api path: " + p);
}

window.api = api;