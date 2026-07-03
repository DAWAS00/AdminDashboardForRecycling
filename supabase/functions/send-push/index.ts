import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface PushPayload {
  user_ids: string[];   // profiles.auth_id values (uuid strings)
  title: string;
  body: string;
  type: string;         // notification_type enum value
  order_id?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const payload: PushPayload = await req.json();
  const { user_ids, title, body, type, order_id } = payload;

  // 1. Look up FCM tokens from profiles table
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("auth_id, fcm_token")
    .in("auth_id", user_ids);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // 2. Write in-app notification log entries (Flutter reads via Realtime)
  if (profiles && profiles.length > 0) {
    await supabase.from("notifications").insert(
      profiles.map((u: { auth_id: string }) => ({
        recipient_id: u.auth_id,
        title,
        body,
        type,
        order_id: order_id ?? null,
        is_read: false,
      }))
    );

    // 3. Send FCM push notifications for users who have a token registered
    const fcmTokens = (profiles as { auth_id: string; fcm_token: string | null }[])
      .filter(u => u.fcm_token)
      .map(u => u.fcm_token!);

    if (fcmTokens.length > 0) {
      const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
      if (fcmServerKey) {
        await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `key=${fcmServerKey}`,
          },
          body: JSON.stringify({
            registration_ids: fcmTokens,
            notification: { title, body },
            data: { type, order_id: order_id ?? "" },
          }),
        });
      }
    }
  }

  return new Response(JSON.stringify({ sent: profiles?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
