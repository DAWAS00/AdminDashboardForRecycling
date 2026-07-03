import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface DispatchPayload {
  order_id: string;
  driver_id: string;   // profiles.auth_id of the driver (uuid)
  reassign: boolean;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { order_id, driver_id, reassign }: DispatchPayload = await req.json();

  // 1. Atomically assign the order to the driver
  const { data: order, error: updateErr } = await supabase
    .from("orders")
    .update({ driver_id, status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", order_id)
    .select("id, waste_types, estimated_weight_kg")
    .single();

  if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });

  // 2. Send push + in-app notification to assigned driver
  const type = reassign ? "orderReassigned" : "orderAssignedToDriver";
  const title = reassign ? "Order Reassigned to You" : "New Order Assigned";
  const body = `${order.waste_types.join(", ")} — ${order.estimated_weight_kg} kg`;

  await supabase.functions.invoke("send-push", {
    body: { user_ids: [driver_id], title, body, type, order_id },
  });

  return new Response(JSON.stringify({ success: true, order_id }), {
    headers: { "Content-Type": "application/json" },
  });
});
