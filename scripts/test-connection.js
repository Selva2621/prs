const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ftlkchjjbffuqgklxdxm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your_anon_key_here';

async function testSupabaseConnection() {
  console.log('🌌 Testing Cosmic Love Database Connection...\n');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
    
    // Test basic connection
    console.log('🔌 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      console.log('📝 This might be expected if tables don\'t exist yet');
    } else {
      console.log('✅ Database connection successful!');
      console.log('📊 Connection test result:', data);
    }
    
    // Test table existence
    console.log('\n🔍 Checking table structure...');
    const tables = ['users', 'messages', 'photos', 'video_calls', 'proposals'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}': Available (${data ? data.length : 0} sample records)`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': Error - ${err.message}`);
      }
    }
    
    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth test failed:', authError.message);
    } else {
      console.log('✅ Authentication system available');
      console.log('👤 Current session:', authData.session ? 'Active' : 'No active session');
    }
    
    // Log configuration
    console.log('\n⚙️  Configuration Summary:');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    console.log('\n🎉 Connection test completed!');
    console.log('\n📚 Next Steps:');
    console.log('1. If tables are missing, run the SQL setup script in Supabase SQL Editor');
    console.log('2. Copy the content from backend/database/supabase-setup.sql');
    console.log('3. Paste and run it in: https://supabase.com/dashboard/project/[your-project]/sql');
    console.log('4. Update your .env file with the correct Supabase credentials');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Supabase project URL and API keys');
    console.log('2. Ensure your project is active and not paused');
    console.log('3. Verify network connectivity');
    console.log('4. Check if you have the correct permissions');
  }
}

// Log system information
function logSystemInfo() {
  console.log('💻 System Information:');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
}

// Run the test
if (require.main === module) {
  logSystemInfo();
  testSupabaseConnection().catch(console.error);
}

module.exports = { testSupabaseConnection };
