// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!url) throw new Error('Missing VITE_SUPABASE_URL in .env')
if (!anonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY in .env')

console.log('[supabaseClient] using', { urlStartsWith: url?.slice(0, 30) })

const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export default supabase
export { supabase }