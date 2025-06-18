const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'db.ftlkchjjbffuqgklxdxm.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD || '[YOUR-PASSWORD]', // Replace with actual password
  ssl: {
    rejectUnauthorized: false
  }
};

async function setupDatabase() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Read the SQL initialization script
    const sqlScript = fs.readFileSync(path.join(__dirname, '../database/init.sql'), 'utf8');
    
    console.log('🚀 Running database initialization script...');
    await client.query(sqlScript);
    console.log('✅ Database tables created successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    console.log('📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if sample data was inserted
    console.log('👥 Checking sample users...');
    const usersResult = await client.query('SELECT id, email, full_name FROM users LIMIT 5');
    console.log('Sample users:');
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.full_name})`);
    });
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
