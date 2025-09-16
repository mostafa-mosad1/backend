// api/actions.js
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const customerId = req.query.customerId || req.body?.customerId || null;
  const productId = req.query.productId || null;

  // مثال: لو نفس العميل شاهد المنتج >=2 خلال آخر 24 ساعة → رجّع show_popup
  if (customerId && productId) {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count, error } = await supabase
      .from("automation_events")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("event", "page_view")
      .filter("payload->>product_id", "eq", String(productId))
      .gte("created_at", since);

    if (!error && count >= 2) {
      return res.status(200).json([
        { type: "show_popup", message: "رجّعنا نعلّم إنك مهتم! خصم 10% كود: TAKE10" }
      ]);
    }
  }

  // مثال abandoned cart بسيط: اذا في add_to_cart ولم يتم order_completed خلال 15 دقيقة
  if (customerId) {
    const fifteenAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    // تحقق من وجود add_to_cart بعد 15 دقيقة ولم يوجد order_completed بعده
    const { data: adds } = await supabase
      .from("automation_events")
      .select("*")
      .eq("customer_id", customerId)
      .eq("event", "add_to_cart")
      .gte("created_at", fifteenAgo)
      .limit(1);
    if (adds && adds.length) {
      const { data: orders } = await supabase
        .from("automation_events")
        .select("*")
        .eq("customer_id", customerId)
        .eq("event", "order_completed")
        .gte("created_at", adds[0].created_at);
      if (!orders || orders.length === 0) {
        // رجّع عمل نابع (مثال: send_whatsapp) — التنفيذ الحقيقي يتم بخدمة منفصلة
        return res.status(200).json([
          { type: "send_whatsapp", phone: adds[0].payload.phone || null, message: "نسيت شيء في السلة! استخدم TAKE10" }
        ]);
      }
    }
  }

  return res.status(200).json([]); // لا توجد actions
}
