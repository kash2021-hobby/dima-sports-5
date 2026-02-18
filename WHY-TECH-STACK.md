# Why Node.js + PostgreSQL + Prisma for DHSA Sports App

## 📋 Overview

This document explains **why** we chose **Node.js + PostgreSQL + Prisma** as the backend stack for the Dima Hasao Sports Association (DHSA) web app. Each technology is justified through **real scenarios** from the app.

---

## 🎯 Technology Breakdown

### 1. **Node.js** (Backend Language)
- **What it is**: JavaScript runtime that runs your server
- **Role**: Handles HTTP requests, business logic, real-time updates
- **Why**: Fast, modern, same language as the React web frontend

### 2. **PostgreSQL** (SQL Database)
- **What it is**: Relational database (tables with rows/columns)
- **Role**: Stores all app data with relationships
- **Why**: Structured data, relationships, transactions, complex queries

### 3. **Prisma** (Database Tool)
- **What it is**: Type-safe ORM (Object-Relational Mapper)
- **Role**: Makes it easy to talk to PostgreSQL
- **Why**: Type safety, auto-generated code, easy migrations

---

## 🔍 Real Scenarios from Your App

### Scenario 1: User Signup → MPIN Setup

**What happens:**
1. User enters phone → OTP sent
2. User sets MPIN (4-6 digits)
3. System stores: `phone`, `mpinHash`, `role = USER`

**Why Node.js:**
- Handles HTTP request (signup endpoint)
- Runs OTP service (send SMS)
- Hashes MPIN with bcrypt
- Fast response time

**Why PostgreSQL:**
- Stores user data securely
- Enforces unique phone numbers
- Supports transactions (create user atomically)

**Why Prisma:**
- Type-safe user creation
- Auto-validates data
- Prevents SQL injection

**Code Example:**
```typescript
// Node.js handles the request
app.post('/api/auth/signup', async (req, res) => {
  const { phone, mpin } = req.body;
  
  // Prisma talks to PostgreSQL
  const user = await prisma.user.create({
    data: {
      phone,
      mpinHash: await bcrypt.hash(mpin, 10), // Node.js hashing
      role: 'USER'
    }
  });
  
  res.json({ userId: user.id });
});
```

---

### Scenario 2: Player Application → Trial Assignment → Admin Approval

**What happens:**
1. User submits application
2. System creates trial request
3. Admin assigns coach
4. Coach evaluates
5. Admin approves → creates Player

**Why Node.js:**
- Handles multiple API endpoints
- Manages workflow logic
- Sends notifications (SMS/email)

**Why PostgreSQL:**
- Stores application data
- Links: User → Application → Trial → Coach → Player
- Ensures data integrity (foreign keys)
- Supports transactions (approve = create player + update status)

**Why Prisma:**
- Easy relationship queries
- Type-safe joins
- Prevents data corruption

**Code Example:**
```typescript
// When admin approves
await prisma.$transaction(async (tx) => {
  // 1. Update application status
  await tx.playerApplication.update({
    where: { userId },
    data: { status: 'APPROVED', reviewedBy: adminId }
  });
  
  // 2. Create player
  const player = await tx.player.create({
    data: {
      userId,
      playerId: generatePlayerId(),
      user: { connect: { id: userId } }
    }
  });
  
  // 3. Update user role
  await tx.user.update({
    where: { id: userId },
    data: { role: 'PLAYER' }
  });
});
```

---

### Scenario 3: Coach Creation → OTP Verification → Activation

**What happens:**
1. Admin creates coach invite
2. System sends OTP
3. Coach verifies OTP + sets MPIN
4. Admin activates coach
5. Coach can evaluate trials

**Why Node.js:**
- Handles OTP sending
- Manages verification flow
- Updates status

**Why PostgreSQL:**
- Stores coach data
- Links: User → Coach → Team Assignments
- Tracks status (INVITED → VERIFIED → ACTIVE)
- Stores credentials (license, documents)

**Why Prisma:**
- Easy relationship queries (coach + user + teams)
- Type-safe status updates
- Prevents invalid states

**Code Example:**
```typescript
// Get coach with all related data
const coach = await prisma.coach.findUnique({
  where: { coachId },
  include: {
    user: true,              // User account
    teamAssignments: true,   // Teams
    trialEvaluations: true    // Trials evaluated
  }
});
```

---

### Scenario 4: Document Upload → Admin Verification

**What happens:**
1. User uploads document (Aadhaar, DOB proof)
2. File stored (local/S3)
3. Document record created (status = PENDING)
4. Admin verifies → status = VERIFIED/REJECTED
5. User sees status update

**Why Node.js:**
- Handles file upload (multer/formidable)
- Processes files
- Updates status

**Why PostgreSQL:**
- Stores document metadata
- Links: Document → User/Application
- Tracks verification history
- Prevents duplicate uploads

**Why Prisma:**
- Easy queries (get all pending docs)
- Type-safe status updates
- Relationship queries (documents for a user)

**Code Example:**
```typescript
// Get all pending documents for admin
const pendingDocs = await prisma.document.findMany({
  where: { verificationStatus: 'PENDING' },
  include: {
    owner: true  // Get user/application who uploaded
  }
});

// Admin verifies
await prisma.document.update({
  where: { id: docId },
  data: {
    verificationStatus: 'VERIFIED',
    verifiedBy: adminId,
    verifiedAt: new Date()
  }
});
```

---

### Scenario 5: Tournament → Team Registration → Fixture Generation

**What happens:**
1. Admin creates tournament
2. Teams register
3. System generates fixtures (AI algorithm)
4. Fixtures stored
5. Players see fixtures

**Why Node.js:**
- Runs fixture generation algorithm
- Handles complex logic (scheduling, conflicts)
- Fast computation

**Why PostgreSQL:**
- Stores tournament data
- Links: Tournament → Teams → Fixtures → Matches
- Complex queries (get all fixtures for a team)
- Ensures data integrity (can't have duplicate fixtures)

**Why Prisma:**
- Easy relationship queries
- Type-safe tournament structure
- Prevents invalid data

**Code Example:**
```typescript
// Get tournament with all related data
const tournament = await prisma.tournament.findUnique({
  where: { id: tournamentId },
  include: {
    teams: {
      include: {
        players: true  // Get all players in teams
      }
    },
    fixtures: {
      include: {
        homeTeam: true,
        awayTeam: true
      }
    }
  }
});
```

---

### Scenario 6: Live Scoring → Auto-Update Stats

**What happens:**
1. Referee records goal
2. System updates match score
3. System updates player stats (goals +1)
4. System updates team standings
5. All users see live updates

**Why Node.js:**
- Real-time updates (WebSocket/Socket.io)
- Fast event processing
- Background jobs (update stats)

**Why PostgreSQL:**
- Stores match events (immutable)
- Links: Match → Events → Player Stats
- Transactions (goal = update match + player + standings)
- Complex queries (calculate standings)

**Why Prisma:**
- Easy relationship queries
- Type-safe event creation
- Prevents duplicate events

**Code Example:**
```typescript
// When referee records goal
await prisma.$transaction(async (tx) => {
  // 1. Create match event
  await tx.matchEvent.create({
    data: {
      matchId,
      type: 'GOAL',
      playerId,
      timestamp: new Date()
    }
  });
  
  // 2. Update match score
  await tx.match.update({
    where: { id: matchId },
    data: { homeScore: { increment: 1 } }
  });
  
  // 3. Update player stats
  await tx.playerStats.update({
    where: { playerId },
    data: { goals: { increment: 1 } }
  });
});
```

---

## ❌ Why NOT Alternatives?

### Why NOT PHP?
- ❌ Slower for real-time (live scoring)
- ❌ Less modern ecosystem
- ❌ Harder to integrate with the React web frontend

### Why NOT MongoDB (Document Database)?
- ❌ No relationships (user → player → tournaments)
- ❌ No transactions (approve = create player + update status)
- ❌ Harder complex queries (reports, analytics)
- ❌ Your data is structured (not flexible documents)

### Why NOT Raw SQL (without Prisma)?
- ❌ More code to write
- ❌ No type safety (more bugs)
- ❌ Manual migrations
- ❌ SQL injection risk

---

## 📊 Summary Table

| Scenario | Node.js Role | PostgreSQL Role | Prisma Role |
|----------|--------------|-----------------|-------------|
| **User signup** | Handles request, hashes MPIN | Stores user data | Type-safe creation |
| **Player approval** | Manages workflow | Links User→Application→Player | Easy relationships |
| **Coach creation** | Sends OTP, updates status | Stores coach + credentials | Type-safe queries |
| **Document verification** | Handles upload | Stores metadata + history | Easy status updates |
| **Tournament setup** | Runs fixture algorithm | Stores tournament + fixtures | Complex relationships |
| **Live scoring** | Real-time updates | Stores events + stats | Transaction safety |

---

## ✅ Final Recommendation

**Use: Node.js + PostgreSQL + Prisma**

**Because:**
- ✅ **Node.js**: Handles HTTP, real-time, background jobs
- ✅ **PostgreSQL**: Stores structured data with relationships and transactions
- ✅ **Prisma**: Makes PostgreSQL easy and type-safe

**This stack fits your app's needs:**
- Relationships (User → Player → Tournaments)
- Transactions (approve = create player + update status)
- Real-time updates (live scoring)
- Complex queries (reports, analytics)

---

## 🚀 Next Steps

1. Setup Node.js + PostgreSQL + Prisma
2. Create database schema
3. Build API endpoints
4. Connect React web frontend

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Project:** DHSA Sports Management Platform
