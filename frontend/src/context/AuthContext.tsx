/**
 * Authentication Context
 * 
 * This file creates a React Context for managing global authentication state.
 * 
 * What is React Context?
 * - A way to share data across your component tree without prop drilling
 * - Think of it as "global state" that any component can access
 * - Perfect for auth state, theme, language, etc.
 * 
 * How it works:
 * 1. We create a Context with createContext()
 * 2. We create a Provider component that wraps our app
 * 3. The Provider manages the auth state (user, loading, etc.)
 * 4. Any child component can access this state with useAuth() hook
 * 
 * Benefits:
 * - Centralized auth state management
 * - No prop drilling (passing props through many levels)
 * - Automatic session persistence (survives page refresh)
 * - Easy to use from any component
 * 
 * Example usage:
 * ```tsx
 * function ProfilePage() {
 *   const { user, logout } = useAuth();
 *   
 *   if (!user) return <div>Please log in</div>;
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {user.username}!</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authService from '../services/authService';
import type { User, RegisterRequest, LoginRequest } from '../types/api';

/**
 * AuthContextType defines the shape of our context
 * This tells TypeScript what data and functions are available
 */
interface AuthContextType {
  // Current user data (null if not logged in)
  user: User | null;
  
  // Loading state (true while checking if user is logged in)
  isLoading: boolean;
  
  // Is user authenticated?
  isAuthenticated: boolean;
  
  // Authentication functions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  
  // Update user data (after profile edit, for example)
  updateUser: (user: User) => void;
}

/**
 * Create the Context
 * 
 * We initialize it as undefined because we'll provide the actual value
 * in the AuthProvider component below.
 * 
 * The "undefined" is just a placeholder - components must be wrapped
 * in AuthProvider to access the real context value.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * 
 * This component wraps your app and provides auth state to all children.
 * It manages:
 * - Current user state
 * - Loading state
 * - Login/logout/register functions
 * - Session persistence (localStorage)
 * 
 * Props:
 * - children: The components to wrap (usually your entire app)
 */
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State for current user (null = not logged in)
  const [user, setUser] = useState<User | null>(null);
  
  // State for loading (true while checking localStorage on mount)
  const [isLoading, setIsLoading] = useState(true);
  
  /**
   * On component mount, check if user is already logged in
   * 
   * This runs once when the app starts.
   * We check localStorage for:
   * 1. Auth token (proves they logged in before)
   * 2. User data (their profile info)
   * 
   * If both exist, we restore the session automatically.
   * This is why you stay logged in when you refresh the page!
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem('authToken');
        
        if (token) {
          // We have a token, try to get user data
          const storedUser = authService.getCurrentUser();
          
          if (storedUser) {
            // Success! Restore the user session
            setUser(storedUser);
          } else {
            // Token exists but no user data - clear everything
            authService.logout();
          }
        }
      } catch (error) {
        // If anything goes wrong, clear auth data
        console.error('Error initializing auth:', error);
        authService.logout();
      } finally {
        // Done checking - stop showing loading state
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []); // Empty dependency array = run once on mount
  
  /**
   * Login Function
   * 
   * This function:
   * 1. Calls the auth service to login
   * 2. Stores the token and user data (done in authService)
   * 3. Updates the context state with user data
   * 
   * The component calling this can handle success/error:
   * ```tsx
   * try {
   *   await login({ email, password });
   *   navigate('/dashboard'); // Success!
   * } catch (error) {
   *   alert('Login failed'); // Error!
   * }
   * ```
   */
  const login = async (data: LoginRequest): Promise<void> => {
    try {
      // Call the auth service
      const response = await authService.login(data);
      
      // Update context state with user data
      setUser(response.user);
    } catch (error) {
      // Re-throw the error so the calling component can handle it
      throw error;
    }
  };
  
  /**
   * Register Function
   * 
   * Similar to login, but for new user registration.
   * After successful registration, the user is automatically logged in.
   */
  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      // Call the auth service
      const response = await authService.register(data);
      
      // Update context state with user data
      setUser(response.user);
    } catch (error) {
      // Re-throw the error so the calling component can handle it
      throw error;
    }
  };
  
  /**
   * Logout Function
   * 
   * This function:
   * 1. Clears the token and user data from localStorage
   * 2. Clears the user from context state
   * 3. User is now logged out!
   * 
   * Note: We don't need to call the backend because JWT tokens are stateless.
   * The token will simply expire on its own.
   */
  const logout = (): void => {
    // Clear localStorage
    authService.logout();
    
    // Clear context state
    setUser(null);
  };
  
  /**
   * Update User Function
   * 
   * This allows updating the user data in context without re-logging in.
   * Useful after profile updates, for example.
   * 
   * Example:
   * ```tsx
   * const { updateUser } = useAuth();
   * 
   * // After updating profile on backend
   * const updatedUser = await updateProfile(data);
   * updateUser(updatedUser); // Update context
   * ```
   */
  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    // Also update localStorage so it persists
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
  
  /**
   * The value object contains everything we want to share
   * This is what components will access when they use useAuth()
   */
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user, // Convert user to boolean (null = false, object = true)
    login,
    register,
    logout,
    updateUser,
  };
  
  /**
   * Render the Provider
   * 
   * The Provider component makes the value available to all children.
   * Any component inside <AuthProvider> can access this context.
   */
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * 
 * This is a custom hook that makes it easy to access the auth context.
 * 
 * Instead of:
 * ```tsx
 * const context = useContext(AuthContext);
 * if (!context) throw new Error('...');
 * ```
 * 
 * You can just:
 * ```tsx
 * const { user, login, logout } = useAuth();
 * ```
 * 
 * Much cleaner!
 * 
 * The hook also includes error checking to ensure it's used correctly.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  // If context is undefined, it means useAuth was called outside of AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Export the context itself (rarely needed, but available)
 * Most of the time you'll just use the useAuth() hook
 */
export default AuthContext;
