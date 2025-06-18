# 🔐 Cosmic Love Admin System Guide

## ✅ **Admin System Successfully Implemented!**

Your Cosmic Love application now has a comprehensive admin system with role-based access control, admin users, and management capabilities.

## 👥 **Admin User Roles**

### **🔴 SUPER_ADMIN**
- **Full system access**
- User management
- System configuration
- Database access
- Security management
- Analytics access
- Content moderation

### **🟡 ADMIN** 
- User management
- Content moderation
- Analytics access
- Support management

### **🟢 USER**
- Standard user access
- No admin privileges

## 🔑 **Default Admin Accounts**

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Super Admin** | `superadmin@cosmic.love` | `SuperCosmic@2024` | Full system access |
| **Admin** | `admin@cosmic.love` | `CosmicAdmin@2024` | General administration |
| **Support Admin** | `support@cosmic.love` | `CosmicAdmin@2024` | Customer support |
| **Content Moderator** | `moderator@cosmic.love` | `CosmicAdmin@2024` | Content moderation |

## 🚀 **Admin API Endpoints**

### **Authentication Required**
All admin endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- User must have ADMIN or SUPER_ADMIN role

### **Available Endpoints**

```bash
# Admin Dashboard
GET /admin/dashboard
# Returns: User stats, recent activity, admin info

# User Management
GET /admin/users
# Returns: List of all users with stats

GET /admin/users/:id
# Returns: Detailed user information

POST /admin/users/:id/deactivate
# Deactivates a user account

POST /admin/users/:id/activate
# Activates a user account

# Analytics
GET /admin/analytics
# Returns: Platform analytics and insights

# System Health (Super Admin Only)
GET /admin/system/health
# Returns: System health status

# Content Moderation
POST /admin/content/moderate
# Moderate content (photos, messages, etc.)
```

## 🔧 **Usage Examples**

### **1. Login as Admin**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@cosmic.love",
  "password": "CosmicAdmin@2024"
}

# Response includes role information:
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@cosmic.love",
    "full_name": "Administrator",
    "role": "ADMIN"
  }
}
```

### **2. Access Admin Dashboard**
```bash
GET /admin/dashboard
Authorization: Bearer <jwt_token>

# Response:
{
  "stats": {
    "totalUsers": 4,
    "activeUsers": 4,
    "inactiveUsers": 0,
    "totalMessages": 0,
    "totalPhotos": 0,
    "totalVideoCalls": 0,
    "totalProposals": 0
  },
  "recentUsers": [...],
  "adminInfo": {
    "name": "Administrator",
    "role": "ADMIN",
    "email": "admin@cosmic.love"
  }
}
```

### **3. Manage Users**
```bash
# Get all users
GET /admin/users
Authorization: Bearer <jwt_token>

# Deactivate a user
POST /admin/users/user_id_here/deactivate
Authorization: Bearer <jwt_token>
```

## 🛡️ **Security Features**

### **Role-Based Access Control (RBAC)**
- `@Roles()` decorator for endpoint protection
- `RolesGuard` validates user permissions
- Automatic role checking in JWT payload

### **Admin-Only Routes**
- All `/admin/*` routes require admin access
- Super Admin routes require SUPER_ADMIN role
- Proper error handling for unauthorized access

### **Password Security**
- Admin passwords are bcrypt hashed (12 rounds)
- Strong default passwords
- Password change recommended on first login

## 📊 **Admin Features**

### **Dashboard Analytics**
- Total user count
- Active/inactive users
- Message, photo, video call statistics
- Recent user registrations
- Admin information display

### **User Management**
- View all users with activity stats
- User detail views
- Account activation/deactivation
- User activity monitoring

### **Content Moderation**
- Content review capabilities
- Moderation action logging
- Safety enforcement tools

### **System Monitoring**
- System health checks (Super Admin)
- Database connectivity status
- Performance metrics
- Error monitoring

## 🔄 **Database Schema Changes**

### **Added to User Model:**
```prisma
model User {
  // ... existing fields
  role        UserRole  @default(USER)
  // ... rest of fields
}

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}
```

## 📝 **Available Scripts**

```bash
# Create admin users
npm run db:seed:admin

# Regular database operations
npm run db:push          # Push schema changes
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open database GUI
npm run start:dev        # Start development server
```

## 🔒 **Security Recommendations**

1. **Change Default Passwords**
   - Update admin passwords after first login
   - Use strong, unique passwords

2. **Enable 2FA** (Future Enhancement)
   - Implement two-factor authentication
   - Use authenticator apps

3. **Monitor Admin Activity**
   - Log all admin actions
   - Regular security audits
   - Review access logs

4. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Regular password rotation

## 🚀 **Testing the Admin System**

1. **Start the server:**
   ```bash
   npm run start:dev
   ```

2. **Login as admin:**
   ```bash
   POST http://localhost:3000/auth/login
   {
     "email": "admin@cosmic.love",
     "password": "CosmicAdmin@2024"
   }
   ```

3. **Access admin dashboard:**
   ```bash
   GET http://localhost:3000/admin/dashboard
   Authorization: Bearer <your_jwt_token>
   ```

## 🎯 **Next Steps**

1. **Frontend Integration**
   - Create admin dashboard UI
   - Implement role-based navigation
   - Add admin management forms

2. **Enhanced Features**
   - Email notifications for admin actions
   - Advanced analytics
   - Audit logging
   - Bulk user operations

3. **Security Enhancements**
   - Two-factor authentication
   - Session management
   - IP whitelisting
   - Rate limiting for admin endpoints

---

## 🎉 **Admin System Ready!**

Your Cosmic Love application now has a fully functional admin system with:
- ✅ 4 Admin users created
- ✅ Role-based access control
- ✅ Admin API endpoints
- ✅ Security guards and decorators
- ✅ Comprehensive user management
- ✅ Analytics and monitoring

The admin system is ready for use and can be extended with additional features as needed!
