// TRE Practice — Supabase-backed API layer.
// Replaces the local server.py /api/* endpoints with direct Supabase REST
// (PostgREST) calls so the same frontend works on any device.
// It exposes the same two globals app.js expects: `API` (path map) and `api`.

"use strict";

const SB = window.SUPABASE || { url: "", anon: "", table: "entries" };
const SB_TABLE = SB.table || "entries";
const SB_REST = SB.url.replace(/\/+$/, "") + "/rest/v1/" + SB_TABLE;

const API = {
  today: "/api/today",
  entries: "/api/entries",
  entryFor: (date) => `/api/entry/${date}`,
  save: "/api/save",
  backup: "/api/backup",
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
  return out;
}

// Compact shape used by the History/Stats lists (mirrors server.py /api/entries).
function listEntry(e) {
  return {
    date: e.date,
    mood: e.mood,
    exercises: e.exercises || [],
    minutes: e.minutes,
    medMinutes: e.medMinutes,
    meditations: e.meditations || [],
    hasNotes: !!(e.notes || "").trim(),
    notes: e.notes || "",
    medMood: e.medMood,
    hasMedNotes: !!(e.medNotes || "").trim(),
    medNotes: e.medNotes || "",
    exerciseNotes: e.exerciseNotes || {},
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
  let resp;
  try {
    resp = await fetch(SB_REST + path, Object.assign({ cache: "no-store" }, opts));
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
    const rows = await sbFetch("?select=*&date=eq." + sbToday() + "&limit=1", { method: "GET" });
    return cleanEntry(rows && rows[0]);
  }

  // GET /api/entry/:date
  const entryMatch = p.match(/^\/api\/entry\/(\d{4}-\d{2}-\d{2})$/);
  if (entryMatch) {
    const rows = await sbFetch("?select=*&date=eq." + entryMatch[1] + "&limit=1", { method: "GET" });
    return cleanEntry(rows && rows[0]);
  }

  // GET /api/entries
  if (p === API.entries) {
    const rows = await sbFetch("?select=*&order=date.asc", { method: "GET" });
    return (rows || []).map(listEntry);
  }

  // GET /api/backup
  if (p === API.backup) {
    const rows = await sbFetch("?select=*&order=date.asc", { method: "GET" });
    return {
      type: "omarchy-tre-practice",
      version: 1,
      exported: new Date().toISOString(),
      entries: (rows || []).map(cleanEntry),
    };
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

  // POST /api/restore — bulk upsert from a backup
  if (p === "/api/restore") {
    const items = (body && body.entries) || [];
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
    return { restored: rows.length };
  }

  throw new Error("unknown api path: " + p);
}

window.api = api;