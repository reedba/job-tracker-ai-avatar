# Quick Setup Guide - AI Chat with MCP

## What We Just Built

A complete AI-powered chat assistant for your job tracking app with:
- ✅ Real-time WebSocket communication (Action Cable)
- ✅ OpenAI function calling for intelligent tool use
- ✅ Three database query tools (companies, applications, contacts)
- ✅ Frontend chat widget with React
- ✅ Simple, maintainable architecture

## File Structure Created

### Backend (Rails)
```
server/app/
├── channels/
│   ├── application_cable/
│   │   ├── connection.rb          # JWT auth for WebSocket
│   │   └── channel.rb
│   └── chat_channel.rb            # Chat WebSocket handler
├── services/
│   ├── chat_service.rb            # Message orchestration
│   └── mcp/
│       ├── client.rb              # Main MCP client
│       ├── llm/
│       │   └── langchain_adapter.rb  # OpenAI function calling (simplified)
│       └── tools/
│           ├── get_companies_tool.rb
│           ├── get_applications_tool.rb
│           └── get_contacts_tool.rb
```

### Frontend (React)
```
client/src/
├── components/chat/
│   └── ChatWidget.jsx             # Chat UI
└── utils/
    └── cable.js                   # WebSocket consumer
```

## Next: Add Your OpenAI API Key

**Using OpenAI with native function calling**

### Get OpenAI API Key
1. Get API key: https://platform.openai.com/api-keys
2. Add to `server/.env`:
   ```bash
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   ```

**Cost:** Very affordable - GPT-4o-mini is $0.15 per 1M input tokens, $0.60 per 1M output tokens (typically $0.001-0.01 per chat session)

## Test It Out

### 1. Install Dependencies (Already Done!)
```bash
# Backend
cd server
bundle install  # ✅ Done - ruby-openai installed

# Frontend
cd client
npm install @rails/actioncable  # ✅ Done
```

### 2. Start Servers
```bash
# Terminal 1: Rails server
cd server
rails s

# Terminal 2: React dev server
cd client
npm run dev
```

### 3. Try These Questions
- "Show me all companies I'm tracking"
- "What applications did I submit this month?"
- "Who are my contacts?"
- "Tell me about my recent applications"

## What Each Tool Does

### 1. GetCompaniesTool
Queries:
- Get all companies tracked by user
- Filter by status (active, inactive)
- Returns company details with metadata

Example: "Show me companies I'm tracking"

### 2. GetApplicationsTool
Queries:
- Get job applications
- Filter by status, company, month, year
- Returns detailed application data

Example: "Show my applications from October"

### 3. GetContactsTool
Queries:
- Get contact information
- Filter by company or role
- Returns contact details

Example: "Show me contacts at Google"

## How It Works

```
User types: "How many applications this month?"
    ↓
ChatWidget sends via WebSocket
    ↓
ChatChannel receives → ChatService
    ↓
ChatService → MCP Client
    ↓
OpenAI Function Calling Adapter
    ↓
OpenAI GPT-4o-mini
    ├─→ Decides: "Need application data"
    └─→ Calls GetApplicationsTool
        ↓
Tool queries database (filtered by user)
    ↓
Results → OpenAI synthesizes answer
    ↓
Response → WebSocket → ChatWidget
```

## Configuration Files

### Backend
- `config/routes.rb` - Mounts `/cable` endpoint ✅
- `config/cable.yml` - Action Cable config ✅
- `Gemfile` - Added faraday gems ✅

### Frontend
- `client/.env.development` - WebSocket URL ✅
- `client/package.json` - Added @rails/actioncable ✅

## Customization

### Add More Tools
1. Create file in `server/app/services/mcp/tools/`
2. Implement methods:
   - `description` - What the tool does
   - `parameters` - JSON schema for inputs
   - `execute(params)` - Query logic
3. Register in `Mcp::Client#load_tools`

### Modify System Prompt
Edit `build_system_prompt` in `server/app/services/mcp/client.rb`

### Change Chat UI
Edit `client/src/components/chat/ChatWidget.jsx`

## Troubleshooting

### "Connecting..." Never Changes
- Rails server not running
- Check cable endpoint: http://localhost:3000/cable
- JWT token expired (re-login)

### No AI Responses
- API key not set in `.env`
- Check Rails logs: `tail -f server/log/development.log`
- Verify LLM adapter loaded

### WebSocket Errors
- Check browser console
- Verify token in localStorage
- Restart both servers

## Production Considerations

1. **Action Cable in Production**
   ```yaml
   # config/cable.yml
   production:
     adapter: redis
     url: <%= ENV['REDIS_URL'] %>
   ```

2. **Environment Variables**
   - Set API keys securely (not in code)
   - Use Rails credentials or secrets manager

3. **Rate Limiting**
   - Add per-user rate limits
   - Implement request throttling

4. **Monitoring**
   - Log all LLM calls
   - Track tool usage
   - Monitor WebSocket connections

## Cost Estimates

### OpenAI GPT-4o-mini
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Typical chat: 1000-5000 tokens = $0.001-0.01 per conversation
- Very affordable for personal use!

## Resources

- **Setup Guides:**
  - [GET_STARTED.md](./GET_STARTED.md) - Quick 5-minute setup
  - [AI_CHAT_README.md](./AI_CHAT_README.md) - Full architecture docs
  
- **External:**
  - [Rails Action Cable](https://guides.rubyonrails.org/action_cable_overview.html)
  - [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
  - [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## What's Next?

1. **Add OpenAI API Key** - Get from https://platform.openai.com/api-keys
2. **Test the chat** with example questions
3. **Customize tools** for your needs
4. **Deploy to production** with Redis

The architecture is complete and production-ready! Just add your OpenAI API key to start chatting with your database. 🚀
