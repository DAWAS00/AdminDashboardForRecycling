import { createClient } from "@supabase/supabase-js";
const s = createClient(
  "https://bbpleeddaquwwvexzmdc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicGxlZWRkYXF1d3d2ZXh6bWRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTk3ODI3NiwiZXhwIjoyMDk3NTU0Mjc2fQ.Irfzk-4R49QaWYXKlUQIGoqfKQYgo1OwRzCPH6hOMUw"
);

// Check existing orders waste_types
const { data, error } = await s.from("orders").select("waste_types").limit(5);
console.log("Existing orders waste_types:", JSON.stringify(data, null, 2));
if (error) console.log("Error:", error.message);

// Try inserting a single test order with just ["oil"]
const { data: test, error: testErr } = await s
  .from("orders")
  .insert({
    type: "pickup",
    status: "pending",
    waste_types: ["oil"],
    estimated_weight_kg: 10,
    reward_jd: 3.5,
    is_urgent: false,
    notes: "SEED_TEST",
    created_at: new Date().toISOString(),
  })
  .select("id, waste_types");
console.log("Test insert:", JSON.stringify(test));
if (testErr) console.log("Test insert error:", testErr.message);

// Clean up test
if (test?.[0]) {
  await s.from("orders").delete().eq("id", test[0].id);
  console.log("Cleaned up test order");
}
