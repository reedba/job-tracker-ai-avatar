import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { login } from '../../features/auth/authSlice';
import '../../styles/auth.scss';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(formData));
    if (!result.error) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardContent>
          <div className="auth-header">
            <Typography variant="h4" component="h1">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Sign in to continue to your dashboard
            </Typography>
          </div>

          {error && (
            <Alert severity="error" className="error-alert">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <TextField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="email"
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <div className="form-actions">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <div className="divider">
                <span>OR</span>
              </div>

              <Button
                component={Link}
                to="/register"
                variant="outlined"
                color="primary"
                fullWidth
              >
                Create an Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
