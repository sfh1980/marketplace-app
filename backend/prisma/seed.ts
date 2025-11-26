/**
 * Database Seed Script
 * 
 * This script populates the database with initial data that the application needs to function.
 * It's run with: npx prisma db seed
 * 
 * Prisma automatically runs this when you run: npx prisma migrate reset
 */

import { PrismaClient } from '@prisma/client';

// Create a new Prisma client instance to interact with the database
const prisma = new PrismaClient();

/**
 * Initial categories for the marketplace
 * 
 * Each category has:
 * - name: Display name shown to users
 * - slug: URL-friendly version (lowercase, no spaces)
 * - description: Helpful text explaining what belongs in this category
 */
const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Computers, phones, tablets, cameras, and electronic accessories',
  },
  {
    name: 'Furniture',
    slug: 'furniture',
    description: 'Tables, chairs, sofas, beds, and home furnishings',
  },
  {
    name: 'Clothing & Accessories',
    slug: 'clothing-accessories',
    description: 'Apparel, shoes, jewelry, and fashion accessories',
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home decor, garden tools, plants, and outdoor equipment',
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sporting goods, fitness equipment, camping gear, and outdoor recreation',
  },
  {
    name: 'Books & Media',
    slug: 'books-media',
    description: 'Books, movies, music, video games, and collectibles',
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Children\'s toys, board games, puzzles, and hobby items',
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    description: 'Cars, motorcycles, bicycles, and vehicle parts',
  },
  {
    name: 'Professional Services',
    slug: 'professional-services',
    description: 'Legal, accounting, consulting, and business services',
  },
  {
    name: 'Home Services',
    slug: 'home-services',
    description: 'Cleaning, repairs, landscaping, and home improvement services',
  },
  {
    name: 'Creative Services',
    slug: 'creative-services',
    description: 'Design, photography, writing, and artistic services',
  },
  {
    name: 'Tutoring & Lessons',
    slug: 'tutoring-lessons',
    description: 'Educational tutoring, music lessons, and skill instruction',
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Fitness training, massage, therapy, and wellness services',
  },
  {
    name: 'Pet Services',
    slug: 'pet-services',
    description: 'Pet sitting, grooming, training, and veterinary services',
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Items and services that don\'t fit other categories',
  },
];

/**
 * Main seed function
 * 
 * This function is called when the seed script runs.
 * It uses Prisma's createMany to efficiently insert all categories at once.
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Delete existing categories to ensure a clean slate
  // This is useful when re-running the seed script
  console.log('🗑️  Clearing existing categories...');
  await prisma.category.deleteMany({});

  // Insert all categories at once
  // createMany is more efficient than creating them one by one
  console.log('📦 Creating categories...');
  const result = await prisma.category.createMany({
    data: categories,
    // skipDuplicates: true would skip categories that already exist
    // We don't need it since we deleted all categories above
  });

  console.log(`✅ Successfully created ${result.count} categories`);

  // Fetch and display all categories to verify they were created
  const allCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  console.log('\n📋 Categories in database:');
  allCategories.forEach((category) => {
    console.log(`   - ${category.name} (${category.slug})`);
  });

  console.log('\n🎉 Database seeding completed successfully!');
}

/**
 * Execute the main function and handle any errors
 * 
 * This pattern ensures:
 * 1. The Prisma client is properly disconnected after seeding
 * 2. Any errors are logged and cause the process to exit with error code
 */
main()
  .catch((error) => {
    console.error('❌ Error during database seeding:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect from the database, even if there was an error
    await prisma.$disconnect();
  });
