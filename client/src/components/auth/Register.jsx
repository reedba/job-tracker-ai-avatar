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
  Grid,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { register } from '../../features/auth/authSlice';
import '../../styles/auth.scss';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone_number: '',
    password: '',
    password_confirmation: ''
  });

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };

  // Phone number validation
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?1?\d{10,15}$/;
    if (!phone) return true; // Phone is optional
    return phoneRegex.test(phone.replace(/[-\s()]/g, '')); // Remove common phone number formatting
  };

  // Password validation
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 6;

    const errors = [];
    if (!hasUpperCase) errors.push('uppercase letter');
    if (!hasLowerCase) errors.push('lowercase letter');
    if (!hasNumber) errors.push('number');
    if (!hasSymbol) errors.push('special character');
    if (!hasMinLength) errors.push('minimum of 6 characters');

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate email
    if (name === 'email') {
      if (!validateEmail(value)) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    }

    // Validate phone number
    if (name === 'phone_number') {
      const formattedPhone = value.replace(/[-\s()]/g, '');
      if (value && !validatePhoneNumber(formattedPhone)) {
        setValidationErrors(prev => ({
          ...prev,
          phone_number: 'Please enter a valid phone number (10-15 digits)'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          phone_number: ''
        }));
      }
    }

    // Validate password
    if (name === 'password') {
      const passwordErrors = validatePassword(value);
      if (passwordErrors.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          password: `Password must contain: ${passwordErrors.join(', ')}`
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          password: ''
        }));
      }

      // Check password confirmation
      if (formData.password_confirmation && value !== formData.password_confirmation) {
        setValidationErrors(prev => ({
          ...prev,
          password_confirmation: 'Passwords do not match'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          password_confirmation: ''
        }));
      }
    }

    // Validate password confirmation
    if (name === 'password_confirmation') {
      if (value !== formData.password) {
        setValidationErrors(prev => ({
          ...prev,
          password_confirmation: 'Passwords do not match'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          password_confirmation: ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const emailValid = validateEmail(formData.email);
    const passwordErrors = validatePassword(formData.password);
    const passwordsMatch = formData.password === formData.password_confirmation;
    const phoneValid = formData.phone_number ? validatePhoneNumber(formData.phone_number) : true;

    if (!emailValid || passwordErrors.length > 0 || !passwordsMatch || !phoneValid) {
      setValidationErrors({
        email: !emailValid ? 'Please enter a valid email address' : '',
        password: passwordErrors.length > 0 ? `Password must contain: ${passwordErrors.join(', ')}` : '',
        password_confirmation: !passwordsMatch ? 'Passwords do not match' : '',
        phone_number: !phoneValid ? 'Please enter a valid phone number (10-15 digits)' : ''
      });
      return;
    }

    const result = await dispatch(register(formData));
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
              Create Account
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Fill out the form to get started
            </Typography>
          </div>

          {error && (
            <Alert severity="error" className="error-alert">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <TextField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="email"
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />

            <TextField
              label="Phone Number"
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              fullWidth
              autoComplete="tel"
              error={!!validationErrors.phone_number}
              helperText={validationErrors.phone_number}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.password}
              helperText={validationErrors.password}
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

            <TextField
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.password_confirmation}
              helperText={validationErrors.password_confirmation}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>

              <div className="divider">
                <span>OR</span>
              </div>

              <Button
                component={Link}
                to="/login"
                variant="outlined"
                color="primary"
                fullWidth
              >
                Already have an account? Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
