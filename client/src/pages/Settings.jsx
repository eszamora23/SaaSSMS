/**
 * Settings Page
 * Organization settings management
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Radio,
  RadioGroup,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Palette as PaletteIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  IntegrationInstructions as IntegrationIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  Voicemail as VoiceIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { organizationAPI, usersAPI } from '../services/api';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    timezone: 'America/New_York',
    country: 'US',
    branding: {
      primaryColor: '#1976D2',
      secondaryColor: '#DC004E',
    },
    businessHours: [],
    settings: {
      emailVerificationRequired: false,
    },
    twilioConfig: {
      accountSid: '',
      authToken: '',
      messagingServiceSid: '',
    },
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showAuthToken, setShowAuthToken] = useState(false);

  // Twilio Wizard State
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    accountSid: '',
    authToken: '',
    messagingServiceSid: '',
  });
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [fetchingNumbers, setFetchingNumbers] = useState(false);
  const [twilioNumbers, setTwilioNumbers] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [importing, setImporting] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Team Management State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'worker',
    bookingEnabled: true,
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  useEffect(() => {
    if (activeTab === 4) {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.get();
      const org = response.data.data.organization;
      setOrganization(org);
      setFormData({
        name: org.name || '',
        slug: org.slug || '',
        timezone: org.timezone || 'America/New_York',
        country: org.country || 'US',
        branding: {
          primaryColor: org.branding?.primaryColor || '#1976D2',
          secondaryColor: org.branding?.secondaryColor || '#DC004E',
        },
        businessHours: org.businessHours || [],
        settings: {
          emailVerificationRequired: org.settings?.emailVerificationRequired ?? false,
        },
        twilioConfig: {
          accountSid: org.twilioConfig?.accountSid || '',
          authToken: org.twilioConfig?.authToken || '',
          messagingServiceSid: org.twilioConfig?.messagingServiceSid || '',
        },
      });
    } catch (error) {
      console.error('Error fetching organization:', error);
      showSnackbar('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await organizationAPI.update(formData);
      showSnackbar('Settings saved successfully');
      fetchOrganization();
    } catch (error) {
      console.error('Error saving settings:', error);
      showSnackbar(error.response?.data?.error?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const toggleBusinessHours = (dayOfWeek) => {
    const exists = formData.businessHours.find((h) => h.dayOfWeek === dayOfWeek);
    if (exists) {
      setFormData({
        ...formData,
        businessHours: formData.businessHours.filter((h) => h.dayOfWeek !== dayOfWeek),
      });
    } else {
      setFormData({
        ...formData,
        businessHours: [
          ...formData.businessHours,
          { dayOfWeek, start: '09:00', end: '17:00' },
        ],
      });
    }
  };

  const updateBusinessHours = (dayOfWeek, field, value) => {
    setFormData({
      ...formData,
      businessHours: formData.businessHours.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      ),
    });
  };

  const isOpen = (dayOfWeek) => {
    return formData.businessHours.some((h) => h.dayOfWeek === dayOfWeek);
  };

  const getHours = (dayOfWeek) => {
    return formData.businessHours.find((h) => h.dayOfWeek === dayOfWeek) || { start: '09:00', end: '17:00' };
  };

  // Twilio Wizard Handlers
  const handleValidateCredentials = async () => {
    if (!wizardData.accountSid || !wizardData.authToken) {
      showSnackbar('Please enter both Account SID and Auth Token', 'error');
      return;
    }

    setValidating(true);
    setValidationError('');

    try {
      const response = await organizationAPI.validateTwilioConfig({
        accountSid: wizardData.accountSid,
        authToken: wizardData.authToken,
      });

      if (response.data.data.valid) {
        setValidated(true);
        showSnackbar('Credentials validated successfully!', 'success');
        setWizardStep(1);
      } else {
        setValidationError(response.data.data.error || 'Invalid credentials');
        showSnackbar(response.data.data.error || 'Invalid credentials', 'error');
      }
    } catch (error) {
      setValidationError(error.response?.data?.error?.message || 'Validation failed');
      showSnackbar(error.response?.data?.error?.message || 'Validation failed', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleFetchNumbers = async () => {
    setFetchingNumbers(true);
    try {
      const response = await organizationAPI.fetchTwilioNumbers({
        accountSid: wizardData.accountSid,
        authToken: wizardData.authToken,
      });

      const numbers = response.data.data.numbers || [];
      setTwilioNumbers(numbers);

      if (numbers.length === 0) {
        showSnackbar('No phone numbers found in your Twilio account', 'warning');
      } else {
        showSnackbar(`Found ${numbers.length} phone number(s)`, 'success');
        setWizardStep(2);
      }
    } catch (error) {
      showSnackbar(error.response?.data?.error?.message || 'Failed to fetch numbers', 'error');
    } finally {
      setFetchingNumbers(false);
    }
  };

  const handleToggleNumber = (number) => {
    setSelectedNumbers((prev) => {
      const exists = prev.find((n) => n.sid === number.sid);
      if (exists) {
        return prev.filter((n) => n.sid !== number.sid);
      } else {
        return [...prev, { ...number, isIVR: false }];
      }
    });
  };

  const handleSetAsIVR = (sid) => {
    setSelectedNumbers((prev) =>
      prev.map((n) => ({
        ...n,
        isIVR: n.sid === sid,
      }))
    );
  };

  const handleImportNumbers = async () => {
    if (selectedNumbers.length === 0) {
      showSnackbar('Please select at least one phone number', 'error');
      return;
    }

    setImporting(true);
    try {
      const response = await organizationAPI.importTwilioNumbers({
        accountSid: wizardData.accountSid,
        authToken: wizardData.authToken,
        messagingServiceSid: wizardData.messagingServiceSid || undefined,
        selectedNumbers,
      });

      const imported = response.data.data.imported || 0;
      showSnackbar(`Successfully imported ${imported} phone number(s)!`, 'success');

      // Reset wizard and refresh organization data
      setWizardStep(0);
      setValidated(false);
      setTwilioNumbers([]);
      setSelectedNumbers([]);
      setWizardData({ accountSid: '', authToken: '', messagingServiceSid: '' });
      fetchOrganization();
    } catch (error) {
      showSnackbar(error.response?.data?.error?.message || 'Failed to import numbers', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Team Management Functions
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await usersAPI.getAll();
      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Failed to load team members', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        email: user.email || '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        role: user.role || 'worker',
        bookingEnabled: user.workerProfile?.bookingEnabled ?? true,
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'worker',
        bookingEnabled: true,
      });
    }
    setUserDialogOpen(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'worker',
      bookingEnabled: true,
    });
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update existing user
        await usersAPI.update(editingUser._id, {
          profile: {
            firstName: userFormData.firstName,
            lastName: userFormData.lastName,
            phone: userFormData.phone,
          },
          role: userFormData.role,
          workerProfile: {
            bookingEnabled: userFormData.bookingEnabled,
          },
        });
        showSnackbar('User updated successfully');
      } else {
        // Create new user
        await usersAPI.create({
          email: userFormData.email,
          profile: {
            firstName: userFormData.firstName,
            lastName: userFormData.lastName,
            phone: userFormData.phone,
          },
          role: userFormData.role,
          workerProfile: {
            bookingEnabled: userFormData.bookingEnabled,
          },
        });
        showSnackbar('User created successfully. They will receive an email with login instructions.');
      }
      handleCloseUserDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar(error.response?.data?.error?.message || 'Failed to save user', 'error');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      await usersAPI.update(userId, { status: newStatus });
      showSnackbar(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      showSnackbar(error.response?.data?.error?.message || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await usersAPI.delete(userId);
      showSnackbar('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar(error.response?.data?.error?.message || 'Failed to delete user', 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Organization Settings</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Stack>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<BusinessIcon />} iconPosition="start" label="General" />
          <Tab icon={<PaletteIcon />} iconPosition="start" label="Branding" />
          <Tab icon={<ScheduleIcon />} iconPosition="start" label="Business Hours" />
          <Tab icon={<IntegrationIcon />} iconPosition="start" label="Integrations" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Team" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper sx={{ p: 3 }}>
        {/* General Tab */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            <Typography variant="h6">General Information</Typography>
            <Divider />

            <TextField
              label="Organization Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText="Your organization or business name"
            />

            <TextField
              label="Organization Slug"
              fullWidth
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              helperText="Used in URLs and public booking pages (lowercase, no spaces)"
              InputProps={{
                endAdornment: <Typography color="text.secondary">.yourdomain.com</Typography>,
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={formData.timezone}
                label="Timezone"
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                {TIMEZONES.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>All appointment times will be shown in this timezone</FormHelperText>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={formData.country}
                label="Country"
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              >
                <MenuItem value="US">United States</MenuItem>
                <MenuItem value="CA">Canada</MenuItem>
                <MenuItem value="GB">United Kingdom</MenuItem>
                <MenuItem value="AU">Australia</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Security Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.settings.emailVerificationRequired}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          emailVerificationRequired: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Require Email Verification"
              />
              <FormHelperText>
                When enabled, new users must verify their email address before they can log in.
                Disabling this will allow users to access their account immediately after registration.
              </FormHelperText>
            </Box>
          </Stack>
        )}

        {/* Branding Tab */}
        {activeTab === 1 && (
          <Stack spacing={3}>
            <Typography variant="h6">Branding & Appearance</Typography>
            <Divider />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Primary Color"
                  type="color"
                  fullWidth
                  value={formData.branding.primaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: { ...formData.branding, primaryColor: e.target.value },
                    })
                  }
                  helperText="Main brand color"
                />
                <Box
                  sx={{
                    mt: 2,
                    height: 60,
                    borderRadius: 1,
                    backgroundColor: formData.branding.primaryColor,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Secondary Color"
                  type="color"
                  fullWidth
                  value={formData.branding.secondaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: { ...formData.branding, secondaryColor: e.target.value },
                    })
                  }
                  helperText="Accent color"
                />
                <Box
                  sx={{
                    mt: 2,
                    height: 60,
                    borderRadius: 1,
                    backgroundColor: formData.branding.secondaryColor,
                  }}
                />
              </Grid>
            </Grid>

            <Alert severity="info">
              Brand colors will be applied to your public booking pages and customer-facing interfaces.
            </Alert>
          </Stack>
        )}

        {/* Business Hours Tab */}
        {activeTab === 2 && (
          <Stack spacing={3}>
            <Typography variant="h6">Business Hours</Typography>
            <Divider />

            <Alert severity="info">
              Set your regular business hours. Appointments can only be booked during these times.
            </Alert>

            {DAYS_OF_WEEK.map((day) => (
              <Card key={day.value} variant="outlined">
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isOpen(day.value)}
                            onChange={() => toggleBusinessHours(day.value)}
                          />
                        }
                        label={<Typography fontWeight="medium">{day.label}</Typography>}
                      />
                    </Grid>

                    {isOpen(day.value) ? (
                      <>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Opens"
                            type="time"
                            fullWidth
                            size="small"
                            value={getHours(day.value).start}
                            onChange={(e) =>
                              updateBusinessHours(day.value, 'start', e.target.value)
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Closes"
                            type="time"
                            fullWidth
                            size="small"
                            value={getHours(day.value).end}
                            onChange={(e) =>
                              updateBusinessHours(day.value, 'end', e.target.value)
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </>
                    ) : (
                      <Grid item xs={12} sm={8}>
                        <Typography color="text.secondary">Closed</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Integrations Tab - Twilio Setup Wizard */}
        {activeTab === 3 && (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
              <Typography variant="h6">Twilio Integration Setup</Typography>
              <IconButton onClick={() => setHelpDialogOpen(true)} color="primary">
                <InfoIcon />
              </IconButton>
            </Stack>

            <Stepper activeStep={wizardStep} orientation="vertical">
              {/* Step 1: Enter Credentials */}
              <Step>
                <StepLabel>Enter Twilio Credentials</StepLabel>
                <StepContent>
                  <Stack spacing={3} sx={{ mb: 2 }}>
                    <Alert severity="info">
                      You'll need your Twilio Account SID and Auth Token. Click the info icon above for step-by-step instructions.
                    </Alert>

                    <TextField
                      label="Account SID"
                      fullWidth
                      value={wizardData.accountSid}
                      onChange={(e) => setWizardData({ ...wizardData, accountSid: e.target.value })}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      helperText="Found in your Twilio Console dashboard"
                      disabled={validated}
                    />

                    <TextField
                      label="Auth Token"
                      type={showAuthToken ? 'text' : 'password'}
                      fullWidth
                      value={wizardData.authToken}
                      onChange={(e) => setWizardData({ ...wizardData, authToken: e.target.value })}
                      placeholder="Your auth token"
                      helperText="Keep this secret! Never share your auth token."
                      disabled={validated}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowAuthToken(!showAuthToken)}
                            edge="end"
                          >
                            {showAuthToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        ),
                      }}
                    />

                    <TextField
                      label="Messaging Service SID (Optional)"
                      fullWidth
                      value={wizardData.messagingServiceSid}
                      onChange={(e) => setWizardData({ ...wizardData, messagingServiceSid: e.target.value })}
                      placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      helperText="Optional: Recommended for better deliverability"
                      disabled={validated}
                    />

                    {validationError && (
                      <Alert severity="error" icon={<WarningIcon />}>
                        {validationError}
                      </Alert>
                    )}

                    {validated && (
                      <Alert severity="success" icon={<CheckCircleIcon />}>
                        Credentials validated successfully!
                      </Alert>
                    )}
                  </Stack>

                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleValidateCredentials}
                      disabled={validating || validated}
                      startIcon={validating ? <CircularProgress size={20} /> : null}
                    >
                      {validating ? 'Validating...' : validated ? 'Validated' : 'Validate Credentials'}
                    </Button>
                    {validated && (
                      <Button
                        onClick={() => {
                          setValidated(false);
                          setValidationError('');
                        }}
                        sx={{ ml: 1 }}
                      >
                        Edit
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>

              {/* Step 2: Fetch Numbers */}
              <Step>
                <StepLabel>Fetch Your Phone Numbers</StepLabel>
                <StepContent>
                  <Stack spacing={2} sx={{ mb: 2 }}>
                    <Alert severity="info">
                      Click below to retrieve all phone numbers from your Twilio account.
                    </Alert>

                    {fetchingNumbers && <LinearProgress />}

                    {twilioNumbers.length > 0 && (
                      <Alert severity="success">
                        Found {twilioNumbers.length} phone number(s) in your Twilio account!
                      </Alert>
                    )}
                  </Stack>

                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleFetchNumbers}
                      disabled={fetchingNumbers}
                      startIcon={fetchingNumbers ? <CircularProgress size={20} /> : null}
                    >
                      {fetchingNumbers ? 'Fetching Numbers...' : 'Fetch Phone Numbers'}
                    </Button>
                    <Button
                      onClick={() => setWizardStep(0)}
                      sx={{ ml: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 3: Select Numbers and Set IVR */}
              <Step>
                <StepLabel>Select Numbers & Set Main IVR Number</StepLabel>
                <StepContent>
                  <Stack spacing={3} sx={{ mb: 2 }}>
                    <Alert severity="info">
                      Select which numbers to import and designate one as your main IVR number (visible to all workers).
                    </Alert>

                    {twilioNumbers.map((number) => {
                      const isSelected = selectedNumbers.find((n) => n.sid === number.sid);
                      const isIVR = isSelected?.isIVR;

                      return (
                        <Card key={number.sid} variant="outlined" sx={{ bgcolor: isSelected ? 'action.selected' : 'background.paper' }}>
                          <CardContent>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item>
                                <Checkbox
                                  checked={!!isSelected}
                                  onChange={() => handleToggleNumber(number)}
                                />
                              </Grid>
                              <Grid item xs>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <PhoneIcon color="primary" />
                                  <Typography variant="h6">{number.phoneNumber}</Typography>
                                  {number.friendlyName && (
                                    <Typography variant="body2" color="text.secondary">
                                      ({number.friendlyName})
                                    </Typography>
                                  )}
                                </Stack>
                                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                                  {number.capabilities?.sms && (
                                    <Chip icon={<SmsIcon />} label="SMS" size="small" color="primary" />
                                  )}
                                  {number.capabilities?.voice && (
                                    <Chip icon={<VoiceIcon />} label="Voice" size="small" color="secondary" />
                                  )}
                                  {number.capabilities?.mms && (
                                    <Chip label="MMS" size="small" />
                                  )}
                                </Stack>
                              </Grid>
                              {isSelected && (
                                <Grid item>
                                  <Button
                                    variant={isIVR ? "contained" : "outlined"}
                                    size="small"
                                    onClick={() => handleSetAsIVR(number.sid)}
                                    startIcon={isIVR ? <CheckCircleIcon /> : null}
                                  >
                                    {isIVR ? 'Main IVR Number' : 'Set as Main IVR'}
                                  </Button>
                                </Grid>
                              )}
                            </Grid>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {selectedNumbers.length > 0 && (
                      <Alert severity="success">
                        {selectedNumbers.length} number(s) selected
                        {selectedNumbers.find((n) => n.isIVR) && (
                          <> · Main IVR: {selectedNumbers.find((n) => n.isIVR).phoneNumber}</>
                        )}
                      </Alert>
                    )}
                  </Stack>

                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleImportNumbers}
                      disabled={importing || selectedNumbers.length === 0}
                      startIcon={importing ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    >
                      {importing ? 'Importing...' : `Import ${selectedNumbers.length} Number(s)`}
                    </Button>
                    <Button
                      onClick={() => setWizardStep(1)}
                      sx={{ ml: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>

            {/* Success Message */}
            {wizardStep === 0 && formData.twilioConfig?.accountSid && (
              <Alert severity="success" sx={{ mt: 3 }}>
                Twilio is already configured! You can run the wizard again to import more numbers.
              </Alert>
            )}

            {/* Help Dialog */}
            <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle>
                How to Get Your Twilio Credentials
                <IconButton
                  onClick={() => setHelpDialogOpen(false)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <VisibilityOffIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Step 1: Get Account SID & Auth Token
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="1. Go to Twilio Console"
                          secondary={
                            <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">
                              https://console.twilio.com/
                            </a>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Sign in to your Twilio account" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. On the dashboard, you'll see 'Account SID' and 'Auth Token'" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="4. Click 'Show' next to Auth Token and copy both values" />
                      </ListItem>
                    </List>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Step 2: Get Messaging Service SID (Recommended)
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <strong>Highly Recommended!</strong> Messaging Services provide better deliverability and compliance.
                    </Alert>
                    <List>
                      <ListItem>
                        <ListItemText primary="1. In Twilio Console, go to 'Messaging' → 'Services'" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Click 'Create Messaging Service'" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Give it a friendly name (e.g., 'My Business SMS')" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="4. Follow the setup wizard and add your phone number(s)" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="5. Copy the Messaging Service SID (starts with 'MG...')" />
                      </ListItem>
                    </List>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Step 3: Purchase Phone Numbers (If needed)
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="1. Go to 'Phone Numbers' → 'Buy a number'" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="2. Select your country and search for numbers" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="3. Make sure 'SMS' capability is checked" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="4. Purchase the number(s) you want" />
                      </ListItem>
                    </List>
                  </Box>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setHelpDialogOpen(false)} variant="contained">
                  Got It!
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        {/* Team Tab */}
        {activeTab === 4 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Team Members</Typography>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => handleOpenUserDialog()}
              >
                Add Team Member
              </Button>
            </Stack>

            {loadingUsers ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Booking</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" py={4}>
                            No team members yet. Click "Add Team Member" to invite someone.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {(user.profile?.firstName?.[0] || user.email[0]).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography fontWeight="medium">
                                  {user.profile?.firstName || user.profile?.lastName
                                    ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()
                                    : 'No name'}
                                </Typography>
                                {user.profile?.phone && (
                                  <Typography variant="body2" color="text.secondary">
                                    {user.profile.phone}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role === 'admin' ? 'Admin' : 'Worker'}
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.status === 'active' ? 'Active' : user.status === 'invited' ? 'Invited' : 'Disabled'}
                              color={user.status === 'active' ? 'success' : user.status === 'invited' ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {user.workerProfile?.bookingEnabled ? (
                              <Chip label="Enabled" color="success" size="small" />
                            ) : (
                              <Chip label="Disabled" size="small" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenUserDialog(user)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={user.status === 'active' ? 'Disable' : 'Enable'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleUserStatus(user._id, user.status)}
                                  color={user.status === 'active' ? 'warning' : 'success'}
                                >
                                  <BlockIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteUser(user._id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              disabled={!!editingUser}
              helperText={editingUser ? 'Email cannot be changed' : 'User will receive an invitation email'}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={userFormData.firstName}
                  onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={userFormData.lastName}
                  onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              label="Phone"
              fullWidth
              value={userFormData.phone}
              onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
              helperText="Optional"
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={userFormData.role}
                label="Role"
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
              >
                <MenuItem value="worker">Worker</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              <FormHelperText>
                Admins have full access to all features. Workers can manage appointments and messages.
              </FormHelperText>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={userFormData.bookingEnabled}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, bookingEnabled: e.target.checked })
                  }
                />
              }
              label="Enable for public booking"
            />
            <FormHelperText sx={{ mt: -2 }}>
              When enabled, customers can book appointments with this team member via the public booking page.
            </FormHelperText>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancel</Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            disabled={!userFormData.email}
          >
            {editingUser ? 'Save Changes' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
