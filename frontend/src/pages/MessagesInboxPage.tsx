/**
 * Messages Inbox Page
 * 
 * This page displays all conversations for the authenticated user.
 * It demonstrates several important messaging UI patterns:
 * 
 * 1. Conversation List:
 *    - Display all conversations sorted by most recent activity
 *    - Show preview of last message
 *    - Display other user's information
 * 
 * 2. Unread Indicators:
 *    - Badge showing unread message count
 *    - Visual distinction for conversations with unread messages
 *    - Helps users prioritize which conversations to check
 * 
 * 3. Navigation:
 *    - Click on conversation to view full thread
 *    - Navigate to conversation page with other user's ID
 * 
 * 4. Empty States:
 *    - Friendly message when no conversations exist
 *    - Encourages users to browse listings and start conversations
 * 
 * Educational Focus:
 * - Inbox UI patterns (conversation list, previews, timestamps)
 * - Unread badges (visual indicators, positioning, styling)
 * - List rendering with React
 * - Navigation between pages
 * - Loading and error states
 * 
 * Requirements: 6.3 (inbox organization)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getConversations } from '../services/messageService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { Conversation } from '../types/api';
import styles from './MessagesInboxPage.module.css';

/**
 * MessagesInboxPage Component
 * 
 * Displays all conversations for the current user with unread indicators.
 * Users can click on a conversation to view the full message thread.
 */
export const MessagesInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  /**
   * Fetch conversations for current user
   * 
   * The API returns conversations sorted by most recent activity.
   * Each conversation includes:
   * - Other user's information (username, profile picture)
   * - Last message preview
   * - Unread message count
   * - Associated listing (if any)
   * 
   * React Query Benefits:
   * - Automatic caching (conversations are cached for 5 minutes)
   * - Automatic refetching when window regains focus
   * - Loading and error states handled automatically
   * - Easy to invalidate cache when new messages arrive
   */
  const {
    data: conversations = [],
    isLoading,
    isError,
    error,
  } = useQuery<Conversation[]>({
    queryKey: ['conversations', user?.id],
    queryFn: getConversations,
    enabled: !!user?.id, // Only fetch if user is logged in
    refetchInterval: 30000, // Refetch every 30 seconds to check for new messages
  });
  
  /**
   * Handle Conversation Click
   * 
   * Navigate to the conversation page to view full message thread.
   * We pass the other user's ID in the URL.
   * 
   * URL Pattern: /messages/:otherUserId
   * Example: /messages/abc123 (where abc123 is the other user's ID)
   */
  const handleConversationClick = (conversation: Conversation) => {
    navigate(`/messages/${conversation.userId}`);
  };
  
  /**
   * Format Timestamp
   * 
   * Display relative time for recent messages, absolute time for older ones.
   * Examples:
   * - "Just now" (< 1 minute ago)
   * - "5 minutes ago"
   * - "2 hours ago"
   * - "Yesterday"
   * - "Jan 15" (older messages)
   * 
   * This helps users quickly understand message recency.
   */
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // For older messages, show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };
  
  /**
   * Truncate Message Preview
   * 
   * Limit message preview to reasonable length.
   * Long messages are truncated with ellipsis (...).
   * 
   * This keeps the inbox clean and scannable.
   */
  const truncateMessage = (content: string, maxLength: number = 80): string => {
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };
  
  /**
   * Redirect if not logged in
   * 
   * This page requires authentication.
   * If no user is logged in, redirect to login page.
   */
  if (!user) {
    navigate('/login');
    return null;
  }
  
  /**
   * Loading State
   * 
   * Show spinner while fetching conversations.
   * This provides feedback that data is being loaded.
   */
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Card variant="elevated" padding="large">
          <Card.Body>
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading your messages...</p>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  /**
   * Error State
   * 
   * Show error message if conversations fail to load.
   * Provide option to retry.
   */
  if (isError) {
    return (
      <div className={styles.container}>
        <Card variant="outlined" padding="large">
          <Card.Body>
            <h2 className={styles.errorTitle}>Unable to Load Messages</h2>
            <p className={styles.errorText}>
              {error instanceof Error 
                ? error.message 
                : 'An error occurred while loading your messages.'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Messages</h1>
        {conversations.length > 0 && (
          <p className={styles.subtitle}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      
      {/* Conversations List */}
      {conversations.length === 0 ? (
        // Empty State - No conversations yet
        <Card variant="outlined" padding="large">
          <Card.Body>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <h2>No Messages Yet</h2>
              <p>
                You don't have any conversations yet. 
                Browse listings and contact sellers to start a conversation!
              </p>
              <Button onClick={() => navigate('/')}>
                Browse Listings
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        // Display conversations
        <div className={styles.conversationsContainer}>
          {conversations.map((conversation) => (
            <Card
              key={conversation.userId}
              variant="outlined"
              className={`${styles.conversationCard} ${
                conversation.unreadCount > 0 ? styles.hasUnread : ''
              }`}
              onClick={() => handleConversationClick(conversation)}
            >
              <div className={styles.conversationContent}>
                {/* User Avatar */}
                <div className={styles.avatarContainer}>
                  {conversation.user.profilePicture ? (
                    <img
                      src={conversation.user.profilePicture}
                      alt={conversation.user.username}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {conversation.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Unread Badge */}
                  {conversation.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
                
                {/* Conversation Details */}
                <div className={styles.conversationDetails}>
                  {/* Username and Timestamp */}
                  <div className={styles.conversationHeader}>
                    <h3 className={styles.username}>
                      {conversation.user.username}
                    </h3>
                    <span className={styles.timestamp}>
                      {formatTimestamp(conversation.lastMessage.createdAt)}
                    </span>
                  </div>
                  
                  {/* Message Preview */}
                  <p className={`${styles.messagePreview} ${
                    conversation.unreadCount > 0 ? styles.unreadPreview : ''
                  }`}>
                    {/* Show "You: " prefix if current user sent the last message */}
                    {conversation.lastMessage.senderId === user.id && (
                      <span className={styles.youPrefix}>You: </span>
                    )}
                    {truncateMessage(conversation.lastMessage.content)}
                  </p>
                  
                  {/* Associated Listing (if any) */}
                  {conversation.listing && (
                    <div className={styles.listingInfo}>
                      <span className={styles.listingIcon}>📦</span>
                      <span className={styles.listingTitle}>
                        {conversation.listing.title}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Chevron Icon (indicates clickable) */}
                <div className={styles.chevron}>
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
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesInboxPage;
