import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for React Query
// This manages server state, caching, and data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      retry: 1, // Retry failed requests once
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <header className="app-header">
            <h1>Marketplace Platform</h1>
            <p>Welcome to the Marketplace - Coming Soon!</p>
          </header>
          
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

// Temporary homepage component
function HomePage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>🚀 Project Setup Complete!</h2>
      <p>The frontend and backend are ready for development.</p>
      <p>Next steps: Set up the database and start building features.</p>
    </div>
  );
}

export default App;
