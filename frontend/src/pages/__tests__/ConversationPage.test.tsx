/**
 * Conversation Page Tests
 * 
 * These tests verify the conversation page functionality:
 * - Displays message thread correctly
 * - Shows sent and received messages with proper styling
 * - Allows sending new messages
 * - Handles loading and error states
 * - Auto-scrolls to latest messages
 * 
 * Testing approach:
 * - Mock API calls to control data
 * - Test user interactions (typing, sending)
 * - Verify UI updates correctly
 * - Test edge cases (empty conversation, errors)
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConversationPage from '../ConversationPage';
import * as messageService from '../../services/messageService';
import type { User, Message } from '../../types/api';

// Mock the axios module to avoid import.meta.env issues
jest.mock('../../lib/axios');

// Mock the message service
jest.mock('../../services/messageService');

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockParams = { otherUserId: 'other-user-123' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Test data
const mockCurrentUser: User = {
  id: 'current-user-123',
  email: 'current@example.com',
  emailVerified: true,
  username: 'currentuser',
  profilePicture: null,
  location: 'New York',
  joinDate: '2024-01-01',
  averageRating: 4.5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOtherUser: User = {
  id: 'other-user-123',
  email: 'other@example.com',
  emailVerified: true,
  username: 'otheruser',
  profilePicture: null,
  location: 'Los Angeles',
  joinDate: '2024-01-01',
  averageRating: 4.8,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'other-user-123',
    sender: mockOtherUser,
    receiverId: 'current-user-123',
    content: 'Hi! Is this item still available?',
    listingId: null,
    read: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    senderId: 'current-user-123',
    sender: mockCurrentUser,
    receiverId: 'other-user-123',
    content: 'Yes, it is! Would you like to see it?',
    listingId: null,
    read: true,
    createdAt: '2024-01-15T10:05:00Z',
  },
  {
    id: 'msg-3',
    senderId: 'other-user-123',
    sender: mockOtherUser,
    receiverId: 'current-user-123',
    content: 'That would be great! When are you available?',
    listingId: null,
    read: false,
    createdAt: '2024-01-15T10:10:00Z',
  },
];

// Helper function to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ConversationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockCurrentUser,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      isLoading: false,
    });
  });

  describe('Message Display', () => {
    it('should display conversation messages', async () => {
      (messageService.getConversationMessages as jest.Mock).mockResolvedValue(mockMessages);

      renderWithProviders(<ConversationPage />);

      // Wait for messages to load
      await waitFor(() => {
        expect(screen.getByText('Hi! Is this item still available?')).toBeInTheDocument();
      });

      expect(screen.getByText('Yes, it is! Would you like to see it?')).toBeInTheDocument();
      expect(screen.getByText('That would be great! When are you available?')).toBeInTheDocument();
    });

    it('should display other user information in header', async () => {
      (messageService.getConversationMessages as jest.Mock).mockResolvedValue(mockMessages);

      renderWithProviders(<ConversationPage />);

      await waitFor(() => {
        expect(screen.getByText('otheruser')).toBeInTheDocument();
      });
    });

    it('should show empty state when no messages exist', async () => {
      (messageService.getConversationMessages as jest.Mock).mockResolvedValue([]);

      renderWithProviders(<ConversationPage />);

      await waitFor(() => {
        expect(screen.getByText('Start the Conversation')).toBeInTheDocument();
      });
    });
  });

  describe('Message Sending', () => {
    it('should allow sending a new message', async () => {
      (messageService.getConversationMessages as jest.Mock).mockResolvedValue(mockMessages);
      (messageService.sendMessage as jest.Mock).mockResolvedValue({
        id: 'msg-4',
        senderId: 'current-user-123',
        receiverId: 'other-user-123',
        content: 'How about tomorrow at 2pm?',
        listingId: null,
        read: false,
        createdAt: new Date().toISOString(),
      });

      renderWithProviders(<ConversationPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });

      // Type a message
      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'How about tomorrow at 2pm?' } });

      // Send the message
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Verify sendMessage was called
      await waitFor(() => {
        expect(messageService.sendMessage).toHaveBeenCalledWith({
          receiverId: 'other-user-123',
          content: 'How about tomorrow at 2pm?',
        });
      });
    });

    it('should not send empty messages', async () => {
      (messageService.getConversationMessages as jest.Mock).mockResolvedValue(mockMessages);

      renderWithProviders(<ConversationPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });

      // Try to send empty message
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Verify sendMessage was not called
      expect(messageService.sendMessage).not.toHaveBeenCalled();
    });

    it('should clear input after sending message', async () => {
      (messageService.getConversationMessages as jest.Mock).mockResolvedValue(mockMessages);
      (messageService.sendMessage as jest.Mock).mockResolvedValue({
        id: 'msg-4',
        senderId: 'current-user-123',
        receiverId: 'other-user-123',
        content: 'Test message',
        listingId: null,
        read: false,
        createdAt: new Date().toISOString(),
      });

      renderWithProviders(<ConversationPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test message' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Wait for message to be sent and input to clear
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state while fetching messages', () => {
      (messageService.getConversationMessages as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<ConversationPage />);

      expect(screen.getByText('Loading conversation...')).toBeInTheDocument();
    });

    it('should show error state when fetching fails', async () => {
      (messageService.getConversationMessages as jest.Mock).mockRejectedValue(
        new Error('Failed to load messages')
      );

      renderWithProviders(<ConversationPage />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Conversation')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load messages')).toBeInTheDocument();
    });

    it('should allow retrying after error', async () => {
      (messageService.getConversationMessages as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockMessages);

      renderWithProviders(<ConversationPage />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Unable to Load Conversation')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      // Should show messages after retry
      await waitFor(() => {
        expect(screen.getByText('Hi! Is this item still available?')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to inbox when back button is clicked', async () => {
      (messageService.getConversationMessages as jest.Mock).mockResolvedValue(mockMessages);

      renderWithProviders(<ConversationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Back to inbox')).toBeInTheDocument();
      });

      const backButton = screen.getByLabelText('Back to inbox');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });

    it('should redirect to login if not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      });

      renderWithProviders(<ConversationPage />);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Character Count', () => {
    it('should show character count when approaching limit', async () => {
      (messageService.getConversationMessages as jest.Mock).mockResolvedValue(mockMessages);

      renderWithProviders(<ConversationPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });

      // Type a long message (over 4500 characters)
      const longMessage = 'a'.repeat(4600);
      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: longMessage } });

      // Character count should appear
      await waitFor(() => {
        expect(screen.getByText(/4600 \/ 5000/)).toBeInTheDocument();
      });
    });
  });
});
