# Backend Development Guide

Complete guide for setting up and working with the backend database and development tools.

---

## Table of Contents

1. [Database Setup](#database-setup)
2. [Prisma Studio](#prisma-studio)
3. [Quick Reference](#quick-reference)
4. [Troubleshooting](#troubleshooting)

---

## Database Setup

### What is PostgreSQL?

PostgreSQL (often called "Postgres") is a powerful, open-source relational database management system. It's known for:
- **Reliability**: ACID-compliant transactions ensure data integrity
- **Performance**: Handles complex queries efficiently
- **Features**: Advanced data types, full-text search, JSON support
- **Standards compliance**: Follows SQL standards closely

### Installing PostgreSQL

#### Windows

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the installer (recommended: PostgreSQL 15 or 16)

2. **Run the Installer**
   - Follow the installation wizard
   - **Important**: Remember the password you set for the `postgres` user
   - Default port: 5432 (keep this unless you have a conflict)
   - Install pgAdmin 4 (visual database management tool) - recommended

3. **Verify Installation**
   ```bash
   psql --version
   ```

#### macOS

**Using Homebrew** (recommended)
```bash
brew install postgresql@15
brew services start postgresql@15
psql --version
```

**Or download from website**
- Visit: https://www.postgresql.org/download/macosx/
- Use the Postgres.app or installer

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Creating the Database

#### Option 1: Using psql (Command Line)

```bash
# Windows (if psql is in PATH)
psql -U postgres

# macOS/Linux
sudo -u postgres psql
```

Then in psql:
```sql
CREATE DATABASE marketplace_db;
\l  -- Verify database was created
\q  -- Exit
```

#### Option 2: Using pgAdmin (Visual Tool)

1. Open pgAdmin 4
2. Connect to your PostgreSQL server (localhost)
3. Right-click on "Databases" → "Create" → "Database"
4. Name it: `marketplace_db`
5. Click "Save"

### Configuring the Connection

1. **Update the .env file** in the `backend` directory:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/marketplace_db"
   ```

2. **Replace the placeholders**:
   - `username`: Your PostgreSQL username (default: `postgres`)
   - `password`: The password you set during installation
   - `localhost`: Your database host (use `localhost` for local development)
   - `5432`: PostgreSQL port (default is 5432)
   - `marketplace_db`: The database name we created

3. **Example**:
   ```
   DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/marketplace_db"
   ```

### What is Prisma ORM?

**ORM** stands for Object-Relational Mapping. It's a technique that lets you interact with your database using TypeScript instead of writing raw SQL.

**Without ORM (Raw SQL)**:
```typescript
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
const user = result.rows[0];
```

**With Prisma ORM**:
```typescript
const user = await prisma.user.findUnique({
  where: { email }
});
```

#### Benefits of Prisma

1. **Type Safety**: Auto-generated TypeScript types prevent errors
2. **Auto-completion**: Your IDE suggests available fields and methods
3. **Migrations**: Track and apply database schema changes safely
4. **Prisma Studio**: Visual database browser
5. **Intuitive API**: Easy to read and write

### Prisma Workflow

1. **Define Schema** - Edit `prisma/schema.prisma`
2. **Create Migration** - `npx prisma migrate dev --name description`
3. **Use Prisma Client** - Import and query in your code

---

## Prisma Studio

### What is Prisma Studio?

Prisma Studio is a visual database browser that provides a user-friendly GUI to:
- View all your database tables
- Browse and search records
- Create, edit, and delete data
- Explore relationships between tables
- Test queries without writing code

### Opening Prisma Studio

```bash
# Working directory: backend/
npx prisma studio
```

This will:
1. Start a local web server (usually on http://localhost:5555)
2. Automatically open your browser to Prisma Studio
3. Connect to your database using the connection string from `.env`

### Using Prisma Studio

#### Viewing Data

1. Click on a model in the left sidebar (e.g., "User")
2. You'll see all records in a table format
3. Scroll horizontally to see all fields

#### Searching and Filtering

- **Search bar**: Type to search across all fields
- **Filter button**: Add specific filters (e.g., `emailVerified = true`)
- **Sort**: Click column headers to sort

**Filter Examples:**
```
emailVerified = true
status = "active"
price > 100
email contains "@gmail.com"
```

#### Creating Records

1. Click **"Add record"** button (top right)
2. Fill in the required fields
3. For relationships, use dropdown to select existing records
4. Click **"Save 1 change"**

#### Editing Records

1. Click on any cell to edit it
2. Make your changes
3. Click **"Save X changes"** (top right)
4. Changes are applied immediately

#### Deleting Records

1. Click checkbox next to records to delete
2. Click trash icon (top right)
3. Confirm deletion
4. **Warning**: This permanently deletes data!

### Common Use Cases

**1. Inspecting Test Data**
```bash
npm test
npx prisma studio  # View what was created
```

**2. Manual Testing**
- Create test users and listings manually
- Test API endpoints with this data

**3. Debugging**
- Check if data was actually saved
- Verify relationships are correct
- Look for unexpected null values

**4. Data Cleanup**
- Select and delete test records
- Or use: `npx ts-node src/utils/verifyDatabase.ts`

### Safety Considerations

⚠️ **Important Warnings:**

1. **Production Data**: Be extremely careful
   - Deletions are permanent
   - No undo button
   - Consider read-only credentials

2. **Relationships**: Deleting a parent may cascade delete children
   - Example: Deleting a User deletes all their Listings
   - Check your schema's `onDelete` behavior

3. **Validation**: Prisma Studio bypasses application validation
   - You can create invalid data
   - Always test with your API after manual changes

### When to Use Prisma Studio

✅ **Good for:**
- Viewing data during development
- Quick manual testing
- Debugging data issues
- Learning your schema
- Creating test data

❌ **Not ideal for:**
- Production data management
- Bulk operations (use migrations)
- Complex queries (use Prisma Client)
- Automated tasks (use scripts)

---

## Quick Reference

### Common Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create and apply a migration
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (visual database browser)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Pull schema from existing database
npx prisma db pull

# Push schema changes without creating migration (dev only)
npx prisma db push

# Verify database setup
npx ts-node src/utils/verifyDatabase.ts
```

### Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. Run tests
npm test

# 3. Check code quality
npm run lint
npm run format

# 4. View database
npx prisma studio
```

### Database Connection String Format

```
postgresql://username:password@host:port/database_name
```

**Example:**
```
postgresql://postgres:mypassword@localhost:5432/marketplace_db
```

---

## Troubleshooting

### Database Connection Issues

**"Connection refused" or "Could not connect"**
- Ensure PostgreSQL is running
  - Windows: Check Services, start "postgresql-x64-15"
  - macOS: `brew services start postgresql@15`
  - Linux: `sudo systemctl start postgresql`
- Verify the port (default: 5432) is correct
- Check firewall settings

**"Database does not exist"**
- Create the database using psql or pgAdmin
- Verify the database name in DATABASE_URL matches

**"Authentication failed"**
- Double-check username and password in DATABASE_URL
- Ensure no special characters need URL encoding
- Try connecting with psql to verify credentials

**"Role does not exist"**
- The username in DATABASE_URL must be a valid PostgreSQL user
- Default user is usually `postgres`

### Prisma Studio Issues

**Prisma Studio Won't Start**
1. Check your `.env` file has correct `DATABASE_URL`
2. Verify PostgreSQL is running
3. Test connection: `npx prisma db pull`

**Can't See Tables**
1. Run migrations: `npx prisma migrate dev`
2. Generate client: `npx prisma generate`
3. Refresh Prisma Studio

**Changes Not Saving**
1. Check for validation errors (red highlights)
2. Ensure required fields are filled
3. Check foreign key constraints
4. Look at browser console for errors

**Port Already in Use**
```bash
# Use a different port
npx prisma studio --port 5556
```

### Migration Issues

**Migration fails**
- Check your schema syntax
- Ensure database is accessible
- Look at the error message for specific issues

**Want to start over**
```bash
# WARNING: This deletes all data
npx prisma migrate reset
```

---

## Resources

### Documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Studio Documentation](https://www.prisma.io/docs/concepts/components/prisma-studio)

### Alternative Tools
- **pgAdmin**: Full-featured PostgreSQL GUI
- **DBeaver**: Universal database tool
- **TablePlus**: Modern database GUI (paid)
- **psql**: Command-line PostgreSQL client
- **VS Code Extensions**: PostgreSQL extensions

---

## Next Steps

Once your database is set up:
1. ✅ PostgreSQL installed and running
2. ✅ Database `marketplace_db` created
3. ✅ DATABASE_URL configured in `.env`
4. ✅ Prisma Client generated
5. 🚀 Ready to define your schema and start building!

For detailed implementation tasks, see the tasks.md file in `.kiro/specs/marketplace-platform/`.
