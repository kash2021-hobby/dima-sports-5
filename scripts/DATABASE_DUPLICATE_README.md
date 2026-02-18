# Duplicate Database

The app can use a **duplicate** of the main PostgreSQL database so you can work on a copy without touching the original.

## Current setup

- **Original DB:** `dhsa_db` (all data preserved)
- **Duplicate DB:** `dhsa_db_duplicate` (created and filled from the original)
- **App:** `.env` is set to use `dhsa_db_duplicate`.

## How it was done

1. **Script:** `scripts/duplicate-database.js`  
   - Creates a new PostgreSQL database `dhsa_db_duplicate`.  
   - Applies the same schema (Prisma migrations / `db push`).  
   - Copies all rows from every table (users, players, coaches, teams, trials, documents, etc.) from `dhsa_db` into `dhsa_db_duplicate`.

2. **Config:** `.env` was updated so `DATABASE_URL` points to `dhsa_db_duplicate`.  
   The original URL is kept in a comment in `.env` if you want to switch back.

## Commands

- **Create or refresh the duplicate from the original:**  
  1. In `.env`, set `DATABASE_URL` to the **original** DB:  
     `DATABASE_URL="postgresql://postgres:1234@localhost:5432/dhsa_db?schema=public"`  
  2. Run: `npm run db:duplicate` (or `node scripts/duplicate-database.js`).  
  3. Set `DATABASE_URL` back to the duplicate if you want the app to use it:  
     `DATABASE_URL="postgresql://postgres:1234@localhost:5432/dhsa_db_duplicate?schema=public"`

- **Use the duplicate in the app:**  
  In `.env`:  
  `DATABASE_URL="postgresql://postgres:1234@localhost:5432/dhsa_db_duplicate?schema=public"`

- **Use the original again:**  
  In `.env`:  
  `DATABASE_URL="postgresql://postgres:1234@localhost:5432/dhsa_db?schema=public"`

## PowerShell option (if PostgreSQL CLI is in PATH)

If `psql` and `pg_dump` are available, you can use:

```powershell
.\scripts\duplicate-database.ps1
```

It uses `pg_dump` / `pg_restore` for a full binary copy.  
To point the app at the new DB, update `DATABASE_URL` in `.env` as above.
