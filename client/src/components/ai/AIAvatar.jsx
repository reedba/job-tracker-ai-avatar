import { Box, Container, Typography, Paper, Button, Avatar, TextField, IconButton, List, ListItem, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Fab } from '@mui/material';
import axios from '../../config/axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useState, useEffect, useRef } from 'react';
import { getConsumer } from '../../utils/cable';
import { createAvatarLink } from '../../features/avatarLinks/avatarLinksSlice';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

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

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isWakeWordMode, setIsWakeWordMode] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const autoSendTimeoutRef = useRef(null);
  const porcupineWorkerRef = useRef(null);
  const webVoiceProcessorRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Initialize Porcupine wake word detection
  useEffect(() => {
    const initializePorcupine = async () => {
      try {
        console.log('Initializing Porcupine wake word detection...');
        
        // Use the built-in "hey siri" wake word as a placeholder 
        // (we'll use speech recognition to detect "hey brandon" after wake word triggers)
        porcupineWorkerRef.current = await PorcupineWorker.create(
          process.env.REACT_APP_PICOVOICE_ACCESS_KEY || 'demo', // You'll need to get a free API key from Picovoice
          [{ builtin: 'hey siri' }], // Using built-in wake word
          (keywordIndex) => {
            console.log('Wake word detected by Porcupine!');
            setWakeWordDetected(true);
            
            // Start regular speech recognition after wake word detection
            if (recognitionRef.current && speechEnabled) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.warn('Failed to start speech recognition after wake word:', e);
              }
            }
          }
        );

        webVoiceProcessorRef.current = await WebVoiceProcessor.init({
          engines: [porcupineWorkerRef.current],
          start: false
        });

        console.log('Porcupine initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize Porcupine:', error);
        console.log('Falling back to Web Speech API for wake word detection');
      }
    };

    initializePorcupine();

    return () => {
      if (porcupineWorkerRef.current) {
        porcupineWorkerRef.current.terminate();
      }
      if (webVoiceProcessorRef.current) {
        webVoiceProcessorRef.current.release();
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        // Ignore speech recognition while AI is speaking to prevent feedback loop
        if (isSpeaking) {
          console.log('Ignoring speech recognition while AI is speaking');
          return;
        }
        
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          
          // Check if this was triggered by wake word detection
          if (wakeWordDetected) {
            console.log('Processing speech after wake word detection');
            setWakeWordDetected(false);
            
            // Check if user said "hey brandon" or similar
            const lowerTranscript = finalTranscript.toLowerCase();
            if (lowerTranscript.includes('brandon') || lowerTranscript.includes('hey')) {
              // Extract command after wake phrase
              let command = finalTranscript.trim();
              
              // Remove common wake phrases
              command = command.replace(/^(hey\s+)?(brandon\s*)/i, '').trim();
              
              console.log('Command after wake word:', command);
              
              if (command) {
                setInputValue(command);
                setTimeout(() => handleSendMessage(command), 100);
              } else {
                // No command after wake word, just acknowledge
                setInputValue('');
                const wakeMessage = { 
                  id: Date.now(), 
                  text: "Yes? How can I help you?", 
                  sender: 'bot', 
                  timestamp: new Date() 
                };
                setMessages(prev => [...prev, wakeMessage]);
                
                if (voiceEnabled) {
                  speakText("Yes? How can I help you?");
                }
              }
            }
            
            // Restart wake word detection
            if (isWakeWordMode && webVoiceProcessorRef.current) {
              setTimeout(() => {
                webVoiceProcessorRef.current.start();
              }, 1000);
            }
          } else if (isWakeWordMode && finalTranscript.toLowerCase().includes('hey brandon')) {
            // Fallback to old method if Porcupine isn't working
            console.log('Wake word detected via speech recognition fallback');
            setIsWakeWordMode(false);
            
            const afterWakeWord = finalTranscript.toLowerCase().split('hey brandon')[1]?.trim();
            console.log('Text after wake word:', afterWakeWord);
            
            if (afterWakeWord) {
              setInputValue(afterWakeWord);
              setTimeout(() => handleSendMessage(afterWakeWord), 100);
            } else {
              setInputValue('');
              const wakeMessage = { 
                id: Date.now(), 
                text: "Yes? How can I help you?", 
                sender: 'bot', 
                timestamp: new Date() 
              };
              setMessages(prev => [...prev, wakeMessage]);
              
              if (voiceEnabled) {
                speakText("Yes? How can I help you?");
              }
            }
          } else if (!isWakeWordMode) {
            // Normal speech input - update input field
            const trimmedText = finalTranscript.trim();
            console.log('Normal speech input:', trimmedText);
            setInputValue(trimmedText);
            
            // Clear any existing auto-send timeout
            if (autoSendTimeoutRef.current) {
              clearTimeout(autoSendTimeoutRef.current);
              autoSendTimeoutRef.current = null;
            }
            
            // Auto-send after a brief delay - only if we have meaningful text
            if (trimmedText && trimmedText.length > 1) {
              console.log('Setting auto-send timeout for:', trimmedText);
              autoSendTimeoutRef.current = setTimeout(() => {
                console.log('Auto-sending message:', trimmedText);
                handleSendMessage(trimmedText);
                setInputValue(''); // Clear input after sending
              }, 1500); // Reduced to 1.5 seconds for faster response
            }
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // If we have text in the input and are not in wake word mode, auto-send it
        if (!isWakeWordMode && inputValue.trim() && inputValue.trim().length > 1) {
          console.log('Speech ended with text, auto-sending:', inputValue.trim());
          // Clear any existing timeout
          if (autoSendTimeoutRef.current) {
            clearTimeout(autoSendTimeoutRef.current);
            autoSendTimeoutRef.current = null;
          }
          // Send immediately when speech recognition ends
          setTimeout(() => {
            const textToSend = inputValue.trim();
            if (textToSend) {
              console.log('Sending message on speech end:', textToSend);
              handleSendMessage(textToSend);
              setInputValue('');
            }
          }, 500); // Small delay to ensure UI updates
        }
        
        // Restart if in wake word mode
        if (isWakeWordMode && speechEnabled) {
          console.log('Restarting speech recognition for wake word mode');
          setTimeout(() => {
            if (recognitionRef.current && isWakeWordMode) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.warn('Failed to restart speech recognition:', e);
              }
            }
          }, 1000);
        }
      };
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices - sometimes they're not immediately available
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        console.log('Speech synthesis voices loaded:', voices.length);
      };
      
      // Load voices immediately if available
      loadVoices();
      
      // Also load voices when they become available
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, [isWakeWordMode, speechEnabled, isSpeaking, inputValue]);

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

  // Setup ActionCable subscription for Avatar chat.
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    const tokenToUse = sessionToken || authToken;

    if (!tokenToUse) {
      // No token available; do not create a consumer yet.
      setIsConnected(false);
      return undefined;
    }

    console.log('Setting up AvatarChannel subscription...');

    // Clean up any previous subscription
    if (subscriptionRef.current) {
      try { 
        subscriptionRef.current.unsubscribe(); 
        console.log('Previous subscription cleaned up');
      } catch (e) {
        console.warn('Error cleaning up previous subscription:', e);
      }
      subscriptionRef.current = null;
    }

    // Small delay to ensure cleanup is complete
    const setupTimer = setTimeout(() => {
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
              const newMessage = { id: Date.now(), text: data.text, sender: 'bot', timestamp: new Date(data.timestamp || Date.now()) };
              setMessages(prev => [...prev, newMessage]);
              setIsLoading(false);
              
              // Speak the AI response if voice is enabled
              if (voiceEnabled && data.text) {
                speakText(data.text);
              }
            } else if (data.type === 'status') {
              setIsLoading(data.status === 'typing');
            } else if (data.type === 'error') {
              const errorMessage = { id: Date.now(), text: data.message, sender: 'bot', timestamp: new Date() };
              setMessages(prev => [...prev, errorMessage]);
              setIsLoading(false);
              
              // Speak error messages too if voice is enabled
              if (voiceEnabled && data.message) {
                speakText(data.message);
              }
            }
          }
        });
        console.log('New subscription created');
      } catch (e) {
        console.warn('AvatarChannel subscription failed', e);
        setIsConnected(false);
      }
    }, 100);

    return () => {
      clearTimeout(setupTimer);
      if (subscriptionRef.current) {
        try { 
          subscriptionRef.current.unsubscribe(); 
          console.log('Subscription cleaned up on unmount');
        } catch (e) {
          console.warn('Error during cleanup:', e);
        }
        subscriptionRef.current = null;
      }
    };
  }, [sessionToken, user, voiceEnabled]); // Added voiceEnabled to dependencies

  const handleSendMessage = (speechText = null) => {
    // Clear any pending auto-send timeout
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }
    
    const messageText = speechText || inputValue.trim();
    if (!messageText || isLoading || !isConnected) {
      console.warn('Cannot send message:', { messageText, isLoading, isConnected });
      return;
    }
    
    // Check if subscription is still valid
    if (!subscriptionRef.current) {
      console.warn('No active subscription available');
      setIsConnected(false);
      return;
    }
    
    console.log('Sending message:', messageText);
    
    const userMessage = { id: Date.now(), text: messageText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      subscriptionRef.current.send({ message: messageText });
    } catch (e) {
      console.error('Failed to send message:', e);
      setIsLoading(false);
      // Add error message to chat
      const errorMessage = { 
        id: Date.now() + 1, 
        text: 'Failed to send message. Please check your connection.', 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    // Always clear input after sending
    setInputValue('');
    
    // Stop listening when sending message (but not if in wake word mode)
    if (isListening && !isWakeWordMode) {
      stopListening();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSendMessage(); 
    }
  };

  const handleSendClick = () => {
    handleSendMessage();
  };

  // Speech recognition functions
  const startListening = (wakeWordMode = false) => {
    if (!speechEnabled) return;
    
    console.log('Starting speech recognition, wake word mode:', wakeWordMode);
    setIsWakeWordMode(wakeWordMode);
    
    if (wakeWordMode) {
      // Start Porcupine wake word detection
      if (webVoiceProcessorRef.current) {
        try {
          webVoiceProcessorRef.current.start();
          console.log('Porcupine wake word detection started');
        } catch (e) {
          console.warn('Failed to start Porcupine, falling back to speech recognition:', e);
          // Fallback to old method
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.warn('Failed to start speech recognition:', err);
              setIsListening(false);
              setIsWakeWordMode(false);
            }
          }
        }
      } else {
        // Fallback if Porcupine not available
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn('Failed to start speech recognition:', e);
            setIsListening(false);
            setIsWakeWordMode(false);
          }
        }
      }
    } else {
      // Normal speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Failed to start speech recognition:', e);
          setIsListening(false);
          setIsWakeWordMode(false);
        }
      }
    }
  };

  const stopListening = () => {
    console.log('Stopping speech recognition');
    
    // Stop Porcupine
    if (webVoiceProcessorRef.current) {
      try {
        webVoiceProcessorRef.current.stop();
      } catch (e) {
        console.warn('Error stopping Porcupine:', e);
      }
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsWakeWordMode(false);
    setWakeWordDetected(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(false);
    }
  };

  const toggleWakeWordMode = () => {
    console.log('Toggling wake word mode, current state:', isWakeWordMode);
    if (isWakeWordMode) {
      stopListening();
    } else {
      startListening(true);
    }
  };

  // Text-to-speech function
  const speakText = (text) => {
    console.log('speakText called with:', { text, voiceEnabled, synthRef: !!synthRef.current });
    
    if (!synthRef.current) {
      console.warn('Speech synthesis not available');
      return;
    }
    
    if (!voiceEnabled) {
      console.log('Voice disabled, skipping TTS');
      return;
    }
    
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text for TTS:', text);
      return;
    }
    
    // Cancel any current speech
    synthRef.current.cancel();
    
    // Stop listening to prevent audio feedback loop
    const wasListening = isListening;
    const wasInWakeWordMode = isWakeWordMode;
    
    if (isListening || isWakeWordMode) {
      console.log('Pausing speech recognition during TTS to prevent feedback loop');
      stopListening();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Get available voices and set a preferred one
    const voices = synthRef.current.getVoices();
    console.log('Available voices:', voices.length);
    
    if (voices.length > 0) {
      // Try to find an English voice
      const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
        console.log('Using voice:', englishVoice.name);
      }
    }
    
    utterance.onstart = () => {
      console.log('TTS started - speech recognition paused');
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log('TTS ended - resuming speech recognition if was active');
      setIsSpeaking(false);
      
      // Resume listening if it was active before
      if (wasListening || wasInWakeWordMode) {
        setTimeout(() => {
          if (wasInWakeWordMode) {
            startListening(true); // Resume wake word mode
          } else if (wasListening) {
            startListening(false); // Resume normal listening
          }
        }, 500); // Small delay to ensure TTS is fully stopped
      }
    };
    
    utterance.onerror = (event) => {
      console.error('TTS error:', event.error);
      setIsSpeaking(false);
      
      // Resume listening if it was active before
      if (wasListening || wasInWakeWordMode) {
        setTimeout(() => {
          if (wasInWakeWordMode) {
            startListening(true);
          } else if (wasListening) {
            startListening(false);
          }
        }, 500);
      }
    };
    
    console.log('Starting TTS for text:', text.substring(0, 50) + '...');
    synthRef.current.speak(utterance);
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const testTTS = () => {
    console.log('Testing TTS...');
    speakText("Hello, this is a test of the text to speech system.");
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
            {/* Speech Status Indicator */}
            {(isListening || isSpeaking || isWakeWordMode) && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {isListening && !isWakeWordMode && (
                  <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MicIcon fontSize="small" /> Listening...
                  </Typography>
                )}
                {isListening && isWakeWordMode && (
                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MicIcon fontSize="small" /> Listening for "Hey Brandon"...
                  </Typography>
                )}
                {isSpeaking && (
                  <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VolumeUpIcon fontSize="small" /> Speaking...
                  </Typography>
                )}
                {isWakeWordMode && !isListening && (
                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    👂 Wake Word Mode Active (Say wake word + "Brandon")
                  </Typography>
                )}
              </Box>
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
                      {message.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
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
                <IconButton color="primary" onClick={handleSendClick} disabled={!inputValue.trim() || !isConnected}><SendIcon /></IconButton>
              </Box>

              {/* Speech Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                {/* Microphone Button */}
                <Fab
                  color={isListening ? 'secondary' : 'primary'}
                  onClick={toggleListening}
                  disabled={!isConnected}
                  size="small"
                  sx={{ 
                    backgroundColor: isListening ? '#f44336' : '#2196f3',
                    '&:hover': {
                      backgroundColor: isListening ? '#d32f2f' : '#1976d2'
                    }
                  }}
                >
                  {isListening ? <MicIcon /> : <MicOffIcon />}
                </Fab>
                
                {/* Wake Word Mode Toggle */}
                <Fab
                  color={isWakeWordMode ? 'success' : 'default'}
                  onClick={toggleWakeWordMode}
                  disabled={!isConnected}
                  size="small"
                  sx={{ 
                    backgroundColor: isWakeWordMode ? '#4caf50' : '#e0e0e0',
                    color: isWakeWordMode ? 'white' : '#757575',
                    '&:hover': {
                      backgroundColor: isWakeWordMode ? '#388e3c' : '#d5d5d5'
                    }
                  }}
                  title="Wake Word Mode (Hey Brandon)"
                >
                  <VolumeUpIcon fontSize="small" />
                </Fab>
                
                {/* Voice Response Toggle */}
                <Fab
                  color={voiceEnabled ? 'info' : 'default'}
                  onClick={toggleVoice}
                  disabled={!isConnected}
                  size="small"
                  sx={{ 
                    backgroundColor: voiceEnabled ? '#2196f3' : '#e0e0e0',
                    color: voiceEnabled ? 'white' : '#757575',
                    '&:hover': {
                      backgroundColor: voiceEnabled ? '#1976d2' : '#d5d5d5'
                    }
                  }}
                  title="Voice Responses"
                >
                  <VolumeUpIcon fontSize="small" />
                </Fab>
                
                {/* Test TTS Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={testTTS}
                  disabled={!voiceEnabled}
                  sx={{ ml: 1 }}
                >
                  Test Voice
                </Button>
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
                This will start a 1-hour interview session for this AI avatar. You will be connected as a guest.
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
