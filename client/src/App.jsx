import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from './theme/darkTheme';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
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
