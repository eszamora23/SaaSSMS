import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Fab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Menu,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Stack,
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays } from 'date-fns';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreVert as MoreVertIcon,
  Event as EventIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { appointmentsAPI, servicesAPI, customersAPI, availabilityAPI } from '../services/api';
import socketService from '../services/socket';
import AddToCalendarButton from '../components/AddToCalendarButton';

const STATUS_COLORS = {
  confirmed: '#2E7D32', // Green
  pending: '#ED6C02',   // Orange
  completed: '#0288D1', // Blue
  canceled: '#D32F2F',  // Red
};

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  completed: 'Completed',
  canceled: 'Canceled',
};

export default function Appointments() {
  // State
  const [view, setView] = useState('month'); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
    status: 'pending',
  });

  // Availability state
  const [availableSlots, setAvailableSlots] = useState({});
  const [datesWithSlots, setDatesWithSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadAppointments();
    loadServices();
    loadCustomers();
    setupSocketListeners();

    return () => {
      socketService.off('appointment.created');
      socketService.off('appointment.updated');
      socketService.off('appointment.canceled');
    };
  }, [currentDate, view]);

  // Setup real-time listeners
  const setupSocketListeners = () => {
    socketService.on('appointment.created', (data) => {
      setAppointments((prev) => [...prev, data.appointment]);
    });

    socketService.on('appointment.updated', (data) => {
      setAppointments((prev) =>
        prev.map((apt) => (apt._id === data.appointment._id ? data.appointment : apt))
      );
    });

    socketService.on('appointment.canceled', (data) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === data.appointment._id ? { ...apt, status: 'canceled' } : apt
        )
      );
    });
  };

  // Load appointments
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const response = await appointmentsAPI.getAll({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        sortBy: 'startTime',
        sortOrder: 'asc',
      });

      setAppointments(response.data.data.appointments || []);
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load services
  const loadServices = async () => {
    try {
      const response = await servicesAPI.getAll({ status: 'active' });
      setServices(response.data.data.services || []);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  // Load customers
  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ limit: 100 });
      setCustomers(response.data.data.customers || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  // Helper function for timezone-independent date formatting
  const formatDateKey = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch availability slots
  const fetchAvailability = async (serviceId) => {
    if (!serviceId) {
      setAvailableSlots({});
      setDatesWithSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      const startDate = new Date();
      const endDate = addDays(new Date(), 30);

      const response = await availabilityAPI.getSlots({
        serviceId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        _t: Date.now(),
      });

      const slotsByDate = {};
      const datesSet = new Set();

      if (response.data?.data?.slots) {
        response.data.data.slots.forEach((slot) => {
          const slotDate = new Date(slot.startTime);
          const dateKey = formatDateKey(slotDate);
          if (!slotsByDate[dateKey]) {
            slotsByDate[dateKey] = [];
            datesSet.add(dateKey);
          }
          slotsByDate[dateKey].push(slot);
        });
      }

      const datesArray = Array.from(datesSet).map(dateKey => {
        const [year, month, day] = dateKey.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
      });

      setAvailableSlots(slotsByDate);
      setDatesWithSlots(datesArray);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Check if a date should be disabled
  const shouldDisableDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return true;
    }
    const dateStr = formatDateKey(date);
    return !datesWithSlots.some(d => formatDateKey(d) === dateStr);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    const slotDate = new Date(slot.startTime);
    setFormData({
      ...formData,
      date: slotDate.toISOString().split('T')[0],
      time: slotDate.toTimeString().substring(0, 5),
    });
  };

  // Get view date range
  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
      return date;
    } else {
      date.setHours(0, 0, 0, 0);
      return date;
    }
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() + (6 - day));
      date.setHours(23, 59, 59, 999);
      return date;
    } else {
      date.setHours(23, 59, 59, 999);
      return date;
    }
  };

  // Navigation
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Create/Edit appointment
  const handleOpenDialog = (appointment = null, dateTime = null) => {
    // Reset availability state
    setAvailableSlots({});
    setDatesWithSlots([]);
    setSelectedDate(null);
    setSelectedSlot(null);

    if (appointment) {
      const startTime = new Date(appointment.startTime);
      setFormData({
        customerId: appointment.customerId?._id || appointment.customerId || '',
        serviceId: appointment.serviceId?._id || appointment.serviceId || '',
        date: startTime.toISOString().split('T')[0],
        time: startTime.toTimeString().substring(0, 5),
        notes: appointment.notes || '',
        status: appointment.status || 'pending',
      });
      setSelectedAppointment(appointment);
      // Fetch availability for the service
      if (appointment.serviceId) {
        fetchAvailability(appointment.serviceId?._id || appointment.serviceId);
      }
    } else {
      const date = dateTime || currentDate;
      setFormData({
        customerId: '',
        serviceId: '',
        date: date.toISOString().split('T')[0],
        time: dateTime ? dateTime.toTimeString().substring(0, 5) : '09:00',
        notes: '',
        status: 'pending',
      });
      setSelectedAppointment(null);
    }
    setAppointmentDialogOpen(true);
  };

  const handleSaveAppointment = async () => {
    try {
      const startTime = new Date(`${formData.date}T${formData.time}`);

      const data = {
        customerId: formData.customerId,
        serviceId: formData.serviceId,
        startTime: startTime.toISOString(),
        notes: formData.notes,
        status: formData.status,
      };

      if (selectedAppointment) {
        await appointmentsAPI.update(selectedAppointment._id, data);
      } else {
        await appointmentsAPI.create(data);
      }

      setAppointmentDialogOpen(false);
      loadAppointments();
    } catch (err) {
      setError('Failed to save appointment');
      console.error('Error saving appointment:', err);
    }
  };

  // Appointment actions
  const handleConfirm = async (appointment) => {
    try {
      await appointmentsAPI.confirm(appointment._id);
      loadAppointments();
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to confirm appointment');
    }
  };

  const handleCancel = async (appointment) => {
    try {
      await appointmentsAPI.cancel(appointment._id, {
        reason: 'Canceled by admin',
      });
      loadAppointments();
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to cancel appointment');
    }
  };

  const handleComplete = async (appointment) => {
    try {
      await appointmentsAPI.complete(appointment._id, {});
      loadAppointments();
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to complete appointment');
    }
  };

  const handleReschedule = (appointment) => {
    handleOpenDialog(appointment);
    setAnchorEl(null);
  };

  // Get appointments for specific date
  const getAppointmentsForDate = (date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Format date header
  const getDateHeader = () => {
    const options = view === 'month'
      ? { year: 'numeric', month: 'long' }
      : view === 'week'
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };

    if (view === 'week') {
      const start = getViewStartDate();
      const end = getViewEndDate();
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    return currentDate.toLocaleDateString('en-US', options);
  };

  // Render month view
  const renderMonthView = () => {
    const start = getViewStartDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = start.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ height: 100, border: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }} />);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <Box
          key={day}
          onClick={() => handleOpenDialog(null, date)}
          sx={{
            height: 120,
            border: '1px solid #e0e0e0',
            p: 1,
            cursor: 'pointer',
            bgcolor: isToday ? '#e3f2fd' : 'white',
            '&:hover': { bgcolor: '#f5f5f5' },
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: isToday ? 600 : 400,
              color: isToday ? 'primary.main' : 'text.primary',
              mb: 0.5,
            }}
          >
            {day}
          </Typography>
          {dayAppointments.slice(0, 3).map((apt) => (
            <Box
              key={apt._id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAppointment(apt);
                setDetailDialogOpen(true);
              }}
              sx={{
                fontSize: '0.75rem',
                p: 0.5,
                mb: 0.5,
                bgcolor: STATUS_COLORS[apt.status] + '20',
                borderLeft: `3px solid ${STATUS_COLORS[apt.status]}`,
                borderRadius: 0.5,
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 },
              }}
            >
              {new Date(apt.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}{' '}
              {apt.customerId?.name || 'Unknown'}
            </Box>
          ))}
          {dayAppointments.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{dayAppointments.length - 3} more
            </Typography>
          )}
        </Box>
      );
    }

    return (
      <Box>
        {/* Day headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Box
              key={day}
              sx={{
                p: 1,
                textAlign: 'center',
                bgcolor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                fontWeight: 600,
              }}
            >
              {day}
            </Box>
          ))}
        </Box>
        {/* Calendar grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>{days}</Box>
      </Box>
    );
  };

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
    const dayAppointments = getAppointmentsForDate(currentDate);

    return (
      <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
        {hours.map((hour) => {
          const hourStart = new Date(currentDate);
          hourStart.setHours(hour, 0, 0, 0);

          const hourAppointments = dayAppointments.filter((apt) => {
            const aptHour = new Date(apt.startTime).getHours();
            return aptHour === hour;
          });

          return (
            <Box
              key={hour}
              onClick={() => {
                const time = new Date(currentDate);
                time.setHours(hour, 0, 0, 0);
                handleOpenDialog(null, time);
              }}
              sx={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                minHeight: 60,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
            >
              <Box
                sx={{
                  width: 100,
                  p: 1,
                  bgcolor: '#fafafa',
                  borderRight: '1px solid #e0e0e0',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2">
                  {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}:00 {hour < 12 ? 'AM' : 'PM'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1, position: 'relative' }}>
                {hourAppointments.map((apt) => (
                  <Card
                    key={apt._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppointment(apt);
                      setDetailDialogOpen(true);
                    }}
                    sx={{
                      mb: 1,
                      borderLeft: `4px solid ${STATUS_COLORS[apt.status]}`,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {apt.customerId?.name || 'Unknown Customer'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(apt.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        - {apt.serviceId?.name || 'Service'}
                      </Typography>
                      <Chip
                        label={STATUS_LABELS[apt.status]}
                        size="small"
                        sx={{
                          mt: 0.5,
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: STATUS_COLORS[apt.status] + '20',
                          color: STATUS_COLORS[apt.status],
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const start = getViewStartDate();
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <Box>
        {/* Day headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', gap: 0 }}>
          <Box sx={{ p: 1, bgcolor: '#fafafa', border: '1px solid #e0e0e0' }} />
          {days.map((date) => {
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <Box
                key={date.toISOString()}
                sx={{
                  p: 1,
                  textAlign: 'center',
                  bgcolor: isToday ? '#e3f2fd' : '#fafafa',
                  border: '1px solid #e0e0e0',
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                <Typography variant="caption">{date.toLocaleDateString('en-US', { weekday: 'short' })}</Typography>
                <Typography variant="body2">{date.getDate()}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* Time slots */}
        {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
          <Box key={hour} sx={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', gap: 0 }}>
            <Box sx={{ p: 1, bgcolor: '#fafafa', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Typography variant="caption">
                {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}:00 {hour < 12 ? 'AM' : 'PM'}
              </Typography>
            </Box>
            {days.map((date) => {
              const dayHourAppointments = appointments.filter((apt) => {
                const aptDate = new Date(apt.startTime);
                return (
                  aptDate.getDate() === date.getDate() &&
                  aptDate.getMonth() === date.getMonth() &&
                  aptDate.getFullYear() === date.getFullYear() &&
                  aptDate.getHours() === hour
                );
              });

              return (
                <Box
                  key={date.toISOString()}
                  onClick={() => {
                    const time = new Date(date);
                    time.setHours(hour, 0, 0, 0);
                    handleOpenDialog(null, time);
                  }}
                  sx={{
                    p: 0.5,
                    minHeight: 60,
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}
                >
                  {dayHourAppointments.map((apt) => (
                    <Box
                      key={apt._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(apt);
                        setDetailDialogOpen(true);
                      }}
                      sx={{
                        fontSize: '0.7rem',
                        p: 0.5,
                        mb: 0.5,
                        bgcolor: STATUS_COLORS[apt.status] + '20',
                        borderLeft: `3px solid ${STATUS_COLORS[apt.status]}`,
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 },
                      }}
                    >
                      {apt.customerId?.name}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Appointments</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup value={view} exclusive onChange={(e, value) => value && setView(value)} size="small">
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="day">Day</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Navigation */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton onClick={handlePrevious} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 250, textAlign: 'center' }}>
              {getDateHeader()}
            </Typography>
            <IconButton onClick={handleNext} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Button variant="outlined" size="small" onClick={handleToday}>
            Today
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Calendar View */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </Paper>
      )}

      {/* FAB for creating appointment */}
      <Fab
        color="primary"
        aria-label="add appointment"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Create/Edit Appointment Dialog */}
      <Dialog open={appointmentDialogOpen} onClose={() => setAppointmentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedAppointment ? 'Edit Appointment' : 'Create Appointment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  label="Customer"
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  value={formData.serviceId}
                  onChange={(e) => {
                    setFormData({ ...formData, serviceId: e.target.value });
                    fetchAvailability(e.target.value);
                  }}
                  label="Service"
                >
                  {services.map((service) => (
                    <MenuItem key={service._id} value={service._id}>
                      {service.name} ({service.durationMinutes}min
                      {service.price?.amount > 0
                        ? ` - ${service.price.currency || 'USD'} $${service.price.amount}`
                        : service.displayFreeLabel
                        ? ' - FREE'
                        : ''
                      })
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date & Time Selector with Calendar */}
            {formData.serviceId && (
              <Grid item xs={12}>
                {loadingSlots ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : datesWithSlots.length > 0 ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Select Date
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateCalendar
                          value={selectedDate}
                          onChange={handleDateSelect}
                          minDate={new Date()}
                          maxDate={addDays(new Date(), 30)}
                          shouldDisableDate={shouldDisableDate}
                          sx={{
                            width: '100%',
                            '& .MuiPickersDay-root:not(.Mui-disabled)': {
                              bgcolor: 'primary.light',
                              color: 'primary.dark',
                              fontWeight: 'bold',
                              '&:hover': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                              },
                              '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Select Time Slot
                      </Typography>
                      {selectedDate ? (
                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                          <Grid container spacing={1}>
                            {(availableSlots[formatDateKey(selectedDate)] || []).map((slot) => {
                              const slotTime = new Date(slot.startTime);
                              const isSelected = selectedSlot?.startTime === slot.startTime;
                              return (
                                <Grid item xs={6} key={slot.startTime}>
                                  <Button
                                    fullWidth
                                    variant={isSelected ? 'contained' : 'outlined'}
                                    onClick={() => handleSlotSelect(slot)}
                                    sx={{
                                      justifyContent: 'center',
                                      textTransform: 'none',
                                    }}
                                  >
                                    {slotTime.toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </Button>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      ) : (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Please select a date first
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="warning">
                    No available time slots found for this service in the next 30 days.
                  </Alert>
                )}
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="canceled">Canceled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes about the appointment..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveAppointment}
            variant="contained"
            disabled={!formData.customerId || !formData.serviceId || !formData.date || !formData.time}
          >
            {selectedAppointment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedAppointment && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Appointment Details
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="body1">{selectedAppointment.customerId?.name || 'Unknown'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedAppointment.customerId?.phone}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Service
                    </Typography>
                    <Typography variant="body1">{selectedAppointment.serviceId?.name || 'N/A'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedAppointment.serviceId?.durationMinutes} minutes
                      {selectedAppointment.serviceId?.price?.amount > 0
                        ? ` - ${selectedAppointment.serviceId.price.currency || 'USD'} $${selectedAppointment.serviceId.price.amount}`
                        : selectedAppointment.serviceId?.displayFreeLabel
                        ? ' - FREE'
                        : ''
                      }
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Date & Time
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedAppointment.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedAppointment.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <br />
                  <Chip
                    label={STATUS_LABELS[selectedAppointment.status]}
                    sx={{
                      mt: 0.5,
                      bgcolor: STATUS_COLORS[selectedAppointment.status] + '20',
                      color: STATUS_COLORS[selectedAppointment.status],
                    }}
                  />
                </Box>

                {selectedAppointment.notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {selectedAppointment.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
              <AddToCalendarButton appointment={selectedAppointment} variant="outlined" />
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Appointment Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {selectedAppointment?.status === 'pending' && (
          <MenuItem onClick={() => handleConfirm(selectedAppointment)}>Confirm</MenuItem>
        )}
        {selectedAppointment?.status !== 'completed' && selectedAppointment?.status !== 'canceled' && (
          <>
            <MenuItem onClick={() => handleReschedule(selectedAppointment)}>Reschedule</MenuItem>
            <MenuItem onClick={() => handleComplete(selectedAppointment)}>Mark Complete</MenuItem>
          </>
        )}
        {selectedAppointment?.status !== 'canceled' && (
          <MenuItem onClick={() => handleCancel(selectedAppointment)} sx={{ color: 'error.main' }}>
            Cancel
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
