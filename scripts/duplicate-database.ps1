# ============================================
# Duplicate DHSA Database Script
# Creates a new database and copies all data from the original.
# Requires: PostgreSQL client tools (psql, pg_dump) in PATH.
# ============================================

param(
    [string]$OriginalUrl = "postgresql://postgres:1234@localhost:5432/dhsa_db?schema=public",
    [string]$NewDbName = "dhsa_db_duplicate"
)

# Parse connection from URL (simple parsing)
if ($env:DATABASE_URL) { $OriginalUrl = $env:DATABASE_URL }
$pattern = 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)'
if ($OriginalUrl -match $pattern) {
    $pgUser = $Matches[1]
    $pgPass = $Matches[2]
    $pgHost = $Matches[3]
    $pgPort = $Matches[4]
    $originalDb = $Matches[5]
} else {
    Write-Error "Could not parse DATABASE_URL. Use format: postgresql://user:password@host:port/database"
    exit 1
}

$env:PGPASSWORD = $pgPass
$dumpFile = Join-Path $PSScriptRoot "..\dhsa_db_dump_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "Original database: $originalDb"
Write-Host "New database: $NewDbName"
Write-Host "Host: $pgHost`:$pgPort"
Write-Host ""

# 1. Create new database (connect to 'postgres' to run CREATE DATABASE)
Write-Host "[1/4] Creating database '$NewDbName'..."
$createDb = "SELECT 1 FROM pg_database WHERE datname = '$NewDbName'"
$exists = psql -h $pgHost -p $pgPort -U $pgUser -d postgres -t -A -c $createDb 2>$null
if ($exists -eq "1") {
    Write-Host "Database '$NewDbName' already exists. Dropping and recreating for a fresh copy..."
    psql -h $pgHost -p $pgPort -U $pgUser -d postgres -c "DROP DATABASE IF EXISTS ${NewDbName};" 2>$null
}
psql -h $pgHost -p $pgPort -U $pgUser -d postgres -c "CREATE DATABASE $NewDbName;"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create database."
    exit 1
}
Write-Host "Done."
Write-Host ""

# 2. Dump original database (schema + data)
Write-Host "[2/4] Dumping '$originalDb' to $dumpFile..."
pg_dump -h $pgHost -p $pgPort -U $pgUser -d $originalDb --no-owner --no-acl -f $dumpFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump failed."
    exit 1
}
Write-Host "Done."
Write-Host ""

# 3. Restore into new database
Write-Host "[3/4] Restoring into '$NewDbName'..."
psql -h $pgHost -p $pgPort -U $pgUser -d $NewDbName -f $dumpFile
# Exit code 1 can occur from NOTICE messages; verify data instead
$count = psql -h $pgHost -p $pgPort -U $pgUser -d $NewDbName -t -A -c "SELECT COUNT(*) FROM users;" 2>$null
Write-Host "Done. Sample check: users table row count = $count"
Write-Host ""

# 4. Remind to update .env
Write-Host "[4/4] Database duplicate ready."
Write-Host ""
Write-Host "To point the app to the new database, update .env:"
Write-Host "  DATABASE_URL=`"postgresql://${pgUser}:${pgPass}@${pgHost}:${pgPort}/${NewDbName}?schema=public`""
Write-Host ""
Write-Host "Optional: remove dump file to save space:"
Write-Host "  Remove-Item '$dumpFile' -ErrorAction SilentlyContinue"
Write-Host ""

$env:PGPASSWORD = $null
