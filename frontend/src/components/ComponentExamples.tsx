/**
 * Component Examples
 * 
 * This file demonstrates how to use the reusable UI components.
 * It serves as both documentation and a visual test of the components.
 * 
 * You can import this component into your App.tsx to see all components in action.
 * 
 * Usage:
 * import ComponentExamples from './components/ComponentExamples';
 * 
 * function App() {
 *   return <ComponentExamples />;
 * }
 */

import React, { useState } from 'react';
import { Button, Input, Card, Modal } from './index';

export const ComponentExamples: React.FC = () => {
  // State for modal demo
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for input demo
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Simple email validation for demo
  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Component Examples</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>
        Demonstration of reusable UI components
      </p>
      
      {/* Button Examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Buttons</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          Different button variants and sizes
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <Button variant="primary" size="small">Small</Button>
          <Button variant="primary" size="medium">Medium</Button>
          <Button variant="primary" size="large">Large</Button>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <Button variant="primary" loading>Loading...</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        
        <Button variant="primary" fullWidth>Full Width Button</Button>
      </section>
      
      {/* Input Examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Inputs</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          Form inputs with validation states
        </p>
        
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            onBlur={() => validateEmail(email)}
            error={emailError}
            required
            helperText="We'll never share your email"
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
          />
          
          <Input
            label="Success State"
            type="text"
            value="Valid input"
            success
            readOnly
          />
          
          <Input
            label="Disabled Input"
            type="text"
            value="Cannot edit"
            disabled
          />
        </div>
      </section>
      
      {/* Card Examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Cards</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          Content containers with different variants
        </p>
        
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <Card variant="default" padding="medium">
            <Card.Header>
              <h3>Default Card</h3>
            </Card.Header>
            <Card.Body>
              <p>This is a default card with subtle background and light border.</p>
            </Card.Body>
            <Card.Footer>
              <Button variant="ghost" size="small">Cancel</Button>
              <Button variant="primary" size="small">Action</Button>
            </Card.Footer>
          </Card>
          
          <Card variant="outlined" padding="medium">
            <Card.Header>
              <h3>Outlined Card</h3>
            </Card.Header>
            <Card.Body>
              <p>This is an outlined card with clear border and no background change.</p>
            </Card.Body>
          </Card>
          
          <Card variant="elevated" padding="medium" hoverable>
            <Card.Header>
              <h3>Elevated Card</h3>
            </Card.Header>
            <Card.Body>
              <p>This is an elevated card with shadow. Hover over it to see the effect!</p>
            </Card.Body>
          </Card>
          
          <Card
            variant="outlined"
            padding="medium"
            hoverable
            onClick={() => alert('Card clicked!')}
          >
            <Card.Body>
              <h3>Clickable Card</h3>
              <p>This entire card is clickable. Try clicking anywhere on it!</p>
            </Card.Body>
          </Card>
        </div>
      </section>
      
      {/* Modal Examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Modal</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          Dialog overlays for focused interactions
        </p>
        
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Open Modal
        </Button>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          size="medium"
        >
          <Modal.Body>
            <p>This is a modal dialog. You can:</p>
            <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
              <li>Click the X button to close</li>
              <li>Press ESC key to close</li>
              <li>Click outside the modal to close</li>
              <li>Use the Cancel button below</li>
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>
      </section>
      
      {/* Component Composition Example */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Component Composition</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          Combining components to create complex UIs
        </p>
        
        <Card variant="elevated" padding="large">
          <Card.Header>
            <h3>Create New Listing</h3>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <Input
                label="Listing Title"
                type="text"
                placeholder="e.g., Vintage Bicycle"
                required
              />
              <Input
                label="Price"
                type="number"
                placeholder="0.00"
                required
              />
              <Input
                label="Description"
                type="text"
                placeholder="Describe your item..."
                helperText="Provide as much detail as possible"
              />
            </div>
          </Card.Body>
          <Card.Footer>
            <Button variant="ghost">Save Draft</Button>
            <Button variant="primary">Publish Listing</Button>
          </Card.Footer>
        </Card>
      </section>
    </div>
  );
};

export default ComponentExamples;
