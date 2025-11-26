/**
 * My Listings Page Tests
 * 
 * These tests verify that the My Listings page:
 * - Displays user's listings correctly
 * - Shows action buttons (edit, delete, mark as sold)
 * - Handles delete confirmation
 * - Updates listing status
 * - Shows empty state when no listings
 * 
 * Educational Focus:
 * - Testing list management interfaces
 * - Testing action buttons and confirmations
 * - Testing mutations with React Query
 * - Testing modal interactions
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyListingsPage from '../MyListingsPage';
import * as userService from '../../services/userService';
import * as listingService from '../../services/listingService';
import type { User, Listing } from '../../types/api';

// Mock axios to avoid import.meta issues
jest.mock('../../lib/axios');

// Mock the services
jest.mock('../../services/userService');
jest.mock('../../services/listingService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('MyListingsPage', () => {
  let queryClient: QueryClient;
  
  const mockUser: User = {
    id: 'user-123',
    email: 'seller@example.com',
    emailVerified: true,
    username: 'testseller',
    profilePicture: null,
    location: 'San Francisco, CA',
    joinDate: '2024-01-01T00:00:00.000Z',
    averageRating: 4.5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
  
  const mockListings: Listing[] = [
    {
      id: 'listing-1',
      sellerId: 'user-123',
      title: 'Vintage Camera',
      description: 'Classic film camera in excellent condition',
      price: 150,
      listingType: 'item',
      pricingType: null,
      category: 'electronics',
      images: ['https://example.com/camera.jpg'],
      status: 'active',
      location: 'San Francisco, CA',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'listing-2',
      sellerId: 'user-123',
      title: 'Web Development Service',
      description: 'Professional web development services',
      price: 75,
      listingType: 'service',
      pricingType: 'hourly',
      category: 'services',
      images: [],
      status: 'sold',
      location: 'San Francisco, CA',
      createdAt: '2024-01-10T00:00:00.000Z',
      updatedAt: '2024-01-20T00:00:00.000Z',
    },
  ];
  
  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Reset mocks
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Setup default mock implementations
    (userService.getUserListings as jest.Mock).mockResolvedValue(mockListings);
    
    // Mock useAuth to return our mock user
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
      updateUser: jest.fn(),
    });
  });
  
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
  
  /**
   * Test: Page displays user's listings
   * 
   * Verifies that the page fetches and displays all listings
   * belonging to the current user.
   */
  it('displays user listings', async () => {
    renderWithProviders(<MyListingsPage />);
    
    // Wait for listings to load
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Web Development Service')).toBeInTheDocument();
    expect(userService.getUserListings).toHaveBeenCalledWith('user-123');
  });
  
  /**
   * Test: Shows status badges
   * 
   * Verifies that listings display their status (active/sold).
   */
  it('shows status badges for listings', async () => {
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
    
    // Check for status badges (using more specific selectors)
    const statusBadges = document.querySelectorAll('.statusBadge');
    expect(statusBadges).toHaveLength(2);
    expect(statusBadges[0]).toHaveTextContent('Active');
    expect(statusBadges[1]).toHaveTextContent('Sold');
  });
  
  /**
   * Test: Edit button navigates to edit page
   * 
   * Verifies that clicking the edit button navigates to the
   * listing edit page.
   */
  it('navigates to edit page when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
    
    // Find and click the first edit button
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/listings/listing-1/edit');
  });
  
  /**
   * Test: Mark as sold button updates status
   * 
   * Verifies that clicking "Mark as Sold" updates the listing status.
   */
  it('marks listing as sold when button is clicked', async () => {
    const user = userEvent.setup();
    (listingService.updateListingStatus as jest.Mock).mockResolvedValue({
      ...mockListings[0],
      status: 'sold',
    });
    
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
    
    // Find and click "Mark as Sold" button for active listing
    const markAsSoldButton = screen.getByText('Mark as Sold');
    await user.click(markAsSoldButton);
    
    await waitFor(() => {
      expect(listingService.updateListingStatus).toHaveBeenCalledWith(
        'listing-1',
        { status: 'sold' }
      );
    });
  });
  
  /**
   * Test: Mark as active button reactivates sold listing
   * 
   * Verifies that sold listings can be marked as active again.
   */
  it('marks sold listing as active when button is clicked', async () => {
    const user = userEvent.setup();
    (listingService.updateListingStatus as jest.Mock).mockResolvedValue({
      ...mockListings[1],
      status: 'active',
    });
    
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Web Development Service')).toBeInTheDocument();
    });
    
    // Find and click "Mark as Active" button for sold listing
    const markAsActiveButton = screen.getByText('Mark as Active');
    await user.click(markAsActiveButton);
    
    await waitFor(() => {
      expect(listingService.updateListingStatus).toHaveBeenCalledWith(
        'listing-2',
        { status: 'active' }
      );
    });
  });
  
  /**
   * Test: Delete button shows confirmation modal
   * 
   * Verifies that clicking delete shows a confirmation dialog
   * before actually deleting.
   */
  it('shows confirmation modal when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
    
    // Find and click the first delete button
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    // Check that confirmation modal appears
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });
  });
  
  /**
   * Test: Confirming delete removes listing
   * 
   * Verifies that confirming the delete action actually deletes
   * the listing.
   */
  it('deletes listing when confirmed', async () => {
    const user = userEvent.setup();
    (listingService.deleteListing as jest.Mock).mockResolvedValue(undefined);
    
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
    
    // Click delete button
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    // Wait for modal and click confirm
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /delete listing/i });
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(listingService.deleteListing).toHaveBeenCalledWith('listing-1');
    });
  });
  
  /**
   * Test: Canceling delete closes modal
   * 
   * Verifies that clicking cancel in the confirmation modal
   * closes it without deleting.
   */
  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
    
    // Click delete button
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    // Wait for modal
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    
    // Delete should not have been called
    expect(listingService.deleteListing).not.toHaveBeenCalled();
  });
  
  /**
   * Test: Shows empty state when no listings
   * 
   * Verifies that an appropriate message is shown when the user
   * has no listings.
   */
  it('shows empty state when user has no listings', async () => {
    (userService.getUserListings as jest.Mock).mockResolvedValue([]);
    
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No Listings Yet')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/You haven't created any listings yet/)).toBeInTheDocument();
  });
  
  /**
   * Test: Create listing button in empty state
   * 
   * Verifies that the empty state includes a button to create
   * the first listing.
   */
  it('shows create listing button in empty state', async () => {
    const user = userEvent.setup();
    (userService.getUserListings as jest.Mock).mockResolvedValue([]);
    
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No Listings Yet')).toBeInTheDocument();
    });
    
    const createButton = screen.getByText('Create Your First Listing');
    await user.click(createButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/listings/create');
  });
  
  /**
   * Test: Shows loading state
   * 
   * Verifies that a loading indicator is shown while fetching listings.
   */
  it('shows loading state while fetching listings', () => {
    (userService.getUserListings as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    renderWithProviders(<MyListingsPage />);
    
    expect(screen.getByText('Loading your listings...')).toBeInTheDocument();
  });
  
  /**
   * Test: Shows error state on fetch failure
   * 
   * Verifies that an error message is shown if fetching listings fails.
   */
  it('shows error state when fetching fails', async () => {
    (userService.getUserListings as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch listings')
    );
    
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Unable to Load Listings')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Failed to fetch listings')).toBeInTheDocument();
  });
  
  /**
   * Test: Create new listing button in header
   * 
   * Verifies that the header includes a button to create new listings.
   */
  it('has create new listing button in header', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyListingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });
    
    const createButton = screen.getByText('Create New Listing');
    await user.click(createButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/listings/create');
  });
});
