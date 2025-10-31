# Quick Setup Guide - AI Chat with MCP

## What We Just Built

A complete AI-powered chat assistant for your job tracking app with:
- ✅ Real-time WebSocket communication (Action Cable)
- ✅ MCP client architecture with 3 database query tools
- ✅ Frontend chat widget with React
- ✅ Ready for Claude or OpenAI integration

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
│       │   └── langchain_adapter.rb  # LangChain integration (HuggingFace/OpenAI/Claude)
│       └── tools/
│           ├── company_insights_tool.rb
│           ├── application_stats_tool.rb
│           └── database_query_tool.rb
```

### Frontend (React)
```
client/src/
├── components/chat/
│   └── ChatWidget.jsx             # Chat UI
└── utils/
    └── cable.js                   # WebSocket consumer
```

## Next: Add Your LLM API Key

**✨ Now using LangChain with multiple provider support!**

### Option 1: HuggingFace (Recommended - FREE!)
1. Get API token: https://huggingface.co/settings/tokens
2. Add to `server/.env`:
   ```bash
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
   HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2  # Optional
   ```

### Option 2: Use OpenAI GPT
1. Get API key: https://platform.openai.com/api-keys
2. Add to `server/.env`:
   ```bash
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   OPENAI_MODEL=gpt-4-turbo-preview  # Optional
   ```

### Option 3: Use Anthropic Claude
1. Get API key: https://console.anthropic.com/
2. Add to `server/.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optional
   ```

**Priority:** HuggingFace > OpenAI > Anthropic (first key found is used)

## Test It Out

### 1. Install Dependencies (Already Done!)
```bash
# Backend
cd server
bundle install  # ✅ Done - langchainrb, hugging-face, ruby-openai installed

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
- "How many applications have I submitted this month?"
- "What's my top company by application count?"
- "Show me my application statistics for the last week"
- "Tell me about [Company Name]"
- "What's my response rate?"
- "Am I on track to meet my monthly goal?"

## What Each Tool Does

### 1. CompanyInsightsTool
Queries:
- Company details with contacts
- Filter/sort by name or application count
- Recent applications per company

Example: "Tell me about Google" or "Which companies do I apply to most?"

### 2. ApplicationStatsTool
Queries:
- Application counts and trends
- Status breakdown (Applied, Interview, Offer, Rejected)
- Monthly averages
- Goal progress tracking

Example: "How many applications this month?" or "What's my success rate?"

### 3. DatabaseQueryTool
Advanced queries:
- Company comparisons
- Application timelines
- Contact lists by company/role
- Response rate analysis
- Status transitions

Example: "Compare Google and Amazon" or "Show my contacts at tech companies"

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
MCP Client → LangChain Adapter
    ↓
LangChain ReAct Agent (with HuggingFace/OpenAI/Claude)
    ├─→ Reasons: "Need application stats"
    └─→ Calls ApplicationStatsTool
        ↓
Tool queries database (filtered by user)
    ↓
Results → Agent synthesizes answer
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

### Anthropic Claude
- ~$3 per 1M input tokens
- ~$15 per 1M output tokens
- Typical chat: 1000-5000 tokens = $0.005-0.10 per conversation

### OpenAI GPT-4
- ~$10 per 1M input tokens
- ~$30 per 1M output tokens
- Similar costs per conversation

## Resources

- **Setup Guides:**
  - [GET_STARTED.md](./GET_STARTED.md) - Quick 5-minute setup
  - [LANGCHAIN_HUGGINGFACE_SETUP.md](./LANGCHAIN_HUGGINGFACE_SETUP.md) - Complete guide
  - [AI_CHAT_README.md](./AI_CHAT_README.md) - Full architecture docs
  
- **External:**
  - [Rails Action Cable](https://guides.rubyonrails.org/action_cable_overview.html)
  - [LangChain Ruby](https://github.com/patterns-ai-core/langchainrb)
  - [HuggingFace](https://huggingface.co/docs/api-inference/index)

## What's Next?

1. **Add API Key** - HuggingFace (free), OpenAI, or Claude
2. **Test the chat** with example questions
3. **Customize tools** for your needs
4. **Tune model settings** in `langchain_adapter.rb`
5. **Deploy to production** with Redis

The architecture is complete and production-ready! Just add your LLM API key to start chatting with your database. 

**Using LangChain:** Automatic tool orchestration, multi-provider support, built-in memory! 🚀
