/**
 * Database Verification Script
 * 
 * This script verifies that:
 * 1. Database connection is working
 * 2. All tables exist
 * 3. We can perform basic operations
 */

import prisma from './prisma';

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');

  try {
    // Test 1: Database connection
    console.log('1️⃣  Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful\n');

    // Test 2: Check if tables exist by counting records
    console.log('2️⃣  Verifying tables exist...');
    
    const userCount = await prisma.user.count();
    console.log(`   ✅ User table exists (${userCount} records)`);
    
    const listingCount = await prisma.listing.count();
    console.log(`   ✅ Listing table exists (${listingCount} records)`);
    
    const categoryCount = await prisma.category.count();
    console.log(`   ✅ Category table exists (${categoryCount} records)`);
    
    const messageCount = await prisma.message.count();
    console.log(`   ✅ Message table exists (${messageCount} records)`);
    
    const ratingCount = await prisma.rating.count();
    console.log(`   ✅ Rating table exists (${ratingCount} records)`);
    
    const favoriteCount = await prisma.favorite.count();
    console.log(`   ✅ Favorite table exists (${favoriteCount} records)\n`);

    // Test 3: Verify we can create and read data
    console.log('3️⃣  Testing basic CRUD operations...');
    
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@example.com`,
        username: `testuser_${Date.now()}`,
        passwordHash: 'test_hash',
        emailVerified: false,
      },
    });
    console.log(`   ✅ Created test user: ${testUser.username}`);
    
    // Read the user back
    const retrievedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    console.log(`   ✅ Retrieved test user: ${retrievedUser?.username}`);
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { emailVerified: true },
    });
    console.log(`   ✅ Updated test user (emailVerified: ${updatedUser.emailVerified})`);
    
    // Delete the user
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log(`   ✅ Deleted test user\n`);

    // Test 4: Verify relationships work
    console.log('4️⃣  Testing relationships...');
    
    // Create a test category first
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
        description: 'Test category for verification',
      },
    });
    
    // Create user with listing
    const seller = await prisma.user.create({
      data: {
        email: `seller_${Date.now()}@example.com`,
        username: `seller_${Date.now()}`,
        passwordHash: 'test_hash',
        emailVerified: true,
      },
    });
    
    const testListing = await prisma.listing.create({
      data: {
        title: 'Test Listing',
        description: 'Test description',
        price: 99.99,
        listingType: 'item',
        images: ['test.jpg'],
        status: 'active',
        location: 'Test City',
        seller: {
          connect: { id: seller.id },
        },
        category: {
          connect: { id: testCategory.id },
        },
      },
    });
    console.log(`   ✅ Created user with listing relationship`);
    
    // Verify the relationship
    const sellerWithListings = await prisma.user.findUnique({
      where: { id: seller.id },
      include: { listings: true },
    });
    console.log(`   ✅ Verified relationship: ${sellerWithListings?.listings.length} listing(s)`);
    
    // Clean up
    await prisma.listing.delete({ where: { id: testListing.id } });
    await prisma.user.delete({ where: { id: seller.id } });
    await prisma.category.delete({ where: { id: testCategory.id } });
    console.log(`   ✅ Cleaned up test data\n`);

    console.log('✨ All database verifications passed!\n');
    console.log('📊 Database Summary:');
    console.log(`   - Total users: ${userCount}`);
    console.log(`   - Total listings: ${listingCount}`);
    console.log(`   - Total categories: ${categoryCount}`);
    console.log(`   - Total messages: ${messageCount}`);
    console.log(`   - Total ratings: ${ratingCount}`);
    console.log(`   - Total favorites: ${favoriteCount}\n`);

    console.log('💡 Next steps:');
    console.log('   1. Run "npx prisma studio" to visually inspect your database');
    console.log('   2. Begin implementing authentication endpoints');
    console.log('   3. Continue with Task 5: User registration\n');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyDatabase();
