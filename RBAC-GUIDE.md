# RBAC (Role-Based Access Control) Implementation Guide

## 📋 Overview

Yes, **RBAC is fully implemented** in this project using **TypeScript/Node.js** with Express middleware.

## 🎯 How RBAC Works

### 1. **Role Storage**

Roles are stored in the `User` model (PostgreSQL database):

```typescript
// prisma/schema.prisma
model User {
  role  String  @default("USER")  // USER, PLAYER, COACH, ADMIN
  // ...
}
```

**Available Roles:**
- `USER` - Basic user (not yet a player)
- `PLAYER` - Approved player
- `COACH` - Active coach
- `ADMIN` - System administrator

### 2. **Authentication Middleware**

When a user logs in, their role is embedded in the JWT token:

```typescript
// src/services/jwt.service.ts
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, role: payload.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}
```

### 3. **Role Verification**

The `authenticateToken` middleware extracts the role from the token and attaches it to the request:

```typescript
// src/middleware/auth.middleware.ts
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  // 1. Verify JWT token
  const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: string };
  
  // 2. Verify user exists and is active
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  
  // 3. Attach user info to request
  req.userId = user.id;
  req.userRole = user.role;  // ← Role attached here
  
  next();
}
```

### 4. **Role-Based Access Control**

The `requireRole()` function checks if the user's role matches the required role(s):

```typescript
// src/middleware/auth.middleware.ts
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
      return;
    }

    next(); // Allow access
  };
}
```

### 5. **Predefined Role Guards**

For convenience, we have predefined guards:

```typescript
// src/middleware/auth.middleware.ts
export const requireAdmin = requireRole('ADMIN');
export const requireCoach = requireRole('COACH');
export const requirePlayer = requireRole('PLAYER');
```

## 💻 Usage Examples

### Example 1: Admin-Only Route

```typescript
// src/routes/admin.routes.ts
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin
router.use(authenticateToken);  // 1. Check authentication
router.use(requireAdmin);      // 2. Check role = ADMIN

router.get('/users', adminController.getAllUsers);
// Only ADMIN can access this route
```

### Example 2: Coach-Only Route

```typescript
// src/routes/coach.routes.ts
import { authenticateToken, requireCoach } from '../middleware/auth.middleware';

router.get('/profile', 
  authenticateToken,  // 1. Check authentication
  requireCoach,       // 2. Check role = COACH
  coachController.getCoachProfile
);
```

### Example 3: Multiple Roles

```typescript
// Allow both ADMIN and COACH
router.get('/reports', 
  authenticateToken,
  requireRole('ADMIN', 'COACH'),  // Either ADMIN OR COACH
  controller.getReports
);
```

### Example 4: Role Check in Controller

```typescript
// src/controllers/admin.controller.ts
export async function approveApplication(req: AuthRequest, res: Response) {
  // Double-check role (defense in depth)
  if (!req.userId || req.userRole !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  
  // ... rest of the code
}
```

## 🔐 Complete Flow

### Step-by-Step RBAC Flow:

```
1. User Login
   ↓
2. Server generates JWT with { userId, role }
   ↓
3. Client sends request with: Authorization: Bearer <token>
   ↓
4. authenticateToken middleware:
   - Verifies JWT
   - Extracts role
   - Attaches to req.userRole
   ↓
5. requireRole middleware:
   - Checks if req.userRole matches allowed roles
   - Allows or denies access
   ↓
6. Controller executes (if allowed)
```

## 📊 Role Permissions Matrix

| Endpoint | USER | PLAYER | COACH | ADMIN |
|----------|------|--------|-------|-------|
| `/api/auth/signup` | ✅ | ✅ | ✅ | ✅ |
| `/api/application/create` | ✅ | ❌ | ❌ | ❌ |
| `/api/player/profile` | ❌ | ✅ | ❌ | ❌ |
| `/api/coach/profile` | ❌ | ❌ | ✅ | ❌ |
| `/api/trial/my-trials` | ❌ | ❌ | ✅ | ❌ |
| `/api/admin/users` | ❌ | ❌ | ❌ | ✅ |
| `/api/admin/approve` | ❌ | ❌ | ❌ | ✅ |

## 🛠️ Language & Framework

- **Language**: **TypeScript** (compiles to JavaScript)
- **Runtime**: **Node.js**
- **Framework**: **Express.js**
- **Database**: **PostgreSQL** (stores roles)
- **Auth**: **JWT** (JSON Web Tokens)

## 🔧 Advanced RBAC (Future Enhancement)

For more complex scenarios, you can extend RBAC with:

### 1. **Permission-Based Access Control**

```typescript
// Add permissions table
model Permission {
  id          String   @id @default(cuid())
  name        String   // "approve_application", "verify_document"
  role        String   // "ADMIN"
}

// Check permissions
export function requirePermission(permission: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const hasPermission = await checkUserPermission(req.userId, permission);
    if (!hasPermission) {
      res.status(403).json({ message: 'Permission denied' });
      return;
    }
    next();
  };
}
```

### 2. **Resource-Based Access Control**

```typescript
// Check if user owns the resource
export async function checkResourceOwnership(
  req: AuthRequest,
  resourceId: string,
  resourceType: 'PLAYER' | 'COACH'
): Promise<boolean> {
  if (req.userRole === 'ADMIN') return true; // Admin can access all
  
  if (resourceType === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { id: resourceId } });
    return player?.userId === req.userId;
  }
  
  return false;
}
```

### 3. **Hierarchical Roles**

```typescript
const roleHierarchy = {
  ADMIN: ['ADMIN', 'COACH', 'PLAYER', 'USER'],
  COACH: ['COACH', 'USER'],
  PLAYER: ['PLAYER', 'USER'],
  USER: ['USER'],
};

export function hasRole(userRole: string, requiredRole: string): boolean {
  return roleHierarchy[userRole]?.includes(requiredRole) || false;
}
```

## 📝 Summary

**RBAC Implementation:**
- ✅ **Language**: TypeScript/Node.js
- ✅ **Method**: Express middleware
- ✅ **Storage**: PostgreSQL (User.role field)
- ✅ **Token**: JWT (contains role)
- ✅ **Guards**: `requireAdmin`, `requireCoach`, `requirePlayer`
- ✅ **Flexible**: `requireRole('ADMIN', 'COACH')` for multiple roles

**How to Use:**
1. Add `authenticateToken` middleware (verifies JWT)
2. Add role guard (`requireAdmin`, `requireCoach`, etc.)
3. Access `req.userRole` in controller if needed

**Example:**
```typescript
router.get('/admin-only', 
  authenticateToken,  // Verify token
  requireAdmin,        // Check role
  controller.handler   // Execute if allowed
);
```

---

**Status**: ✅ Fully Implemented  
**Version**: 1.0.0
