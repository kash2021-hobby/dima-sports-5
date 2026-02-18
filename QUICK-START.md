# 🚀 Quick Start Guide

Get your DHSA backend running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be v18+

# Check PostgreSQL (if installed locally)
psql --version

# Or check Docker (if using Docker)
docker --version
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

**Option A: Using Docker (Recommended)**
```bash
docker run --name dhsa-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=dhsa_db \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: Using Local PostgreSQL**
- Create database: `dhsa_db`
- User: `postgres`
- Password: `password` (or your password)

### 3. Create `.env` File

Copy `.env.example` to `.env` and update:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dhsa_db?schema=public"
JWT_SECRET="change-this-to-random-string"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"
```

**For local testing (OTP will be logged to console):**
- You can leave Firebase fields empty for now
- OTP codes will appear in console logs

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Create Uploads Directory

```bash
mkdir uploads
```

### 6. Start Server

```bash
npm run dev
```

You should see:
```
🚀 DHSA Sports Platform Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://localhost:3000
🔗 Health: http://localhost:3000/health
```

### 7. Test It!

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"success":true,"message":"DHSA Backend API is running","database":"connected"}
```

## 🎉 You're Ready!

Your backend is now running. Next steps:

1. **Test API endpoints** using Postman or cURL
2. **Connect your web frontend** to `http://localhost:3000`
3. **View database** using Prisma Studio: `npm run prisma:studio`

## Common Issues

### Database Connection Failed?
- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Verify DATABASE_URL in `.env`

### Port 3000 Already in Use?
- Change PORT in `.env` to another port (e.g., 3001)

### Prisma Errors?
- Run: `npx prisma generate`
- Or reset: `npm run prisma:reset` (⚠️ deletes all data)

## Need Help?

Check the full [README.md](./README.md) for detailed documentation.
