const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('📋 Checking existing users...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 You may need to run the seed script: npm run db:seed:admin');
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName || 'No name'} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
