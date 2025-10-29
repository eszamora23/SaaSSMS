import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { register, clearError } from '../store/slices/authSlice';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organizationName: '',
    subdomain: '',
    country: 'US',
    timezone: 'America/New_York',
  });

  const [success, setSuccess] = useState(false);

  // Subdomain validation state
  const [subdomainState, setSubdomainState] = useState({
    checking: false,
    available: null,
    error: null,
  });

  const checkTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Check subdomain availability with debounce
  const checkSubdomain = useCallback(async (subdomain) => {
    if (!subdomain || subdomain.length < 2) {
      setSubdomainState({ checking: false, available: null, error: null });
      return;
    }

    // Validate format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      setSubdomainState({
        checking: false,
        available: false,
        error: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
      });
      return;
    }

    setSubdomainState({ checking: true, available: null, error: null });

    try {
      const response = await axios.get(`${API_URL}/api/v1/auth/check-subdomain`, {
        params: { subdomain },
      });

      setSubdomainState({
        checking: false,
        available: response.data.data.available,
        error: response.data.data.available ? null : 'Subdomain is already taken',
      });
    } catch (error) {
      setSubdomainState({
        checking: false,
        available: false,
        error: 'Error checking subdomain availability',
      });
    }
  }, []);

  // Debounced subdomain check
  useEffect(() => {
    const subdomain = formData.subdomain.trim().toLowerCase();

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(() => {
      checkSubdomain(subdomain);
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [formData.subdomain, checkSubdomain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    // Check if subdomain is available before submitting
    if (!subdomainState.available) {
      return;
    }

    const result = await dispatch(register(formData));

    if (register.fulfilled.match(result)) {
      setSuccess(true);

      // Redirect to the organization's subdomain login page
      setTimeout(() => {
        const currentHost = window.location.hostname;
        const currentPort = window.location.port;
        const protocol = window.location.protocol;

        // Determine base domain for subdomain creation
        let baseDomain = 'localhost'; // Default to localhost for development

        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
          baseDomain = 'localhost';
        } else if (currentHost.includes('lvh.me')) {
          baseDomain = 'lvh.me';
        } else {
          // Production: use the current domain
          const parts = currentHost.split('.');
          if (parts.length >= 2) {
            baseDomain = parts.slice(-2).join('.');
          }
        }

        // Construct subdomain URL
        const subdomainUrl = `${protocol}//${formData.subdomain}.${baseDomain}${currentPort ? ':' + currentPort : ''}/login`;

        // Use window.location for cross-subdomain navigation
        window.location.href = subdomainUrl;
      }, 3000);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            SaaS SMS Calendar
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Create your organization account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration successful! Redirecting to your organization's login page at {formData.subdomain}.
              {(() => {
                const currentHost = window.location.hostname;
                if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                  return 'localhost';
                } else if (currentHost.includes('lvh.me')) {
                  return 'lvh.me';
                } else {
                  return currentHost;
                }
              })()}...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="organizationName"
              label="Organization Name"
              name="organizationName"
              autoFocus
              value={formData.organizationName}
              onChange={handleChange}
              disabled={loading || success}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="subdomain"
              label="Subdomain"
              name="subdomain"
              value={formData.subdomain}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setFormData((prev) => ({ ...prev, subdomain: value }));
              }}
              disabled={loading || success}
              error={!!subdomainState.error}
              helperText={
                subdomainState.error ||
                (formData.subdomain && (() => {
                  const currentHost = window.location.hostname;
                  const currentPort = window.location.port;
                  let baseDomain = 'localhost';

                  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                    baseDomain = 'localhost';
                  } else if (currentHost.includes('lvh.me')) {
                    baseDomain = 'lvh.me';
                  } else {
                    baseDomain = currentHost;
                  }

                  return `Your site will be: ${formData.subdomain}.${baseDomain}${currentPort ? ':' + currentPort : ''}`;
                })())
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {subdomainState.checking && <CircularProgress size={20} />}
                    {subdomainState.available === true && (
                      <CheckCircleIcon color="success" />
                    )}
                    {subdomainState.available === false && (
                      <ErrorIcon color="error" />
                    )}
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading || success}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading || success}
            />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="country"
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading || success}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="timezone"
                  label="Timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  disabled={loading || success}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || success}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
