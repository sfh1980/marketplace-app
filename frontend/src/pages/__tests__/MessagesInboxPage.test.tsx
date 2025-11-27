/**
 * Messages Inbox Page Tests
 * 
 * These tests verify that the Messages Inbox page:
 * - Displays conversations correctly
 * - Shows unread message indicators
 * - Displays message previews
 * - Handles navigation to conversation threads
 * - Shows empty state when no conversations
 * - Handles loading and error states
 * 
 * Educational Focus:
 * - Testing list interfaces with dynamic data
 * - Testing unread badges and visual indicators
 * - Testing navigation between pages
 * - Testing timestamp formatting
 * - Testing empty states
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MessagesInboxPage from '../MessagesInboxPage';
import * as messageService from '../../services/messageService';
import type { User, Conversation } from '../../types/api';

// Mock axios to avoid import.meta issues
jest.mock('../../lib/axios');

// Mock the message service
jest.mock('../../services/messageService');

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

describe('MessagesInboxPage', () => {
  let queryClient: QueryClient;
  
  const mockUser: User = {
    id: 'user-123',
    email: 'buyer@example.com',
    emailVerified: true,
    username: 'testbuyer',
    profilePicture: null,
    location: 'San Francisco, CA',
    joinDate: '2024-01-01T00:00:00.000Z',
    averageRating: 4.5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
  
  const mockConversations: Conversation[] = [
    {
      userId: 'seller-1',
      user: {
        id: 'seller-1',
        username: 'johnseller',
        profilePicture: 'https://example.com/john.jpg',
        email: 'john@example.com',
        emailVerified: true,
        location: 'New York, NY',
        joinDate: '2024-01-01T00:00:00.000Z',
        averageRating: 4.8,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      listingId: 'listing-1',
      listing: {
        id: 'listing-1',
        sellerId: 'seller-1',
        title: 'Vintage Camera',
        description: 'Classic film camera',
        price: 150,
        listingType: 'item',
        pricingType: null,
        category: 'electronics',
        images: [],
        status: 'active',
        location: 'New York, NY',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      },
      lastMessage: {
        id: 'msg-1',
        content: 'Is this camera still available?',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        senderId: 'user-123',
        read: true,
      },
      unreadCount: 0,
    },
    {
      userId: 'seller-2',
      user: {
        id: 'seller-2',
        username: 'janeseller',
        profilePicture: null,
        email: 'jane@example.com',
        emailVerified: true,
        location: 'Los Angeles, CA',
        joinDate: '2024-01-01T00:00:00.000Z',
        averageRating: 4.5,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      listingId: null,
      lastMessage: {
        id: 'msg-2',
        content: 'Thanks for your interest! Yes, it is available.',
        createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        senderId: 'seller-2',
        read: false,
      },
      unreadCount: 2,
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
    (messageService.getConversations as jest.Mock).mockResolvedValue(mockConversations);
    
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
   * Test: Page displays conversations
   * 
   * Verifies that the page fetches and displays all conversations
   * for the current user.
   */
  it('displays user conversations', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('johnseller')).toBeInTheDocument();
    });
    
    expect(screen.getByText('janeseller')).toBeInTheDocument();
    expect(messageService.getConversations).toHaveBeenCalled();
  });
  
  /**
   * Test: Shows message previews
   * 
   * Verifies that the last message in each conversation is displayed
   * as a preview.
   */
  it('shows message previews', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('johnseller')).toBeInTheDocument();
    });
    
    // Check for message previews
    expect(screen.getByText(/Is this camera still available/)).toBeInTheDocument();
    expect(screen.getByText(/Thanks for your interest/)).toBeInTheDocument();
  });
  
  /**
   * Test: Shows "You:" prefix for sent messages
   * 
   * Verifies that messages sent by the current user show a "You:" prefix
   * in the preview.
   */
  it('shows "You:" prefix for messages sent by current user', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('johnseller')).toBeInTheDocument();
    });
    
    // First conversation has message sent by current user
    expect(screen.getByText('You:')).toBeInTheDocument();
  });
  
  /**
   * Test: Shows unread badges
   * 
   * Verifies that conversations with unread messages display
   * an unread count badge.
   */
  it('shows unread badges for conversations with unread messages', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('janeseller')).toBeInTheDocument();
    });
    
    // Check for unread badge with count
    const unreadBadge = document.querySelector('.unreadBadge');
    expect(unreadBadge).toBeInTheDocument();
    expect(unreadBadge).toHaveTextContent('2');
  });
  
  /**
   * Test: Navigates to conversation when clicked
   * 
   * Verifies that clicking on a conversation navigates to the
   * full conversation thread.
   */
  it('navigates to conversation when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('johnseller')).toBeInTheDocument();
    });
    
    // Click on first conversation
    const conversationCard = screen.getByText('johnseller').closest('.conversationCard');
    if (conversationCard) {
      await user.click(conversationCard);
    }
    
    expect(mockNavigate).toHaveBeenCalledWith('/messages/seller-1');
  });
  
  /**
   * Test: Shows associated listing
   * 
   * Verifies that conversations associated with a listing display
   * the listing information.
   */
  it('shows associated listing when present', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('johnseller')).toBeInTheDocument();
    });
    
    // Check for listing title
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
  });
  
  /**
   * Test: Shows profile picture or placeholder
   * 
   * Verifies that user avatars are displayed, with placeholders
   * for users without profile pictures.
   */
  it('shows profile picture or placeholder', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('johnseller')).toBeInTheDocument();
    });
    
    // Check for profile picture (img element)
    const profilePic = screen.getByAltText('johnseller');
    expect(profilePic).toBeInTheDocument();
    expect(profilePic).toHaveAttribute('src', 'https://example.com/john.jpg');
    
    // Check for placeholder (first letter of username)
    const placeholder = document.querySelector('.avatarPlaceholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent('J'); // First letter of "janeseller"
  });
  
  /**
   * Test: Shows empty state when no conversations
   * 
   * Verifies that an appropriate message is shown when the user
   * has no conversations.
   */
  it('shows empty state when user has no conversations', async () => {
    (messageService.getConversations as jest.Mock).mockResolvedValue([]);
    
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No Messages Yet')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/You don't have any conversations yet/)).toBeInTheDocument();
  });
  
  /**
   * Test: Browse listings button in empty state
   * 
   * Verifies that the empty state includes a button to browse listings.
   */
  it('shows browse listings button in empty state', async () => {
    const user = userEvent.setup();
    (messageService.getConversations as jest.Mock).mockResolvedValue([]);
    
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No Messages Yet')).toBeInTheDocument();
    });
    
    const browseButton = screen.getByText('Browse Listings');
    await user.click(browseButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
  
  /**
   * Test: Shows loading state
   * 
   * Verifies that a loading indicator is shown while fetching conversations.
   */
  it('shows loading state while fetching conversations', () => {
    (messageService.getConversations as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    renderWithProviders(<MessagesInboxPage />);
    
    expect(screen.getByText('Loading your messages...')).toBeInTheDocument();
  });
  
  /**
   * Test: Shows error state on fetch failure
   * 
   * Verifies that an error message is shown if fetching conversations fails.
   */
  it('shows error state when fetching fails', async () => {
    (messageService.getConversations as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch conversations')
    );
    
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Unable to Load Messages')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Failed to fetch conversations')).toBeInTheDocument();
  });
  
  /**
   * Test: Shows conversation count in header
   * 
   * Verifies that the header displays the total number of conversations.
   */
  it('shows conversation count in header', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('johnseller')).toBeInTheDocument();
    });
    
    expect(screen.getByText('2 conversations')).toBeInTheDocument();
  });
  
  /**
   * Test: Formats timestamps correctly
   * 
   * Verifies that message timestamps are formatted in a user-friendly way.
   */
  it('formats timestamps correctly', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('johnseller')).toBeInTheDocument();
    });
    
    // Check for relative time formatting
    expect(screen.getByText(/hour/)).toBeInTheDocument(); // "1 hour ago"
    expect(screen.getByText(/minute/)).toBeInTheDocument(); // "5 minutes ago"
  });
  
  /**
   * Test: Redirects to login if not authenticated
   * 
   * Verifies that unauthenticated users are redirected to the login page.
   */
  it('redirects to login if user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
      updateUser: jest.fn(),
    });
    
    renderWithProviders(<MessagesInboxPage />);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
  
  /**
   * Test: Highlights unread conversations
   * 
   * Verifies that conversations with unread messages have visual distinction.
   */
  it('highlights conversations with unread messages', async () => {
    renderWithProviders(<MessagesInboxPage />);
    
    await waitFor(() => {
      expect(screen.getByText('janeseller')).toBeInTheDocument();
    });
    
    // Find the conversation card with unread messages
    const unreadCard = screen.getByText('janeseller').closest('.conversationCard');
    expect(unreadCard).toHaveClass('hasUnread');
  });
});
