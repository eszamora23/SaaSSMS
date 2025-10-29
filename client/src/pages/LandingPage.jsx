import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Slide,
  Zoom,
} from '@mui/material';
import {
  CalendarMonth,
  Message,
  People,
  Schedule,
  TrendingUp,
  CheckCircle,
  Notifications,
  Analytics,
  Business,
  LocalHospital,
  ContentCut,
  DirectionsCar,
  FitnessCenter,
  Restaurant,
  ArrowForward,
  Phone,
  PhoneIphone,
  DesktopWindows,
  Speed,
  Security,
  CloudDone,
  Group,
  IntegrationInstructions,
  AutoAwesome,
} from '@mui/icons-material';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  // Demo data for interactive showcase
  const [demoTab, setDemoTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    setAnimateStats(true);
  }, []);

  const features = [
    {
      icon: <Message sx={{ fontSize: 40 }} />,
      title: 'SMS-First Booking',
      description: 'Customers book appointments via text message. No app download required. Simple, fast, and accessible to everyone.',
      color: '#2196F3',
    },
    {
      icon: <CalendarMonth sx={{ fontSize: 40 }} />,
      title: 'Smart Scheduling',
      description: 'Intelligent calendar with multi-view support. Automated availability management, buffer times, and conflict prevention.',
      color: '#4CAF50',
    },
    {
      icon: <Notifications sx={{ fontSize: 40 }} />,
      title: 'Automated Reminders',
      description: 'Reduce no-shows by up to 80%. Automatic SMS reminders sent 24 hours and 1 hour before appointments.',
      color: '#FF9800',
    },
    {
      icon: <People sx={{ fontSize: 40 }} />,
      title: 'Built-in CRM',
      description: 'Complete customer database with messaging history, appointment records, notes, and engagement tracking.',
      color: '#9C27B0',
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Real-Time Analytics',
      description: 'Track key metrics: appointment volume, customer engagement, revenue trends, and team performance.',
      color: '#F44336',
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Team Management',
      description: 'Multi-user support with role-based access. Manage your team, assign services, and track individual availability.',
      color: '#00BCD4',
    },
  ];

  const useCases = [
    { icon: <ContentCut />, title: 'Salons & Spas', description: 'Manage cuts, colors, treatments' },
    { icon: <LocalHospital />, title: 'Healthcare', description: 'Patient appointments & reminders' },
    { icon: <DirectionsCar />, title: 'Auto Services', description: 'Repair appointments & updates' },
    { icon: <FitnessCenter />, title: 'Fitness Studios', description: 'Classes and training sessions' },
    { icon: <Restaurant />, title: 'Restaurants', description: 'Reservations and waitlist' },
    { icon: <Business />, title: 'Consulting', description: 'Client meetings and calls' },
  ];

  const benefits = [
    'No-Show Rate Drops by 80%',
    'Save 10+ Hours Per Week',
    'Double Your Bookings',
    'Centralize All Communication',
    'Scale Without Hiring',
    'Zero Training Required',
  ];

  const techHighlights = [
    { icon: <Speed />, text: 'Lightning Fast Performance' },
    { icon: <Security />, text: 'Bank-Level Security' },
    { icon: <CloudDone />, text: 'Cloud-Based Infrastructure' },
    { icon: <IntegrationInstructions />, text: 'Seamless Integrations' },
  ];

  // Demo stats with animation
  const stats = [
    { value: animateStats ? '50K+' : '0', label: 'Messages Sent', color: '#2196F3' },
    { value: animateStats ? '10K+' : '0', label: 'Appointments Booked', color: '#4CAF50' },
    { value: animateStats ? '5K+' : '0', label: 'Happy Customers', color: '#FF9800' },
    { value: animateStats ? '99.9%' : '0%', label: 'Uptime', color: '#9C27B0' },
  ];

  // Demo appointment data for calendar visualization
  const demoAppointments = [
    { time: '09:00 AM', client: 'Sarah Johnson', service: 'Haircut & Style', status: 'confirmed' },
    { time: '10:30 AM', client: 'Mike Chen', service: 'Consultation', status: 'confirmed' },
    { time: '01:00 PM', client: 'Emma Davis', service: 'Color Treatment', status: 'pending' },
    { time: '03:00 PM', client: 'Available', service: '90 min slot open', status: 'available' },
  ];

  // Demo SMS conversation
  const demoMessages = [
    { sender: 'customer', text: 'Hi, can I book a haircut for tomorrow?', time: '10:23 AM' },
    { sender: 'business', text: 'Of course! I have 2:00 PM or 4:30 PM available. Which works better?', time: '10:24 AM' },
    { sender: 'customer', text: '2:00 PM works perfect!', time: '10:25 AM' },
    { sender: 'business', text: "Great! You're all set for tomorrow at 2:00 PM. See you then! 📅", time: '10:25 AM' },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 12, md: 16 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in={visible} timeout={1000}>
            <Box>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Chip
                    label="🚀 SMS-First Booking Platform"
                    sx={{
                      mb: 3,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                      fontWeight: 800,
                      lineHeight: 1.1,
                      mb: 3,
                    }}
                  >
                    Customers Book
                    <Box component="span" sx={{ display: 'block', color: theme.palette.secondary.light }}>
                      By Text Message
                    </Box>
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 4,
                      opacity: 0.95,
                      fontWeight: 400,
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    The all-in-one platform for appointment scheduling, customer communication, and business management.
                    No app required. No complexity. Just results.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/register')}
                      endIcon={<ArrowForward />}
                      sx={{
                        bgcolor: 'white',
                        color: theme.palette.primary.main,
                        py: 1.8,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s',
                      }}
                    >
                      Start Free Trial
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => {
                        document.getElementById('demo-section').scrollIntoView({ behavior: 'smooth' });
                      }}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        py: 1.8,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      See It In Action
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
                    {techHighlights.slice(0, 2).map((item, index) => (
                      <Stack direction="row" spacing={1} alignItems="center" key={index}>
                        {item.icon}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.text}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>

                {/* Hero Visual */}
                <Grid item xs={12} md={6}>
                  <Zoom in={visible} timeout={1200}>
                    <Box
                      sx={{
                        position: 'relative',
                        height: { xs: 300, md: 500 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* Phone mockup with SMS conversation */}
                      <Paper
                        elevation={24}
                        sx={{
                          width: { xs: 280, md: 320 },
                          height: { xs: 400, md: 480 },
                          borderRadius: 6,
                          overflow: 'hidden',
                          position: 'relative',
                          bgcolor: '#1a1a1a',
                          border: '8px solid #2a2a2a',
                        }}
                      >
                        {/* Phone status bar */}
                        <Box sx={{ bgcolor: '#0a0a0a', p: 1, textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'white' }}>
                            9:41 AM
                          </Typography>
                        </Box>

                        {/* SMS Interface */}
                        <Box sx={{ bgcolor: '#f5f5f5', height: '100%', p: 2 }}>
                          <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1.5, mb: 2, boxShadow: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>S</Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  Style Studio
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Online
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>

                          <Stack spacing={1.5} sx={{ mt: 2 }}>
                            {demoMessages.map((msg, idx) => (
                              <Fade in={visible} timeout={1000 + idx * 200} key={idx}>
                                <Box
                                  sx={{
                                    alignSelf: msg.sender === 'customer' ? 'flex-start' : 'flex-end',
                                    maxWidth: '75%',
                                  }}
                                >
                                  <Paper
                                    sx={{
                                      p: 1.5,
                                      bgcolor: msg.sender === 'customer' ? 'white' : theme.palette.primary.main,
                                      color: msg.sender === 'customer' ? 'text.primary' : 'white',
                                      borderRadius: 2,
                                      boxShadow: 1,
                                    }}
                                  >
                                    <Typography variant="body2">{msg.text}</Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        opacity: 0.7,
                                        fontSize: '0.7rem',
                                        display: 'block',
                                        mt: 0.5,
                                      }}
                                    >
                                      {msg.time}
                                    </Typography>
                                  </Paper>
                                </Box>
                              </Fade>
                            ))}
                          </Stack>
                        </Box>
                      </Paper>

                      {/* Floating elements */}
                      <Zoom in={visible} timeout={1500}>
                        <Paper
                          elevation={8}
                          sx={{
                            position: 'absolute',
                            top: 20,
                            right: -20,
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'white',
                            display: { xs: 'none', md: 'block' },
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                Booking Confirmed
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Reminder sent
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Zoom>

                      <Zoom in={visible} timeout={1800}>
                        <Paper
                          elevation={8}
                          sx={{
                            position: 'absolute',
                            bottom: 40,
                            left: -40,
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'white',
                            display: { xs: 'none', md: 'block' },
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TrendingUp sx={{ color: 'success.main', fontSize: 28 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                +40% Bookings
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                This month
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Zoom>
                    </Box>
                  </Zoom>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mt: -8, mb: 8, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Fade in={visible} timeout={1000 + index * 100}>
                <Paper
                  elevation={8}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderRadius: 3,
                    bgcolor: 'white',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 12,
                    },
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: stat.color,
                      mb: 1,
                      fontSize: { xs: '1.8rem', md: '2.5rem' },
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {stat.label}
                  </Typography>
                </Paper>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Social Proof */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Paper
          sx={{
            p: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" textAlign="center" fontWeight={600} mb={3} color="text.secondary">
            Trusted by service providers across industries
          </Typography>
          <Grid container spacing={2}>
            {useCases.map((useCase, index) => (
              <Grid item xs={6} md={2} key={index}>
                <Stack alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      bgcolor: 'white',
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      color: theme.palette.primary.main,
                    }}
                  >
                    {useCase.icon}
                  </Box>
                  <Typography variant="caption" fontWeight={600} textAlign="center">
                    {useCase.title}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* Interactive Demo Section */}
      <Box id="demo-section" sx={{ bgcolor: 'grey.50', py: 12 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Chip
              label="Live Demo"
              color="primary"
              sx={{ mb: 2, fontWeight: 600, fontSize: '0.9rem' }}
            />
            <Typography variant="h2" fontWeight={800} gutterBottom>
              See It In Action
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Experience the platform with real components. This is exactly what you'll use to manage your business.
            </Typography>
          </Box>

          {/* Demo Appointment Calendar */}
          <Paper
            elevation={12}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              mb: 6,
              border: `3px solid ${theme.palette.primary.main}`,
            }}
          >
            {/* Demo Toolbar */}
            <Box
              sx={{
                bgcolor: 'white',
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={2}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarMonth sx={{ color: 'primary.main', fontSize: 32 }} />
                  <Typography variant="h6" fontWeight={700}>
                    Today's Schedule
                  </Typography>
                  <Chip
                    label="Live Dashboard"
                    size="small"
                    color="success"
                    sx={{ ml: 1 }}
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Demo Appointments List */}
            <Box sx={{ bgcolor: 'grey.50', p: 3 }}>
              <Grid container spacing={2}>
                {demoAppointments.map((apt, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Fade in={visible} timeout={1000 + index * 200}>
                      <Paper
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor:
                            apt.status === 'confirmed'
                              ? 'success.light'
                              : apt.status === 'pending'
                              ? 'warning.light'
                              : 'grey.300',
                          bgcolor: 'white',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateX(5px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                              sx={{
                                bgcolor:
                                  apt.status === 'confirmed'
                                    ? 'success.main'
                                    : apt.status === 'pending'
                                    ? 'warning.main'
                                    : 'grey.300',
                                color: 'white',
                                p: 1.5,
                                borderRadius: 2,
                                minWidth: 70,
                                textAlign: 'center',
                              }}
                            >
                              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                                {apt.time}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {apt.client}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {apt.service}
                              </Typography>
                            </Box>
                          </Stack>
                          <Chip
                            label={apt.status.toUpperCase()}
                            size="small"
                            color={
                              apt.status === 'confirmed'
                                ? 'success'
                                : apt.status === 'pending'
                                ? 'warning'
                                : 'default'
                            }
                            sx={{ fontWeight: 600 }}
                          />
                        </Stack>
                      </Paper>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Demo Action Footer */}
            <Box
              sx={{
                bgcolor: 'white',
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="outlined" startIcon={<CalendarMonth />}>
                  View Full Calendar
                </Button>
                <Button variant="contained" startIcon={<Message />}>
                  Send Reminder
                </Button>
              </Stack>
            </Box>
          </Paper>

          {/* Demo CTA */}
          <Box textAlign="center">
            <Typography variant="body1" color="text.secondary" mb={2}>
              This is just a preview. The full platform includes calendar views, customer management, analytics, and more.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              endIcon={<ArrowForward />}
              sx={{ px: 4, py: 1.5, fontWeight: 700 }}
            >
              Get Started Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Box textAlign="center" mb={8}>
          <Chip
            label="Everything You Need"
            variant="outlined"
            color="primary"
            sx={{ mb: 2, fontWeight: 600, fontSize: '0.9rem' }}
          />
          <Typography variant="h2" fontWeight={800} gutterBottom>
            All-In-One Platform
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            From appointment scheduling to customer communication, we've got everything covered.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Fade in={visible} timeout={1000 + index * 100}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: 'grey.200',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: feature.color,
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 24px ${feature.color}30`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        bgcolor: `${feature.color}15`,
                        color: feature.color,
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: theme.palette.primary.main, color: 'white', py: 12 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" fontWeight={800} gutterBottom>
                Transform Your Business Operations
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.7 }}>
                Join thousands of service providers who've streamlined their booking process and
                increased revenue with our platform.
              </Typography>
              <List>
                {benefits.map((benefit, index) => (
                  <Fade in={visible} timeout={1000 + index * 100} key={index}>
                    <ListItem sx={{ py: 1.5, px: 0 }}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: theme.palette.secondary.light, fontSize: 32 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={benefit}
                        primaryTypographyProps={{
                          variant: 'h6',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                        }}
                      />
                    </ListItem>
                  </Fade>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={24}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box textAlign="center" mb={3}>
                  <AutoAwesome sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
                    Why Service Providers Love Us
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  <Paper sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight={600} color="text.primary" gutterBottom>
                      "Cut no-shows by 80%"
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automated reminders via SMS ensure customers never forget their appointments.
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight={600} color="text.primary" gutterBottom>
                      "Book appointments 24/7"
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customers can schedule via SMS anytime, even when you're closed.
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight={600} color="text.primary" gutterBottom>
                      "Save 10+ hours per week"
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stop playing phone tag. Automated scheduling handles everything.
                    </Typography>
                  </Paper>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Technology Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" fontWeight={800} gutterBottom>
            Built for Performance & Scale
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
            Enterprise-grade infrastructure that grows with your business
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {techHighlights.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: 'grey.200',
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>{item.icon}</Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {item.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Final CTA */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: 12,
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h2" fontWeight={800} gutterBottom>
              Ready to Transform Your Business?
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.95 }}>
              Join thousands of service providers who've streamlined their operations
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  py: 2,
                  px: 5,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  py: 2,
                  px: 5,
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Sign In
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
              No credit card required • Setup in 5 minutes • Cancel anytime
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                SMS Calendar
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                The modern booking platform for service providers. Manage appointments, communicate with
                customers, and grow your business.
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Product
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ opacity: 0.7, cursor: 'pointer' }}>
                  Features
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, cursor: 'pointer' }}>
                  Integrations
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, cursor: 'pointer' }}>
                  API
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Company
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ opacity: 0.7, cursor: 'pointer' }}>
                  About
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, cursor: 'pointer' }}>
                  Contact
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, cursor: 'pointer' }}>
                  Privacy
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', mt: 4, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.5 }}>
              © {new Date().getFullYear()} SMS Calendar. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
