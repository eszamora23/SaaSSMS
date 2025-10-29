/**
 * Add to Calendar Button Component
 * Provides dropdown menu to add appointment to various calendar services
 */

import { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  Google as GoogleIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateOffice365CalendarUrl,
  generateYahooCalendarUrl,
  downloadIcsFile,
  openCalendarUrl,
} from '../utils/calendar';

export default function AddToCalendarButton({ appointment, variant = 'contained', size = 'medium', fullWidth = false }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(appointment);
    openCalendarUrl(url);
    handleClose();
  };

  const handleOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl(appointment);
    openCalendarUrl(url);
    handleClose();
  };

  const handleOffice365Calendar = () => {
    const url = generateOffice365CalendarUrl(appointment);
    openCalendarUrl(url);
    handleClose();
  };

  const handleYahooCalendar = () => {
    const url = generateYahooCalendarUrl(appointment);
    openCalendarUrl(url);
    handleClose();
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(appointment);
    handleClose();
  };

  if (!appointment) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        startIcon={<EventIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={handleClick}
        aria-controls={open ? 'calendar-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        Add to Calendar
      </Button>
      <Menu
        id="calendar-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'calendar-button',
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleGoogleCalendar}>
          <ListItemIcon>
            <GoogleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Google Calendar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOutlookCalendar}>
          <ListItemIcon>
            <CalendarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Outlook Calendar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOffice365Calendar}>
          <ListItemIcon>
            <CalendarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Office 365 Calendar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleYahooCalendar}>
          <ListItemIcon>
            <CalendarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Yahoo Calendar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDownloadIcs}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download .ics file</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
