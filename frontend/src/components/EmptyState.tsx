/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states when there's no data to show.
 * 
 * Key Features:
 * - Friendly, encouraging messaging
 * - Optional icon or illustration
 * - Call-to-action button
 * - Customizable content
 * - Responsive design
 * 
 * Educational Focus:
 * - Empty States: Why they matter for UX
 * - User Guidance: Helping users understand what to do next
 * - Visual Design: Making empty states friendly, not frustrating
 * - Call-to-Action: Encouraging user engagement
 * 
 * UX Best Practices:
 * 1. Never show a blank screen - always provide context
 * 2. Explain why there's no content
 * 3. Provide a clear next action
 * 4. Use friendly, encouraging language
 * 5. Add visual interest (icons, illustrations)
 * 6. Make it feel like an opportunity, not a problem
 * 
 * Empty State Guidelines:
 * - Bad: "No results"
 * - Good: "No listings yet. Be the first to post!"
 * 
 * - Bad: "Empty"
 * - Good: "Your inbox is empty. Browse listings to start conversations!"
 * 
 * - Bad: "0 items"
 * - Good: "You haven't saved any favorites yet. Click the heart icon on listings you like!"
 * 
 * Usage Examples:
 * ```tsx
 * // Simple empty state
 * <EmptyState
 *   title="No Listings Yet"
 *   message="You haven't created any listings yet."
 * />
 * 
 * // With action button
 * <EmptyState
 *   icon="📦"
 *   title="No Listings Yet"
 *   message="Create your first listing to get started!"
 *   action={
 *     <Button onClick={() => navigate('/listings/create')}>
 *       Create Listing
 *     </Button>
 *   }
 * />
 * 
 * // Search results empty state
 * <EmptyState
 *   icon="🔍"
 *   title="No Results Found"
 *   message="Try adjusting your search terms or filters."
 *   action={
 *     <Button onClick={clearFilters}>Clear Filters</Button>
 *   }
 * />
 * ```
 */

import React from 'react';
import styles from './EmptyState.module.css';

/**
 * EmptyState Props
 */
export interface EmptyStateProps {
  /** Icon or emoji to display */
  icon?: string | React.ReactNode;
  
  /** Title of the empty state */
  title: string;
  
  /** Descriptive message */
  message: string;
  
  /** Optional call-to-action button or custom content */
  action?: React.ReactNode;
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Additional CSS class name */
  className?: string;
}

/**
 * EmptyState Component
 * 
 * Displays a friendly empty state with optional action.
 * 
 * Why Empty States Matter:
 * - Prevent user confusion (blank screen = broken app?)
 * - Provide context about why there's no content
 * - Guide users toward their next action
 * - Reduce bounce rate (users don't leave out of confusion)
 * - Improve onboarding (help new users get started)
 * - Make the app feel polished and complete
 * 
 * Empty State Psychology:
 * - Empty states are opportunities, not failures
 * - Use positive, encouraging language
 * - Frame it as a fresh start or clean slate
 * - Emphasize what users CAN do, not what's missing
 * - Make it visually appealing (not sad or negative)
 * 
 * Examples of Good Empty States:
 * - Spotify: "Your library is empty. Let's find some music!"
 * - Airbnb: "No trips yet. Time to dust off your bags!"
 * - GitHub: "You don't have any repositories yet. Create your first!"
 * 
 * @param props - Component props
 * @returns EmptyState component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  size = 'medium',
  className = '',
}) => {
  /**
   * Build CSS class names
   */
  const containerClasses = [
    styles.container,
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {/* Icon */}
      {icon && (
        <div className={styles.icon} aria-hidden="true">
          {typeof icon === 'string' ? (
            <span className={styles.emoji}>{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      
      {/* Content */}
      <div className={styles.content}>
        {/* Title */}
        <h2 className={styles.title}>
          {title}
        </h2>
        
        {/* Message */}
        <p className={styles.message}>
          {message}
        </p>
        
        {/* Action */}
        {action && (
          <div className={styles.action}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Display name for debugging
 */
EmptyState.displayName = 'EmptyState';

export default EmptyState;
