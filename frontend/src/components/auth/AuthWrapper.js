import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Verification from './Verification';
import ForgotPassword from './ForgotPassword';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function AuthWrapper({ onAuthSuccess }) {
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('arkas_token');
      if (token) {
        try {
          const response = await axios.get(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          onAuthSuccess(response.data);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('arkas_token');
          localStorage.removeItem('arkas_user');
        }
      }
    };

    checkAuth();
  }, [onAuthSuccess]);

  const handleLoginSuccess = (userData) => {
    onAuthSuccess(userData);
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentView('register');
  };

  const handleSwitchToForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  switch (currentView) {
    case 'register':
      return (
        <Register
          onBackToLogin={handleBackToLogin}
        />
      );
    
    case 'forgot-password':
      return (
        <ForgotPassword
          onBackToLogin={handleBackToLogin}
        />
      );
    
    default:
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      );
  }
}