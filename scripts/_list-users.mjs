import { createClient } from "@supabase/supabase-js";
const s = createClient(
  "https://bbpleeddaquwwvexzmdc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicGxlZWRkYXF1d3d2ZXh6bWRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTk3ODI3NiwiZXhwIjoyMDk3NTU0Mjc2fQ.Irfzk-4R49QaWYXKlUQIGoqfKQYgo1OwRzCPH6hOMUw"
);

// Try listing without any params
const result = await s.auth.admin.listUsers();
console.log("Keys:", Object.keys(result));
console.log("data keys:", result.data ? Object.keys(result.data) : "null");
console.log("users count:", result.data?.users?.length ?? "none");
console.log("error:", JSON.stringify(result.error));

if (result.data?.users?.length) {
  for (const u of result.data.users.slice(0, 15)) {
    console.log(`  ${u.id} | ${u.email}`);
  }
}

// Also try: just query from profiles table to find our seed users
const { data: profiles } = await s.from("profiles").select("auth_id, name, email").eq("email", "ahmad.khalil@dawer-seed.test").limit(1);
console.log("\nProfile lookup:", JSON.stringify(profiles));
