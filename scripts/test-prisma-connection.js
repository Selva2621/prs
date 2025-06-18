const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testPrismaConnection() {
  console.log('🌌 Testing Cosmic Love Prisma Connection...\n');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('🔌 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connected successfully!');
    
    // Test a simple query
    console.log('📊 Testing database query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Check if tables exist (this will fail if tables don't exist yet, which is expected)
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table exists with ${userCount} records`);
    } catch (error) {
      console.log('ℹ️  Tables not yet created (this is expected before migration)');
      console.log('   Run "npm run db:push" to create tables');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check your DATABASE_URL in .env file');
      console.log('2. Make sure you have replaced [YOUR-PASSWORD] with your actual Supabase password');
      console.log('3. Verify your internet connection');
      console.log('4. Check if the Supabase project is active');
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Prisma disconnected');
  }
}

testPrismaConnection();
