require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// جلب القيم من env
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const { data, error } = await supabase
    .from('automation_events')
    .insert([
      {
        customer_id: 'user-1',
        store_id: 'store-123',
        event: 'cart_abandoned',
        payload: { product_id: '456', price: 120 }
      }
    ])
    .select()

  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Event logged:', data)
  }
}

testInsert()
