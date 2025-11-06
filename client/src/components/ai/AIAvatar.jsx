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

// Add pulse animation styles
const pulseAnimation = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

// Inject styles into head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = pulseAnimation;
  document.head.appendChild(styleSheet);
}

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
    { id: 'welcome', text: "Hi — I'm your AI Career Coach with real-time voice conversation powered by OpenAI's Realtime API. Experience ultra-low latency conversations - just start talking!", sender: 'bot', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Realtime API state
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);
  const [currentActivity, setCurrentActivity] = useState('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoResumeListening, setAutoResumeListening] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Audio handling for Realtime API
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  const synthRef = useRef(null);
  const audioBufferRef = useRef([]);
  const audioBufferTimeRef = useRef(0);
  const nextAudioStartTimeRef = useRef(0);
  const currentMessageRef = useRef(null);
  const currentMessageIdRef = useRef(null);
  
  // State refs for legacy TTS functions
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isRecordingRef = useRef(false);
  const conversationModeRef = useRef(false);  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Debug state changes
  useEffect(() => {
    console.log('🔍 STATE CHANGE:', {
      isListening,
      isSpeaking,
      isRecording,
      conversationMode,
      currentActivity,
      autoResumeListening,
      isProcessing,
      isConnected,
      synthSpeaking: synthRef.current?.speaking || false
    });
  }, [isListening, isSpeaking, isRecording, conversationMode, currentActivity, autoResumeListening, isProcessing, isConnected]);

  // Sync state with refs for legacy TTS functions
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    isListeningRef.current = isListening;
    isRecordingRef.current = isRecording;
    conversationModeRef.current = conversationMode;
  }, [isSpeaking, isListening, isRecording, conversationMode]);

  // Initialize audio context for Realtime API
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 24000
        });
        console.log('✅ Audio context initialized for Realtime API');
      } catch (error) {
        console.error('❌ Failed to initialize audio context:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
            console.log('📥 Realtime message:', data.type, data);
            handleRealtimeMessage(data);
          }
        });
        console.log('New Realtime subscription created');
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



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSendMessage(); 
    }
  };

  const handleSendClick = () => {
    handleSendMessage();
  };

  // Realtime API Message Handler
  const handleRealtimeMessage = (data) => {
    switch (data.type) {
      case 'connection':
        console.log('🔗 Realtime connection confirmed:', data.message);
        setCurrentActivity('idle');
        break;

      case 'realtime_connected':
        console.log('✅ OpenAI Realtime API connected');
        break;

      case 'speech_started':
        console.log('🎤 User speech started');
        setCurrentActivity('listening');
        setIsListening(true);
        break;

      case 'speech_stopped':
        console.log('⏹️ User speech stopped, processing...');
        setCurrentActivity('processing');
        setIsListening(false);
        break;

      case 'user_transcript':
        console.log('📝 User transcript:', data.text);
        const userMessage = { 
          id: Date.now(), 
          text: data.text, 
          sender: 'user', 
          timestamp: new Date(data.timestamp || Date.now()) 
        };
        setMessages(prev => [...prev, userMessage]);
        setCurrentActivity('thinking');
        break;

      case 'audio_delta':
        // Stream audio response from OpenAI
        console.log('🔊 Audio delta received');
        if (voiceEnabled) {
          playAudioDelta(data.audio);
        }
        setCurrentActivity('speaking');
        setIsSpeaking(true);
        
        // Initialize audio timing if this is the first chunk
        if (nextAudioStartTimeRef.current === 0) {
          nextAudioStartTimeRef.current = audioContextRef.current?.currentTime || 0;
          // Clear any pending text streaming
          currentMessageRef.current = null;
          currentMessageIdRef.current = null;
        }
        break;

      case 'audio_complete':
        console.log('✅ Audio response complete');
        setIsSpeaking(false);
        setCurrentActivity('idle');
        
        // Reset audio processing state
        nextAudioStartTimeRef.current = 0;
        audioQueueRef.current = [];
        isPlayingAudioRef.current = false;
        
        // Auto-resume conversation if in conversation mode
        if (conversationModeRef.current) {
          setTimeout(() => {
            if (conversationModeRef.current && !isSpeakingRef.current && !isRecordingRef.current) {
              console.log('🔄 Auto-resuming conversation mode after audio...');
              startRecording();
            }
          }, 1000);
        }
        break;

      case 'text_delta':
        // Handle streaming text - accumulate text as it comes in
        console.log('📝 Text delta:', data.text);
        
        if (!currentMessageIdRef.current) {
          // Start a new message
          const messageId = Date.now();
          currentMessageIdRef.current = messageId;
          currentMessageRef.current = data.text || '';
          
          const newMessage = { 
            id: messageId, 
            text: currentMessageRef.current, 
            sender: 'bot', 
            timestamp: new Date(),
            isStreaming: true
          };
          setMessages(prev => [...prev, newMessage]);
        } else {
          // Update existing message
          currentMessageRef.current += data.text || '';
          setMessages(prev => prev.map(msg => 
            msg.id === currentMessageIdRef.current 
              ? { ...msg, text: currentMessageRef.current }
              : msg
          ));
        }
        break;

      case 'ai_response':
        console.log('💬 AI response:', data.text);
        
        if (currentMessageIdRef.current) {
          // Finalize the streaming message
          setMessages(prev => prev.map(msg => 
            msg.id === currentMessageIdRef.current 
              ? { ...msg, text: data.text, isStreaming: false }
              : msg
          ));
        } else {
          // Create a new complete message
          const aiMessage = { 
            id: Date.now(), 
            text: data.text, 
            sender: 'bot', 
            timestamp: new Date(data.timestamp || Date.now()) 
          };
          setMessages(prev => [...prev, aiMessage]);
        }
        
        // Reset streaming state
        currentMessageRef.current = null;
        currentMessageIdRef.current = null;
        setIsLoading(false);
        break;

      case 'function_call_result':
        console.log('🛠️ Function called:', data.function, data.result);
        const toolMessage = { 
          id: Date.now(), 
          text: `🔧 Used ${data.function} tool`, 
          sender: 'system', 
          timestamp: new Date(data.timestamp || Date.now()),
          isToolCall: true
        };
        setMessages(prev => [...prev, toolMessage]);
        break;

      case 'response_complete':
        console.log('✅ Complete response finished');
        setCurrentActivity('idle');
        setIsLoading(false);
        setIsSpeaking(false);
        
        // Auto-resume conversation if in conversation mode
        if (conversationModeRef.current) {
          setTimeout(() => {
            if (conversationModeRef.current && !isSpeakingRef.current && !isRecordingRef.current) {
              console.log('🔄 Auto-resuming conversation mode...');
              startRecording();
            }
          }, 1000);
        }
        break;

      case 'error':
        console.error('❌ Realtime error:', data.message);
        const errorMessage = { 
          id: Date.now(), 
          text: `Error: ${data.message}`, 
          sender: 'bot', 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, errorMessage]);
        setCurrentActivity('idle');
        setIsLoading(false);
        break;
    }
  };

  // Helper function to ensure audio context is ready
  const ensureAudioContextReady = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000
      });
    }
    
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('🔊 Audio context resumed');
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  };

  // Audio playbook for streaming audio from Realtime API with proper sequencing
  const playAudioDelta = async (audioData) => {
    try {
      await ensureAudioContextReady();
      if (!audioContextRef.current || !voiceEnabled) {
        console.log('🚫 Skipping audio playback:', !audioContextRef.current ? 'No AudioContext' : 'Voice disabled');
        return;
      }

      // Add to queue and process
      audioQueueRef.current.push(audioData);
      processAudioQueue();

    } catch (error) {
      console.error('❌ Error in playAudioDelta:', error);
    }
  };

  // Process audio queue sequentially
  const processAudioQueue = async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingAudioRef.current = true;
    
    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      await playAudioChunk(audioData);
    }
    
    isPlayingAudioRef.current = false;
  };

  // Play a single audio chunk
  const playAudioChunk = async (audioData) => {
    return new Promise((resolve) => {
      try {
        console.log(`🎵 Processing audio chunk: ${audioData.length} chars`);

        // Decode base64 PCM16 audio data
        let binaryString;
        try {
          binaryString = atob(audioData);
        } catch (error) {
          console.error('❌ Base64 decode failed:', error);
          resolve();
          return;
        }

        // Ensure even number of bytes
        if (binaryString.length % 2 !== 0) {
          binaryString += '\0';
        }

        const pcm16Data = new Int16Array(binaryString.length / 2);
        
        // Convert to PCM16
        for (let i = 0; i < pcm16Data.length; i++) {
          const byte1 = binaryString.charCodeAt(i * 2) & 0xFF;
          const byte2 = binaryString.charCodeAt(i * 2 + 1) & 0xFF;
          pcm16Data[i] = (byte2 << 8) | byte1;
        }

        // Create audio buffer
        const audioBuffer = audioContextRef.current.createBuffer(1, pcm16Data.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        // Convert to Float32
        for (let i = 0; i < pcm16Data.length; i++) {
          channelData[i] = pcm16Data[i] / 32768.0;
        }

        // Play immediately and wait for completion
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
          console.log(`✅ Audio chunk finished: ${audioBuffer.duration.toFixed(3)}s`);
          resolve();
        };
        
        source.start();
        console.log(`🔊 Playing audio chunk: ${audioBuffer.duration.toFixed(3)}s`);

      } catch (error) {
        console.error('❌ Error playing audio chunk:', error);
        resolve();
      }
    });
  };

  // Start recording for Realtime API using Web Audio API for PCM16 format
  const startRecording = async () => {
    try {
      if (isRecording || isSpeaking) {
        console.log('🔇 Cannot start recording - already recording or AI speaking');
        return;
      }

      console.log('🎤 Starting Realtime recording...');

      // Request microphone access with explicit permissions check
      console.log('🔍 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        } 
      });

      console.log('✅ Microphone access granted, stream tracks:', stream.getTracks().length);

      // Initialize Web Audio API for raw audio processing
      if (!audioContextRef.current) {
        console.log('🔧 Creating new AudioContext...');
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 24000
        });
      }

      console.log('🎵 AudioContext state:', audioContextRef.current.state);
      
      if (audioContextRef.current.state === 'suspended') {
        console.log('▶️ Resuming suspended AudioContext...');
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      console.log('🔗 Setting up audio processing chain...');

      processor.onaudioprocess = (event) => {
        if (!isRecordingRef.current) {
          console.log('⏸️ Audio processing stopped - isRecordingRef is false');
          return;
        }

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Debug: Check if we're getting audio input (every 10th frame to avoid spam)
        const audioLevel = Math.max(...inputData.map(Math.abs));
        if (Math.random() < 0.1) { // Log 10% of the time
          console.log(`🎤 Audio processing - level: ${audioLevel.toFixed(4)}, recording: ${isRecordingRef.current}`);
        }
        
        if (audioLevel > 0.01) {
          console.log(`🔊 VOICE DETECTED! Level: ${audioLevel.toFixed(3)}`);
        }
        
        // Convert float32 to int16 (PCM16)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // Add to buffer
        audioBufferRef.current.push(pcm16);
        audioBufferTimeRef.current += (inputData.length / 24000) * 1000; // Add milliseconds

        // Send audio chunks periodically (every ~100ms worth of audio)
        if (audioBufferTimeRef.current >= 100) {
          // Combine all buffered audio
          const totalLength = audioBufferRef.current.reduce((sum, arr) => sum + arr.length, 0);
          const combinedAudio = new Int16Array(totalLength);
          let offset = 0;
          
          for (const chunk of audioBufferRef.current) {
            combinedAudio.set(chunk, offset);
            offset += chunk.length;
          }

          // Convert to base64 and send
          const uint8Array = new Uint8Array(combinedAudio.buffer);
          const base64Audio = btoa(String.fromCharCode(...uint8Array));
          
          console.log(`📤 Sending audio chunk: ${audioBufferTimeRef.current.toFixed(2)}ms, ${combinedAudio.length} samples`);
          
          // Send audio chunk to OpenAI
          sendAudioChunk(base64Audio);
          
          // Reset buffer
          audioBufferRef.current = [];
          audioBufferTimeRef.current = 0;
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      // Store references for cleanup
      mediaRecorderRef.current = { source, processor, stream };

      console.log('🔴 Realtime recording started');
      setIsRecording(true);
      setIsListening(true);
      setCurrentActivity('listening');
      
      // Debug: Verify refs are updated
      setTimeout(() => {
        console.log(`📊 Recording state - isRecording: ${isRecording}, isRecordingRef: ${isRecordingRef.current}`);
        console.log('🎵 AudioContext state after setup:', audioContextRef.current.state);
        console.log('🔌 MediaStream active:', stream.active, 'tracks:', stream.getTracks().map(t => ({enabled: t.enabled, kind: t.kind, readyState: t.readyState})));
      }, 100);

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        constraint: error.constraint
      });
      
      setIsRecording(false);
      setIsListening(false);
      setCurrentActivity('idle');
      
      if (error.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone.');
      } else if (error.name === 'NotReadableError') {
        alert('Microphone is being used by another application.');
      } else {
        alert('Error accessing microphone: ' + error.message);
      }
    }
  };

  const stopRecording = () => {
    console.log('⏹️ Stopping Realtime recording...');
    
    if (mediaRecorderRef.current) {
      const { source, processor, stream } = mediaRecorderRef.current;
      
      if (source) source.disconnect();
      if (processor) processor.disconnect();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      mediaRecorderRef.current = null;
    }

    setIsRecording(false);
    setIsListening(false);
    setCurrentActivity('processing');
    
    // Send any remaining buffered audio if we have enough
    if (audioBufferRef.current.length > 0 && audioBufferTimeRef.current >= 100) {
      // Combine remaining audio
      const totalLength = audioBufferRef.current.reduce((sum, arr) => sum + arr.length, 0);
      const combinedAudio = new Int16Array(totalLength);
      let offset = 0;
      
      for (const chunk of audioBufferRef.current) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to base64 and send
      const uint8Array = new Uint8Array(combinedAudio.buffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));
      
      // Send final audio chunk
      sendAudioChunk(base64Audio);
      
      // Commit audio buffer to OpenAI only if we sent audio
      setTimeout(() => {
        if (subscriptionRef.current) {
          console.log(`🎯 Committing audio buffer (${audioBufferTimeRef.current.toFixed(2)}ms of audio)`);
          subscriptionRef.current.send({ type: 'commit_audio' });
        }
      }, 100);
    } else {
      console.log(`⚠️ Not committing audio - insufficient data (${audioBufferTimeRef.current.toFixed(2)}ms)`);
    }
    
    // Reset audio buffer
    audioBufferRef.current = [];
    audioBufferTimeRef.current = 0;
  };

  const sendAudioChunk = async (audioData) => {
    try {
      if (!subscriptionRef.current) {
        console.warn('⚠️ No ActionCable subscription - cannot send audio');
        return;
      }

      console.log(`📤 Sending audio chunk to backend: ${audioData.length} chars`);

      // audioData should already be base64 encoded PCM16 from our audio processing
      subscriptionRef.current.send({
        type: 'audio',
        audio: audioData
      });

    } catch (error) {
      console.error('❌ Error sending audio chunk:', error);
    }
  };

  // Test microphone access independently
  const testMicrophone = async () => {
    try {
      console.log('🧪 Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone test successful!');
      console.log('🎤 Available audio tracks:', stream.getAudioTracks().map(track => ({
        label: track.label,
        enabled: track.enabled,
        kind: track.kind,
        readyState: track.readyState
      })));
      
      // Test audio levels
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        console.log(`🎵 Audio level: ${average.toFixed(2)}`);
        
        if (average > 10) {
          console.log('🔊 AUDIO DETECTED IN TEST!');
        }
      };
      
      // Check for 5 seconds
      const interval = setInterval(checkAudio, 500);
      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        console.log('🧪 Microphone test completed');
      }, 5000);
      
    } catch (error) {
      console.error('❌ Microphone test failed:', error);
    }
  };

  // Test audio playback with a simple tone
  const testAudioPlayback = async () => {
    try {
      console.log('🧪 Testing audio playback...');
      await ensureAudioContextReady();
      
      if (!audioContextRef.current) {
        console.error('❌ No AudioContext available');
        return;
      }

      // Create a simple 440Hz tone for 1 second
      const duration = 1;
      const frequency = 440;
      const sampleRate = audioContextRef.current.sampleRate;
      const bufferSize = sampleRate * duration;
      
      const audioBuffer = audioContextRef.current.createBuffer(1, bufferSize, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate sine wave
      for (let i = 0; i < bufferSize; i++) {
        channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      
      console.log('🔊 Playing test tone...');
      
    } catch (error) {
      console.error('❌ Audio playback test failed:', error);
    }
  };

  const toggleRecording = () => {
    if (isSpeaking) {
      console.log('🔇 Cannot toggle recording - AI is speaking');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleConversationMode = () => {
    const newMode = !conversationMode;
    setConversationMode(newMode);
    
    if (newMode) {
      console.log('🔄 Starting conversation mode');
      setTimeout(() => {
        if (!isSpeaking && !isRecording) {
          startRecording();
        }
      }, 500);
    } else {
      console.log('⏹️ Stopping conversation mode');
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    console.log('🔊 Voice toggled to:', !voiceEnabled);
  };

  // Update handleSendMessage for Realtime API
  const handleSendMessage = () => {
    const messageText = inputValue.trim();
    if (!messageText || !isConnected) return;

    console.log('📤 Sending text message:', messageText);

    const userMessage = { 
      id: Date.now(), 
      text: messageText, 
      sender: 'user', 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentActivity('thinking');

    // Send text to Realtime API via Rails
    subscriptionRef.current.send({
      type: 'text',
      message: messageText
    });

    setInputValue('');
  };

  const testRealtimeConnection = () => {
    console.log('🧪 Testing Realtime connection...');
    const testMessage = "Hello, this is a test of the OpenAI Realtime API integration.";
    
    const userMessage = { 
      id: Date.now(), 
      text: testMessage, 
      sender: 'user', 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);

    if (subscriptionRef.current) {
      subscriptionRef.current.send({
        type: 'text',
        message: testMessage
      });
    }
  };

  // Legacy Whisper Speech Recognition Functions (keeping for fallback)
  const startWhisperRecording = async () => {
    try {
      // Prevent recording if AI is currently speaking to avoid feedback loop
      if (isSpeaking) {
        console.log('🔇 Cannot start recording - AI is currently speaking');
        return;
      }
      
      // Additional state debugging
      console.log('🎤 Starting Whisper recording...');
      console.log('📊 Current states:', {
        isListening,
        isRecording,
        isSpeaking,
        conversationMode,
        currentActivity,
        synthSpeaking: synthRef.current?.speaking
      });
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported in this browser');
        alert('Microphone access not supported in this browser');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('✅ Microphone access granted');
      
      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        console.error('MediaRecorder not supported in this browser');
        alert('Audio recording not supported in this browser');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Check supported MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('✅ Using MIME type:', mimeType);
          break;
        }
      }
      
      if (!selectedMimeType) {
        console.error('No supported audio MIME types found');
        alert('Audio recording format not supported');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('📊 Audio data chunk received:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstart = () => {
        console.log('🔴 Recording started');
      };
      
      mediaRecorderRef.current.onstop = async () => {
        console.log('⏹️ Recording stopped, processing with Whisper...');
        
        if (audioChunksRef.current.length === 0) {
          console.warn('No audio data recorded');
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        console.log('📦 Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Stopped track:', track.kind);
        });
        
        await processWithWhisper(audioBlob);
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsListening(true);
      setCurrentActivity('listening');
      
      console.log('🟢 Recording started successfully');
      
      // Auto-stop recording after 30 seconds to prevent infinite recording
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('⏰ Auto-stopping recording after 30 seconds');
          stopRecording();
        }
      }, 30000);
      
    } catch (error) {
      console.error('❌ Error starting Whisper recording:', error);
      setIsRecording(false);
      setIsListening(false);
      
      if (error.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Error accessing microphone: ' + error.message);
      }
    }
  };
  
  const stopWhisperRecording = () => {
    console.log('Stopping Whisper recording...');
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsListening(false);
    setCurrentActivity('processing');
  };
  
  const processWithWhisper = async (audioBlob) => {
    try {
      console.log('🤖 Processing audio with Whisper API...');
      console.log('📊 Audio blob details:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // Minimum size check
      if (audioBlob.size < 1000) {
        console.warn('⚠️ Audio blob too small:', audioBlob.size, 'bytes');
        alert('Recording too short. Please speak longer.');
        return;
      }
      
      // Create FormData for Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'json');
      
      console.log('📤 Sending to Whisper API...');
      
      const response = await axios.post('/api/speech/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('📥 Whisper API response:', response.data);
      
      if (response.data && response.data.text) {
        const transcribedText = response.data.text.trim();
        console.log('✅ Whisper transcription successful:', transcribedText);
        
        if (transcribedText.length > 0) {
          console.log('📝 Setting input value to:', transcribedText);
          setInputValue(transcribedText);
          
          // Auto-send the transcribed text immediately for seamless conversation
          if (transcribedText.length > 1) {
            console.log('🚀 Auto-sending Whisper transcription immediately');
            console.log('📨 Executing handleSendMessage with:', transcribedText);
            handleSendMessage(transcribedText);
          }
        } else {
          console.warn('⚠️ Empty transcription received');
          alert('No speech detected. Please try speaking again.');
        }
      } else {
        console.warn('⚠️ No transcription text in response');
        alert('No transcription received. Please try again.');
      }
    } catch (error) {
      console.error('❌ Whisper transcription error:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // User-friendly error messages
      if (error.response?.status === 429) {
        alert('Whisper API rate limit reached. Please wait a moment and try again.');
      } else if (error.response?.status === 400) {
        alert('Invalid audio format. Please try recording again.');
      } else if (error.response?.status === 401) {
        alert('Authentication error. Please check your OpenAI API key configuration.');
      } else if (error.code === 'ECONNABORTED') {
        alert('Request timed out. Please try with a shorter recording.');
      } else {
        alert('Transcription failed: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const toggleListening = () => {
    // Use the new Realtime API recording functions
    toggleRecording();
  };

  // Text-to-speech function with enhanced debugging and voice loading
  const speakText = (text) => {
    console.log('speakText called with:', { 
      text: text?.substring(0, 50) + '...', 
      voiceEnabled, 
      synthRef: !!synthRef.current,
      synthSupported: 'speechSynthesis' in window
    });
    
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }
    
    if (!synthRef.current) {
      console.warn('Speech synthesis not initialized, trying to reinitialize...');
      synthRef.current = window.speechSynthesis;
      if (!synthRef.current) {
        console.error('Failed to initialize speech synthesis');
        return;
      }
    }
    
    if (!voiceEnabled) {
      console.log('Voice disabled, skipping TTS');
      return;
    }
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('Invalid text for TTS:', text);
      return;
    }
    
    // Cancel any current speech
    try {
      synthRef.current.cancel();
      console.log('Cancelled any existing speech');
    } catch (e) {
      console.warn('Error cancelling existing speech:', e);
    }
    
    // Stop listening to prevent audio feedback loop
    const wasListening = isListening;
    
    if (isListening) {
      console.log('Pausing speech recognition during TTS to prevent feedback loop');
      stopRecording();
    }
    
    // Immediately set speaking state to prevent any new recording attempts
    setIsSpeaking(true);
    setCurrentActivity('speaking');
    
    // Clean the text
    const cleanText = text.trim();
    console.log('Cleaned text for TTS:', cleanText.substring(0, 100));
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    // Enhanced voice selection with fallback
    const selectVoice = () => {
      const voices = synthRef.current.getVoices();
      console.log('Total voices available:', voices.length);
      
      if (voices.length === 0) {
        console.warn('No voices available yet');
        return null;
      }
      
      // Log all available voices for debugging
      voices.forEach((voice, index) => {
        console.log(`Voice ${index}: ${voice.name} (${voice.lang}) - ${voice.localService ? 'local' : 'remote'}`);
      });
      
      // Priority order for voice selection
      const voiceSelectors = [
        // Prefer local English voices
        voice => voice.lang.startsWith('en') && voice.localService,
        // Any English voice
        voice => voice.lang.startsWith('en'),
        // Default voice (usually first one)
        voice => voice.default,
        // Any local voice
        voice => voice.localService,
        // First available voice
        voice => true
      ];
      
      for (const selector of voiceSelectors) {
        const selectedVoice = voices.find(selector);
        if (selectedVoice) {
          console.log('Selected voice:', selectedVoice.name, selectedVoice.lang);
          return selectedVoice;
        }
      }
      
      return voices[0] || null;
    };
    
    const selectedVoice = selectVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      console.warn('No suitable voice found, using default');
    }
    
    utterance.onstart = () => {
      console.log('✅ TTS started successfully - speech recognition paused');
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log('✅ TTS ended successfully');
      setIsSpeaking(false);
      setCurrentActivity('idle');
      
      // Auto-resume listening in conversation mode with additional safety checks
      if (conversationMode) {
        console.log('🔄 Auto-resuming listening after AI response');
        setTimeout(() => {
          // Get current state to avoid closure issues
          const currentSpeaking = synthRef.current?.speaking;
          const currentConversationMode = conversationModeRef.current;
          const currentIsListening = isListeningRef.current;
          const currentIsRecording = isRecordingRef.current;
          
          console.log('🔍 Auto-resume state check:', {
            synthSpeaking: currentSpeaking,
            conversationMode: currentConversationMode,
            isListening: currentIsListening,
            isRecording: currentIsRecording,
            currentActivity
          });
          
          // Double-check that we're not still speaking and conversation mode is still active
          if (!currentSpeaking && currentConversationMode && !currentIsListening && !currentIsRecording) {
            console.log('✅ Starting auto-resume recording');
            startRecording();
          } else {
            console.log('🔇 Skipping auto-resume:', {
              reason: currentSpeaking ? 'still speaking' : 
                     !currentConversationMode ? 'conversation mode off' :
                     currentIsListening ? 'already listening' :
                     currentIsRecording ? 'already recording' : 'unknown'
            });
          }
        }, 800); // Reduced delay for faster conversation flow
      }
    };
    
    utterance.onerror = (event) => {
      console.error('❌ TTS error occurred:', {
        error: event.error,
        message: event.message,
        type: event.type
      });
      setIsSpeaking(false);
      setCurrentActivity('idle');
      
      // Auto-resume listening in conversation mode even after error
      if (conversationMode) {
        console.log('🔄 Auto-resuming listening after TTS error');
        setTimeout(() => {
          // Get current state to avoid closure issues
          const currentSpeaking = synthRef.current?.speaking;
          const currentConversationMode = conversationModeRef.current;
          const currentIsListening = isListeningRef.current;
          const currentIsRecording = isRecordingRef.current;
          
          console.log('🔍 Auto-resume error state check:', {
            synthSpeaking: currentSpeaking,
            conversationMode: currentConversationMode,
            isListening: currentIsListening,
            isRecording: currentIsRecording,
            currentActivity
          });
          
          // Double-check that we're not still speaking and conversation mode is still active
          if (!currentSpeaking && currentConversationMode && !currentIsListening && !currentIsRecording) {
            console.log('✅ Starting auto-resume recording after error');
            startRecording();
          } else {
            console.log('🔇 Skipping auto-resume after error:', {
              reason: currentSpeaking ? 'still speaking' : 
                     !currentConversationMode ? 'conversation mode off' :
                     currentIsListening ? 'already listening' :
                     currentIsRecording ? 'already recording' : 'unknown'
            });
          }
        }, 800); // Reduced delay for faster conversation flow
      }
    };
    
    utterance.onpause = () => {
      console.log('TTS paused');
    };
    
    utterance.onresume = () => {
      console.log('TTS resumed');
    };
    
    utterance.onmark = (event) => {
      console.log('TTS mark event:', event);
    };
    
    // Additional debugging for speech synthesis state
    console.log('Speech synthesis state before speaking:', {
      speaking: synthRef.current.speaking,
      pending: synthRef.current.pending,
      paused: synthRef.current.paused
    });
    
    try {
      console.log('🔊 Starting TTS for text:', cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : ''));
      synthRef.current.speak(utterance);
      
      // Additional verification after speak call
      setTimeout(() => {
        console.log('Speech synthesis state after speak call:', {
          speaking: synthRef.current.speaking,
          pending: synthRef.current.pending,
          paused: synthRef.current.paused
        });
      }, 100);
      
    } catch (error) {
      console.error('❌ Error calling speak():', error);
      setIsSpeaking(false);
      
      // Resume listening if it was active before
      if (wasListening) {
        setTimeout(() => {
          console.log('Speak error handled, ready for new recording');
        }, 500);
      }
    }
  };

  const testRealtimeFlow = () => {
    console.log('🧪 Testing Realtime flow with dummy text...');
    const testText = "This is a test of the OpenAI Realtime API integration.";
    console.log('📝 Setting test text:', testText);
    setInputValue(testText);
    
    setTimeout(() => {
      console.log('🚀 Auto-sending test text');
      handleSendMessage(testText);
    }, 1000);
  };

  const testTTS = () => {
    console.log('🧪 Testing TTS...');
    console.log('Browser support:', {
      speechSynthesis: 'speechSynthesis' in window,
      SpeechSynthesisUtterance: 'SpeechSynthesisUtterance' in window
    });
    
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in this browser');
      return;
    }
    
    const testText = "Hello, this is a test of the text to speech system. Can you hear me?";
    console.log('Test text:', testText);
    
    // Show current speech synthesis state
    if (synthRef.current) {
      console.log('Current speech synthesis state:', {
        speaking: synthRef.current.speaking,
        pending: synthRef.current.pending,
        paused: synthRef.current.paused,
        voicesCount: synthRef.current.getVoices().length
      });
    }
    
    speakText(testText);
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
            <Typography variant="h5">AI Career Coach (Realtime)</Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time voice conversation with your AI Career Coach using OpenAI's latest technology. Experience ultra-low latency (~200ms) with built-in echo cancellation.
            </Typography>
            {remaining && (
              <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
                Session time remaining: {remaining}
              </Typography>
            )}
            {/* Speech Status Indicator */}
            {(isListening || isSpeaking || isRecording) && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {isRecording && (
                  <Typography variant="caption" sx={{ color: '#9c27b0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MicIcon fontSize="small" /> Recording (Whisper AI)...
                  </Typography>
                )}
                {isSpeaking && (
                  <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VolumeUpIcon fontSize="small" /> Speaking...
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
                {/* Conversation Mode Toggle */}
                <Button
                  variant={conversationMode ? 'contained' : 'outlined'}
                  size="small"
                  onClick={toggleConversationMode}
                  disabled={!isConnected}
                  sx={{ 
                    backgroundColor: conversationMode ? '#4caf50' : 'transparent',
                    color: conversationMode ? 'white' : '#4caf50',
                    borderColor: '#4caf50',
                    '&:hover': {
                      backgroundColor: conversationMode ? '#45a049' : '#e8f5e8'
                    }
                  }}
                >
                  {conversationMode ? '🎯 Conversation On' : '💬 Start Conversation'}
                </Button>
              </Box>

              {/* Activity Indicator */}
              {conversationMode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    px: 2, 
                    py: 1, 
                    borderRadius: 2, 
                    backgroundColor: 
                      currentActivity === 'listening' ? '#e3f2fd' :
                      currentActivity === 'processing' ? '#fff3e0' :
                      currentActivity === 'thinking' ? '#f3e5f5' :
                      currentActivity === 'speaking' ? '#e8f5e8' :
                      '#f5f5f5',
                    border: '1px solid',
                    borderColor:
                      currentActivity === 'listening' ? '#2196f3' :
                      currentActivity === 'processing' ? '#ff9800' :
                      currentActivity === 'thinking' ? '#9c27b0' :
                      currentActivity === 'speaking' ? '#4caf50' :
                      '#e0e0e0'
                  }}>
                    {currentActivity === 'listening' && (
                      <>
                        <MicIcon sx={{ color: '#2196f3', animation: 'pulse 1.5s infinite' }} />
                        <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                          🎧 Listening...
                        </Typography>
                      </>
                    )}
                    {currentActivity === 'processing' && (
                      <>
                        <CircularProgress size={16} sx={{ color: '#ff9800' }} />
                        <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                          🔄 Processing speech...
                        </Typography>
                      </>
                    )}
                    {currentActivity === 'thinking' && (
                      <>
                        <CircularProgress size={16} sx={{ color: '#9c27b0' }} />
                        <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                          🤔 AI thinking...
                        </Typography>
                      </>
                    )}
                    {currentActivity === 'speaking' && (
                      <>
                        <VolumeUpIcon sx={{ color: '#4caf50', animation: 'pulse 1.5s infinite' }} />
                        <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                          🗣️ AI speaking...
                        </Typography>
                      </>
                    )}
                    {currentActivity === 'idle' && conversationMode && (
                      <>
                        <Typography variant="body2" sx={{ color: '#757575' }}>
                          💭 Ready for conversation
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
              )}

              {/* Manual Speech Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                {/* Microphone Button for Whisper Recording */}
                <Fab
                  color={isListening || isRecording ? 'secondary' : 'primary'}
                  onClick={toggleListening}
                  disabled={!isConnected || isSpeaking}
                  size="small"
                  sx={{ 
                    backgroundColor: (isListening || isRecording) ? '#9c27b0' : '#2196f3',
                    '&:hover': {
                      backgroundColor: (isListening || isRecording) ? '#7b1fa2' : '#1976d2'
                    }
                  }}
                  title="Record with Whisper AI"
                >
                  {(isListening || isRecording) ? <MicIcon /> : <MicOffIcon />}
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
                
                {/* Test Realtime Flow Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={testRealtimeConnection}
                  disabled={!isConnected}
                  sx={{ ml: 1, backgroundColor: '#f3e5f5', color: '#9c27b0', borderColor: '#9c27b0' }}
                >
                  Test Realtime
                </Button>
                
                {/* Test Microphone Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={testMicrophone}
                  sx={{ ml: 1, backgroundColor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2' }}
                >
                  Test Mic
                </Button>
                
                {/* Test Voice Recording Button */}
                <Button
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  disabled={isSpeaking}
                  sx={{ ml: 1, backgroundColor: isRecording ? '#ffebee' : '#e8f5e8', color: isRecording ? '#d32f2f' : '#2e7d32', borderColor: isRecording ? '#d32f2f' : '#2e7d32' }}
                >
                  {isRecording ? 'Stop Voice' : 'Test Voice Recording'}
                </Button>
                
                {/* Test Audio Playback Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={testAudioPlayback}
                  sx={{ ml: 1, backgroundColor: '#fff3e0', color: '#f57c00', borderColor: '#f57c00' }}
                >
                  Test Audio
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
