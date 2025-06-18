# 🌌 Cosmic Love Database Setup Guide

This guide will help you set up the PostgreSQL database for the Cosmic Love romantic application using Supabase.

## 📋 Prerequisites

- Supabase account and project
- Access to Supabase SQL Editor
- Database connection details

## 🚀 Quick Setup

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: `https://supabase.com/dashboard/project/[your-project-id]/sql`
   - Replace `[your-project-id]` with your actual project ID

2. **Run the Setup Script**
   - Copy the entire content from `backend/database/supabase-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify Setup**
   - The script will create all necessary tables, indexes, and policies
   - Check the output for success messages
   - Verify that sample data was inserted

### Option 2: Using Direct Connection

1. **Update Environment Variables**
   ```bash
   # In backend/.env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ftlkchjjbffuqgklxdxm.supabase.co:5432/postgres
   DB_HOST=db.ftlkchjjbffuqgklxdxm.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=[YOUR-PASSWORD]
   DB_NAME=postgres
   ```

2. **Run Setup Script**
   ```bash
   cd backend
   npm run db:setup
   ```

## 📊 Database Schema

### Tables Created

1. **users** - User profiles and authentication data
2. **messages** - Chat messages between users
3. **photos** - Photo gallery with metadata
4. **video_calls** - Video call history and data
5. **proposals** - Love proposals with customization

### Key Features

- **UUID Primary Keys** - For better security and scalability
- **JSONB Columns** - For flexible metadata storage
- **Row Level Security (RLS)** - Automatic data protection
- **Indexes** - Optimized for common queries
- **Triggers** - Automatic timestamp updates
- **Enums** - Type safety for status fields

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Messages are only visible to sender and recipient
- Photos respect visibility settings
- Calls and proposals are private to participants

### Authentication Integration

The database is designed to work with Supabase Auth:
- Uses `auth.uid()` for user identification
- Automatic user session management
- Secure password hashing

## 📈 Sample Data

The setup script includes sample data for testing:

### Sample Users
- `lover1@cosmic.love` - "My Beloved"
- `lover2@cosmic.love` - "My Darling"

### Sample Messages
- Welcome messages between the sample users
- Different message types (text, emoji)

## 🔧 Configuration

### Environment Variables

Make sure to set these in your `.env` file:

```env
# Database
DATABASE_URL=your_supabase_connection_string
DB_HOST=your_supabase_host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=postgres

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

## 📝 Logging

The application includes comprehensive logging for:

- **User Activities** - Login, profile updates, etc.
- **Messages** - Send, receive, read status
- **Photo Uploads** - Upload events and metadata
- **Video Calls** - Call initiation, duration, quality
- **Proposals** - Creation, viewing, responses
- **Security Events** - Failed logins, suspicious activity
- **Performance Metrics** - Query times, response times
- **Database Operations** - CRUD operations with timing

### Log Levels

- `ERROR` - Application errors and exceptions
- `WARN` - Security events and warnings
- `INFO` - User activities and business events
- `DEBUG` - Database operations and detailed traces

## 🧪 Testing the Setup

### Verify Tables
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Check Sample Data
```sql
SELECT email, full_name FROM users;
SELECT content, type FROM messages LIMIT 5;
```

### Test RLS Policies
```sql
-- This should only return data for the authenticated user
SELECT * FROM users WHERE auth.uid() = id;
```

## 🔄 Database Migrations

For future schema changes:

1. Create migration files in `backend/database/migrations/`
2. Use TypeORM migrations for version control
3. Test migrations on staging before production

### Running Migrations
```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check your Supabase project URL
   - Verify database password
   - Ensure IP is whitelisted (if applicable)

2. **Permission Denied**
   - Check RLS policies
   - Verify user authentication
   - Ensure proper JWT configuration

3. **Table Not Found**
   - Re-run the setup script
   - Check for SQL syntax errors
   - Verify schema name (should be 'public')

### Getting Help

1. Check Supabase logs in the dashboard
2. Review application logs for detailed errors
3. Use the SQL Editor to test queries directly
4. Check the Supabase documentation for RLS and Auth

## 🎉 Success!

If everything is set up correctly, you should see:
- ✅ All tables created successfully
- ✅ Sample data inserted
- ✅ RLS policies active
- ✅ Indexes created for performance
- ✅ Triggers working for timestamps

Your Cosmic Love database is now ready for the romantic journey! 💖✨
