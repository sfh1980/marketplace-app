import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AuthContextExample from './examples/AuthContextExample';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import VerifyEmailNoticePage from './pages/VerifyEmailNoticePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className={styles.app}>
            <header className={styles.appHeader}>
              <h1>Marketplace Platform</h1>
              <p>CSS Variables Design System Demo</p>
            </header>
            
            <main className={styles.appMain}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth-example" element={<AuthContextExample />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/verify-email-notice" element={<VerifyEmailNoticePage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                {/* Protected Routes - Require Authentication */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Temporary homepage component showcasing the design system
function HomePage() {
  return (
    <div className={styles.demoContainer}>
      {/* Colors Section */}
      <section className={styles.demoSection}>
        <h2>Color Palette</h2>
        <p>Our design system uses CSS variables for consistent colors across the platform.</p>
        
        <h3 style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>Primary Colors</h3>
        <div className={styles.colorGrid}>
          <div className={styles.colorSwatch}>
            <div className={styles.colorBox} style={{ backgroundColor: 'var(--color-primary)' }}></div>
            <div className={styles.colorLabel}>--color-primary</div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.colorBox} style={{ backgroundColor: 'var(--color-primary-dark)' }}></div>
            <div className={styles.colorLabel}>--color-primary-dark</div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.colorBox} style={{ backgroundColor: 'var(--color-primary-light)' }}></div>
            <div className={styles.colorLabel}>--color-primary-light</div>
          </div>
        </div>
        
        <h3 style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>Semantic Colors</h3>
        <div className={styles.colorGrid}>
          <div className={styles.colorSwatch}>
            <div className={styles.colorBox} style={{ backgroundColor: 'var(--color-success)' }}></div>
            <div className={styles.colorLabel}>--color-success</div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.colorBox} style={{ backgroundColor: 'var(--color-warning)' }}></div>
            <div className={styles.colorLabel}>--color-warning</div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.colorBox} style={{ backgroundColor: 'var(--color-error)' }}></div>
            <div className={styles.colorLabel}>--color-error</div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className={styles.demoSection}>
        <h2>Typography Scale</h2>
        <p>Consistent font sizes and weights using our type scale.</p>
        <div className={styles.typographyDemo}>
          <h1>Heading 1 - Page Titles</h1>
          <h2>Heading 2 - Section Headings</h2>
          <h3>Heading 3 - Subsection Headings</h3>
          <h4>Heading 4 - Card Titles</h4>
          <h5>Heading 5 - Small Headings</h5>
          <h6>Heading 6 - Labels</h6>
          <p>Body text - This is the default paragraph text size used throughout the application.</p>
          <small>Small text - Used for captions, labels, and secondary information.</small>
        </div>
      </section>

      {/* Spacing Section */}
      <section className={styles.demoSection}>
        <h2>Spacing Scale</h2>
        <p>Consistent spacing using our 4px-based scale.</p>
        <div className={styles.spacingDemo}>
          <div className={styles.spacingItem}>
            <div className={styles.spacingLabel}>--space-xs (4px)</div>
            <div className={styles.spacingBox} style={{ width: 'var(--space-xs)' }}></div>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingLabel}>--space-sm (8px)</div>
            <div className={styles.spacingBox} style={{ width: 'var(--space-sm)' }}></div>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingLabel}>--space-md (16px)</div>
            <div className={styles.spacingBox} style={{ width: 'var(--space-md)' }}></div>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingLabel}>--space-lg (24px)</div>
            <div className={styles.spacingBox} style={{ width: 'var(--space-lg)' }}></div>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingLabel}>--space-xl (32px)</div>
            <div className={styles.spacingBox} style={{ width: 'var(--space-xl)' }}></div>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingLabel}>--space-2xl (48px)</div>
            <div className={styles.spacingBox} style={{ width: 'var(--space-2xl)' }}></div>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className={styles.demoSection}>
        <h2>Button Styles</h2>
        <p>Buttons using our color system and spacing.</p>
        <div className={styles.buttonDemo}>
          <button className={`${styles.demoButton} ${styles.buttonPrimary}`}>Primary Button</button>
          <button className={`${styles.demoButton} ${styles.buttonSecondary}`}>Secondary Button</button>
          <button className={`${styles.demoButton} ${styles.buttonSuccess}`}>Success Button</button>
          <button className={`${styles.demoButton} ${styles.buttonWarning}`}>Warning Button</button>
          <button className={`${styles.demoButton} ${styles.buttonError}`}>Error Button</button>
        </div>
      </section>

      {/* Shadows Section */}
      <section className={styles.demoSection}>
        <h2>Shadow System</h2>
        <p>Elevation levels using our shadow scale.</p>
        <div className={styles.shadowDemo}>
          <div className={`${styles.shadowBox} ${styles.shadowSm}`}>
            shadow-sm
          </div>
          <div className={`${styles.shadowBox} ${styles.shadowMd}`}>
            shadow-md
          </div>
          <div className={`${styles.shadowBox} ${styles.shadowLg}`}>
            shadow-lg
          </div>
          <div className={`${styles.shadowBox} ${styles.shadowXl}`}>
            shadow-xl
          </div>
        </div>
      </section>

      {/* Success Message */}
      <section className={styles.demoSection} style={{ 
        backgroundColor: 'var(--color-success-light)', 
        borderColor: 'var(--color-success)' 
      }}>
        <h2 style={{ color: 'var(--color-success)' }}>✅ Design System Ready!</h2>
        <p>The CSS Variables design system is now set up and ready to use. All components can reference these variables for consistent styling.</p>
        <p><strong>Next steps:</strong> Create reusable UI components (Button, Input, Card, Modal) that use this design system.</p>
      </section>

      {/* Auth Context Example Link */}
      <section className={styles.demoSection}>
        <h2>🔐 Authentication Context</h2>
        <p>The AuthContext is now set up for global authentication state management!</p>
        <a 
          href="/auth-example" 
          style={{
            display: 'inline-block',
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md) var(--space-xl)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          View Auth Context Example →
        </a>
      </section>

      {/* Protected Route Example */}
      <section className={styles.demoSection}>
        <h2>🛡️ Protected Routes</h2>
        <p>The ProtectedRoute component guards routes that require authentication!</p>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-secondary)' }}>
          Try accessing the dashboard below. If you're not logged in, you'll be redirected to the login page.
          After logging in, you'll be automatically redirected back to the dashboard!
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
          <a 
            href="/dashboard" 
            style={{
              display: 'inline-block',
              padding: 'var(--space-md) var(--space-xl)',
              backgroundColor: 'var(--color-success)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Try Protected Dashboard →
          </a>
          <a 
            href="/login" 
            style={{
              display: 'inline-block',
              padding: 'var(--space-md) var(--space-xl)',
              backgroundColor: 'var(--color-secondary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Login First
          </a>
        </div>
      </section>
    </div>
  );
}

export default App;
