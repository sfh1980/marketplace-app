/**
 * SkipLink Component
 * 
 * A skip link allows keyboard users to bypass repetitive navigation
 * and jump directly to the main content of the page.
 * 
 * Why Skip Links Matter:
 * - Keyboard users would otherwise have to tab through all navigation links
 * - Screen reader users benefit from quick access to main content
 * - Required for WCAG 2.1 Level A compliance
 * 
 * How It Works:
 * - Hidden by default (positioned off-screen)
 * - Becomes visible when focused (Tab key)
 * - Clicking it moves focus to main content
 * 
 * Educational Focus:
 * - Accessibility best practices
 * - Focus management
 * - CSS positioning techniques
 */

import React from 'react';
import styles from './SkipLink.module.css';

/**
 * SkipLink Props Interface
 */
interface SkipLinkProps {
  /** 
   * The ID of the element to skip to
   * Default: "main-content"
   */
  targetId?: string;
  
  /**
   * The text to display in the skip link
   * Default: "Skip to main content"
   */
  children?: React.ReactNode;
}

/**
 * SkipLink Component
 * 
 * This component provides a keyboard-accessible way to skip navigation.
 * 
 * Implementation Details:
 * 1. Positioned absolutely off-screen by default
 * 2. Moves into view when focused
 * 3. Uses a hash link (#main-content) to jump to content
 * 4. Styled to be visually prominent when visible
 * 
 * Usage:
 * ```tsx
 * // In App.tsx or layout component
 * <SkipLink />
 * 
 * // In your main content area
 * <main id="main-content">
 *   {content}
 * </main>
 * ```
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  children = 'Skip to main content',
}) => {
  return (
    <a
      href={`#${targetId}`}
      className={styles.skipLink}
    >
      {children}
    </a>
  );
};

/**
 * Display name for debugging
 */
SkipLink.displayName = 'SkipLink';

export default SkipLink;
