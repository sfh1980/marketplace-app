/**
 * Card Component
 * 
 * A reusable card component for displaying content in elevated containers.
 * Cards are one of the most common UI patterns in modern web design.
 * 
 * Features:
 * - Multiple variants (default, outlined, elevated)
 * - Padding options (none, small, medium, large)
 * - Hover effect option
 * - Clickable card option (entire card is clickable)
 * - Header, body, and footer sections
 * - Flexible content composition
 * - Accessible (proper semantic HTML, keyboard navigation for clickable cards)
 * 
 * Usage:
 * <Card variant="elevated" padding="medium">
 *   <Card.Header>
 *     <h3>Card Title</h3>
 *   </Card.Header>
 *   <Card.Body>
 *     <p>Card content goes here</p>
 *   </Card.Body>
 *   <Card.Footer>
 *     <Button>Action</Button>
 *   </Card.Footer>
 * </Card>
 * 
 * Clickable card:
 * <Card hoverable onClick={() => navigate('/listing/123')}>
 *   <p>Click anywhere on this card</p>
 * </Card>
 */

import React from 'react';
import styles from './Card.module.css';

/**
 * Card Props Interface
 */
interface CardProps {
  /** Visual style variant of the card */
  variant?: 'default' | 'outlined' | 'elevated';
  
  /** Padding size inside the card */
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  /** Enable hover effect (lift and shadow) */
  hoverable?: boolean;
  
  /** Make the entire card clickable */
  onClick?: () => void;
  
  /** Custom class name */
  className?: string;
  
  /** Card content */
  children: React.ReactNode;
}

/**
 * Card Header Props
 */
interface CardSectionProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Main Card Component
 * 
 * This component demonstrates the Compound Component pattern.
 * Card.Header, Card.Body, and Card.Footer are sub-components that
 * provide semantic structure and consistent styling.
 * 
 * Benefits of this pattern:
 * - Clear, semantic API (Card.Header makes intent obvious)
 * - Flexible composition (use only the sections you need)
 * - Consistent styling (each section has predefined styles)
 * - Easy to maintain (styles are co-located)
 */
export const Card: React.FC<CardProps> & {
  Header: React.FC<CardSectionProps>;
  Body: React.FC<CardSectionProps>;
  Footer: React.FC<CardSectionProps>;
} = ({
  variant = 'default',
  padding = 'medium',
  hoverable = false,
  onClick,
  className = '',
  children,
  ...rest
}) => {
  /**
   * Determine if card should be interactive
   * A card is interactive if it has an onClick handler
   */
  const isClickable = Boolean(onClick);
  
  /**
   * Build card classes
   */
  const cardClasses = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--padding-${padding}`],
    hoverable && styles['card--hoverable'],
    isClickable && styles['card--clickable'],
    className
  ].filter(Boolean).join(' ');
  
  /**
   * Render as button if clickable, otherwise as div
   * 
   * Why? Clickable elements should be buttons or links for accessibility.
   * Screen readers and keyboard navigation work better with semantic HTML.
   */
  if (isClickable) {
    return (
      <button
        type="button"
        className={cardClasses}
        onClick={onClick}
        {...rest}
      >
        {children}
      </button>
    );
  }
  
  return (
    <div className={cardClasses} {...rest}>
      {children}
    </div>
  );
};

/**
 * Card Header Sub-component
 * 
 * Use for card titles, actions, and header content.
 * Typically contains headings, icons, or action buttons.
 */
Card.Header = ({ className = '', children }: CardSectionProps) => {
  const headerClasses = [
    styles.card__header,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={headerClasses}>
      {children}
    </div>
  );
};

/**
 * Card Body Sub-component
 * 
 * Use for main card content.
 * This is where most of your content goes.
 */
Card.Body = ({ className = '', children }: CardSectionProps) => {
  const bodyClasses = [
    styles.card__body,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={bodyClasses}>
      {children}
    </div>
  );
};

/**
 * Card Footer Sub-component
 * 
 * Use for card actions, metadata, or footer content.
 * Typically contains buttons, links, or supplementary information.
 */
Card.Footer = ({ className = '', children }: CardSectionProps) => {
  const footerClasses = [
    styles.card__footer,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={footerClasses}>
      {children}
    </div>
  );
};

// Display names for debugging
Card.displayName = 'Card';
Card.Header.displayName = 'Card.Header';
Card.Body.displayName = 'Card.Body';
Card.Footer.displayName = 'Card.Footer';

export default Card;
