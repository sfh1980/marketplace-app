# Database Setup Guide

## What is PostgreSQL?

PostgreSQL (often called "Postgres") is a powerful, open-source relational database management system. It's known for:
- **Reliability**: ACID-compliant transactions ensure data integrity
- **Performance**: Handles complex queries efficiently
- **Features**: Advanced data types, full-text search, JSON support
- **Standards compliance**: Follows SQL standards closely

## Installing PostgreSQL Locally

### Windows

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

### macOS

1. **Using Homebrew** (recommended)
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```

2. **Or download from website**
   - Visit: https://www.postgresql.org/download/macosx/
   - Use the Postgres.app or installer

3. **Verify Installation**
   ```bash
   psql --version
   ```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Creating the Database

### Option 1: Using psql (Command Line)

1. **Connect to PostgreSQL**
   ```bash
   # Windows (if psql is in PATH)
   psql -U postgres

   # macOS/Linux
   sudo -u postgres psql
   ```

2. **Create the database**
   ```sql
   CREATE DATABASE marketplace_db;
   ```

3. **Verify database was created**
   ```sql
   \l
   ```

4. **Exit psql**
   ```sql
   \q
   ```

### Option 2: Using pgAdmin (Visual Tool)

1. Open pgAdmin 4
2. Connect to your PostgreSQL server (localhost)
3. Right-click on "Databases" → "Create" → "Database"
4. Name it: `marketplace_db`
5. Click "Save"

## Configuring the Connection

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

## What is Prisma ORM?

**ORM** stands for Object-Relational Mapping. It's a technique that lets you interact with your database using your programming language (TypeScript) instead of writing raw SQL.

### Why Use an ORM?

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

### Benefits of Prisma

1. **Type Safety**: Auto-generated TypeScript types prevent errors
   ```typescript
   // TypeScript knows exactly what fields 'user' has
   const user = await prisma.user.findUnique({ where: { id: '123' } });
   console.log(user.email); // ✓ TypeScript knows this exists
   console.log(user.invalidField); // ✗ TypeScript error!
   ```

2. **Auto-completion**: Your IDE suggests available fields and methods

3. **Migrations**: Track and apply database schema changes safely
   ```bash
   npx prisma migrate dev --name add_user_table
   ```

4. **Prisma Studio**: Visual database browser
   ```bash
   npx prisma studio
   ```

5. **Intuitive API**: Easy to read and write
   ```typescript
   // Create a user
   await prisma.user.create({
     data: { email: 'user@example.com', username: 'john' }
   });

   // Find users with filters
   await prisma.user.findMany({
     where: { email: { contains: '@gmail.com' } }
   });

   // Update a user
   await prisma.user.update({
     where: { id: '123' },
     data: { username: 'newname' }
   });
   ```

## Prisma Workflow

### 1. Define Schema
Edit `prisma/schema.prisma` to define your data models:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  createdAt DateTime @default(now())
}
```

### 2. Create Migration
Generate SQL migration from your schema:
```bash
npx prisma migrate dev --name init
```

This:
- Creates SQL migration files
- Applies changes to your database
- Generates Prisma Client with TypeScript types

### 3. Use Prisma Client
Import and use in your code:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Now you can query your database!
const users = await prisma.user.findMany();
```

## Common Prisma Commands

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
```

## Troubleshooting

### "Connection refused" or "Could not connect"
- Ensure PostgreSQL is running: `pg_ctl status` or check Services (Windows)
- Verify the port (default: 5432) is correct
- Check firewall settings

### "Database does not exist"
- Create the database using psql or pgAdmin (see above)
- Verify the database name in DATABASE_URL matches

### "Authentication failed"
- Double-check username and password in DATABASE_URL
- Ensure no special characters need URL encoding in password
- Try connecting with psql to verify credentials work

### "Role does not exist"
- The username in DATABASE_URL must be a valid PostgreSQL user
- Default user is usually `postgres`

## Next Steps

Once PostgreSQL is installed and the database is created:
1. Verify your DATABASE_URL in `.env` is correct
2. Run `npx prisma generate` to generate the Prisma Client
3. In the next task, we'll define our database schema
4. Then we'll run migrations to create the tables

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
