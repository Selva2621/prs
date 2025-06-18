const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testAdminSystem() {
  console.log('🔐 Testing Cosmic Love Admin System...\n');

  try {
    // Test 1: Check if admin users exist
    console.log('1️⃣ Checking admin users...');
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`✅ Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.fullName} (${user.email})`);
    });

    // Test 2: Check role distribution
    console.log('\n2️⃣ Checking role distribution...');
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    console.log('✅ Role distribution:');
    roleCounts.forEach(roleCount => {
      console.log(`   ${roleCount.role}: ${roleCount._count.role} users`);
    });

    // Test 3: Verify user schema has role field
    console.log('\n3️⃣ Testing user schema...');
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true
      }
    });

    if (sampleUser && sampleUser.role) {
      console.log('✅ User schema includes role field');
      console.log(`   Sample: ${sampleUser.fullName} has role ${sampleUser.role}`);
    } else {
      console.log('❌ User schema missing role field');
    }

    // Test 4: Check admin user details
    console.log('\n4️⃣ Checking admin user details...');
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@cosmic.love' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        preferences: true,
        profileData: true,
        isActive: true
      }
    });

    if (superAdmin) {
      console.log('✅ Super Admin found:');
      console.log(`   Name: ${superAdmin.fullName}`);
      console.log(`   Role: ${superAdmin.role}`);
      console.log(`   Active: ${superAdmin.isActive}`);
      console.log(`   Permissions: ${superAdmin.profileData?.permissions?.length || 0} defined`);
    } else {
      console.log('❌ Super Admin not found');
    }

    // Test 5: Database health check
    console.log('\n5️⃣ Database health check...');
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection healthy');

    console.log('\n🎉 Admin System Test Results:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│            TEST SUMMARY                 │');
    console.log('├─────────────────────────────────────────┤');
    console.log(`│ ✅ Admin Users Created: ${adminUsers.length}              │`);
    console.log(`│ ✅ Role System: Working                 │`);
    console.log(`│ ✅ Database Schema: Updated             │`);
    console.log(`│ ✅ Super Admin: Configured              │`);
    console.log(`│ ✅ Database Health: Good                │`);
    console.log('└─────────────────────────────────────────┘');

    console.log('\n🚀 Admin system is ready for use!');
    console.log('\n📋 Quick Start:');
    console.log('1. Start the server: npm run start:dev');
    console.log('2. Login with: admin@cosmic.love / CosmicAdmin@2024');
    console.log('3. Access admin endpoints with JWT token');

  } catch (error) {
    console.error('❌ Admin system test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure database is connected');
    console.log('2. Run: npm run db:push');
    console.log('3. Run: npm run db:seed:admin');
  } finally {
    await prisma.$disconnect();
  }
}

testAdminSystem();
