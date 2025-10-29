/**
 * Phone Numbers Page
 * Manage organization phone numbers
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  Voicemail as VoiceIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { numbersAPI } from '../services/api';

export default function PhoneNumbers() {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      setLoading(true);
      const response = await numbersAPI.getAll();
      setNumbers(response.data.data.phoneNumbers || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      showSnackbar('Failed to load phone numbers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await numbersAPI.release(selectedNumber._id);
      showSnackbar('Phone number released successfully');
      setOpenDeleteDialog(false);
      setSelectedNumber(null);
      fetchNumbers();
    } catch (error) {
      console.error('Error deleting number:', error);
      showSnackbar('Failed to release phone number', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatPhoneNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
      if (match) return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
    return number;
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
        <Typography variant="h4">Phone Numbers</Typography>
      </Stack>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Phone numbers are managed through your Twilio account. Configure Twilio credentials in Settings to purchase numbers.
      </Alert>

      {/* Phone Numbers List */}
      {numbers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PhoneIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No phone numbers configured
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure Twilio integration in Settings to purchase and manage phone numbers
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Phone Number</TableCell>
                <TableCell>Friendly Name</TableCell>
                <TableCell>Capabilities</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Twilio SID</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {numbers.map((number) => (
                <TableRow key={number._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon color="primary" />
                      <Typography variant="body1" fontWeight="medium">
                        {formatPhoneNumber(number.e164)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{number.friendlyName || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
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
                  </TableCell>
                  <TableCell>
                    {number.status === 'active' ? (
                      <Chip icon={<CheckCircleIcon />} label="Active" size="small" color="success" />
                    ) : (
                      <Chip label={number.status || 'Unknown'} size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {number.twilioSid}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Release Number">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedNumber(number);
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Release Phone Number?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to release {selectedNumber && formatPhoneNumber(selectedNumber.e164)}?
            This will disconnect the number from your account and it may become available to others.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Release Number
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
