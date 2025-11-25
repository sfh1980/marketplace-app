/**
 * Prisma Client Setup
 * 
 * This file creates and exports a single instance of PrismaClient.
 * 
 * Why a single instance?
 * - PrismaClient manages a connection pool to the database
 * - Creating multiple instances can exhaust database connections
 * - Singleton pattern ensures we reuse the same client throughout the app
 * 
 * Best Practice:
 * - In development, we use globalThis to prevent hot-reload from creating new instances
 * - In production, we create a single instance
 */

import { PrismaClient } from '@prisma/client';

// Extend globalThis to include our prisma property (TypeScript)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create PrismaClient instance with logging in development
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] // Log queries in development for debugging
    : ['error'], // Only log errors in production
});

// In development, store the client on globalThis to prevent multiple instances
// during hot-reload (when using ts-node-dev or similar)
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export the client for use throughout the application
export default prisma;

/**
 * Usage Example:
 * 
 * import prisma from './utils/prisma';
 * 
 * // Create a user
 * const user = await prisma.user.create({
 *   data: {
 *     email: 'user@example.com',
 *     username: 'john',
 *   }
 * });
 * 
 * // Find users
 * const users = await prisma.user.findMany({
 *   where: { email: { contains: '@gmail.com' } }
 * });
 * 
 * // Update a user
 * await prisma.user.update({
 *   where: { id: user.id },
 *   data: { username: 'newname' }
 * });
 * 
 * // Delete a user
 * await prisma.user.delete({
 *   where: { id: user.id }
 * });
 */
