// TRE Practice — Supabase configuration.
// Fill in these values from your Supabase project (Project Settings > API):
//   url  — "https://<project-ref>.supabase.co"
//   anon — the public "anon" (publishable) key
// The anon key ships in this file for any visitor to read, so it is NOT a
// secret. For a private journal you must protect the data with Row Level
// Security policies (see supabase-schema.sql) rather than relying on this key.
window.SUPABASE = {
  url: "https://zwwpxslfpjyykpadxiuc.supabase.co",
  anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d3B4c2xmcGp5eWtwYWR4aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTkxMDAsImV4cCI6MjEwMzg3NTEwMH0.fOROcr2qJ1WWOf2d_M9UosTqWqOxC9tgOaZuFrCYtU4",
  table: "entries",
  // Shared secret checked by the Row Level Security policy in supabase-schema.sql.
  // Anyone can read this value from the app source, so it only stops casual
  // access, it is not real authentication.
  appKey: "ea2f1f556d8bd3d5c78876db95c17998a9425d5b082ab604",
};