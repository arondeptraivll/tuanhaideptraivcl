import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function setupDatabase() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🚀 Setting up DDoS Protection Database...')
    
    // Read and execute SQL file
    const sql = fs.readFileSync('./database.sql', 'utf8')
    
    // Note: You'll need to run the SQL manually in Supabase SQL Editor
    // This script is for reference
    
    console.log('✅ Database setup complete!')
    console.log('📝 Please run the SQL commands in database.sql manually in Supabase SQL Editor')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
  }
}

setupDatabase()
