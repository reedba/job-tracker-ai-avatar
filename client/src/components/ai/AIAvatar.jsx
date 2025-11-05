import { Box, Container, Typography, Paper, Button, Avatar, TextField, IconButton, List, ListItem, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from '../../config/axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SendIcon from '@mui/icons-material/Send';
import { useState, useEffect, useRef } from 'react';
import { getConsumer } from '../../utils/cable';
import { createAvatarLink } from '../../features/avatarLinks/avatarLinksSlice';
import { Person as PersonIcon, SmartToy as BotIcon } from '@mui/icons-material';

const AIAvatar = () => {
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const isAdmin = Boolean(user && (user.is_admin === true || user.is_admin === 'true' || user.is_admin === 1 || user.is_admin === '1'));
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const dispatch = useDispatch();
  const params = useParams();

  // Public session state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [linkValid, setLinkValid] = useState(null); // null = unknown, true/false
  const [linkData, setLinkData] = useState(null);
  const [startingSession, setStartingSession] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [remaining, setRemaining] = useState(null);

  // AvatarLinks redux state
  const avatarLinksStatus = useSelector((state) => state.avatarLinks.status);
  const lastCreatedLink = useSelector((state) => state.avatarLinks.lastCreated);
  const avatarLinksError = useSelector((state) => state.avatarLinks.error);

  // Inline chat state
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    { id: 'welcome', text: "Hi — I'm your AI Avatar (Phase 2: OpenAI Integration). Ask me anything about your job search!", sender: 'bot', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Try to restore an active guest session from sessionStorage so a browser
  // refresh won't force the visitor to re-open the modal if they've already
  // begun the interview in this tab.
  useEffect(() => {
    const tokenFromUrl = params?.token;
    if (!tokenFromUrl) return;

    // If logged-in user exists, nothing to restore for public guest flows
    if (user) return;

    try {
      const stored = sessionStorage.getItem(`avatar_session:${tokenFromUrl}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.session_token && parsed?.expires_at) {
          const expires = new Date(parsed.expires_at);
          if (expires > new Date()) {
            setSessionToken(parsed.session_token);
            setSessionExpiresAt(parsed.expires_at);
            setShowVerifyModal(false);
            return; // restored, skip verify
          } else {
            // expired, remove stored value
            sessionStorage.removeItem(`avatar_session:${tokenFromUrl}`);
          }
        }
      }
    } catch (e) {
      console.warn('failed restoring avatar session from storage', e);
    }

    // No valid stored session; proceed to verify the link with the server.
    if (sessionToken) return; // session established elsewhere
    
    const verify = async () => {
      try {
        setLinkValid(null);
        const res = await axios.get(`/api/avatar_links/verify?token=${encodeURIComponent(tokenFromUrl)}`);
        if (res?.data?.valid) {
          setLinkValid(true);
          setLinkData(res.data);
        } else {
          setLinkValid(false);
          setLinkData(null);
        }
      } catch (e) {
        console.warn('verify failed', e);
        setLinkValid(false);
        setLinkData(null);
      }
    };

    // Always verify the link to check if it's still available
    verify();
    setShowVerifyModal(true);
  }, [params, user, sessionToken]);

  const handleBeginInterview = async () => {
    if (!linkData) return;
    setStartingSession(true);
    try {
      const res = await axios.post(`/api/avatar_links/${linkData.id}/start_session`);
      const { session_token, expires_at } = res.data;
      if (session_token) {
        setSessionToken(session_token);
        setSessionExpiresAt(expires_at);
        setShowVerifyModal(false);
        // Persist session for this tab so refresh won't prompt again.
        try {
          sessionStorage.setItem(`avatar_session:${params?.token}`, JSON.stringify({ session_token, expires_at }));
        } catch (e) {
          console.warn('failed to persist avatar session in sessionStorage', e);
        }
      } else {
        console.warn('no session_token in response', res.data);
      }
    } catch (e) {
      console.error('start_session failed', e);
      // show an error in modal (simple approach)
      setLinkValid(false);
    } finally {
      setStartingSession(false);
    }
  };

  // When a sessionExpiresAt is present, set a timer to clear the stored
  // session and local state when the session JWT expires.
  useEffect(() => {
    if (!sessionExpiresAt || !params?.token) return;
    // Only enforce guest session expiry UI for public (unauthenticated) visitors
    if (user) return;
    
    const expiresAtDate = new Date(sessionExpiresAt);
    const ms = expiresAtDate - new Date();
    if (ms <= 0) {
      // Session already expired - clear everything and don't allow restart
      try { sessionStorage.removeItem(`avatar_session:${params.token}`); } catch (e) {}
      setSessionToken(null);
      setSessionExpiresAt(null);
      setLinkValid(false); // Mark link as invalid after session expires
      setLinkData(null);
      setShowVerifyModal(true); // Show modal with expired message
      return;
    }
    const t = setTimeout(() => {
      // Session expired - clear everything and mark link as consumed
      try { sessionStorage.removeItem(`avatar_session:${params.token}`); } catch (e) {}
      setSessionToken(null);
      setSessionExpiresAt(null);
      setLinkValid(false); // Mark link as invalid after session expires
      setLinkData(null);
      setShowVerifyModal(true); // Show modal with expired message
    }, ms);
    return () => clearTimeout(t);
  }, [sessionExpiresAt, params, user]);

  // Countdown display for active guest session
  useEffect(() => {
    if (!sessionExpiresAt || !params?.token) {
      setRemaining(null);
      return;
    }

    const formatMs = (ms) => {
      const total = Math.max(0, Math.floor(ms / 1000));
      const hrs = Math.floor(total / 3600);
      const mins = Math.floor((total % 3600) / 60);
      const secs = total % 60;
      if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const update = () => {
      const ms = new Date(sessionExpiresAt) - new Date();
      if (ms <= 0) {
        try { sessionStorage.removeItem(`avatar_session:${params.token}`); } catch (e) {}
        // Session expired - link is now consumed and unusable
        if (!user) {
          setLinkValid(false);
          setLinkData(null);
          setShowVerifyModal(true);
        }
        setSessionToken(null);
        setSessionExpiresAt(null);
        setRemaining(null);
        return;
      }
      setRemaining(formatMs(ms));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [sessionExpiresAt, params]);

  // Setup ActionCable subscription for inline chat.
  // Setup ActionCable subscription for Avatar chat.
  // Phase 1: Basic echo channel for testing WebSocket plumbing
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    const tokenToUse = sessionToken || authToken;

    if (!tokenToUse) {
      // No token available; do not create a consumer yet.
      return undefined;
    }

    console.log('Setting up AvatarChannel subscription...');

    // Clean up any previous subscription
    if (subscriptionRef.current) {
      try { subscriptionRef.current.unsubscribe(); } catch (e) {}
      subscriptionRef.current = null;
    }

    const consumer = getConsumer(tokenToUse);
    try {
      subscriptionRef.current = consumer.subscriptions.create({ channel: 'AvatarChannel' }, {
        connected() { 
          console.log('AvatarChannel connected');
          setIsConnected(true); 
        },
        disconnected() { 
          console.log('AvatarChannel disconnected');
          setIsConnected(false); 
        },
        received(data) {
          console.log('AvatarChannel received:', data);
          
          if (data.type === 'connection') {
            console.log('Connection confirmed:', data.message);
          } else if (data.type === 'message') {
            setMessages(prev => [...prev, { id: Date.now(), text: data.text, sender: 'bot', timestamp: new Date(data.timestamp || Date.now()) }]);
            setIsLoading(false);
          } else if (data.type === 'status') {
            setIsLoading(data.status === 'typing');
          } else if (data.type === 'error') {
            setMessages(prev => [...prev, { id: Date.now(), text: data.message, sender: 'bot', timestamp: new Date() }]);
            setIsLoading(false);
          }
        }
      });
    } catch (e) {
      console.warn('AvatarChannel subscription failed', e);
    }

    return () => {
      if (subscriptionRef.current) {
        try { subscriptionRef.current.unsubscribe(); } catch (e) {}
        subscriptionRef.current = null;
      }
    };
  }, [sessionToken, user]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading || !isConnected) return;
    const userMessage = { id: Date.now(), text: inputValue, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    if (subscriptionRef.current) {
      try { subscriptionRef.current.send({ message: inputValue }); } catch (e) { console.warn(e); }
    }
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleGenerateUrl = () => {
    if (!isAdmin) return;
    // Dispatch the avatar link creation thunk. Payload can be extended
    dispatch(createAvatarLink({ name: 'Interview', max_uses: 1 }));
  };

  // When a new link is created via the slice, update the generatedUrl shown in the UI
  useEffect(() => {
    if (lastCreatedLink && lastCreatedLink.url) {
      setGeneratedUrl(lastCreatedLink.url);
      setCopied(false);
    } else if (lastCreatedLink && lastCreatedLink.token) {
      setGeneratedUrl(`${window.location.origin}/avatar/${lastCreatedLink.token}`);
      setCopied(false);
    }
    if (avatarLinksStatus === 'failed' && avatarLinksError) {
      alert(`Failed to create link: ${avatarLinksError}`);
    }
  }, [lastCreatedLink, avatarLinksStatus, avatarLinksError]);

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // fallback: do nothing
      console.warn('Copy failed', e);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 96, height: 96 }}>AI</Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5">AI Avatar</Typography>
            <Typography variant="body2" color="text.secondary">
              This page provides a chat interface for interacting with the AI assistant. Public visitors can chat, and admins have extra controls.
            </Typography>
            {remaining && (
              <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
                Session time remaining: {remaining}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            Chat with the assistant below.
          </Typography>

          {/* Admin-only generate URL control */}
          {isAdmin && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Button variant="contained" onClick={handleGenerateUrl} disabled={avatarLinksStatus === 'loading'}>
                {avatarLinksStatus === 'loading' ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Generate URL'}
              </Button>
              <TextField
                value={generatedUrl}
                placeholder="Generated URL will appear here"
                size="small"
                sx={{ flex: 1 }}
                InputProps={{ readOnly: true }}
              />
              <IconButton onClick={handleCopy} disabled={!generatedUrl} color={copied ? 'success' : 'default'}>
                {copied ? <CheckIcon /> : <ContentCopyIcon />}
              </IconButton>
            </Box>
          )}

          {/* Inline chat panel */}
          <Box sx={{ mt: 1 }}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <List sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                {messages.map((message) => (
                  <ListItem key={message.id} sx={{ display: 'flex', flexDirection: message.sender === 'user' ? 'row-reverse' : 'row', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main' }}>
                      {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                    </Avatar>
                    <Box sx={{ bgcolor: message.sender === 'user' ? 'primary.light' : 'white', p: 1.25, borderRadius: 1, maxWidth: '80%' }}>
                      <Typography variant="body2" sx={{ color: message.sender === 'user' ? 'white' : '#1a237e' }}>{message.text}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </Box>
                  </ListItem>
                ))}
                {isLoading && (
                  <ListItem sx={{ justifyContent: 'center' }}><CircularProgress size={20} /></ListItem>
                )}
                <div ref={messagesEndRef} />
              </List>

              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder={isConnected ? 'Ask the assistant...' : 'Connecting...'} 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  onKeyPress={handleKeyPress} 
                  disabled={!isConnected} 
                  multiline 
                  maxRows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: 'grey.400',
                        borderWidth: '1px'
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: '2px'
                      },
                      '& input': {
                        color: '#1a237e'
                      },
                      '& textarea': {
                        color: '#1a237e'
                      }
                    }
                  }}
                />
                <IconButton color="primary" onClick={handleSendMessage} disabled={!inputValue.trim() || !isConnected}><SendIcon /></IconButton>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
          </Box>
        </Box>
      </Paper>

      {/* Public verify / begin interview modal (for unauthenticated visitors) */}
      <Dialog open={showVerifyModal} onClose={() => setShowVerifyModal(false)}>
        <DialogTitle>Begin Interview</DialogTitle>
        <DialogContent>
          {linkValid === null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 300 }}>
              <CircularProgress size={20} />
              <Typography>Checking link...</Typography>
            </Box>
          )}

          {linkValid === false && (
            <Typography color="error">
              This interview link is invalid, expired, or has already been used. 
              Please request a new link to start another interview session.
            </Typography>
          )}

          {linkValid === true && linkData && (
            <Box sx={{ minWidth: 320 }}>
              <Typography variant="subtitle1">{linkData.name || 'Interview Session'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This will start a 2-minute interview session for this AI avatar. You will be connected as a guest.
              </Typography>
              {linkData.expires_at && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Link expires at: {new Date(linkData.expires_at).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVerifyModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBeginInterview} disabled={!linkValid || startingSession}>
            {startingSession ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Begin Interview'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AIAvatar;
