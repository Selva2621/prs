import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌌 Starting Cosmic Love Database Seeding...\n');

  // Create sample users
  console.log('👥 Creating sample users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'lover1@cosmic.love' },
    update: {},
    create: {
      email: 'lover1@cosmic.love',
      password: hashedPassword,
      fullName: 'My Beloved',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      phone: '+1234567890',
      birthday: new Date('1995-06-15'),
      isActive: true,
      preferences: {
        theme: 'cosmic',
        notifications: true,
        language: 'en'
      },
      profileData: {
        bio: 'Lost in the stars, found in your eyes ✨',
        relationship_status: 'In a cosmic love story',
        anniversary_date: '2023-02-14',
        favorite_memories: [
          'Our first stargazing date',
          'Dancing under the moonlight',
          'The day we said I love you'
        ]
      }
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'lover2@cosmic.love' },
    update: {},
    create: {
      email: 'lover2@cosmic.love',
      password: hashedPassword,
      fullName: 'My Darling',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      phone: '+1234567891',
      birthday: new Date('1993-12-22'),
      isActive: true,
      preferences: {
        theme: 'romantic',
        notifications: true,
        language: 'en'
      },
      profileData: {
        bio: 'Your love is my universe 🌟',
        relationship_status: 'Madly in love',
        anniversary_date: '2023-02-14',
        favorite_memories: [
          'Our first kiss',
          'The proposal under the stars',
          'Every moment with you'
        ]
      }
    }
  });

  console.log(`✅ Created users: ${user1.fullName} and ${user2.fullName}`);

  // Create sample messages
  console.log('💌 Creating sample messages...');
  
  const message1 = await prisma.message.create({
    data: {
      content: 'Good morning, my love! ☀️ Hope your day is as beautiful as you are! 💕',
      type: 'TEXT',
      status: 'READ',
      senderId: user1.id,
      recipientId: user2.id,
      readAt: new Date(),
      deliveredAt: new Date(Date.now() - 5000),
      metadata: {
        reactions: {
          [user2.id]: '❤️'
        }
      }
    }
  });

  const message2 = await prisma.message.create({
    data: {
      content: 'I love you to the moon and back! 🌙✨',
      type: 'TEXT',
      status: 'READ',
      senderId: user2.id,
      recipientId: user1.id,
      readAt: new Date(),
      deliveredAt: new Date(Date.now() - 3000),
      metadata: {
        reactions: {
          [user1.id]: '🥰'
        }
      }
    }
  });

  console.log(`✅ Created ${2} sample messages`);

  // Create sample photos
  console.log('📸 Creating sample photos...');
  
  const photo1 = await prisma.photo.create({
    data: {
      title: 'Our First Date',
      description: 'The night we fell in love under the stars',
      fileUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=200',
      fileSize: 1024000,
      fileType: 'image/jpeg',
      width: 800,
      height: 600,
      category: 'COUPLE',
      uploadedById: user1.id,
      takenAt: new Date('2023-02-14'),
      isFavorite: true,
      metadata: {
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Central Park, New York'
        },
        tags: ['love', 'first-date', 'stars', 'romantic'],
        emotions: ['happy', 'excited', 'in-love'],
        color_palette: ['#1a1a2e', '#16213e', '#0f3460']
      }
    }
  });

  console.log(`✅ Created sample photo: ${photo1.title}`);

  // Create sample video call
  console.log('📹 Creating sample video call...');
  
  const videoCall = await prisma.videoCall.create({
    data: {
      status: 'ENDED',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      endedAt: new Date(Date.now() - 1800000), // 30 minutes ago
      duration: 1800, // 30 minutes in seconds
      quality: 'HD',
      callerId: user1.id,
      calleeId: user2.id,
      metadata: {
        connection_quality: 'excellent',
        call_type: 'romantic_chat',
        special_effects_used: ['heart_filter', 'star_background']
      }
    }
  });

  console.log(`✅ Created sample video call (${videoCall.duration}s duration)`);

  // Create sample proposal
  console.log('💍 Creating sample proposal...');
  
  const proposal = await prisma.proposal.create({
    data: {
      title: 'Will You Marry Me?',
      message: 'My dearest love, you are my universe, my everything. Will you make me the happiest person alive and marry me? 💍✨',
      type: 'MARRIAGE',
      status: 'ACCEPTED',
      proposerId: user1.id,
      sentAt: new Date(Date.now() - 86400000), // 1 day ago
      viewedAt: new Date(Date.now() - 86400000 + 300000), // 5 minutes after sent
      respondedAt: new Date(Date.now() - 86400000 + 600000), // 10 minutes after sent
      response: 'YES! A thousand times YES! I love you so much! 💕',
      isAccepted: true,
      customization: {
        background_theme: 'cosmic_galaxy',
        music_url: 'https://example.com/romantic-music.mp3',
        animation_style: 'floating_hearts',
        color_scheme: ['#ff6b9d', '#c44569', '#f8b500'],
        font_style: 'elegant_script',
        special_effects: ['shooting_stars', 'heart_rain'],
        ring_style: 'diamond_solitaire',
        universe_theme: {
          stars_count: 1000,
          galaxy_style: 'spiral',
          cosmic_colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483']
        }
      }
    }
  });

  console.log(`✅ Created sample proposal: ${proposal.title}`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`👥 Users: 2`);
  console.log(`💌 Messages: 2`);
  console.log(`📸 Photos: 1`);
  console.log(`📹 Video Calls: 1`);
  console.log(`💍 Proposals: 1`);
  console.log('\n✨ Your Cosmic Love database is ready! ✨');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
