import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components';
import { SkipLink } from './components/SkipLink';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import AuthContextExample from './examples/AuthContextExample';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import VerifyEmailNoticePage from './pages/VerifyEmailNoticePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ListingEditPage from './pages/ListingEditPage';
import MyListingsPage from './pages/MyListingsPage';
import CategoryBrowsePage from './pages/CategoryBrowsePage';
import MessagesInboxPage from './pages/MessagesInboxPage';
import ConversationPage from './pages/ConversationPage';
import styles from './App.module.css';

// Create a client for React Query
// This manages server state, caching, and data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      retry: 1, // Retry failed requests once
    },
  },
});

function App() {
  return (
    // Top-level error boundary catches errors in the entire app
    // This prevents the whole app from crashing if any component fails
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            {/* Skip link for keyboard accessibility */}
            <SkipLink />
            
            <div className={styles.app}>
              {/* Main content area with ID for skip link target */}
              <main id="main-content" className={styles.appMain}>
                {/* Nested error boundary for routes - isolates routing errors */}
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/auth-example" element={<AuthContextExample />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/verify-email-notice" element={<VerifyEmailNoticePage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    
                    {/* Profile Page - Public */}
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                    
                    {/* Category Browse Page - Public */}
                    <Route path="/categories/:categorySlug" element={<CategoryBrowsePage />} />
                    
                    {/* Listing Detail Page - Public */}
                    <Route path="/listings/:listingId" element={<ListingDetailPage />} />
                    
                    {/* Protected Routes - Require Authentication */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile/:userId/edit" 
                      element={
                        <ProtectedRoute>
                          <ProfileEditPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/listings/create" 
                      element={
                        <ProtectedRoute>
                          <CreateListingPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/listings/:listingId/edit" 
                      element={
                        <ProtectedRoute>
                          <ListingEditPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/my-listings" 
                      element={
                        <ProtectedRoute>
                          <MyListingsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/messages" 
                      element={
                        <ProtectedRoute>
                          <MessagesInboxPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/messages/:otherUserId" 
                      element={
                        <ProtectedRoute>
                          <ConversationPage />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </ErrorBoundary>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
