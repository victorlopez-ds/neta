// =============================================================================
// Edge Function: run-recurring
// -----------------------------------------------------------------------------
// Optional HTTP trigger for the recurring/DCA engine. The actual logic lives in
// the SQL function `process_recurring_movements()` so there is a single source
// of truth; this function just invokes it with the service-role key (which
// bypasses RLS so it can process every user).
//
// The recommended scheduler is pg_cron calling the SQL function directly (see
// migrations/20260708120300_cron.sql). Use this function when you want to drive
// the engine over HTTP instead — e.g. a manual "run now" button, an external
// scheduler, or a client-boot catch-up call.
//
// Deploy:  supabase functions deploy run-recurring
// Invoke:  curl -X POST "$SUPABASE_URL/functions/v1/run-recurring" \
//               -H "Authorization: Bearer $SERVICE_ROLE_KEY"
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.rpc("process_recurring_movements");

  if (error) {
    console.error("process_recurring_movements failed:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, inserted: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
