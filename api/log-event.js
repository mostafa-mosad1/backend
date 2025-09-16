// api/log-event.js
const supabase = require('../services/supabase');

module.exports = async (req, res) => {
  // CORS (مؤقت للمراحل التجريبية)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { event, storeId, customerId, payload } = req.body || {};

  if (!event) return res.status(400).json({ error: 'event is required' });

  try {
    const { data, error } = await supabase
      .from('automation_events')
      .insert([{
        event,
        store_id: storeId || null,
        customer_id: customerId || null,
        payload: payload || {}
      }])
      .select();

    if (error) {
      console.error('Supabase insert error', error);
      return res.status(500).json({ error });
    }

    return res.status(200).json({ success: true, inserted: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal error' });
  }
};
