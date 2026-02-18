# DHSA Sports Management Platform - Backend API

Phase 1: User → Player Registration & Approval System

## 🎯 Overview

This is the backend API for the Dima Hasao Sports Association (DHSA) web app (responsive for mobile). Phase 1 focuses on the complete user-to-player journey including:

- User authentication (MPIN-based)
- Player application submission
- Document upload & verification
- Coach management & trial evaluation
- Admin approval workflow
- Basic player profile

## 🛠️ Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + MPIN
- **OTP**: Firebase Auth (SMS)
- **File Storage**: Local filesystem (for testing)

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **PostgreSQL** (v14 or higher)
   - Option A: Docker (recommended)
     ```bash
     docker run --name dhsa-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=dhsa_db -p 5432:5432 -d postgres:15
     ```
   - Option B: [Download PostgreSQL](https://www.postgresql.org/download/)

3. **Firebase Project** (for SMS OTP)
   - Create project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication
   - Get service account credentials

## 🚀 Setup Instructions

### Step 1: Clone & Install

```bash
# Navigate to project directory
cd dhsa-backend

# Install dependencies
npm install
```

### Step 2: Database Setup

1. **Create `.env` file** (copy from `.env.example`):
   ```env
   DATABASE_URL="postgresql://postgres:1234@localhost:5432/dhsa_db?schema=public"
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   MPIN_MAX_ATTEMPTS=5
   MPIN_LOCKOUT_MINUTES=30
   OTP_EXPIRY_MINUTES=10
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY=your-firebase-private-key
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf
   ```

2. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

3. **Verify database** (optional):
   ```bash
   npm run prisma:studio
   # Opens at http://localhost:5555
   ```

### Step 3: Create Uploads Directory

```bash
mkdir uploads
```

### Step 4: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Server will start at: `http://localhost:3000`

### Step 5: Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "DHSA Backend API is running",
  "database": "connected",
  "timestamp": "2025-01-XX..."
}
```

## 📚 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/signup` | User signup (phone + OTP) | Public |
| POST | `/verify-otp` | Verify OTP code | Public |
| POST | `/setup-mpin` | Setup MPIN (4-6 digits) | Public |
| POST | `/coach-initial-login` | Coach initial login (phone + Coach ID) | Public |
| POST | `/login` | Login with phone + MPIN | Public |
| POST | `/resend-otp` | Resend OTP | Public |
| POST | `/update-mpin` | Update existing MPIN | Protected |
| POST | `/setup-mpin-authenticated` | Setup MPIN (for authenticated users) | Protected |
| GET | `/me` | Get current user (includes player/coach data) | Protected |

### Player Application (`/api/application`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/create` | Create/update application (DRAFT) | User |
| GET | `/my-application` | Get user's application | User |
| POST | `/submit` | Submit application | User |
| GET | `/status` | Get application status | User |

### Documents (`/api/documents`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/upload` | Upload document | User |
| GET | `/my-documents` | Get user's documents | User |
| GET | `/:id` | Get document by ID | User |

### Coach (`/api/coach`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/invite/:inviteToken` | Validate invite link & get coach info | Public |
| POST | `/verify-otp` | Verify coach OTP | Public |
| POST | `/setup-mpin` | Setup coach MPIN | Public |
| GET | `/profile` | Get coach profile | Coach |
| GET | `/my-players` | Get players I recommended & were approved | Coach |
| POST | `/invite` | Create coach invite (returns invite link) | Admin |
| POST | `/:coachId/activate` | Activate coach | Admin |
| GET | `/all` | Get all coaches | Admin |

### Trial (`/api/trial`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/my-trials` | Get trials (assigned + unassigned pending) | Coach |
| POST | `/:trialId/evaluate` | Evaluate trial (auto-assigns if unassigned) | Coach |
| POST | `/assign` | Manually assign trial to coach | Admin |
| GET | `/all` | Get all trials | Admin |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | Get all users | Admin |
| GET | `/users/:userId` | Get user dashboard | Admin |
| GET | `/applications` | Get all applications (filter by status) | Admin |
| GET | `/approvals/pending` | Get pending approvals (SUBMITTED/UNDER_REVIEW/HOLD) | Admin |
| POST | `/applications/:applicationId/approve` | Approve application (creates Player) | Admin |
| POST | `/applications/:applicationId/reject` | Reject application (with reason) | Admin |
| POST | `/applications/:applicationId/hold` | Hold application (optional reason) | Admin |
| GET | `/documents/pending` | Get pending documents | Admin |
| POST | `/documents/:documentId/verify` | Verify document | Admin |

### Player Profile (`/api/player`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/profile` | Get player profile | Player |
| PUT | `/profile/personal` | Update personal profile | Player |
| PUT | `/profile/medical` | Update medical info | Player |
| GET | `/documents` | Get player documents | Player |
| GET | `/eligibility` | Get eligibility status | Player |

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Token is obtained after successful login.

## 📝 Complete Phase 1 Flow: User → Player Journey

### 🎯 Overview

Phase 1 implements the complete journey from a new user registration to becoming an approved player with a Player ID. This includes user authentication, application submission, coach evaluation, and admin approval.

---

## 🔄 Complete User-to-Player Flow

### **Step 1: User Registration & Authentication**

#### 1.1 User Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "phone": "9876543210"
}
```
**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "data": { "userId": "clx..." }
}
```
**Status:** User created with `role: USER`, `status: ACTIVE`

#### 1.2 Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "userId": "clx...",
  "otpCode": "123456"
}
```
**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```
**Status:** `otpVerified: true`

#### 1.3 Setup MPIN
```http
POST /api/auth/setup-mpin
Content-Type: application/json

{
  "userId": "clx...",
  "mpin": "1234"
}
```
**Response:**
```json
{
  "success": true,
  "message": "MPIN set successfully"
}
```
**Status:** MPIN hashed and stored

#### 1.4 Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "9876543210",
  "mpin": "1234"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx...",
      "phone": "9876543210",
      "role": "USER",
      "status": "ACTIVE"
    }
  }
}
```

---

### **Step 2: Player Application Creation**

#### 2.1 Create/Update Application (DRAFT)
```http
POST /api/application/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "dateOfBirth": "2005-05-15",
  "gender": "MALE",
  "primaryPosition": "STRIKER",
  "dominantFoot": "RIGHT",
  "height": "175",
  "weight": "70",
  "city": "Haflong",
  "state": "Assam",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "9876543211",
  "emergencyContactRelation": "Mother"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Application saved as draft",
  "data": {
    "application": {
      "id": "clx...",
      "status": "DRAFT",
      "fullName": "John Doe",
      ...
    }
  }
}
```
**Status:** Application saved as `DRAFT` (can be edited multiple times)

#### 2.2 Upload Documents (Optional - can be done before or after submission)
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
documentType: "AADHAAR"
ownerType: "APPLICANT"
```
**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "document": {
      "id": "clx...",
      "documentType": "AADHAAR",
      "status": "PENDING",
      "url": "/uploads/..."
    }
  }
}
```

#### 2.3 Submit Application
```http
POST /api/application/submit
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "id": "clx...",
      "status": "SUBMITTED",
      "submittedAt": "2025-01-27T10:00:00Z"
    },
    "trial": {
      "id": "clx...",
      "status": "PENDING",
      "assignedCoachId": null
    }
  }
}
```
**Status Changes:**
- Application: `DRAFT` → `SUBMITTED`
- Trial: Created with `status: PENDING`, `assignedCoachId: null`

---

### **Step 3: Coach Management & Trial Evaluation**

#### 3.1 Admin: Create Coach Invite
```http
POST /api/coach/invite
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "phone": "8888888888",
  "email": "coach@example.com",
  "sport": "FOOTBALL",
  "coachingRole": "HEAD",
  "ageGroups": ["U15", "U18"],
  "yearsExperience": 5
}
```
**Response:**
```json
{
  "success": true,
  "message": "Coach invite sent. OTP sent to phone.",
  "data": {
    "coach": {
      "coachId": "COA-9F3A",
      "status": "INVITED",
      ...
    },
    "inviteLink": "http://localhost:5173/invite/abc123...",
    "inviteToken": "abc123..."
  }
}
```
**Status:** 
- User created with `role: COACH`, `status: INVITED`
- Coach created with `status: INVITED`, `inviteToken: "abc123..."`
- **Important:** Admin shares the `inviteLink` with the coach

#### 3.2 Coach: Access Invite Link
**Coach clicks invite link:** `http://localhost:5173/invite/abc123...`

**Frontend automatically:**
- Validates invite token via `GET /api/coach/invite/:inviteToken`
- Shows "Coach Login" tab (only visible via invite link)
- Pre-fills phone and Coach ID

#### 3.3 Coach: Initial Login (Phone + Coach ID)
```http
POST /api/auth/coach-initial-login
Content-Type: application/json

{
  "phone": "8888888888",
  "coachId": "COA-9F3A"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Please set your MPIN to complete login",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "requiresMPINSetup": true,
    "user": {
      "id": "clx...",
      "phone": "8888888888",
      "coachId": "COA-9F3A",
      "status": "INVITED"
    }
  }
}
```

#### 3.4 Coach: Setup MPIN
```http
POST /api/auth/setup-mpin
Content-Type: application/json

{
  "userId": "clx...",
  "mpin": "5678"
}
```
**Response:**
```json
{
  "success": true,
  "message": "MPIN set successfully"
}
```
**Status Changes:**
- User: `status: INVITED` → `VERIFIED`
- Coach: `status: INVITED` → `VERIFIED`
- **Invite token expires:** `inviteToken: null` (link can no longer be used)

#### 3.5 Admin: Activate Coach
```http
POST /api/coach/COA-9F3A/activate
Authorization: Bearer <admin-token>
```
**Response:**
```json
{
  "success": true,
  "message": "Coach activated successfully"
}
```
**Status Changes:**
- Coach: `status: VERIFIED` → `ACTIVE`
- User: `status: VERIFIED` → `ACTIVE`

#### 3.6 Coach: Login (After MPIN Setup)
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "8888888888",
  "mpin": "5678"
}
```
**Response:** Returns JWT token (same as regular login)

---

### **Step 4: Trial Evaluation**

#### 4.1 Coach: View Available Trials
```http
GET /api/trial/my-trials
Authorization: Bearer <coach-token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "trials": [
      {
        "id": "clx...",
        "status": "PENDING",
        "assignedCoachId": null,
        "application": {
          "fullName": "John Doe",
          "primaryPosition": "STRIKER",
          ...
        }
      }
    ]
  }
}
```
**Note:** Coaches can see:
- Trials assigned to them (`assignedCoachId: coach.id`)
- Unassigned pending trials (`assignedCoachId: null`, `status: PENDING`)

#### 4.2 Coach: Evaluate Trial
```http
POST /api/trial/:trialId/evaluate
Authorization: Bearer <coach-token>
Content-Type: application/json

{
  "outcome": "RECOMMENDED",
  "notes": "Excellent skills, good attitude"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Trial evaluated successfully",
  "data": {
    "trial": {
      "id": "clx...",
      "outcome": "RECOMMENDED",
      "status": "COMPLETED",
      "evaluatedAt": "2025-01-27T11:00:00Z",
      "assignedCoachId": "clx..." // Auto-assigned if was unassigned
    }
  }
}
```
**Status Changes:**
- Trial: `status: PENDING` → `COMPLETED`
- If unassigned: `assignedCoachId: null` → `coach.id` (auto-assigned)
- Application: `status: SUBMITTED` → `UNDER_REVIEW` (if `outcome: RECOMMENDED`)

**Possible Outcomes:**
- `RECOMMENDED` - Ready for admin approval
- `NOT_RECOMMENDED` - Application may be rejected
- `NEEDS_RETEST` - Requires another trial

---

### **Step 5: Admin Approval & Player Creation**

#### 5.1 Admin: View Applications
```http
GET /api/admin/applications?status=UNDER_REVIEW
Authorization: Bearer <admin-token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "clx...",
        "status": "UNDER_REVIEW",
        "fullName": "John Doe",
        "trial": {
          "outcome": "RECOMMENDED",
          "evaluatedAt": "2025-01-27T11:00:00Z",
          "assignedCoach": {
            "coachId": "COA-9F3A",
            "displayName": "Coach Name"
          }
        },
        "allDocumentsVerified": true
      }
    ]
  }
}
```

#### 5.2 Admin: Approve Application
```http
POST /api/admin/applications/:applicationId/approve
Authorization: Bearer <admin-token>
```
**Response:**
```json
{
  "success": true,
  "message": "Application approved. Player created successfully.",
  "data": {
    "player": {
      "id": "clx...",
      "playerId": "PLR-9F3A",
      "userId": "clx...",
      "displayName": "John Doe"
    },
    "application": {
      "id": "clx...",
      "status": "APPROVED",
      "reviewedAt": "2025-01-27T12:00:00Z"
    }
  }
}
```
**Status Changes (Atomic Transaction):**
1. Application: `status: UNDER_REVIEW` → `APPROVED`
2. User: `role: USER` → `PLAYER`
3. Player: Created with unique `playerId` (e.g., `PLR-9F3A`)

#### 5.3 Player: View Profile
```http
GET /api/auth/me
Authorization: Bearer <player-token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "phone": "9876543210",
      "role": "PLAYER",
      "status": "ACTIVE",
      "player": {
        "playerId": "PLR-9F3A",
        "displayName": "John Doe",
        "footballStatus": "ACTIVE"
      },
      "application": {
        "status": "APPROVED",
        "trial": {
          "outcome": "RECOMMENDED",
          "assignedCoach": {
            "coachId": "COA-9F3A",
            "displayName": "Coach Name"
          }
        }
      }
    }
  }
}
```

#### 5.4 Coach: View My Players
```http
GET /api/coach/my-players
Authorization: Bearer <coach-token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "playerId": "PLR-9F3A",
        "displayName": "John Doe",
        "primaryPosition": "STRIKER",
        "footballStatus": "ACTIVE",
        "application": {
          "fullName": "John Doe",
          "status": "APPROVED",
          "reviewedAt": "2025-01-27T12:00:00Z"
        },
        "trial": {
          "outcome": "RECOMMENDED",
          "evaluatedAt": "2025-01-27T11:00:00Z",
          "notes": "Excellent skills"
        },
        "user": {
          "phone": "9876543210",
          "email": null
        }
      }
    ]
  }
}
```
**Note:** Only shows players whose trials the coach evaluated with `RECOMMENDED` outcome and were `APPROVED` by admin.

---

## 📊 Status Flow Diagram

### **Application Status Flow:**
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
                          ↓
                      REJECTED
                          ↓
                        HOLD
```

### **Trial Status Flow:**
```
PENDING → COMPLETED
```

### **User Role Flow:**
```
USER → PLAYER (after admin approval)
```

### **Coach Status Flow:**
```
INVITED → VERIFIED → ACTIVE
```

### **Coach Invite Link Flow:**
```
Invite Created → Link Shared → Coach Clicks Link → MPIN Set → Link Expires
```

---

## 🔐 Security Features

### **Coach Invite Link Security:**
- ✅ Invite link only visible via unique token
- ✅ Link expires automatically after MPIN is set
- ✅ Link invalid if MPIN already exists
- ✅ Regular users never see "Coach Login" tab
- ✅ Token validation on backend

### **Authentication Security:**
- ✅ MPIN hashing (bcrypt)
- ✅ MPIN rate limiting (5 attempts)
- ✅ MPIN lockout (30 minutes)
- ✅ JWT token expiration
- ✅ Role-based access control (RBAC)

---

## 🎯 Key Features Summary

### ✅ **User Features:**
- Phone-based signup with OTP
- MPIN authentication
- Draft application (save & edit)
- Document upload
- Application submission
- View application status
- Player profile (after approval)

### ✅ **Coach Features:**
- Invite link access (unique token)
- Initial login (Phone + Coach ID)
- MPIN setup
- View available trials (assigned + unassigned)
- Evaluate trials
- Auto-assign on evaluation
- View approved players

### ✅ **Admin Features:**
- Create coach invites (with invite link)
- Activate coaches
- View all applications
- Filter by status
- Approve/Reject/Hold applications
- View risk indicators
- Document verification

---

## 📝 Important Notes

1. **Coach Invite Links:**
   - Admin creates invite → receives `inviteLink`
   - Coach must use invite link to see "Coach Login" tab
   - Link expires after MPIN is set
   - After MPIN setup, coach uses regular login

2. **Trial Assignment:**
   - Trials are auto-visible to all active coaches when `status: PENDING`
   - Coaches can evaluate unassigned trials (auto-assigns on evaluation)
   - Admin can manually assign trials if needed

3. **Application Approval:**
   - Requires: `trial.outcome: RECOMMENDED` AND `allDocumentsVerified: true`
   - Creates Player with unique `playerId`
   - Updates User role to `PLAYER`
   - Atomic transaction (all or nothing)

4. **Player Creation:**
   - Only happens after admin approval
   - Player ID format: `PLR-XXXX` (4 random uppercase chars)
   - Player can see assigned coach and trial details
   - Coach can see players they recommended

---

## 🧪 Testing the Complete Flow

### **Test User Journey:**
1. Signup → Verify OTP → Setup MPIN → Login
2. Create application (DRAFT)
3. Upload documents
4. Submit application
5. Wait for coach evaluation
6. Wait for admin approval
7. Check player profile

### **Test Coach Journey:**
1. Admin creates coach invite (get invite link)
2. Coach clicks invite link
3. Coach logs in with Phone + Coach ID
4. Coach sets MPIN
5. Admin activates coach
6. Coach views trials
7. Coach evaluates trial
8. Coach views approved players

### **Test Admin Journey:**
1. Create coach invite
2. View applications
3. Approve application
4. Verify player created

## 🧪 Testing

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "mpin": "1234"}'
```

### Using Postman

1. Import collection (create from endpoints above)
2. Set base URL: `http://localhost:3000`
3. For protected routes, add token to Authorization header

## 📁 Project Structure

```
dhsa-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client
│   │   └── env.ts             # Environment config
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── application.controller.ts
│   │   ├── document.controller.ts
│   │   ├── coach.controller.ts
│   │   ├── trial.controller.ts
│   │   ├── admin.controller.ts
│   │   └── player.controller.ts
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── application.routes.ts
│   │   ├── document.routes.ts
│   │   ├── coach.routes.ts
│   │   ├── trial.routes.ts
│   │   ├── admin.routes.ts
│   │   └── player.routes.ts
│   ├── services/              # Business logic
│   │   ├── otp.service.ts
│   │   ├── mpin.service.ts
│   │   ├── jwt.service.ts
│   │   └── notification.service.ts
│   ├── middleware/
│   │   └── auth.middleware.ts # Auth & role checks
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── validators.ts
│   └── server.ts              # Main server file
├── uploads/                   # Document uploads
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | JWT signing secret | Required |
| `MPIN_MAX_ATTEMPTS` | Max failed MPIN attempts | 5 |
| `MPIN_LOCKOUT_MINUTES` | MPIN lockout duration | 30 |
| `OTP_EXPIRY_MINUTES` | OTP expiration time | 10 |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Required |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Required |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Required |
| `UPLOAD_DIR` | Upload directory | ./uploads |
| `MAX_FILE_SIZE` | Max file size (bytes) | 5242880 (5MB) |
| `ALLOWED_FILE_TYPES` | Allowed file types | jpg,jpeg,png,pdf |

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps  # If using Docker
# or
pg_isready  # If installed locally

# Verify DATABASE_URL in .env
```

### Port Already in Use
```bash
# Change PORT in .env or kill process
lsof -ti:3000 | xargs kill
```

### Prisma Errors
```bash
# Reset database (WARNING: deletes all data)
npm run prisma:reset

# Regenerate Prisma client
npm run prisma:generate
```

## 📦 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Use production PostgreSQL database
- [ ] Configure Firebase production credentials
- [ ] Set up file storage (AWS S3 / Firebase Storage)
- [ ] Enable HTTPS
- [ ] Set up monitoring & logging
- [ ] Configure CORS for production domain

## 📄 License

ISC

## 👥 Support

For issues or questions, contact the development team.

---

**Version**: 1.0.0  
**Phase**: 1 (User → Player) - ✅ **COMPLETE**  
**Last Updated**: January 27, 2025

---

## 🎉 Phase 1 Complete!

All features for Phase 1 have been successfully implemented:

✅ User authentication (Phone + OTP + MPIN)  
✅ Player application submission  
✅ Document upload & verification  
✅ Coach management with invite links  
✅ Trial evaluation workflow  
✅ Admin approval & player creation  
✅ Complete user-to-player journey  

**Next Phase:** Team management, tournaments, matches, and advanced features.
