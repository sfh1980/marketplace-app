import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

/**
 * Serve static files from uploads directory
 * 
 * What is static file serving?
 * - Serves files directly from filesystem
 * - No processing or transformation
 * - Used for images, CSS, JavaScript, etc.
 * 
 * Why do we need this?
 * - Profile pictures are stored in uploads/profile-pictures/
 * - Frontend needs to access these images via URL
 * - Express doesn't serve files by default (security)
 * - We explicitly enable serving from uploads directory
 * 
 * How it works:
 * - URL: http://localhost:5000/uploads/profile-pictures/image.jpg
 * - Maps to: backend/uploads/profile-pictures/image.jpg
 * - Express sends the file to the browser
 * - Browser displays the image
 * 
 * Security considerations:
 * - Only uploads directory is exposed (not entire filesystem)
 * - Files cannot be executed (only downloaded)
 * - No directory listing (can't browse all files)
 * - Path traversal attacks prevented by Express
 * 
 * Example URLs:
 * - /uploads/profile-pictures/user123-1234567890-abc.jpg
 * - /uploads/listings/listing456-1234567890-xyz.jpg (future)
 * 
 * Alternative approaches:
 * - Cloud storage (AWS S3, Cloudinary) - better for production
 * - CDN (CloudFront, Cloudflare) - faster delivery
 * - Nginx/Apache - more efficient for static files
 * 
 * For MVP, this simple approach works well for development.
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint - useful for monitoring and deployment
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Marketplace API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Marketplace API',
    version: '1.0.0',
  });
});

// Authentication routes - mounted at /api/auth
app.use('/api/auth', authRoutes);

// User routes - mounted at /api/users
// These routes demonstrate protected endpoints using authentication middleware
app.use('/api/users', userRoutes);

// 404 handler for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Start server only if this file is run directly (not imported in tests)
// This allows tests to import the app without starting the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
