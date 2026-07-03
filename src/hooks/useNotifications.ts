import { useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useNotifications() {
  const sendToUser = useCallback(async (
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>
  ) => {
    const { error } = await supabase.functions.invoke("send-push", {
      body: { user_ids: [userId], title, body, type, data: data ?? {} },
    });
    if (error) throw new Error(error.message);
  }, []);

  const broadcast = useCallback(async (
    role: "driver" | "supplier" | "recyclingCo",
    title: string,
    body: string,
    type = "system"
  ) => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("auth_id")
      .eq("role", role)
      .not("fcm_token", "is", null);
    if (error) throw new Error(error.message);
    if (!profiles || profiles.length === 0) return;

    const { error: fnError } = await supabase.functions.invoke("send-push", {
      body: {
        user_ids: profiles.map((u: { auth_id: string }) => u.auth_id),
        title,
        body,
        type,
      },
    });
    if (fnError) throw new Error(fnError.message);
  }, []);

  return { sendToUser, broadcast };
}
