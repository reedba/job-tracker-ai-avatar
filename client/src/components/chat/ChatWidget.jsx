import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Fab,
  Paper,
  IconButton,
  TextField,
  Typography,
  Collapse,
  List,
  ListItem,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { getConsumer } from '../../utils/cable';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your job tracking assistant. I can help you analyze your applications, provide insights about companies, and answer questions about your job search. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !subscriptionRef.current) {
      // Create WebSocket subscription
      const consumer = getConsumer();
      
      subscriptionRef.current = consumer.subscriptions.create(
        { channel: 'ChatChannel' },
        {
          connected() {
            console.log('Connected to ChatChannel');
            setIsConnected(true);
          },
          disconnected() {
            console.log('Disconnected from ChatChannel');
            setIsConnected(false);
          },
          received(data) {
            console.log('Received data:', data);
            
            switch (data.type) {
              case 'message':
                const botMessage = {
                  id: Date.now(),
                  text: data.text,
                  sender: 'bot',
                  timestamp: new Date(data.timestamp),
                };
                console.log('Adding bot message:', botMessage);
                setMessages((prev) => {
                  const updated = [...prev, botMessage];
                  console.log('Updated messages:', updated);
                  return updated;
                });
                break;
                
              case 'status':
                if (data.status === 'typing') {
                  setIsLoading(true);
                } else if (data.status === 'idle') {
                  setIsLoading(false);
                }
                break;
                
              case 'error':
                const errorMessage = {
                  id: Date.now(),
                  text: data.message,
                  sender: 'bot',
                  timestamp: new Date(data.timestamp),
                };
                setMessages((prev) => [...prev, errorMessage]);
                setIsLoading(false);
                break;
                
              case 'system':
                console.log('System message:', data.message);
                break;
                
              default:
                console.warn('Unknown message type:', data.type);
            }
          },
        }
      );
    }

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Send message through WebSocket
    if (subscriptionRef.current) {
      subscriptionRef.current.send({ message: inputValue });
    }
    
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleToggle}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Chat Widget */}
      <Collapse
        in={isOpen}
        sx={{
          position: 'fixed',
          bottom: 96,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: 380,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BotIcon />
              <Typography variant="h6">Job Search Assistant</Typography>
            </Box>
            <IconButton size="small" onClick={handleToggle} sx={{ color: 'inherit' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <List
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              bgcolor: 'grey.50',
              minHeight: 0,
            }}
          >
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  display: 'flex',
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 1,
                  mb: 2,
                  p: 0,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                  }}
                >
                  {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '75%',
                    bgcolor: message.sender === 'user' ? 'primary.light' : 'white',
                  }}
                >
                  <Typography 
                    variant="body2"
                    sx={{
                      color: message.sender === 'user' ? 'white' : '#1a237e',
                    }}
                  >
                    {message.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                      fontSize: '0.7rem',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
            {isLoading && (
              <ListItem sx={{ justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={isConnected ? "Ask about your applications..." : "Connecting..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !isConnected}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !isConnected}
              >
                <SendIcon />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {isConnected ? 'Powered by AI • Ask me anything about your job search' : 'Connecting to chat...'}
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default ChatWidget;
