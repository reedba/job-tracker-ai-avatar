# Phase 2 Testing Instructions

## Testing OpenAI Integration

### Prerequisites
1. Make sure you have `OPENAI_API_KEY` set in your environment
2. Rails server should be running
3. Client dev server should be running

### Test Steps

#### For Authenticated Users:
1. Login to the application as an admin/user
2. Navigate to the AI Avatar page (`/ai-avatar`)
3. Send a test message like "Hello, can you help me with my job search?"
4. Verify you get a real AI response (not an echo)
5. Check the browser console for connection logs

#### For Guest Sessions:
1. As an admin, generate an avatar link
2. Open the link in an incognito browser
3. Click "Begin Interview"
4. Send a test message like "Tell me about this interview process"
5. Verify you get a professional interview-style response

### Expected Behavior
- ✅ Connection established with "Welcome to your AI Avatar..." message
- ✅ Typing indicator appears when sending message
- ✅ Real AI responses (not echo messages)
- ✅ Different system prompts for users vs guests
- ✅ Error handling if OpenAI API fails

### Debugging
- Check browser console for WebSocket connection logs
- Check Rails logs for OpenAI API calls
- Verify `OPENAI_API_KEY` is set in environment

### Success Criteria
- Send message → get intelligent AI response via OpenAI
- Different conversation styles for authenticated vs guest users
- Proper error handling and user feedback

## Common Issues

### "No OPENAI_API_KEY configured"
Add to your `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

### WebSocket connection fails
Check ActionCable connection and authentication tokens

### OpenAI API errors
Check API key validity and rate limits