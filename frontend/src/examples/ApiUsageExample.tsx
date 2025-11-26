/**
 * API Usage Examples
 * 
 * This file demonstrates how to use the API client and React Query hooks.
 * These are examples for learning - not meant to be used in production.
 */

import { useState } from 'react';
import { useLogin, useRegister } from '../hooks/useAuth';
import { useListings, useCreateListing } from '../hooks/useListings';
import { useSearchListings, useCategories } from '../hooks/useSearch';

/**
 * Example 1: Authentication
 * 
 * Shows how to use login and register mutations
 */
export function AuthExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          console.log('Logged in!', data.user);
          alert(`Welcome back, ${data.user.username}!`);
        },
        onError: (error: Error) => {
          console.error('Login failed:', error);
          alert('Login failed. Please check your credentials.');
        },
      }
    );
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    registerMutation.mutate(
      { email, password, username: email.split('@')[0] },
      {
        onSuccess: (data) => {
          console.log('Registered!', data.user);
          alert(`Account created! Welcome, ${data.user.username}!`);
        },
        onError: (error: Error) => {
          console.error('Registration failed:', error);
          alert('Registration failed. Email might already be in use.');
        },
      }
    );
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Authentication Example</h2>
      
      <form onSubmit={handleLogin}>
        <h3>Login</h3>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', margin: '10px 0', padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', margin: '10px 0', padding: '8px' }}
        />
        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </button>
        <button
          type="button"
          onClick={handleRegister}
          disabled={registerMutation.isPending}
          style={{ marginLeft: '10px' }}
        >
          {registerMutation.isPending ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      {loginMutation.isError && (
        <p style={{ color: 'red' }}>Login error: {loginMutation.error.message}</p>
      )}
      {registerMutation.isError && (
        <p style={{ color: 'red' }}>Registration error: {registerMutation.error.message}</p>
      )}
    </div>
  );
}

/**
 * Example 2: Fetching Data
 * 
 * Shows how to fetch and display listings with loading and error states
 */
export function ListingsExample() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useListings(page, 10);
  
  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading listings...</div>;
  }
  
  if (isError) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error loading listings: {error.message}
      </div>
    );
  }
  
  if (!data) {
    return <div style={{ padding: '20px' }}>No data available</div>;
  }
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Listings Example</h2>
      <p>
        Showing {data.data.length} of {data.pagination.total} listings
        (Page {data.pagination.page} of {data.pagination.totalPages})
      </p>
      
      <div style={{ display: 'grid', gap: '10px' }}>
        {data.data.map((listing) => (
          <div
            key={listing.id}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <h3>{listing.title}</h3>
            <p>{listing.description}</p>
            <p>
              <strong>${listing.price}</strong> - {listing.listingType}
            </p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              {listing.location} • {new Date(listing.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span style={{ margin: '0 10px' }}>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= data.pagination.totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * Example 3: Creating Data
 * 
 * Shows how to create a new listing with a mutation
 */
export function CreateListingExample() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  const createMutation = useCreateListing();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate(
      {
        title,
        description,
        price: parseFloat(price),
        listingType: 'item',
        category: 'electronics',
        location: 'San Francisco, CA',
      },
      {
        onSuccess: (newListing) => {
          console.log('Created listing:', newListing);
          alert(`Listing "${newListing.title}" created successfully!`);
          // Reset form
          setTitle('');
          setDescription('');
          setPrice('');
        },
        onError: (error: Error) => {
          console.error('Failed to create listing:', error);
          alert('Failed to create listing. Please try again.');
        },
      }
    );
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Create Listing Example</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          step="0.01"
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
      
      {createMutation.isError && (
        <p style={{ color: 'red' }}>Error: {createMutation.error.message}</p>
      )}
      {createMutation.isSuccess && (
        <p style={{ color: 'green' }}>Listing created successfully!</p>
      )}
    </div>
  );
}

/**
 * Example 4: Search with Filters
 * 
 * Shows how to search listings with various filters
 */
export function SearchExample() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  const { data: categories } = useCategories();
  const { data, isLoading, isError } = useSearchListings({
    query: query || undefined,
    category: category || undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
  });
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Search Example</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        />
        
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        >
          <option value="">All Categories</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name} ({cat.listingCount})
            </option>
          ))}
        </select>
        
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ padding: '8px', width: '100px' }}
        />
      </div>
      
      {isLoading && <p>Searching...</p>}
      {isError && <p style={{ color: 'red' }}>Search failed</p>}
      
      {data && (
        <div>
          <p>Found {data.pagination.total} results</p>
          <div style={{ display: 'grid', gap: '10px' }}>
            {data.data.map((listing) => (
              <div
                key={listing.id}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <h3>{listing.title}</h3>
                <p>
                  <strong>${listing.price}</strong> - {listing.category}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main component that shows all examples
 */
export function ApiExamples() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>API Client Usage Examples</h1>
      <p>
        These examples demonstrate how to use the API client and React Query hooks.
        Open the browser console to see detailed logs.
      </p>
      
      <AuthExample />
      <ListingsExample />
      <CreateListingExample />
      <SearchExample />
    </div>
  );
}
