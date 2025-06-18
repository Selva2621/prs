const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseAPI() {
  console.log('🌌 Testing Cosmic Love Supabase API Connection (New Project)...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('📋 Configuration:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log('');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration in .env file');
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');

    // Test basic API connection
    console.log('🔌 Testing API connection...');
    const { data, error, count } = await supabase
      .from('users')
      .select('id, email, full_name', { count: 'exact' })
      .limit(5);

    if (error) {
      console.log('ℹ️  API Response Error:', error.message);

      if (error.message.includes('relation "users" does not exist') || error.message.includes('relation "public.users" does not exist')) {
        console.log('✅ API connection successful! (Tables just need to be created)');
        console.log('💡 Next step: Run the SQL setup in Supabase SQL Editor');
      } else if (error.message.includes('JWT')) {
        console.log('❌ Authentication error - check your SUPABASE_ANON_KEY');
      } else {
        console.log('❌ API connection failed');
      }
    } else {
      console.log('✅ API connection successful!');
      console.log('📊 Users found:', count);
      console.log('📋 Sample data:', data);

      // Test other tables
      console.log('\n🔍 Testing other tables...');
      const tables = ['messages', 'photos', 'video_calls', 'proposals'];

      for (const table of tables) {
        try {
          const { count: tableCount } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          console.log(`✅ ${table}: ${tableCount} records`);
        } catch (err) {
          console.log(`❌ ${table}: ${err.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);

    if (error.message.includes('fetch')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the SUPABASE_URL is correct');
      console.log('3. Make sure the Supabase project is active');
    }
  }
}

testSupabaseAPI();
