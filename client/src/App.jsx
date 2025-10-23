import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from './theme/darkTheme';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import { useSelector } from 'react-redux';

// Configure axios defaults
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:3000/api'; // Your Rails API URL
axios.defaults.headers.common['Accept'] = 'application/json';

// Axios interceptor for JWT token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
