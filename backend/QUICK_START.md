# Quick Start: Database Setup

## Before You Continue

You need PostgreSQL installed and running before proceeding to the next task.

## Quick Setup (5 minutes)

### 1. Install PostgreSQL

**Windows:**
```
Download from: https://www.postgresql.org/download/windows/
Run installer, remember your password for 'postgres' user
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create the Database

**Option A: Command Line**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE marketplace_db;

# Exit
\q
```

**Option B: pgAdmin (Visual Tool)**
1. Open pgAdmin 4 (installed with PostgreSQL)
2. Right-click "Databases" → "Create" → "Database"
3. Name: `marketplace_db`
4. Click "Save"

### 3. Update Your .env File

Edit `backend/.env` and update the DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/marketplace_db"
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

### 4. Test the Connection

```bash
cd backend
npx prisma generate
```

If this runs without errors, you're ready to go!

## Troubleshooting

**"Connection refused"**
- PostgreSQL isn't running. Start it:
  - Windows: Check Services, start "postgresql-x64-15"
  - macOS: `brew services start postgresql@15`
  - Linux: `sudo systemctl start postgresql`

**"Database does not exist"**
- You forgot to create the database. See step 2 above.

**"Authentication failed"**
- Wrong password in DATABASE_URL. Check your .env file.

## Next Steps

Once PostgreSQL is set up:
1. ✅ You're ready for Task 3: Define database schema
2. We'll create the User, Listing, Message, and Category models
3. We'll run our first migration to create the tables

## Need More Help?

See `DATABASE_SETUP.md` for detailed instructions with explanations.
