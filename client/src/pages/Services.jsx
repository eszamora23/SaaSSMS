/**
 * Services Page
 * Full CRUD interface for service management
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { servicesAPI } from '../services/api';

export default function Services() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 30,
    priceAmount: 0,
    priceCurrency: 'USD',
    displayFreeLabel: false,
    status: 'active',
    bufferBefore: 0,
    bufferAfter: 0,
    maxSlotsPerTimeSlot: 1,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch services
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      setServices(response.data.data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      showSnackbar('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Active services
  const activeServices = services.filter((s) => s.status === 'active');
  const inactiveServices = services.filter((s) => s.status !== 'active');

  // Handlers
  const handleOpenDialog = (service = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name || '',
        description: service.description || '',
        durationMinutes: service.durationMinutes || 30,
        priceAmount: service.price?.amount || 0,
        priceCurrency: service.price?.currency || 'USD',
        displayFreeLabel: service.displayFreeLabel || false,
        status: service.status || 'active',
        bufferBefore: service.bufferBefore || 0,
        bufferAfter: service.bufferAfter || 0,
        maxSlotsPerTimeSlot: service.maxSlotsPerTimeSlot || 1,
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        description: '',
        durationMinutes: 30,
        priceAmount: 0,
        priceCurrency: 'USD',
        displayFreeLabel: false,
        status: 'active',
        bufferBefore: 0,
        bufferAfter: 0,
        maxSlotsPerTimeSlot: 1,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
  };

  const handleSaveService = async () => {
    try {
      if (selectedService) {
        await servicesAPI.update(selectedService._id, formData);
        showSnackbar('Service updated successfully');
      } else {
        await servicesAPI.create(formData);
        showSnackbar('Service created successfully');
      }
      handleCloseDialog();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      showSnackbar(error.response?.data?.error?.message || 'Failed to save service', 'error');
    }
  };

  const handleDeleteService = async () => {
    try {
      await servicesAPI.delete(selectedService._id);
      showSnackbar('Service deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedService(null);
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      showSnackbar('Failed to delete service', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const formatPrice = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Mobile List View
  const renderMobileList = (servicesList) => (
    <List>
      {servicesList.map((service) => (
        <Card key={service._id} sx={{ mb: 2 }}>
          <ListItem
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton edge="end" onClick={() => handleOpenDialog(service)}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setSelectedService(service);
                    setOpenDeleteDialog(true);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {service.name}
                  </Typography>
                  {service.status === 'active' ? (
                    <Chip label="Active" size="small" color="success" />
                  ) : (
                    <Chip label="Inactive" size="small" />
                  )}
                </Stack>
              }
              secondary={
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {service.description}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <ScheduleIcon fontSize="small" />
                      <Typography variant="body2">
                        {formatDuration(service.durationMinutes)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <MoneyIcon fontSize="small" />
                      <Typography variant="body2">
                        {formatPrice(service.priceAmount, service.priceCurrency)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              }
            />
          </ListItem>
        </Card>
      ))}
    </List>
  );

  // Desktop Table View
  const renderDesktopTable = (servicesList) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Service Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Buffer Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {servicesList.map((service) => (
            <TableRow key={service._id} hover>
              <TableCell>
                <Typography variant="body1" fontWeight="medium">
                  {service.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                  {service.description}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2">{formatDuration(service.durationMinutes)}</Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {formatPrice(service.priceAmount, service.priceCurrency)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {service.bufferBefore}m / {service.bufferAfter}m
                </Typography>
              </TableCell>
              <TableCell>
                {service.status === 'active' ? (
                  <Chip label="Active" size="small" color="success" />
                ) : (
                  <Chip label="Inactive" size="small" />
                )}
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpenDialog(service)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedService(service);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

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
        <Typography variant="h4">Services</Typography>
        {!isMobile && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Service
          </Button>
        )}
      </Stack>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {activeServices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Services
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">{services.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Services
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Services */}
      {activeServices.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Active Services
          </Typography>
          {isMobile ? renderMobileList(activeServices) : renderDesktopTable(activeServices)}
        </Box>
      )}

      {/* Inactive Services */}
      {inactiveServices.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Inactive Services
          </Typography>
          {isMobile ? renderMobileList(inactiveServices) : renderDesktopTable(inactiveServices)}
        </Box>
      )}

      {/* Empty State */}
      {services.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No services found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
          >
            Add Your First Service
          </Button>
        </Paper>
      )}

      {/* FAB for mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          onClick={() => handleOpenDialog()}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedService ? 'Edit Service' : 'Add Service'}
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
            <TextField
              autoFocus
              label="Service Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText="e.g., 30-Min Consultation, 1-Hour Session"
            />

            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              helperText="Brief description of the service"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Duration (minutes)"
                  type="number"
                  fullWidth
                  required
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">min</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price"
                  type="number"
                  fullWidth
                  required
                  value={formData.priceAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, priceAmount: parseFloat(e.target.value) })
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>

            {formData.priceAmount === 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.displayFreeLabel}
                    onChange={(e) =>
                      setFormData({ ...formData, displayFreeLabel: e.target.checked })
                    }
                  />
                }
                label="Display 'FREE' label"
                sx={{ ml: 0.5 }}
              />
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Buffer Before (minutes)"
                  type="number"
                  fullWidth
                  value={formData.bufferBefore}
                  onChange={(e) =>
                    setFormData({ ...formData, bufferBefore: parseInt(e.target.value) })
                  }
                  helperText="Prep time before"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Buffer After (minutes)"
                  type="number"
                  fullWidth
                  value={formData.bufferAfter}
                  onChange={(e) =>
                    setFormData({ ...formData, bufferAfter: parseInt(e.target.value) })
                  }
                  helperText="Cleanup time after"
                />
              </Grid>
            </Grid>

            <TextField
              label="Max Bookings Per Time Slot"
              type="number"
              fullWidth
              value={formData.maxSlotsPerTimeSlot}
              onChange={(e) =>
                setFormData({ ...formData, maxSlotsPerTimeSlot: parseInt(e.target.value) || 1 })
              }
              helperText="How many clients can book the same time slot? (1 = exclusive, 3+ = group sessions)"
              InputProps={{
                inputProps: { min: 1, max: 100 }
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
              <FormHelperText>
                Inactive services won't be available for booking
              </FormHelperText>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveService}
            variant="contained"
            disabled={!formData.name || !formData.durationMinutes}
          >
            {selectedService ? 'Save Changes' : 'Add Service'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Service?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedService?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteService} color="error" variant="contained">
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
