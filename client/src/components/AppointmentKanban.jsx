import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  EventAvailable as ConfirmedIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const AppointmentKanban = ({ appointments }) => {
  const theme = useTheme();

  // Define kanban columns
  const columns = [
    {
      id: 'pending',
      title: 'Pending',
      icon: <PendingIcon />,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
    },
    {
      id: 'confirmed',
      title: 'Confirmed',
      icon: <ConfirmedIcon />,
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1),
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
    },
    {
      id: 'canceled',
      title: 'Canceled',
      icon: <CancelIcon />,
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.1),
    },
  ];

  // Get time badge for appointment
  const getTimeBadge = (appointment) => {
    const appointmentDate = new Date(appointment.startTime);

    if (isPast(appointmentDate) && appointment.status !== 'completed' && appointment.status !== 'canceled') {
      return { label: 'Overdue', color: 'error' };
    }

    if (isToday(appointmentDate)) {
      return { label: 'Today', color: 'primary' };
    }

    if (isTomorrow(appointmentDate)) {
      return { label: 'Tomorrow', color: 'info' };
    }

    return null;
  };

  // Format time display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, h:mm a');
  };

  // Render appointment card
  const AppointmentCard = ({ appointment, columnColor }) => {
    const timeBadge = getTimeBadge(appointment);
    const customerName = appointment.customerId?.name || appointment.customerInfo?.name || 'Unknown Customer';
    const serviceName = appointment.serviceId?.name || 'Unknown Service';
    const serviceColor = appointment.serviceId?.color || theme.palette.grey[500];
    const duration = appointment.serviceId?.durationMinutes || 30;

    return (
      <Card
        sx={{
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.3s',
          border: `2px solid ${alpha(columnColor, 0.2)}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 6,
            borderColor: columnColor,
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
            <Stack direction="row" spacing={1} alignItems="center" flex={1}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: serviceColor,
                  flexShrink: 0,
                }}
              />
              <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1 }}>
                {serviceName}
              </Typography>
            </Stack>
            <IconButton size="small" sx={{ ml: 1 }}>
              <MoreIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Customer Info */}
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: columnColor,
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              {customerName.charAt(0).toUpperCase()}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {customerName}
              </Typography>
              {appointment.customerId?.phone && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 12 }} />
                  {appointment.customerId.phone}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Time & Duration */}
          <Stack spacing={1}>
            <Chip
              icon={<ScheduleIcon />}
              label={formatTime(appointment.startTime)}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
            {timeBadge && (
              <Chip
                label={timeBadge.label}
                size="small"
                color={timeBadge.color}
                sx={{ fontSize: '0.7rem', fontWeight: 700 }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              Duration: {duration} minutes
            </Typography>
          </Stack>

          {/* Notes */}
          {appointment.notes && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              📝 {appointment.notes}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Kanban Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Appointments Board
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your appointments as they move through different stages this month
        </Typography>
      </Box>

      {/* Kanban Columns */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        {columns.map((column) => {
          const columnAppointments = appointments[column.id] || [];
          const count = columnAppointments.length;

          return (
            <Paper
              key={column.id}
              elevation={0}
              sx={{
                p: 2,
                bgcolor: column.bgColor,
                border: `2px solid ${alpha(column.color, 0.3)}`,
                borderRadius: 2,
                minHeight: 400,
                maxHeight: 600,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
                pb={2}
                sx={{
                  borderBottom: `2px solid ${alpha(column.color, 0.2)}`,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ color: column.color, display: 'flex' }}>
                    {column.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    {column.title}
                  </Typography>
                </Stack>
                <Badge
                  badgeContent={count}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: column.color,
                      color: 'white',
                      fontWeight: 700,
                    },
                  }}
                >
                  <Box sx={{ width: 24, height: 24 }} />
                </Badge>
              </Stack>

              {/* Cards Container */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  pr: 0.5,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(column.color, 0.3),
                    borderRadius: '10px',
                    '&:hover': {
                      bgcolor: alpha(column.color, 0.5),
                    },
                  },
                }}
              >
                {count === 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 200,
                      color: 'text.secondary',
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <Box sx={{ color: alpha(column.color, 0.3), fontSize: 48 }}>
                        {column.icon}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        No {column.title.toLowerCase()} appointments
                      </Typography>
                    </Stack>
                  </Box>
                ) : (
                  columnAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                      columnColor={column.color}
                    />
                  ))
                )}
              </Box>

              {/* Column Footer */}
              <Box
                sx={{
                  pt: 2,
                  mt: 2,
                  borderTop: `1px solid ${alpha(column.color, 0.1)}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                  {count} {count === 1 ? 'appointment' : 'appointments'}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default AppointmentKanban;
