/**
 * Listing Edit Page Tests
 * 
 * These tests verify that the listing edit page works correctly.
 * 
 * What we test:
 * 1. Form initialization with existing data
 * 2. Form validation
 * 3. Successful update submission
 * 4. Authorization (only owner can edit)
 * 5. Error handling
 * 6. Read-only fields (listing type, pricing type, images)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import ListingEditPage from '../ListingEditPage';
import * as listingService from '../../services/listingService';
import * as searchService from '../../services/searchService';
import type { User, Listing, Category } from '../../types/api';

// Mock axios first (before importing services)
jest.mock('../../lib/axios');

// Mock the services
jest.mock('../../services/listingService');
jest.mock('../../services/searchService');

const mockedListingService = listingService as jest.Mocked<typeof listingService>;
const mockedSearchService = searchService as jest.Mocked<typeof searchService>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
const mockUseAuth = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

describe('ListingEditPage', () => {
  let queryClient: QueryClient;
  
  const mockUser: User = {
    id: 'user-1',
    email: 'seller@example.com',
    emailVerified: true,
    username: 'seller',
    profilePicture: null,
    location: 'San Francisco, CA',
    joinDate: '2024-01-01T00:00:00.000Z',
    averageRating: 4.5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
  
  const mockListing: Listing = {
    id: 'listing-1',
    sellerId: 'user-1',
    seller: mockUser,
    title: 'Vintage Camera',
    description: 'A beautiful vintage camera in excellent condition. Perfect for collectors.',
    price: 150,
    listingType: 'item',
    pricingType: null,
    category: 'electronics',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    status: 'active',
    location: 'San Francisco, CA',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  };
  
  const mockCategories: Category[] = [
    { id: '1', name: 'Electronics', slug: 'electronics', description: 'Electronic items' },
    { id: '2', name: 'Furniture', slug: 'furniture', description: 'Furniture items' },
    { id: '3', name: 'Clothing', slug: 'clothing', description: 'Clothing items' },
  ];
  
  const renderWithProviders = (user: User | null = mockUser) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Mock useAuth to return the user
    mockUseAuth.mockReturnValue({
      user,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      isLoading: false,
    });
    
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/listings/:listingId/edit" element={<ListingEditPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock successful API calls by default
    mockedListingService.getListingById.mockResolvedValue(mockListing);
    mockedSearchService.getCategories.mockResolvedValue(mockCategories);
    mockedListingService.updateListing.mockResolvedValue({
      ...mockListing,
      title: 'Updated Title',
    });
    
    // Set up the URL to include the listing ID
    window.history.pushState({}, '', '/listings/listing-1/edit');
  });
  
  describe('Form Initialization', () => {
    it('should load and display existing listing data', async () => {
      renderWithProviders();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Check all fields are pre-filled
      expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/beautiful vintage camera/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
      expect(screen.getByDisplayValue('San Francisco, CA')).toBeInTheDocument();
      
      // Check category is selected
      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      expect(categorySelect.value).toBe('electronics');
    });
    
    it('should display listing type as read-only', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Item for Sale')).toBeInTheDocument();
      });
      
      // Should not have radio buttons for listing type
      expect(screen.queryByRole('radio', { name: /item for sale/i })).not.toBeInTheDocument();
    });
    
    it('should display current images', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        const images = screen.getAllByAltText(/listing image/i);
        expect(images).toHaveLength(2);
      });
    });
    
    it('should show loading state while fetching data', () => {
      mockedListingService.getListingById.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      renderWithProviders();
      
      expect(screen.getByText(/loading listing/i)).toBeInTheDocument();
    });
  });
  
  describe('Authorization', () => {
    it('should redirect if user is not logged in', () => {
      renderWithProviders(null);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    
    it('should show error and redirect if user does not own the listing', async () => {
      const differentUser: User = {
        ...mockUser,
        id: 'user-2',
        username: 'otheruser',
      };
      
      renderWithProviders(differentUser);
      
      await waitFor(() => {
        expect(screen.getByText(/you do not have permission/i)).toBeInTheDocument();
      });
      
      // Should redirect after 2 seconds
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/listings/listing-1');
      }, { timeout: 3000 });
    });
  });
  
  describe('Form Validation', () => {
    it('should validate title length', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Clear title and enter short title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'ABC');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/title must be between 5 and 100 characters/i)).toBeInTheDocument();
      });
    });
    
    it('should validate description length', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Clear description and enter short description
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Too short');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/description must be between 20 and 2000 characters/i)).toBeInTheDocument();
      });
    });
    
    it('should validate price is positive', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Enter negative price
      const priceInput = screen.getByLabelText(/price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '-10');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid price greater than 0/i)).toBeInTheDocument();
      });
    });
    
    it('should show error if no changes detected', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Submit without making any changes
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/no changes detected/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Form Submission', () => {
    it('should submit only changed fields', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Change only the title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Vintage Camera');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Should call updateListing with only changed fields
      await waitFor(() => {
        expect(mockedListingService.updateListing).toHaveBeenCalledWith(
          'listing-1',
          { title: 'Updated Vintage Camera' }
        );
      });
    });
    
    it('should submit multiple changed fields', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Change title and price
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Camera');
      
      const priceInput = screen.getByLabelText(/price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '200');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Should call updateListing with both changed fields
      await waitFor(() => {
        expect(mockedListingService.updateListing).toHaveBeenCalledWith(
          'listing-1',
          { 
            title: 'Updated Camera',
            price: 200
          }
        );
      });
    });
    
    it('should redirect to listing detail page on success', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Change title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Camera');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Should redirect to listing detail page
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/listings/listing-1');
      });
    });
    
    it('should show error message on submission failure', async () => {
      const user = userEvent.setup();
      mockedListingService.updateListing.mockRejectedValue({
        response: {
          data: {
            error: {
              message: 'Failed to update listing',
            },
          },
        },
      });
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Change title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Camera');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/failed to update listing/i)).toBeInTheDocument();
      });
    });
    
    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      mockedListingService.updateListing.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Change title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Camera');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);
      
      // Button should be disabled and show loading text
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Cancel Button', () => {
    it('should navigate back to listing detail page when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Camera')).toBeInTheDocument();
      });
      
      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Should navigate to listing detail page
      expect(mockNavigate).toHaveBeenCalledWith('/listings/listing-1');
    });
  });
  
  describe('Service Listings', () => {
    it('should display pricing type as read-only for services', async () => {
      const serviceListing: Listing = {
        ...mockListing,
        listingType: 'service',
        pricingType: 'hourly',
      };
      
      mockedListingService.getListingById.mockResolvedValue(serviceListing);
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Service Offered')).toBeInTheDocument();
      });
      
      // Should show pricing type as read-only
      expect(screen.getByText('Per Hour')).toBeInTheDocument();
      
      // Should not have select dropdown for pricing type
      expect(screen.queryByRole('combobox', { name: /pricing type/i })).not.toBeInTheDocument();
    });
  });
  
  describe('Error Handling', () => {
    it('should show error if listing fails to load', async () => {
      mockedListingService.getListingById.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load listing/i)).toBeInTheDocument();
      });
      
      // Should show go back button
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });
  });
});
