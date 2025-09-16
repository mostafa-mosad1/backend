// services/supabase.js
require('dotenv').config(); // لو شغّال محليًا
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_KEY in env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
