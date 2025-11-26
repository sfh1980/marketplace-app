/**
 * Component Exports
 * 
 * This barrel file exports all reusable components from a single location.
 * 
 * Benefits:
 * - Cleaner imports: import { Button, Input } from '@/components'
 * - Single source of truth for component exports
 * - Easy to add new components
 * - Better tree-shaking (bundler can remove unused components)
 * 
 * Usage in other files:
 * import { Button, Input, Card, Modal } from '../components';
 * 
 * Or with path alias (if configured):
 * import { Button, Input, Card, Modal } from '@/components';
 */

export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Modal } from './Modal';
export { ProtectedRoute } from './ProtectedRoute';

// Export types if needed
export type { default as ButtonProps } from './Button';
export type { default as InputProps } from './Input';
export type { default as CardProps } from './Card';
export type { default as ModalProps } from './Modal';
