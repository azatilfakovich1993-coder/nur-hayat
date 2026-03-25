import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://bwnzfyxcgzscghowpqfn.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bnpmeXhjZ3pzY2dob3dwcWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzMxMDAsImV4cCI6MjA4OTkwOTEwMH0.0M-eXXyaqHZnfOLT0T04T3hCWUE_GuZ-HXE069VDodw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
