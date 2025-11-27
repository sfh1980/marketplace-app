/**
 * Conversation Page
 * 
 * This page displays a full message thread between the authenticated user and another user.
 * It demonstrates several important chat UI patterns:
 * 
 * 1. Message Threading:
 *    - Display all messages in chronological order (oldest first)
 *    - Differentiate between sent and received messages
 *    - Show timestamps for each message
 *    - Auto-scroll to latest messages
 * 
 * 2. Message Composition:
 *    - Text input for composing new messages
 *    - Send button to submit messages
 *    - Character count and validation
 *    - Disable send while submitting
 * 
 * 3. Real-time Updates:
 *    - Automatically refetch messages periodically
 *    - Optimistic updates when sending messages
 *    - Scroll to bottom when new messages arrive
 * 
 * 4. User Experience:
 *    - Show other user's profile information
 *    - Loading states while fetching messages
 *    - Error handling with retry options
 *    - Empty state for new conversations
 * 
 * Educational Focus:
 * - Chat UI patterns (message bubbles, alignment, timestamps)
 * - Message threading (chronological display, sender identification)
 * - Form handling (controlled inputs, validation, submission)
 * - Auto-scrolling (useEffect, refs, scroll behavior)
 * - Optimistic updates (immediate UI feedback)
 * 
 * Requirements: 6.1 (send messages), 6.2 (receive messages), 6.4 (message timestamps)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  getConversationMessages, 
  sendMessage 
} from '../services/messageService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { Message } from '../types/api';
import styles from './ConversationPage.module.css';

/**
 * ConversationPage Component
 * 
 * Displays a full message thread with another user and allows sending new messages.
 * The URL parameter :otherUserId identifies the other user in the conversation.
 */
export const ConversationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const queryClient = useQueryClient();
  
  // Extract listing context from navigation state (if coming from listing detail page)
  // This allows us to associate the first message with a specific listing
  const locationState = location.state as { listingId?: string; listingTitle?: string } | null;
  const contextListingId = locationState?.listingId;
  const contextListingTitle = locationState?.listingTitle;
  
  // State for message composition
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  /**
   * Fetch conversation messages
   * 
   * The API returns all messages between the current user and the other user.
   * Messages are ordered chronologically (oldest first).
   * 
   * React Query Benefits:
   * - Automatic caching (messages cached for 5 minutes)
   * - Automatic refetching when window regains focus
   * - Polling for new messages (every 10 seconds)
   * - Loading and error states handled automatically
   */
  const {
    data: messagesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<{ messages: Message[] }>({
    queryKey: ['conversation', otherUserId],
    queryFn: async () => {
      if (!otherUserId) throw new Error('No user ID provided');
      const messages = await getConversationMessages(otherUserId);
      return { messages };
    },
    enabled: !!user?.id && !!otherUserId,
    refetchInterval: 10000, // Poll for new messages every 10 seconds
  });
  
  const messages = messagesData?.messages || [];
  
  /**
   * Send Message Mutation
   * 
   * Handles sending a new message to the other user.
   * Uses optimistic updates to immediately show the message in the UI.
   * 
   * Listing Context:
   * - If this conversation was initiated from a listing detail page,
   *   we include the listingId in the first message
   * - This associates the conversation with that specific listing
   * - Subsequent messages in the conversation don't need the listingId
   *   (the backend tracks the conversation context)
   * 
   * Optimistic Updates:
   * - Add message to UI immediately (before server confirms)
   * - If server request fails, remove the optimistic message
   * - Provides instant feedback to user
   * - Makes app feel faster and more responsive
   */
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!otherUserId) throw new Error('No recipient');
      
      // Include listing context only if:
      // 1. We have a listing ID from navigation state
      // 2. This is the first message (no existing messages)
      // This associates the conversation with the listing
      const shouldIncludeListingContext = contextListingId && messages.length === 0;
      
      return sendMessage({
        receiverId: otherUserId,
        content,
        ...(shouldIncludeListingContext && { listingId: contextListingId }),
      });
    },
    onMutate: async (content: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['conversation', otherUserId] });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<{ messages: Message[] }>([
        'conversation',
        otherUserId,
      ]);
      
      // Optimistically update to the new value
      if (previousMessages && user) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`, // Temporary ID
          senderId: user.id,
          receiverId: otherUserId!,
          content,
          listingId: null,
          read: false,
          createdAt: new Date().toISOString(),
        };
        
        queryClient.setQueryData<{ messages: Message[] }>(
          ['conversation', otherUserId],
          {
            messages: [...previousMessages.messages, optimisticMessage],
          }
        );
      }
      
      // Return context with previous value
      return { previousMessages };
    },
    onError: (err, content, context) => {
      // If mutation fails, roll back to previous value
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['conversation', otherUserId],
          context.previousMessages
        );
      }
    },
    onSuccess: () => {
      // Refetch to get the real message from server
      refetch();
      
      // Also invalidate conversations list to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
  
  /**
   * Handle Send Message
   * 
   * Validates and sends the message.
   * Clears the input field after successful send.
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate message content
    const trimmedContent = messageContent.trim();
    if (!trimmedContent || trimmedContent.length === 0) {
      return; // Don't send empty messages
    }
    
    if (trimmedContent.length > 5000) {
      alert('Message is too long. Maximum 5000 characters.');
      return;
    }
    
    // Send message
    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync(trimmedContent);
      setMessageContent(''); // Clear input after successful send
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  /**
   * Auto-scroll to Bottom
   * 
   * Automatically scroll to the bottom of the messages when:
   * - New messages are loaded
   * - User sends a message
   * - Component first renders
   * 
   * This ensures users always see the latest messages.
   * 
   * Why useEffect?
   * - Scrolling must happen after DOM updates
   * - useEffect runs after render, ensuring elements exist
   * - Dependencies ensure it runs when messages change
   * 
   * Note: scrollIntoView may not be available in test environments (jsdom)
   * so we check if it exists before calling it.
   */
  useEffect(() => {
    if (messagesEndRef.current && messagesEndRef.current.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  /**
   * Format Timestamp
   * 
   * Display time in a readable format for chat messages.
   * Examples:
   * - "10:30 AM" (today)
   * - "Yesterday 3:45 PM"
   * - "Jan 15, 2:20 PM" (older messages)
   */
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    if (diffDays === 0) {
      // Today - just show time
      return timeString;
    } else if (diffDays === 1) {
      // Yesterday
      return `Yesterday ${timeString}`;
    } else if (diffDays < 7) {
      // This week - show day name
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayName} ${timeString}`;
    } else {
      // Older - show date
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${dateStr}, ${timeString}`;
    }
  };
  
  /**
   * Get Other User Info
   * 
   * Extract information about the other user from messages.
   * We can get their username and profile picture from any message they sent.
   */
  const getOtherUserInfo = () => {
    // Find a message from the other user
    const messageFromOther = messages.find(
      (msg) => msg.senderId === otherUserId && msg.sender
    );
    
    if (messageFromOther?.sender) {
      return {
        username: messageFromOther.sender.username,
        profilePicture: messageFromOther.sender.profilePicture,
      };
    }
    
    // If no messages from other user yet, we don't have their info
    return null;
  };
  
  const otherUserInfo = getOtherUserInfo();
  
  /**
   * Redirect if not logged in
   */
  if (!user) {
    navigate('/login');
    return null;
  }
  
  /**
   * Validate otherUserId parameter
   */
  if (!otherUserId) {
    return (
      <div className={styles.container}>
        <Card variant="outlined" padding="large">
          <Card.Body>
            <h2 className={styles.errorTitle}>Invalid Conversation</h2>
            <p className={styles.errorText}>
              No user specified for this conversation.
            </p>
            <Button onClick={() => navigate('/messages')}>
              Back to Inbox
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Card variant="elevated" padding="large">
          <Card.Body>
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading conversation...</p>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  /**
   * Error State
   */
  if (isError) {
    return (
      <div className={styles.container}>
        <Card variant="outlined" padding="large">
          <Card.Body>
            <h2 className={styles.errorTitle}>Unable to Load Conversation</h2>
            <p className={styles.errorText}>
              {error instanceof Error
                ? error.message
                : 'An error occurred while loading the conversation.'}
            </p>
            <div className={styles.errorActions}>
              <Button onClick={() => refetch()}>Try Again</Button>
              <Button variant="secondary" onClick={() => navigate('/messages')}>
                Back to Inbox
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* Conversation Header */}
      <Card variant="elevated" className={styles.header}>
        <div className={styles.headerContent}>
          {/* Back Button */}
          <button
            className={styles.backButton}
            onClick={() => navigate('/messages')}
            aria-label="Back to inbox"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          {/* Other User Info */}
          <div className={styles.userInfo}>
            {otherUserInfo ? (
              <>
                {otherUserInfo.profilePicture ? (
                  <img
                    src={otherUserInfo.profilePicture}
                    alt={otherUserInfo.username}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {otherUserInfo.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <h1 className={styles.username}>{otherUserInfo.username}</h1>
              </>
            ) : (
              <h1 className={styles.username}>Conversation</h1>
            )}
          </div>
        </div>
      </Card>
      
      {/* Listing Context Banner */}
      {contextListingId && contextListingTitle && (
        <Card variant="outlined" className={styles.listingContext}>
          <div className={styles.listingContextContent}>
            <span className={styles.listingContextIcon}>📦</span>
            <div className={styles.listingContextText}>
              <span className={styles.listingContextLabel}>About listing:</span>
              <span className={styles.listingContextTitle}>{contextListingTitle}</span>
            </div>
          </div>
        </Card>
      )}
      
      {/* Messages Container */}
      <div className={styles.messagesWrapper}>
        <div 
          className={styles.messagesContainer}
          ref={messagesContainerRef}
        >
          {messages.length === 0 ? (
            // Empty State - No messages yet
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <h2>Start the Conversation</h2>
              <p>
                Send a message to {otherUserInfo?.username || 'this user'} to start chatting!
              </p>
            </div>
          ) : (
            // Display messages
            <div className={styles.messagesList}>
              {messages.map((message) => {
                const isSentByMe = message.senderId === user.id;
                
                return (
                  <div
                    key={message.id}
                    className={`${styles.messageWrapper} ${
                      isSentByMe ? styles.sentMessage : styles.receivedMessage
                    }`}
                  >
                    <div className={styles.messageBubble}>
                      <p className={styles.messageContent}>{message.content}</p>
                      <span className={styles.messageTimestamp}>
                        {formatTimestamp(message.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Scroll anchor - always at bottom */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* Message Composition Form */}
      <Card variant="elevated" className={styles.composerCard}>
        <form onSubmit={handleSendMessage} className={styles.composer}>
          <div className={styles.inputWrapper}>
            <Input
              type="text"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
              className={styles.messageInput}
              maxLength={5000}
            />
            {messageContent.length > 4500 && (
              <span className={styles.charCount}>
                {messageContent.length} / 5000
              </span>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={isSending || !messageContent.trim()}
            className={styles.sendButton}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ConversationPage;
