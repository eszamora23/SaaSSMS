import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Avatar,
  Stack,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  EventAvailable as AvailableIcon,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import AddToCalendarButton from '../components/AddToCalendarButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const steps = ['Choose Service', 'Select Date & Time', 'Your Details', 'Confirm'];

// Helper function to format date consistently (timezone-independent)
const formatDateKey = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PublicBooking({ orgSlug: propOrgSlug }) {
  const { orgSlug: paramOrgSlug } = useParams();
  const orgSlug = propOrgSlug || paramOrgSlug;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [organization, setOrganization] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Wizard state
  const [activeStep, setActiveStep] = useState(0);

  // Booking form state
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Availability state
  const [availableSlots, setAvailableSlots] = useState({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [datesWithSlots, setDatesWithSlots] = useState([]);

  // Fetch organization and services
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!orgSlug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch organization by slug
        const orgResponse = await axios.get(`${API_URL}/api/v1/public/org/${orgSlug}`);
        setOrganization(orgResponse.data.data);

        // Fetch services
        const servicesResponse = await axios.get(`${API_URL}/api/v1/public/org/${orgSlug}/services`);
        const servicesData = servicesResponse.data?.data || [];
        setServices(servicesData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err.response?.data?.message || 'Organization not found');
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, [orgSlug]);

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceSelect = async (service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedTime('');
    setActiveStep(1);

    // Fetch availability for the next 30 days
    await fetchAvailability(service._id);
  };

  const fetchAvailability = async (serviceId) => {
    if (!serviceId) return;

    try {
      setLoadingAvailability(true);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const response = await axios.get(
        `${API_URL}/api/v1/public/org/${orgSlug}/availability`,
        {
          params: {
            serviceId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            _t: Date.now(), // Cache buster
          },
        }
      );

      console.log('Availability response:', response.data);
      console.log('Total slots received:', response.data?.data?.slots?.length || 0);

      // Group slots by date (using consistent date formatting)
      const slotsByDate = {};
      const datesSet = new Set();
      const now = new Date();

      if (response.data?.data?.slots) {
        // Filter and validate slots before grouping
        const validSlots = response.data.data.slots.filter((slot) => {
          // Ensure slot has required fields
          if (!slot.startTime || !slot.endTime) {
            console.warn('Slot missing startTime or endTime:', slot);
            return false;
          }

          const slotDate = new Date(slot.startTime);

          // Ensure slot is valid date
          if (isNaN(slotDate.getTime())) {
            console.warn('Invalid slot startTime:', slot.startTime);
            return false;
          }

          // Filter out past slots (with 1 minute buffer)
          if (slotDate <= now) {
            console.warn('Slot is in the past:', slot.startTime);
            return false;
          }

          return true;
        });

        console.log('Valid slots after filtering:', validSlots.length);

        // Group valid slots by date
        validSlots.forEach((slot) => {
          const slotDate = new Date(slot.startTime);
          const dateKey = formatDateKey(slotDate);

          if (!slotsByDate[dateKey]) {
            slotsByDate[dateKey] = [];
            datesSet.add(dateKey);
          }
          slotsByDate[dateKey].push(slot);
        });
      }

      // Remove dates with no remaining slots after filtering
      const finalSlotsByDate = {};
      const finalDatesSet = new Set();

      Object.keys(slotsByDate).forEach(dateKey => {
        if (slotsByDate[dateKey].length > 0) {
          finalSlotsByDate[dateKey] = slotsByDate[dateKey];
          finalDatesSet.add(dateKey);
        } else {
          console.warn('Removed date with no valid slots:', dateKey);
        }
      });

      // Convert date keys back to date objects at noon (timezone safe)
      const datesArray = Array.from(finalDatesSet).map(dateKey => {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0, 0);
        return date;
      });

      console.log('Final slots by date:', finalSlotsByDate);
      console.log('Final date keys:', Array.from(finalDatesSet));
      console.log('Dates array:', datesArray);

      setAvailableSlots(finalSlotsByDate);
      setDatesWithSlots(datesArray);
      setLoadingAvailability(false);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setLoadingAvailability(false);
    }
  };

  const handleDateSelect = (date) => {
    const dateKey = formatDateKey(date);
    console.log('=== DATE SELECTED ===');
    console.log('Selected date object:', date);
    console.log('Formatted date key:', dateKey);
    console.log('All available slot keys:', Object.keys(availableSlots));
    console.log('Number of slots for this date:', (availableSlots[dateKey] || []).length);
    console.log('Sample slots:', (availableSlots[dateKey] || []).slice(0, 3));
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedService) return;
    if (activeStep === 1 && (!selectedDate || !selectedTime)) return;
    if (activeStep === 2 && (!customerInfo.name || !customerInfo.email || !customerInfo.phone)) return;

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Please complete all steps');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bookingData = {
        serviceId: selectedService._id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        notes: customerInfo.notes,
      };

      const response = await axios.post(
        `${API_URL}/api/v1/public/org/${orgSlug}/book`,
        bookingData
      );

      // Store the created appointment
      if (response.data?.data?.appointment) {
        setCreatedAppointment(response.data.data.appointment);
      }

      setSuccess(true);
      setLoading(false);
      setActiveStep(0);

      // Reset form
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime('');
      setCustomerInfo({ name: '', email: '', phone: '', notes: '' });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Failed to create booking');
      setLoading(false);
    }
  };

  const shouldDisableDate = (date) => {
    // Validate the date before formatting
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return true;
    }

    const dateStr = formatDateKey(date);
    return !datesWithSlots.some(d => formatDateKey(d) === dateStr);
  };

  if (loading && !organization) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error && !organization) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : null;
  const selectedDateSlots = selectedDateKey ? availableSlots[selectedDateKey] || [] : [];

  // Only log when there's a selected date to avoid spam
  if (selectedDate) {
    console.log('=== RENDERING TIME SLOTS ===');
    console.log('Selected date key:', selectedDateKey);
    console.log('Number of slots to render:', selectedDateSlots.length);
    console.log('Available slots object has keys:', Object.keys(availableSlots).length);
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.background.default} 50%, ${theme.palette.secondary.light}15 100%)`,
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        {/* Header - Organization Info */}
        <Zoom in timeout={500}>
          <Paper
            elevation={8}
            sx={{
              mb: 4,
              overflow: 'hidden',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            <Box
              sx={{
                color: 'white',
                py: { xs: 3, md: 5 },
                px: 3,
                textAlign: 'center',
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 70, md: 100 },
                  height: { xs: 70, md: 100 },
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  fontWeight: 'bold',
                  boxShadow: 4,
                }}
              >
                {organization?.name?.charAt(0) || 'O'}
              </Avatar>
              <Typography variant={isMobile ? "h4" : "h3"} gutterBottom fontWeight="bold">
                {organization?.name}
              </Typography>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ opacity: 0.95 }}>
                Book Your Appointment Online
              </Typography>

              {/* Contact Information */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                sx={{ mt: 3, flexWrap: 'wrap' }}
              >
                {organization?.email && (
                  <Chip
                    icon={<EmailIcon />}
                    label={organization.email}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}
                  />
                )}
                {organization?.timezone && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label={organization.timezone}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}
                  />
                )}
                {organization?.country && (
                  <Chip
                    icon={<LocationIcon />}
                    label={organization.country}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}
                  />
                )}
              </Stack>
            </Box>
          </Paper>
        </Zoom>

        {/* Success Message */}
        {success && (
          <Fade in timeout={500}>
            <Alert
              severity="success"
              icon={<CheckCircleIcon fontSize="large" />}
              onClose={() => {
                setSuccess(false);
                setCreatedAppointment(null);
              }}
              sx={{
                mb: 4,
                borderRadius: 2,
                boxShadow: 3,
                '& .MuiAlert-icon': {
                  fontSize: 40,
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Booking Confirmed!
              </Typography>
              <Typography variant="body2" gutterBottom>
                Your appointment has been successfully booked. You will receive a confirmation email shortly.
              </Typography>
              {createdAppointment && (
                <Box sx={{ mt: 2 }}>
                  <AddToCalendarButton
                    appointment={createdAppointment}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              )}
            </Alert>
          </Fade>
        )}

        {/* Error Message */}
        {error && (
          <Fade in timeout={500}>
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Stepper */}
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel={isMobile}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step Content */}
        <Fade in key={activeStep} timeout={300}>
          <Box>
            {/* Step 0: Choose Service */}
            {activeStep === 0 && (
              <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                  Choose a Service
                </Typography>

                {services.length === 0 ? (
                  <Alert severity="info">No services available at the moment.</Alert>
                ) : (
                  <Grid container spacing={2}>
                    {services.map((service) => (
                      <Grid item xs={12} sm={6} md={4} key={service._id}>
                        <Zoom in timeout={300}>
                          <Card
                            elevation={selectedService?._id === service._id ? 8 : 2}
                            sx={{
                              height: '100%',
                              border: 2,
                              borderColor: selectedService?._id === service._id ? 'primary.main' : 'transparent',
                              transition: 'all 0.3s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 6,
                              },
                            }}
                          >
                            <CardActionArea onClick={() => handleServiceSelect(service)} sx={{ height: '100%', p: 2 }}>
                              <CardContent>
                                <Stack spacing={1.5}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6" fontWeight="bold">
                                      {service.name}
                                    </Typography>
                                    {service.color && (
                                      <Box
                                        sx={{
                                          width: 16,
                                          height: 16,
                                          borderRadius: '50%',
                                          bgcolor: service.color,
                                          boxShadow: 2,
                                        }}
                                      />
                                    )}
                                  </Box>

                                  {service.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {service.description}
                                    </Typography>
                                  )}

                                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                    {service.price?.amount > 0 && (
                                      <Chip
                                        icon={<MoneyIcon />}
                                        label={`${service.price.currency || 'USD'} ${service.price.amount}`}
                                        size="small"
                                        color="primary"
                                      />
                                    )}
                                    {service.price?.amount === 0 && service.displayFreeLabel && (
                                      <Chip label="FREE" size="small" color="success" />
                                    )}
                                    {service.durationMinutes && (
                                      <Chip
                                        icon={<TimeIcon />}
                                        label={`${service.durationMinutes} min`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                    {service.location && (
                                      <Chip
                                        icon={<LocationIcon />}
                                        label={service.location}
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </Zoom>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            )}

            {/* Step 1: Select Date & Time */}
            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                      Select a Date
                    </Typography>

                    {loadingAvailability ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : datesWithSlots.length === 0 ? (
                      <Alert severity="info">
                        No availability found for the next 30 days. Please contact us directly.
                      </Alert>
                    ) : (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateCalendar
                          value={selectedDate}
                          onChange={handleDateSelect}
                          minDate={new Date()}
                          maxDate={addDays(new Date(), 30)}
                          shouldDisableDate={shouldDisableDate}
                          sx={{
                            width: '100%',
                            '& .MuiPickersCalendarHeader-root': {
                              paddingLeft: 2,
                              paddingRight: 2,
                            },
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
                      </LocalizationProvider>                    )}

                    {datesWithSlots.length > 0 && (
                      <Alert severity="info" icon={<AvailableIcon />} sx={{ mt: 2 }}>
                        Highlighted dates have available time slots
                      </Alert>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                      Available Times
                      {selectedDate && (
                        <Typography variant="body2" color="text.secondary">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                      )}
                    </Typography>

                    {!selectedDate ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 200,
                          color: 'text.secondary',
                        }}
                      >
                        <Stack alignItems="center" spacing={2}>
                          <CalendarIcon sx={{ fontSize: 60, opacity: 0.3 }} />
                          <Typography variant="body2" align="center">
                            Please select a date to see available time slots
                          </Typography>
                        </Stack>
                      </Box>
                    ) : selectedDateSlots.length === 0 ? (
                      <>
                        <Alert severity="warning">No time slots available for this date</Alert>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.75rem' }}>
                          <Typography variant="caption" component="div">Debug Info:</Typography>
                          <Typography variant="caption" component="div">Selected Date Key: {selectedDateKey}</Typography>
                          <Typography variant="caption" component="div">Available Date Keys: {Object.keys(availableSlots).join(', ')}</Typography>
                          <Typography variant="caption" component="div">Total Dates with Slots: {Object.keys(availableSlots).length}</Typography>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                        <Grid container spacing={1.5}>
                          {selectedDateSlots.map((slot, index) => {
                            const time = format(new Date(slot.startTime), 'h:mm a');
                            const timeValue = format(new Date(slot.startTime), 'HH:mm');
                            const isSelected = selectedTime === timeValue;

                            return (
                              <Grid item xs={6} key={index}>
                                <Button
                                  fullWidth
                                  variant={isSelected ? 'contained' : 'outlined'}
                                  onClick={() => handleTimeSelect(timeValue)}
                                  sx={{
                                    py: 2,
                                    borderRadius: 2,
                                    fontWeight: isSelected ? 'bold' : 'normal',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                    },
                                  }}
                                >
                                  <Stack spacing={0.5} alignItems="center">
                                    <Typography variant="body2">{time}</Typography>
                                    {slot.availableSpots !== undefined && (
                                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                        {slot.availableSpots} spot{slot.availableSpots !== 1 ? 's' : ''}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Button>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Step 2: Your Details */}
            {activeStep === 2 && (
              <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                  Your Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleCustomerInfoChange}
                      required
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleCustomerInfoChange}
                      required
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="tel"
                      label="Phone Number"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      required
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Additional Notes (Optional)"
                      name="notes"
                      value={customerInfo.notes}
                      onChange={handleCustomerInfoChange}
                      placeholder="Any special requests or information we should know?"
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Step 3: Confirm */}
            {activeStep === 3 && (
              <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                  Confirm Your Booking
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                        Service Details
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {selectedService?.name}
                      </Typography>
                      <Stack spacing={1}>
                        {selectedService?.durationMinutes && (
                          <Chip
                            icon={<TimeIcon />}
                            label={`${selectedService.durationMinutes} minutes`}
                            size="small"
                            sx={{ width: 'fit-content' }}
                          />
                        )}
                        {selectedService?.price?.amount > 0 && (
                          <Chip
                            icon={<MoneyIcon />}
                            label={`${selectedService.price.currency || 'USD'} ${selectedService.price.amount}`}
                            size="small"
                            color="primary"
                            sx={{ width: 'fit-content' }}
                          />
                        )}
                        {selectedService?.location && (
                          <Chip
                            icon={<LocationIcon />}
                            label={selectedService.location}
                            size="small"
                            sx={{ width: 'fit-content' }}
                          />
                        )}
                      </Stack>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="secondary.dark" gutterBottom>
                        Appointment Time
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </Typography>
                      <Typography variant="h5" color="secondary.dark">
                        {selectedTime && format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                      </Typography>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Your Information
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={4}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PersonIcon color="action" />
                            <Typography variant="body2">{customerInfo.name}</Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <EmailIcon color="action" />
                            <Typography variant="body2">{customerInfo.email}</Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PhoneIcon color="action" />
                            <Typography variant="body2">{customerInfo.phone}</Typography>
                          </Stack>
                        </Grid>
                        {customerInfo.notes && (
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                              Notes:
                            </Typography>
                            <Typography variant="body2">{customerInfo.notes}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        </Fade>

        {/* Navigation Buttons */}
        <Paper elevation={3} sx={{ p: 2, mt: 3, borderRadius: 2 }}>
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<BackIcon />}
              size="large"
              variant="outlined"
            >
              Back
            </Button>

            <Box sx={{ flex: 1 }} />

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleBooking}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                sx={{ minWidth: 160 }}
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                endIcon={<NextIcon />}
                disabled={
                  (activeStep === 0 && !selectedService) ||
                  (activeStep === 1 && (!selectedDate || !selectedTime)) ||
                  (activeStep === 2 && (!customerInfo.name || !customerInfo.email || !customerInfo.phone))
                }
                sx={{ minWidth: 120 }}
              >
                Next
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
