// TRE Practice — Supabase configuration.
// Fill in these values from your Supabase project (Project Settings > API):
//   url  — "https://<project-ref>.supabase.co"
//   anon — the public "anon" (publishable) key
// The anon key ships in this file for any visitor to read, so it is NOT a
// secret. For a private journal you must protect the data with Row Level
// Security policies (see supabase-schema.sql) rather than relying on this key.
window.SUPABASE = {
  url: "https://YOUR-PROJECT-REF.supabase.co",
  anon: "YOUR-ANON-KEY",
  table: "entries",
};