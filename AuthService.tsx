// Authentication service for DeGeNz Lounge
import { createContext, useState, useEffect, useContext } from 'react';

// Create authentication context
const AuthContext = createContext(null);

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('degenz_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('degenz_user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call to your backend
      // For demo purposes, we'll simulate a successful login
      if (email && password) {
        const user = {
          id: 'user-' + Date.now(),
          email,
          name: email.split('@')[0],
          plan: 'free', // Default plan
          createdAt: new Date().toISOString()
        };
        
        // Store user in localStorage
        localStorage.setItem('degenz_user', JSON.stringify(user));
        setCurrentUser(user);
        return user;
      } else {
        throw new Error('Email and password are required');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call to your backend
      // For demo purposes, we'll simulate a successful registration
      if (name && email && password) {
        const user = {
          id: 'user-' + Date.now(),
          email,
          name,
          plan: 'free', // Default plan
          createdAt: new Date().toISOString()
        };
        
        // Store user in localStorage
        localStorage.setItem('degenz_user', JSON.stringify(user));
        setCurrentUser(user);
        return user;
      } else {
        throw new Error('All fields are required');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('degenz_user');
    setCurrentUser(null);
  };

  // Update user plan
  const updatePlan = (plan) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      plan
    };
    
    localStorage.setItem('degenz_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  // Check if user has access to a feature based on their plan
  const hasAccess = (feature) => {
    if (!currentUser) return false;
    
    const planFeatures = {
      free: ['basic_agents', 'single_sandbox', 'limited_messages'],
      pro: ['unlimited_agents', 'multiple_sandboxes', 'more_messages', 'manager_agent', 'agent_export'],
      enterprise: ['unlimited_agents', 'unlimited_sandboxes', 'unlimited_messages', 'advanced_manager', 'priority_support']
    };
    
    return planFeatures[currentUser.plan]?.includes(feature) || false;
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updatePlan,
    hasAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
