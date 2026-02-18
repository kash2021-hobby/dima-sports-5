# 🚀 How to Start the App & Test Login

## Step 1: Start the Backend Server

### 1.1 Install Dependencies (First Time Only)
```bash
npm install
```

### 1.2 Setup Database (First Time Only)
```bash
# Create database (if not exists)
psql -U postgres -c "CREATE DATABASE dhsa_db;"

# Run migrations
npx prisma migrate dev --name init
```

### 1.3 Create Uploads Folder (First Time Only)
```bash
mkdir uploads
```

### 1.4 Start Server
```bash
npm run dev
```

**Server will start at:** `http://localhost:3000`

You should see:
```
🚀 DHSA Sports Platform Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://localhost:3000
🔗 Health: http://localhost:3000/health
```

---

## Step 2: Create Admin Test Account

### 2.1 Run Admin Account Setup Script
```bash
node scripts/setup-test-accounts.js
```

This will create **admin test account only**:
- ✅ Admin account

### 2.2 Admin Test Credentials

After running the script, you'll get:

**ADMIN ACCOUNT:**
- Phone: `9999999999`
- MPIN: `1234`

**Note:** Coach and User accounts should be created through your frontend:
- **User**: Signup flow (phone + OTP + MPIN)
- **Coach**: Admin creates coach invite → Coach verifies OTP → Sets MPIN

---

## Step 3: Test Login

### 3.1 Test Admin Login (Frontend)

**API Endpoint:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "9999999999",
  "mpin": "1234"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "phone": "9999999999",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  }
}
```

**Use the `token` for authenticated requests:**
```
Authorization: Bearer <token>
```

---

### 3.2 Create User Account (Frontend)

**Flow:**
1. User signup → `POST /api/auth/signup` (phone)
2. Verify OTP → `POST /api/auth/verify-otp` (userId, otpCode)
3. Setup MPIN → `POST /api/auth/setup-mpin` (userId, mpin)
4. Login → `POST /api/auth/login` (phone, mpin)

**Example Signup:**
```
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "phone": "7777777777"
}
```

**Note:** OTP will appear in console logs (if Firebase not configured)

---

### 3.3 Create Coach Account (Frontend - Admin Panel)

**Flow:**
1. Admin creates coach invite → `POST /api/coach/invite` (requires admin token)
2. Coach verifies OTP → `POST /api/coach/verify-otp` (userId, otpCode)
3. Coach sets MPIN → `POST /api/coach/setup-mpin` (userId, mpin)
4. Admin activates coach → `POST /api/coach/:coachId/activate` (requires admin token)
5. Coach login → `POST /api/auth/login` (phone, mpin)

**Example Create Coach (as Admin):**
```
POST http://localhost:3000/api/coach/invite
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "phone": "8888888888",
  "email": "coach@example.com",
  "sport": "FOOTBALL",
  "coachingRole": "HEAD"
}
```

---

### 3.4 Test User Login (After Creating via Frontend)

**API Endpoint:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "7777777777",
  "mpin": "1234"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "phone": "7777777777",
      "role": "USER",
      "status": "ACTIVE"
    }
  }
}
```

**Use the `token` for authenticated requests:**
```
Authorization: Bearer <token>
```

---

**API Endpoint:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "7777777777",  // Phone you used during signup
  "mpin": "1234"          // MPIN you set
}
```

---

### 3.5 Test Coach Login (After Creating via Admin Panel)

**API Endpoint:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "8888888888",  // Phone used when admin created coach invite
  "mpin": "1234"          // MPIN coach set
}
```

---

## Frontend Integration

### Login Flow in Your React Web App

```typescript
// Example: Login function
async function login(phone: string, mpin: string) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, mpin }),
  });

  const data = await response.json();
  
  if (data.success) {
    // Store token
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('userRole', data.data.user.role);
    
    // Navigate based on role
    if (data.data.user.role === 'ADMIN') {
      // Navigate to Admin Dashboard
    } else if (data.data.user.role === 'COACH') {
      // Navigate to Coach Dashboard
    } else if (data.data.user.role === 'USER') {
      // Navigate to User Dashboard
    }
  }
}
```

### Using Token for Authenticated Requests

```typescript
// Example: Get user profile
async function getProfile() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return await response.json();
}
```

---

## 🧪 Quick Test with cURL

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"9999999999\",\"mpin\":\"1234\"}"
```

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test User Signup (Create User Account)
```bash
# 1. Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"7777777777\"}"

# 2. Check console for OTP code, then verify
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"<userId-from-signup>\",\"otpCode\":\"<otp-from-console>\"}"

# 3. Setup MPIN
curl -X POST http://localhost:3000/api/auth/setup-mpin \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"<userId>\",\"mpin\":\"1234\"}"

# 4. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"7777777777\",\"mpin\":\"1234\"}"
```

---

## 📋 Complete Test Flow

### 1. Start Server
```bash
npm run dev
```

### 2. Create Test Accounts
```bash
node scripts/setup-test-accounts.js
```

### 3. Test Login

**Option A: Admin Login (Using cURL)**
```bash
# Admin (pre-created)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"9999999999\",\"mpin\":\"1234\"}"
```

**Option B: Create User via Frontend**
- Use signup flow in your web frontend
- Follow: Signup → Verify OTP → Setup MPIN → Login

**Option C: Create Coach via Admin Panel**
- Login as admin first
- Use admin panel to create coach invite
- Coach verifies OTP → Sets MPIN → Admin activates → Coach can login

**Option B: Using Postman**
1. Create POST request to `http://localhost:3000/api/auth/login`
2. Body → raw → JSON
3. Enter phone and mpin
4. Send request

**Option C: Using Web Frontend**
- Add login form
- Call login API
- Store token
- Navigate based on role

---

## 🎯 Testing Checklist

- [ ] Server started (`npm run dev`)
- [ ] Health check works (`curl http://localhost:3000/health`)
- [ ] Admin account created (`node scripts/setup-test-accounts.js`)
- [ ] Admin login tested (phone: 9999999999, mpin: 1234)
- [ ] User account created via frontend (signup flow)
- [ ] User login tested (with created credentials)
- [ ] Coach account created via admin panel
- [ ] Coach login tested (with created credentials)
- [ ] Token received and stored
- [ ] Authenticated requests work (with token)

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env` file
- Test connection: `psql -U postgres -d dhsa_db`

### "User not found" on login
- Run test account setup: `node scripts/setup-test-accounts.js`
- Check phone number format (10 digits, starts with 6-9)

### "Invalid or expired token"
- Make sure you're using the token from login response
- Token format: `Authorization: Bearer <token>`

### "Access denied" error
- Check user role matches required role
- Verify token is valid
- Check user status is ACTIVE

---

## 📝 Notes

- **Admin test account uses MPIN: `1234`** (for easy testing)
- **Admin account has OTP skipped** (otpVerified: true) for quick access
- **User and Coach accounts** must be created through frontend flows
- **User accounts** require: Signup → OTP → MPIN setup
- **Coach accounts** require: Admin invite → OTP → MPIN → Admin activation
- **Change credentials** in production!

---

**Ready to test!** 🚀
