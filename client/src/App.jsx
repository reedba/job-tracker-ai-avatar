import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from './theme/darkTheme';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import AIAvatar from './components/ai/AIAvatar';
import Layout from './components/layout/Layout';
import { useSelector } from 'react-redux';

import axios from 'axios';
// Remove axios configuration since it's handled in api.js

function App() {
  const { token } = useSelector((state) => state.auth);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={!token ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!token ? <Register /> : <Navigate to="/dashboard" />}
          />

          {/* Protected routes - redirect to login if not authenticated */}
          <Route
            path="/dashboard"
            element={token ? <Dashboard /> : <Navigate to="/login" />}
          />

          {/* Publicly accessible AI Avatar page: show toolbar only when logged in */}
          <Route
            path="/avatar"
            element={
              token ? (
                <Layout>
                  <AIAvatar />
                </Layout>
              ) : (
                // Public view without the app Layout/toolbar
                <AIAvatar />
              )
            }
          />

          {/* Redirect root to login or dashboard based on auth state */}
          <Route
            path="/"
            element={
              <Navigate to={token ? '/dashboard' : '/login'} />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
