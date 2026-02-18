# Create .env File - Quick Guide

## ✅ Generated JWT Secret

Your secure JWT secret has been generated:
```
9642659e3b5c002957a8f38230b7ad7110c9d54a11c38db5dec988e6209ec1e4
```

## 📝 Steps to Create .env File

### Step 1: Copy Template
Copy `env.template` to `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item env.template .env
```

**Windows (CMD):**
```cmd
copy env.template .env
```

**Mac/Linux:**
```bash
cp env.template .env
```

### Step 2: Update PostgreSQL Credentials

Open `.env` file and update the `DATABASE_URL` line with your PostgreSQL credentials:

**Current (default):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dhsa_db?schema=public"
```

**Update with your credentials:**
```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/dhsa_db?schema=public"
```

**Example:**
- Username: `myuser`
- Password: `mypass123`
- Database: `dhsa_db`
- Host: `localhost`
- Port: `5432`

```env
DATABASE_URL="postgresql://myuser:mypass123@localhost:5432/dhsa_db?schema=public"
```

### Step 3: Verify .env File

Your `.env` file should have:
- ✅ `DATABASE_URL` with your PostgreSQL credentials
- ✅ `JWT_SECRET` (already set)
- ✅ Other optional settings (can leave as-is)

## 🎯 Quick Checklist

- [ ] `.env` file created (copied from `env.template`)
- [ ] `DATABASE_URL` updated with your PostgreSQL username
- [ ] `DATABASE_URL` updated with your PostgreSQL password
- [ ] `DATABASE_URL` updated with your database name (if different from `dhsa_db`)
- [ ] `JWT_SECRET` is set (already done ✅)

## 📋 PostgreSQL Connection String Format

```
postgresql://username:password@host:port/database?schema=public
```

**Components:**
- `username` - Your PostgreSQL username (usually `postgres`)
- `password` - Your PostgreSQL password
- `host` - Usually `localhost` for local PostgreSQL
- `port` - Usually `5432` (default PostgreSQL port)
- `database` - Database name (we'll create `dhsa_db`)

## 🔍 How to Find Your PostgreSQL Credentials

### If you installed PostgreSQL locally:

1. **Username**: Usually `postgres` (default)
2. **Password**: The password you set during installation
3. **Host**: `localhost`
4. **Port**: `5432` (default)

### If you forgot your password:

**Windows:**
- Check PostgreSQL installation directory
- Or reset via pgAdmin

**Mac (Homebrew):**
```bash
# Reset password
psql postgres
ALTER USER postgres WITH PASSWORD 'newpassword';
```

**Linux:**
```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'newpassword';
```

## ✅ After Creating .env

Once `.env` is created and `DATABASE_URL` is updated:

1. **Create database** (if not exists):
   ```bash
   psql -U postgres -c "CREATE DATABASE dhsa_db;"
   ```

2. **Run migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Start server**:
   ```bash
   npm run dev
   ```

## 🆘 Troubleshooting

### "Connection refused" error
- Check PostgreSQL is running: `pg_isready` or check services
- Verify host/port in `DATABASE_URL`

### "Authentication failed" error
- Check username/password in `DATABASE_URL`
- Verify PostgreSQL user exists

### "Database does not exist" error
- Create database: `psql -U postgres -c "CREATE DATABASE dhsa_db;"`
- Or update `DATABASE_URL` with existing database name

---

**Next Step**: Update `DATABASE_URL` in `.env` file with your PostgreSQL credentials!
