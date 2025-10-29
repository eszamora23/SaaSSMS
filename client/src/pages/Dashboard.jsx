import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  Message,
  CalendarMonth,
  People,
  CheckCircle,
} from '@mui/icons-material';
import { organizationAPI } from '../services/api';
import AppointmentKanban from '../components/AppointmentKanban';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await organizationAPI.getStats();
        setStats(response.data.data.stats);
      } catch (err) {
        setError('Failed to load dashboard stats');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const statCards = [
    {
      title: 'Messages This Month',
      value: stats?.monthly?.messages || 0,
      icon: <Message sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      subtitle: `${stats?.totalMessages || 0} total`,
    },
    {
      title: 'Appointments This Month',
      value: stats?.monthly?.appointments || 0,
      icon: <CalendarMonth sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      subtitle: `${stats?.totalAppointments || 0} total`,
    },
    {
      title: 'New Customers This Month',
      value: stats?.monthly?.customers || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      subtitle: `${stats?.totalCustomers || 0} total`,
    },
    {
      title: 'Completed This Month',
      value: stats?.monthly?.completedAppointments || 0,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      subtitle: `${stats?.completedAppointments || 0} total`,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with your business.
          </Typography>
        </Box>
        <Chip
          label={stats?.monthly?.month || 'This Month'}
          color="primary"
          sx={{ fontWeight: 600, fontSize: '0.9rem', px: 1 }}
        />
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      bgcolor: card.color,
                      color: 'white',
                      borderRadius: 2,
                      p: 1.5,
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Kanban Board */}
      {stats?.kanban && <AppointmentKanban appointments={stats.kanban} />}
    </Box>
  );
}
