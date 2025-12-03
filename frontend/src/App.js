import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import PartsList from './components/PartsList';
import PartsForm from './components/PartsForm';
import StockManagement from './components/StockManagement';
import ReorderTasks from './components/ReorderTasks';
import Analytics from './components/Analytics';
import './App.css';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/parts" element={<PartsList />} />
                    <Route path="/parts/new" element={<PartsForm />} />
                    <Route path="/parts/edit/:partId" element={<PartsForm />} />
                    <Route path="/stock" element={<StockManagement />} />
                    <Route path="/reorder" element={<ReorderTasks />} />
                    <Route path="/analytics" element={<Analytics />} />
                  </Routes>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

