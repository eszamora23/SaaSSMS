/**
 * Team Management Page (Users)
 * Manage organization workers and team members
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { usersAPI, servicesAPI } from '../services/api';

const STATUS_COLORS = {
  active: 'success',
  invited: 'warning',
  disabled: 'error',
};

const STATUS_LABELS = {
  active: 'Active',
  invited: 'Invited',
  disabled: 'Disabled',
};

export default function Users() {
  // State
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'worker',
    bookingEnabled: true,
    serviceIds: [],
    availability: [],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load data on mount
  useEffect(() => {
    fetchUsers();
    fetchServices();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll({ status: 'active' });
      setServices(response.data.data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email || '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        role: user.role || 'worker',
        bookingEnabled: user.workerProfile?.bookingEnabled || false,
        serviceIds: user.workerProfile?.serviceIds?.map(s => s._id || s) || [],
        availability: user.workerProfile?.availability || [],
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'worker',
        bookingEnabled: true,
        serviceIds: [],
        availability: getDefaultAvailability(),
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const getDefaultAvailability = () => {
    // Default 9-5 Mon-Fri schedule
    return [
      { dayOfWeek: 1, start: '09:00', end: '17:00' }, // Monday
      { dayOfWeek: 2, start: '09:00', end: '17:00' }, // Tuesday
      { dayOfWeek: 3, start: '09:00', end: '17:00' }, // Wednesday
      { dayOfWeek: 4, start: '09:00', end: '17:00' }, // Thursday
      { dayOfWeek: 5, start: '09:00', end: '17:00' }, // Friday
    ];
  };

  const handleSaveUser = async () => {
    try {
      const userData = {
        email: formData.email,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        role: formData.role,
      };

      // Add worker profile if role is worker
      if (formData.role === 'worker' || formData.role === 'admin') {
        userData.workerProfile = {
          bookingEnabled: formData.bookingEnabled,
          serviceIds: formData.serviceIds,
          availability: formData.availability.length > 0 ? formData.availability : getDefaultAvailability(),
        };
      }

      if (selectedUser) {
        await usersAPI.update(selectedUser._id, userData);
        showSnackbar('Team member updated successfully');
      } else {
        // For new users, add a default password field (they'll need to set it on first login)
        userData.passwordHash = 'TempPassword123!'; // This should trigger an email or password reset flow
        await usersAPI.create(userData);
        showSnackbar('Team member created successfully. They will receive an invitation email.');
      }

      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar(error.response?.data?.error?.message || 'Failed to save team member', 'error');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await usersAPI.delete(selectedUser._id);
      showSnackbar('Team member deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar('Failed to delete team member', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'worker':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Team Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your organization's workers and team members
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Team Member
        </Button>
      </Box>

      {/* Team Members List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No team members yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first team member to get started
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Booking Enabled</TableCell>
                <TableCell>Services</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.profile?.phone || '-'}</TableCell>
                  <TableCell>
                    <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[user.status]}
                      color={STATUS_COLORS[user.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.workerProfile?.bookingEnabled ? (
                      <Chip icon={<ActiveIcon />} label="Yes" color="success" size="small" />
                    ) : (
                      <Chip icon={<InactiveIcon />} label="No" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.workerProfile?.serviceIds?.length > 0 ? (
                      <Typography variant="body2">
                        {user.workerProfile.serviceIds.length} service(s)
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        None
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit Team Member' : 'Add Team Member'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!selectedUser}
                  helperText={selectedUser ? 'Email cannot be changed' : 'Used for login'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Role & Permissions
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="admin">Admin - Full system access</MenuItem>
                <MenuItem value="worker">Worker - Can manage appointments and bookings</MenuItem>
              </Select>
            </FormControl>

            {(formData.role === 'worker' || formData.role === 'admin') && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.bookingEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, bookingEnabled: e.target.checked })
                      }
                    />
                  }
                  label="Enable for bookings (can show apartments/services)"
                />

                <FormControl fullWidth>
                  <InputLabel>Assigned Services</InputLabel>
                  <Select
                    multiple
                    value={formData.serviceIds}
                    onChange={(e) => setFormData({ ...formData, serviceIds: e.target.value })}
                    label="Assigned Services"
                    renderValue={(selected) =>
                      selected
                        .map((id) => services.find((s) => s._id === id)?.name)
                        .filter(Boolean)
                        .join(', ')
                    }
                  >
                    {services.map((service) => (
                      <MenuItem key={service._id} value={service._id}>
                        {service.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Alert severity="info">
                  Availability schedule can be customized after creation in the user's profile.
                </Alert>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            disabled={
              !formData.email || !formData.firstName || !formData.lastName || !formData.role
            }
          >
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Team Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedUser?.profile?.firstName}{' '}
            {selectedUser?.profile?.lastName}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Delete
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
