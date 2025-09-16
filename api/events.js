// api/events.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    const evt = req.body;
    // ادرج صف في جدول automation_events
    const { error } = await supabase.from("automation_events").insert([{
      customer_id: evt.customerId || null,
      store_id: evt.storeId || null,
      event: evt.event,
      payload: evt.payload || {},
      created_at: new Date().toISOString()
    }]);
    if (error) return res.status(500).json({ error });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("automation_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return res.status(500).json({ error });
    return res.status(200).json({ data });
  }

  res.status(405).end();
}
