import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Simulator from './pages/Simulator';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import AIChatbot from './components/AIChatbot';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    return children;
  };

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-background">
        {isAuthenticated && <Sidebar />}
        <div className="flex-1 flex flex-col relative overflow-y-auto">
          {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
          <main className="p-6">
            <Routes>
              <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
              <Route 
                path="/" 
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/transactions" 
                element={<ProtectedRoute><Transactions /></ProtectedRoute>} 
              />
              <Route 
                path="/simulator" 
                element={<ProtectedRoute><Simulator /></ProtectedRoute>} 
              />
              <Route 
                path="/analytics" 
                element={<ProtectedRoute><Analytics /></ProtectedRoute>} 
              />
            </Routes>
          </main>
          {isAuthenticated && <AIChatbot />}
        </div>
      </div>
    </Router>
  );
};

export default App;
