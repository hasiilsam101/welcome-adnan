import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const tables = ["products", "orders", "brands", "categories", "coupons"];
    const results: Record<string, number> = {};

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .not("deleted_at", "is", null)
        .lt("deleted_at", thirtyDaysAgo)
        .select("id");

      if (error) {
        console.error(`Error cleaning ${table}:`, error.message);
        results[table] = -1;
      } else {
        const count = data?.length || 0;
        results[table] = count;

        // Log each deletion
        if (count > 0) {
          const logs = (data || []).map((row: any) => ({
            entity_type: table.replace(/s$/, ""), // products -> product
            entity_id: row.id,
            entity_name: "Auto-cleaned",
            action: "permanently_deleted",
            performed_by_email: "system",
          }));
          await supabase.from("trash_log").insert(logs);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, cleaned: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
