# Prisma Studio Guide

## What is Prisma Studio?

Prisma Studio is a visual database browser that comes with Prisma. It provides a user-friendly GUI to:
- View all your database tables
- Browse and search records
- Create, edit, and delete data
- Explore relationships between tables
- Test queries without writing code

Think of it as a visual interface for your database, similar to phpMyAdmin for MySQL or pgAdmin for PostgreSQL, but specifically designed for Prisma.

## How to Open Prisma Studio

### From the Backend Directory

```bash
# Working directory: backend/
npx prisma studio
```

This will:
1. Start a local web server (usually on http://localhost:5555)
2. Automatically open your browser to Prisma Studio
3. Connect to your database using the connection string from `.env`

### What You'll See

When Prisma Studio opens, you'll see:
- **Left sidebar**: List of all your database models (User, Listing, Category, Message, Rating, Favorite)
- **Main area**: Table view showing records from the selected model
- **Top bar**: Search, filter, and action buttons

## Using Prisma Studio

### Viewing Data

1. **Click on a model** in the left sidebar (e.g., "User")
2. You'll see all records in a table format
3. Each column represents a field from your schema
4. Scroll horizontally to see all fields

### Searching and Filtering

1. **Search bar**: Type to search across all fields
2. **Filter button**: Add specific filters (e.g., `emailVerified = true`)
3. **Sort**: Click column headers to sort by that field

### Creating Records

1. Click the **"Add record"** button (top right)
2. Fill in the required fields
3. For relationships:
   - Use the dropdown to select existing related records
   - Or create new related records inline
4. Click **"Save 1 change"**

### Editing Records

1. Click on any cell to edit it
2. Make your changes
3. Click **"Save X changes"** (top right)
4. Changes are applied immediately to the database

### Deleting Records

1. Click the checkbox next to records you want to delete
2. Click the **trash icon** (top right)
3. Confirm the deletion
4. **Warning**: This permanently deletes data!

### Viewing Relationships

1. Click on a record
2. Related data shows as links (e.g., a User's listings)
3. Click the link to navigate to related records
4. Use the breadcrumb trail to navigate back

## Common Use Cases

### 1. Inspecting Test Data

After running tests, use Prisma Studio to see what data was created:

```bash
# Run tests
npm test

# Open Prisma Studio to inspect
npx prisma studio
```

### 2. Manual Testing

Create test users and listings manually to test your API:

1. Open Prisma Studio
2. Create a User with email and password
3. Create a Listing associated with that User
4. Test your API endpoints with this data

### 3. Debugging

When something isn't working:

1. Check if data was actually saved
2. Verify relationships are correct
3. Look for unexpected null values
4. Check timestamps to see when data was created/updated

### 4. Data Cleanup

Remove test data:

1. Select records to delete
2. Click trash icon
3. Confirm deletion

Or use the verification script:
```bash
# Working directory: backend/
npx ts-node src/utils/verifyDatabase.ts
```

### 5. Exploring Schema

Learn about your database structure:

1. Click on different models
2. See what fields exist
3. Understand relationships
4. View data types

## Tips and Tricks

### Keyboard Shortcuts

- **Cmd/Ctrl + K**: Open command palette
- **Cmd/Ctrl + F**: Focus search
- **Escape**: Close dialogs

### Filtering Examples

```
# Find verified users
emailVerified = true

# Find active listings
status = "active"

# Find listings above a price
price > 100

# Find users by email domain
email contains "@gmail.com"
```

### Relationship Navigation

- **One-to-Many**: Click on a user to see their listings
- **Many-to-One**: Click on a listing to see its seller
- **Many-to-Many**: Click on a user to see their favorites

### Data Types

- **String**: Text fields (email, username, title)
- **Int/Float**: Numbers (price, rating)
- **Boolean**: True/false (emailVerified, mfaEnabled)
- **DateTime**: Timestamps (createdAt, updatedAt)
- **JSON**: Arrays (images array in Listing)

## Safety Considerations

### ⚠️ Important Warnings

1. **Production Data**: Be extremely careful with production databases
   - Deletions are permanent
   - No undo button
   - Consider using read-only credentials

2. **Relationships**: Deleting a parent record may cascade delete children
   - Example: Deleting a User deletes all their Listings
   - Check your schema's `onDelete` behavior

3. **Validation**: Prisma Studio bypasses application validation
   - You can create invalid data
   - Always test with your API after manual changes

### Best Practices

1. **Use for Development**: Prisma Studio is great for local development
2. **Read-Only in Production**: If you must use in production, use read-only access
3. **Backup First**: Before bulk deletions, backup your data
4. **Test Changes**: After manual edits, test your application still works

## Troubleshooting

### Prisma Studio Won't Start

**Problem**: Error connecting to database

**Solution**:
1. Check your `.env` file has correct `DATABASE_URL`
2. Verify PostgreSQL is running
3. Test connection: `npx prisma db pull`

### Can't See My Tables

**Problem**: Tables don't appear in sidebar

**Solution**:
1. Run migrations: `npx prisma migrate dev`
2. Generate client: `npx prisma generate`
3. Refresh Prisma Studio

### Changes Not Saving

**Problem**: Edits don't persist

**Solution**:
1. Check for validation errors (red highlights)
2. Ensure required fields are filled
3. Check foreign key constraints
4. Look at browser console for errors

### Port Already in Use

**Problem**: Port 5555 is already taken

**Solution**:
```bash
# Use a different port
npx prisma studio --port 5556
```

## Alternatives to Prisma Studio

If you prefer other tools:

1. **pgAdmin**: Full-featured PostgreSQL GUI
2. **DBeaver**: Universal database tool
3. **TablePlus**: Modern database GUI (paid)
4. **psql**: Command-line PostgreSQL client
5. **VS Code Extensions**: PostgreSQL extensions

## When to Use Prisma Studio

✅ **Good for:**
- Viewing data during development
- Quick manual testing
- Debugging data issues
- Learning your schema
- Creating test data
- Exploring relationships

❌ **Not ideal for:**
- Production data management
- Bulk operations (use migrations)
- Complex queries (use Prisma Client)
- Automated tasks (use scripts)
- Schema changes (use migrations)

## Next Steps

Now that you know how to use Prisma Studio:

1. Open it and explore your database
2. Look at the User and Rating tables (from tests)
3. Try creating a test user manually
4. Navigate relationships between models
5. Get comfortable with the interface

Then continue with Task 5: Implementing user registration!

## Resources

- [Prisma Studio Documentation](https://www.prisma.io/docs/concepts/components/prisma-studio)
- [Prisma Client Documentation](https://www.prisma.io/docs/concepts/components/prisma-client)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
