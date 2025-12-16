// Quick test to check if photo_sessions table exists
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return;
    }

    console.log('✅ Database connection successful');

    // Test if photo_sessions table exists
    const { data: tableTest, error: tableError } = await supabase
      .from('photo_sessions')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ photo_sessions table does not exist:', tableError);
      console.log('📝 You need to run the migration in supabase-sessions-migration.sql');
    } else {
      console.log('✅ photo_sessions table exists');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection();