// Edge Function: отправка уведомлений админам (email через Resend или webhook).
// Вызывается из бэкенда или по триггеру БД (pg_net или http extension).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL_ADMIN = Deno.env.get("NOTIFY_EMAIL_ADMIN");

interface NotifyPayload {
  subject: string;
  text: string;
  to?: string;
  event?: string;
  payload?: Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body: NotifyPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const to = body.to || NOTIFY_EMAIL_ADMIN;
  if (!to) {
    return new Response(JSON.stringify({ error: "No recipient" }), { status: 400 });
  }

  const subject = body.subject || "Замены KIBERone";
  const text = body.text || JSON.stringify(body.payload || {});

  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "replacements@kiberone.local",
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: 502 });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
