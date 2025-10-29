import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Chip,
  InputAdornment,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Fab,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Replay as ReopenIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { messagesAPI, threadsAPI, usersAPI, customersAPI } from '../services/api';
import socketService from '../services/socket';

export default function Messages() {
  const { user } = useSelector((state) => state.auth);

  // State
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);

  // Dialogs and menus
  const [anchorEl, setAnchorEl] = useState(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [assignMenuAnchor, setAssignMenuAnchor] = useState(null);

  // New message dialog
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [newMessageMode, setNewMessageMode] = useState('customer'); // 'customer' or 'phone'
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingNewMessage, setSendingNewMessage] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Load threads on mount
  useEffect(() => {
    loadThreads();
    loadAgents();
    setupSocketListeners();

    return () => {
      socketService.off('message.received');
      socketService.off('message.sent');
      socketService.off('thread.updated');
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load threads
  const loadThreads = async () => {
    try {
      setLoading(true);
      const response = await threadsAPI.getThreads({
        page: 1,
        limit: 100,
        sortBy: 'lastMessageAt',
        sortOrder: 'desc',
      });
      setThreads(response.data.data.threads);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading threads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load agents for assignment
  const loadAgents = async () => {
    try {
      const response = await usersAPI.getUsers({ role: 'agent', status: 'active' });
      setAgents(response.data.data.users || []);
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  };

  // Setup real-time socket listeners
  const setupSocketListeners = () => {
    // New message received
    socketService.on('message.received', (data) => {
      const { message } = data;

      // Update thread list
      setThreads((prevThreads) => {
        const updatedThreads = prevThreads.map((thread) => {
          if (thread._id === message.threadId) {
            return {
              ...thread,
              lastMessagePreview: message.body,
              lastMessageAt: message.createdAt,
              unreadCount: selectedThread?._id === thread._id ? 0 : (thread.unreadCount || 0) + 1,
            };
          }
          return thread;
        });
        // Sort by last message time
        return updatedThreads.sort((a, b) =>
          new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      });

      // Add to messages if in current thread
      if (selectedThread && message.threadId === selectedThread._id) {
        setMessages((prev) => [...prev, message]);
        markThreadAsRead(selectedThread._id);
      }
    });

    // Message sent successfully
    socketService.on('message.sent', (data) => {
      const { message } = data;

      // Update thread list
      setThreads((prevThreads) => {
        const updatedThreads = prevThreads.map((thread) => {
          if (thread._id === message.threadId) {
            return {
              ...thread,
              lastMessagePreview: message.body,
              lastMessageAt: message.createdAt,
            };
          }
          return thread;
        });
        return updatedThreads.sort((a, b) =>
          new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      });

      // Add to messages if in current thread
      if (selectedThread && message.threadId === selectedThread._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Thread updated
    socketService.on('thread.updated', (data) => {
      const { thread } = data;
      setThreads((prevThreads) =>
        prevThreads.map((t) => (t._id === thread._id ? { ...t, ...thread } : t))
      );
      if (selectedThread?._id === thread._id) {
        setSelectedThread((prev) => ({ ...prev, ...thread }));
      }
    });
  };

  // Select thread and load messages
  const handleSelectThread = async (thread) => {
    setSelectedThread(thread);
    setError(null);

    try {
      const response = await messagesAPI.getMessages(thread._id, {
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
      setMessages(response.data.data.messages);

      // Mark as read
      markThreadAsRead(thread._id);

      // Update local thread unread count
      setThreads((prevThreads) =>
        prevThreads.map((t) =>
          t._id === thread._id ? { ...t, unreadCount: 0 } : t
        )
      );
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    }
  };

  // Mark thread as read
  const markThreadAsRead = async (threadId) => {
    try {
      await threadsAPI.markAsRead(threadId);
    } catch (err) {
      console.error('Error marking thread as read:', err);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedThread || sendingMessage) return;

    const messageBody = messageInput.trim();
    setMessageInput('');
    setSendingMessage(true);

    try {
      await messagesAPI.sendMessage({
        threadId: selectedThread._id,
        to: selectedThread.customerId?.phone,
        body: messageBody,
      });
      // Message will be added via socket event
      messageInputRef.current?.focus();
    } catch (err) {
      setError('Failed to send message');
      setMessageInput(messageBody); // Restore message on error
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Enter key to send
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Close thread dialog
  const handleCloseThread = async () => {
    if (!selectedThread) return;

    try {
      await threadsAPI.updateThread(selectedThread._id, { status: 'closed' });
      setCloseDialogOpen(false);
      setSelectedThread((prev) => ({ ...prev, status: 'closed' }));
    } catch (err) {
      setError('Failed to close conversation');
      console.error('Error closing thread:', err);
    }
  };

  // Reopen thread
  const handleReopenThread = async () => {
    if (!selectedThread) return;

    try {
      await threadsAPI.updateThread(selectedThread._id, { status: 'open' });
      setSelectedThread((prev) => ({ ...prev, status: 'open' }));
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to reopen conversation');
      console.error('Error reopening thread:', err);
    }
  };

  // Assign to agent
  const handleAssignAgent = async (agentId) => {
    if (!selectedThread) return;

    try {
      await threadsAPI.updateThread(selectedThread._id, { assignedTo: agentId });
      const assignedAgent = agents.find((a) => a._id === agentId);
      setSelectedThread((prev) => ({
        ...prev,
        assignedTo: agentId,
        assignedToUser: assignedAgent,
      }));
      setAssignMenuAnchor(null);
    } catch (err) {
      setError('Failed to assign conversation');
      console.error('Error assigning thread:', err);
    }
  };

  // New message dialog handlers
  const handleOpenNewMessageDialog = async () => {
    setNewMessageDialogOpen(true);
    // Load customers when dialog opens
    if (customers.length === 0) {
      loadCustomers();
    }
  };

  const handleCloseNewMessageDialog = () => {
    setNewMessageDialogOpen(false);
    setSelectedCustomer(null);
    setNewPhoneNumber('');
    setNewMessageText('');
    setNewMessageMode('customer');
  };

  const loadCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await customersAPI.getAll({ limit: 100 });
      setCustomers(response.data.data.customers || []);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessageText.trim()) return;

    const recipientPhone = newMessageMode === 'customer'
      ? selectedCustomer?.phone
      : newPhoneNumber;

    if (!recipientPhone) {
      setError('Please select a customer or enter a phone number');
      return;
    }

    try {
      setSendingNewMessage(true);
      await messagesAPI.sendMessage({
        to: recipientPhone,
        body: newMessageText.trim(),
      });

      // Reload threads to show the new conversation
      await loadThreads();
      handleCloseNewMessageDialog();
      setError(null);
    } catch (err) {
      console.error('Error sending new message:', err);
      setError(err.response?.data?.error?.message || 'Failed to send message');
    } finally {
      setSendingNewMessage(false);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter threads by search
  const filteredThreads = threads.filter((thread) => {
    const query = searchQuery.toLowerCase();
    return (
      thread.customerId?.name?.toLowerCase().includes(query) ||
      thread.customerId?.phone?.includes(query) ||
      thread.lastMessagePreview?.toLowerCase().includes(query)
    );
  });

  // Format time
  const formatTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const isToday = messageDate.toDateString() === today.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 0 }}>
      {/* Thread List Sidebar */}
      <Paper
        sx={{
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        {/* Search Bar and New Message Button */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={handleOpenNewMessageDialog}
            >
              New Message
            </Button>
            <TextField
              fullWidth
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Box>

        {/* Thread List */}
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredThreads.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </Typography>
            </Box>
          ) : (
            filteredThreads.map((thread) => (
              <ListItem
                key={thread._id}
                disablePadding
                sx={{
                  bgcolor: selectedThread?._id === thread._id ? 'action.selected' : 'transparent',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <ListItemButton onClick={() => handleSelectThread(thread)}>
                  <ListItemAvatar>
                    <Badge
                      badgeContent={thread.unreadCount || 0}
                      color="primary"
                      max={99}
                    >
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: thread.unreadCount > 0 ? 600 : 400 }}>
                          {thread.customerId?.name || thread.customerId?.phone}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(thread.lastMessageAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            color: thread.unreadCount > 0 ? 'text.primary' : 'text.secondary',
                            fontWeight: thread.unreadCount > 0 ? 500 : 400,
                          }}
                        >
                          {thread.lastMessagePreview || 'No messages yet'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {thread.status === 'closed' && (
                            <Chip label="Closed" size="small" color="default" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                          {thread.assignedToUser && (
                            <Chip
                              label={thread.assignedToUser.profile?.firstName || 'Agent'}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 0,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="h6">
                  {selectedThread.customerId?.name || selectedThread.customerId?.phone}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {selectedThread.customerId?.phone}
                  </Typography>
                  {selectedThread.status === 'closed' && (
                    <Chip label="Closed" size="small" color="default" sx={{ ml: 1 }} />
                  )}
                  {selectedThread.assignedToUser && (
                    <Chip
                      label={`Assigned to ${selectedThread.assignedToUser.profile?.firstName || 'Agent'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Box>
              <Box>
                <IconButton onClick={(e) => setAssignMenuAnchor(e.currentTarget)}>
                  <PersonIcon />
                </IconButton>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Paper>

            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                bgcolor: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {messages.map((message) => {
                const isOutbound = message.direction === 'outbound';
                const isSent = message.status === 'sent' || message.status === 'delivered';

                return (
                  <Box
                    key={message._id}
                    sx={{
                      display: 'flex',
                      justifyContent: isOutbound ? 'flex-end' : 'flex-start',
                      mb: 0.5,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: '70%',
                        bgcolor: isOutbound ? 'primary.main' : 'white',
                        color: isOutbound ? 'white' : 'text.primary',
                        borderRadius: 2,
                        borderTopRightRadius: isOutbound ? 4 : 16,
                        borderTopLeftRadius: isOutbound ? 16 : 4,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.body}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.8,
                            fontSize: '0.65rem',
                          }}
                        >
                          {formatTime(message.createdAt)}
                        </Typography>
                        {isOutbound && (
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: 0.8,
                              fontSize: '0.65rem',
                            }}
                          >
                            {isSent ? '✓✓' : '✓'}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 0,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              {selectedThread.status === 'closed' ? (
                <Alert severity="info" action={
                  <Button color="inherit" size="small" onClick={handleReopenThread}>
                    Reopen
                  </Button>
                }>
                  This conversation is closed. Reopen to send messages.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    inputRef={messageInputRef}
                    disabled={sendingMessage}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    sx={{ mb: 0.5 }}
                  >
                    {sendingMessage ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Box>
              )}
            </Paper>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start messaging
            </Typography>
          </Box>
        )}
      </Box>

      {/* Thread Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {selectedThread?.status === 'open' ? (
          <MenuItem onClick={() => { setAnchorEl(null); setCloseDialogOpen(true); }}>
            <CloseIcon sx={{ mr: 1 }} fontSize="small" />
            Close Conversation
          </MenuItem>
        ) : (
          <MenuItem onClick={handleReopenThread}>
            <ReopenIcon sx={{ mr: 1 }} fontSize="small" />
            Reopen Conversation
          </MenuItem>
        )}
      </Menu>

      {/* Agent Assignment Menu */}
      <Menu
        anchorEl={assignMenuAnchor}
        open={Boolean(assignMenuAnchor)}
        onClose={() => setAssignMenuAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">Assign to agent</Typography>
        </MenuItem>
        <Divider />
        {agents.map((agent) => (
          <MenuItem
            key={agent._id}
            onClick={() => handleAssignAgent(agent._id)}
            selected={selectedThread?.assignedTo === agent._id}
          >
            {agent.profile?.firstName || agent.email} {agent.profile?.lastName || ''}
          </MenuItem>
        ))}
        {agents.length === 0 && (
          <MenuItem disabled>No agents available</MenuItem>
        )}
      </Menu>

      {/* Close Conversation Dialog */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)}>
        <DialogTitle>Close Conversation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to close this conversation? The conversation history will be saved
            and you can reopen it later if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCloseThread} variant="contained" color="primary">
            Close Conversation
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Message Dialog */}
      <Dialog
        open={newMessageDialogOpen}
        onClose={handleCloseNewMessageDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          New Message
          <IconButton
            aria-label="close"
            onClick={handleCloseNewMessageDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Toggle between existing customer and new number */}
            <ToggleButtonGroup
              value={newMessageMode}
              exclusive
              onChange={(e, value) => value && setNewMessageMode(value)}
              fullWidth
              size="small"
            >
              <ToggleButton value="customer">
                <PersonIcon sx={{ mr: 1 }} />
                Existing Contact
              </ToggleButton>
              <ToggleButton value="phone">
                <PhoneIcon sx={{ mr: 1 }} />
                Phone Number
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Customer selection */}
            {newMessageMode === 'customer' ? (
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                value={selectedCustomer}
                onChange={(e, value) => setSelectedCustomer(value)}
                loading={customersLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Contact"
                    placeholder="Search for a contact..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {customersLoading ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.phone}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            ) : (
              <TextField
                label="Phone Number"
                placeholder="+1234567890 or 1234567890"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
                helperText="Enter phone number with country code (e.g., +1 for US)"
              />
            )}

            {/* Message text */}
            <TextField
              label="Message"
              multiline
              rows={4}
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type your message here..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewMessageDialog}>Cancel</Button>
          <Button
            onClick={handleSendNewMessage}
            variant="contained"
            disabled={
              sendingNewMessage ||
              !newMessageText.trim() ||
              (newMessageMode === 'customer' ? !selectedCustomer : !newPhoneNumber.trim())
            }
            startIcon={sendingNewMessage ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sendingNewMessage ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
