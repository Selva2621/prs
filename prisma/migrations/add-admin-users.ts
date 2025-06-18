import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addAdminUsers() {
  console.log('🔐 Adding Admin Users to Cosmic Love Database...\n');

  try {
    // Hash password for admin users
    const adminPassword = await bcrypt.hash('CosmicAdmin@2024', 12);
    const superAdminPassword = await bcrypt.hash('SuperCosmic@2024', 12);

    // Create Super Admin
    console.log('👑 Creating Super Admin...');
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@cosmic.love' },
      update: {
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
      create: {
        email: 'superadmin@cosmic.love',
        password: superAdminPassword,
        fullName: 'Super Administrator',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        phone: '+1-800-COSMIC',
        preferences: {
          theme: 'admin_dark',
          notifications: true,
          language: 'en',
          admin_dashboard: true,
          system_alerts: true
        },
        profileData: {
          bio: 'System Administrator - Keeping love connections secure',
          role_description: 'Full system access and management',
          department: 'System Administration',
          permissions: [
            'user_management',
            'system_configuration',
            'database_access',
            'security_management',
            'analytics_access',
            'content_moderation'
          ]
        }
      }
    });

    console.log(`✅ Super Admin created: ${superAdmin.fullName} (${superAdmin.email})`);

    // Create Admin
    console.log('👨‍💼 Creating Admin...');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cosmic.love' },
      update: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        email: 'admin@cosmic.love',
        password: adminPassword,
        fullName: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '+1-800-ADMIN',
        preferences: {
          theme: 'admin_light',
          notifications: true,
          language: 'en',
          admin_dashboard: true,
          system_alerts: false
        },
        profileData: {
          bio: 'Platform Administrator - Ensuring smooth love connections',
          role_description: 'User management and content moderation',
          department: 'Platform Administration',
          permissions: [
            'user_management',
            'content_moderation',
            'analytics_access',
            'support_management'
          ]
        }
      }
    });

    console.log(`✅ Admin created: ${admin.fullName} (${admin.email})`);

    // Create Support Admin
    console.log('🎧 Creating Support Admin...');
    const supportAdmin = await prisma.user.upsert({
      where: { email: 'support@cosmic.love' },
      update: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        email: 'support@cosmic.love',
        password: adminPassword,
        fullName: 'Support Administrator',
        role: UserRole.ADMIN,
        isActive: true,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        phone: '+1-800-SUPPORT',
        preferences: {
          theme: 'support_theme',
          notifications: true,
          language: 'en',
          admin_dashboard: true,
          system_alerts: true
        },
        profileData: {
          bio: 'Customer Support Lead - Helping love stories flourish',
          role_description: 'Customer support and user assistance',
          department: 'Customer Support',
          permissions: [
            'user_support',
            'content_moderation',
            'ticket_management',
            'user_communication'
          ]
        }
      }
    });

    console.log(`✅ Support Admin created: ${supportAdmin.fullName} (${supportAdmin.email})`);

    // Create Content Moderator
    console.log('🛡️ Creating Content Moderator...');
    const moderator = await prisma.user.upsert({
      where: { email: 'moderator@cosmic.love' },
      update: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        email: 'moderator@cosmic.love',
        password: adminPassword,
        fullName: 'Content Moderator',
        role: UserRole.ADMIN,
        isActive: true,
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        phone: '+1-800-MODERATE',
        preferences: {
          theme: 'moderator_theme',
          notifications: true,
          language: 'en',
          admin_dashboard: true,
          system_alerts: true
        },
        profileData: {
          bio: 'Content Moderator - Keeping the platform safe and loving',
          role_description: 'Content review and community safety',
          department: 'Content Moderation',
          permissions: [
            'content_moderation',
            'user_reports',
            'safety_enforcement',
            'community_guidelines'
          ]
        }
      }
    });

    console.log(`✅ Content Moderator created: ${moderator.fullName} (${moderator.email})`);

    // Display summary
    console.log('\n📊 Admin Users Summary:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                     ADMIN CREDENTIALS                      │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ Super Admin:                                                │');
    console.log('│   Email: superadmin@cosmic.love                            │');
    console.log('│   Password: SuperCosmic@2024                               │');
    console.log('│                                                             │');
    console.log('│ Admin:                                                      │');
    console.log('│   Email: admin@cosmic.love                                 │');
    console.log('│   Password: CosmicAdmin@2024                               │');
    console.log('│                                                             │');
    console.log('│ Support Admin:                                              │');
    console.log('│   Email: support@cosmic.love                               │');
    console.log('│   Password: CosmicAdmin@2024                               │');
    console.log('│                                                             │');
    console.log('│ Content Moderator:                                          │');
    console.log('│   Email: moderator@cosmic.love                             │');
    console.log('│   Password: CosmicAdmin@2024                               │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    console.log('\n🔒 Security Notes:');
    console.log('• Change default passwords after first login');
    console.log('• Enable 2FA for admin accounts');
    console.log('• Review admin permissions regularly');
    console.log('• Monitor admin activity logs');

    console.log('\n🎉 Admin users migration completed successfully!');

  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  addAdminUsers()
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default addAdminUsers;
