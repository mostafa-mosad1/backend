// api/actions.js
const supabase = require('../services/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const customerId = req.query.customerId || null;
  const productId = req.query.productId || null;

  const actions = [];

  try {
    // Rule A: viewed same product >= 2 times in last 24h -> show popup
    if (customerId && productId) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: views, error: viewErr } = await supabase
        .from('automation_events')
        .select('*')
        .eq('customer_id', customerId)
        .eq('event', 'page_view')
        .gte('created_at', since);

      if (!viewErr) {
        const count = (views || []).filter(v => v.payload && String(v.payload.product_id) === String(productId)).length;
        if (count >= 2) {
          actions.push({
            type: 'show_popup',
            message: 'مهتم بهذا المنتج؟ خصم 10% الآن — استخدم الكود: TAKE10'
          });
        }
      }
    }

    // Rule B: abandoned cart (simple): add_to_cart older than 15 min and no order_completed after it -> popup
    if (customerId) {
      // get most recent add_to_cart by this customer
      const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: adds } = await supabase
        .from('automation_events')
        .select('*')
        .eq('customer_id', customerId)
        .eq('event', 'add_to_cart')
        .gte('created_at', since24h)
        .order('created_at', { ascending: false })
        .limit(1);

      if (adds && adds.length) {
        const add = adds[0];
        const addedAt = new Date(add.created_at).getTime();
        const diff = Date.now() - addedAt;

        if (diff > 15 * 60 * 1000) { // older than 15 min
          // check if order_completed after that add
          const { data: orders } = await supabase
            .from('automation_events')
            .select('*')
            .eq('customer_id', customerId)
            .eq('event', 'order_completed')
            .gte('created_at', add.created_at)
            .limit(1);

          if (!orders || orders.length === 0) {
            actions.push({
              type: 'show_popup',
              message: 'نسيت شيء في السلة؟ اكمل الآن واستفد بخصم 10% — كود: CART10'
            });
            // optionally: actions.push({ type: 'send_whatsapp', phone: add.payload?.phone || null, message: '...' });
          }
        }
      }
    }

    return res.status(200).json(actions);
  } catch (err) {
    console.error('actions error', err);
    return res.status(500).json({ error: 'internal error' });
  }
};
