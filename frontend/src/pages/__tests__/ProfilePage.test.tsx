/**
 * ProfilePage Tests
 * 
 * These tests verify that the ProfilePage component:
 * - Renders user information correctly
 * - Displays user's listings
 * - Shows loading states while fetching data
 * - Handles errors appropriately
 * - Handles missing userId gracefully
 * 
 * Testing Approach:
 * - Use React Testing Library for component testing
 * - Mock React Query hooks to avoid real API calls
 * - Test different states (loading, success, error)
 * - Verify UI updates based on data
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import { ProfilePage } from '../ProfilePage';
import * as userService from '../../services/userService';

// Mock axios to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the user service
jest.mock('../../services/userService');

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/**
 * Test Wrapper Component
 * 
 * Wraps the ProfilePage with required providers and routing context.
 */
const renderProfilePage = (userId: string = 'test-user-123') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Set the initial URL before rendering
  window.history.pushState({}, '', `/profile/${userId}`);

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/profile/:userId" element={<ProfilePage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

/**
 * Mock user data for testing
 */
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
  username: 'testuser',
  profilePicture: 'https://example.com/avatar.jpg',
  location: 'San Francisco, CA',
  joinDate: '2024-01-15T00:00:00.000Z',
  averageRating: 4.5,
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

/**
 * Mock listings data for testing
 */
const mockListings = [
  {
    id: 'listing-1',
    sellerId: 'test-user-123',
    title: 'Vintage Camera',
    description: 'Great condition vintage camera',
    price: 150,
    listingType: 'item' as const,
    pricingType: null,
    category: 'Electronics',
    images: ['https://example.com/camera.jpg'],
    status: 'active' as const,
    location: 'San Francisco, CA',
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z',
  },
  {
    id: 'listing-2',
    sellerId: 'test-user-123',
    title: 'Web Development Services',
    description: 'Professional web development',
    price: 75,
    listingType: 'service' as const,
    pricingType: 'hourly' as const,
    category: 'Services',
    images: [],
    status: 'active' as const,
    location: 'San Francisco, CA',
    createdAt: '2024-01-21T00:00:00.000Z',
    updatedAt: '2024-01-21T00:00:00.000Z',
  },
];

describe('ProfilePage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage with auth data
    const mockAuthUser = {
      id: 'current-user-123',
      email: 'current@example.com',
      emailVerified: true,
      username: 'currentuser',
      profilePicture: null,
      location: null,
      joinDate: '2024-01-01T00:00:00.000Z',
      averageRating: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('user', JSON.stringify(mockAuthUser));
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Test: Page renders loading state initially
   */
  it('shows loading state while fetching user data', () => {
    // Mock service to return pending promise
    (userService.getUserProfile as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    (userService.getUserListings as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    renderProfilePage();

    // Check for loading message
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  /**
   * Test: Page renders user information correctly
   */
  it('displays user profile information when data is loaded', async () => {
    // Mock successful API responses
    (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (userService.getUserListings as jest.Mock).mockResolvedValue(mockListings);

    renderProfilePage();

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Check for user information
    expect(screen.getByText(/member since/i)).toBeInTheDocument();
    expect(screen.getByText(/january 2024/i)).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText(/⭐ 4.5/)).toBeInTheDocument();
    expect(screen.getByText(/email verified/i)).toBeInTheDocument();
  });

  /**
   * Test: Page displays user's listings
   */
  it('displays user listings when data is loaded', async () => {
    (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (userService.getUserListings as jest.Mock).mockResolvedValue(mockListings);

    renderProfilePage();

    // Wait for listings to load
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });

    // Check for both listings
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    expect(screen.getByText('Web Development Services')).toBeInTheDocument();
    
    // Check for prices
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$75.00/hr')).toBeInTheDocument();
    
    // Check for listing type badges
    expect(screen.getByText('📦 Item')).toBeInTheDocument();
    expect(screen.getByText('🛠️ Service')).toBeInTheDocument();
  });

  /**
   * Test: Page shows empty state when user has no listings
   */
  it('shows empty state when user has no listings', async () => {
    (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (userService.getUserListings as jest.Mock).mockResolvedValue([]);

    renderProfilePage();

    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText(/hasn't posted any listings yet/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Page handles error when fetching user profile fails
   */
  it('displays error message when user profile fetch fails', async () => {
    (userService.getUserProfile as jest.Mock).mockRejectedValue(
      new Error('User not found')
    );
    (userService.getUserListings as jest.Mock).mockResolvedValue([]);

    renderProfilePage();

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/unable to load profile/i)).toBeInTheDocument();
    });

    // Check for error details
    expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });

  /**
   * Test: Page shows loading state for listings separately
   */
  it('shows loading state for listings while user profile is displayed', async () => {
    (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (userService.getUserListings as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderProfilePage();

    // Wait for user profile to load
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Check that listings are still loading
    expect(screen.getByText(/loading listings/i)).toBeInTheDocument();
  });

  /**
   * Test: Clicking on a listing navigates to listing detail page
   */
  it('navigates to listing detail when listing card is clicked', async () => {
    const user = userEvent.setup();
    
    (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (userService.getUserListings as jest.Mock).mockResolvedValue(mockListings);

    renderProfilePage();

    // Wait for listings to load
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });

    // Click on the first listing
    const listingCard = screen.getByText('Vintage Camera').closest('button');
    if (listingCard) {
      await user.click(listingCard);
    }

    // Verify navigation was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/listings/listing-1');
    });
  });

  /**
   * Test: Profile picture displays correctly
   */
  it('displays profile picture when available', async () => {
    (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (userService.getUserListings as jest.Mock).mockResolvedValue([]);

    renderProfilePage();

    // Wait for profile to load
    await waitFor(() => {
      const avatar = screen.getByAltText(/testuser's profile/i);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  /**
   * Test: Shows placeholder when no profile picture
   */
  it('shows placeholder avatar when no profile picture', async () => {
    const userWithoutPicture = { ...mockUser, profilePicture: null };
    
    (userService.getUserProfile as jest.Mock).mockResolvedValue(userWithoutPicture);
    (userService.getUserListings as jest.Mock).mockResolvedValue([]);

    renderProfilePage();

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Check for placeholder with first letter
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "testuser"
  });

  /**
   * Test: Shows "No ratings yet" when user has no ratings
   */
  it('displays "No ratings yet" when average rating is 0', async () => {
    const userWithoutRating = { ...mockUser, averageRating: 0 };
    
    (userService.getUserProfile as jest.Mock).mockResolvedValue(userWithoutRating);
    (userService.getUserListings as jest.Mock).mockResolvedValue([]);

    renderProfilePage();

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText(/no ratings yet/i)).toBeInTheDocument();
    });
  });
});
