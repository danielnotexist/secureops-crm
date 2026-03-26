import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vksjrrtspvybypyabnyh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrc2pycnRzcHZ5YnlweWFibnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTE3NDAsImV4cCI6MjA4OTg2Nzc0MH0.U11T0HMubKHAt1t6Oy0ZrUPgn6wXinJTcydPOW6aiRY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
