# AI Chat Integration - MCP Client Architecture

## Overview
This implementation provides a real-time AI chat assistant for your job tracking application using Rails Action Cable (WebSockets) and a Model Context Protocol (MCP) client architecture.

## Architecture

```
Frontend (React)                Backend (Rails)
┌────────────────┐             ┌──────────────────┐
│  ChatWidget    │◄─WebSocket─►│  ChatChannel     │
│  Component     │             │  (Action Cable)  │
└────────────────┘             └──────────────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  ChatService     │
                               │  (Orchestrator)  │
                               └──────────────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  MCP Client      │
                               │  (LLM Interface) │
                               └──────────────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                   ┌─────────┐   ┌──────────┐   ┌──────────┐
                   │Company  │   │Application│   │Database  │
                   │Insights │   │Stats Tool │   │Query Tool│
                   └─────────┘   └──────────┘   └──────────┘
```

## File Structure

### Backend (Rails)

```
server/
├── app/
│   ├── channels/
│   │   ├── application_cable/
│   │   │   ├── connection.rb          # WebSocket authentication
│   │   │   └── channel.rb             # Base channel class
│   │   └── chat_channel.rb            # Chat-specific channel
│   │
│   ├── services/
│   │   ├── chat_service.rb            # Orchestrates chat logic
│   │   └── mcp/
│   │       ├── client.rb              # MCP client (LLM interface)
│   │       ├── llm/
│   │       │   └── langchain_adapter.rb  # LangChain integration
│   │       └── tools/
│   │           ├── company_insights_tool.rb
│   │           ├── application_stats_tool.rb
│   │           └── database_query_tool.rb
│   │
│   └── config/
│       ├── cable.yml                  # Action Cable configuration
│       └── routes.rb                  # Mounted cable endpoint
```

### Frontend (React)

```
client/
├── src/
│   ├── components/
│   │   └── chat/
│   │       └── ChatWidget.jsx         # Chat UI component
│   └── utils/
│       └── cable.js                   # Action Cable consumer
```

## How It Works

### 1. WebSocket Connection
- User opens chat widget → Establishes WebSocket connection
- Connection authenticated using JWT token from localStorage
- ChatChannel subscription created for real-time bidirectional communication

### 2. Message Flow
1. User types message in ChatWidget
2. Message sent through WebSocket to ChatChannel
3. ChatChannel receives message, passes to ChatService
4. ChatService calls MCP Client with message + context
5. MCP Client → LangChain Adapter → LLM (HuggingFace/OpenAI/Claude)
6. LangChain ReAct agent automatically decides which tools to use
7. Tools execute database queries (filtered by current_user)
8. Response synthesized and streamed back through WebSocket
9. ChatWidget displays response in real-time

### 3. MCP Tools
Three specialized tools provide database access:

**CompanyInsightsTool**
- Get company information
- Filter by name, sort by application count
- Returns contacts, recent applications

**ApplicationStatsTool**
- Calculate application statistics
- Time period filters (week, month, quarter, year)
- Goal progress tracking
- Status breakdown

**DatabaseQueryTool**
- Company comparisons
- Application timelines
- Contact lists
- Response rate analysis
- Status transition tracking

## LLM Integration (Using LangChain)

The system now uses **LangChain** for LLM integration, which provides:
- Automatic tool orchestration via ReAct agents
- Support for multiple LLM providers (HuggingFace, OpenAI, Claude)
- Built-in conversation memory
- Simplified tool calling

### Quick Setup

**Option 1: HuggingFace (Recommended - FREE!)**
```bash
# Get free token: https://huggingface.co/settings/tokens
# Add to server/.env:
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx

# Optional: Choose different model
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

**Option 2: OpenAI GPT**
```bash
# Add to server/.env:
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview  # Optional
```

**Option 3: Anthropic Claude**
```bash
# Add to server/.env:
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optional
```

### How It Works

LangChain's `langchain_adapter.rb` handles all LLM communication:
- Priority: HuggingFace > OpenAI > Anthropic
- ReAct agent automatically decides when to use tools
- Tools are converted to LangChain-compatible format
- Responses are streamed back through WebSocket

See [LANGCHAIN_HUGGINGFACE_SETUP.md](./LANGCHAIN_HUGGINGFACE_SETUP.md) for detailed setup instructions.

## Environment Setup

### Backend (.env)
```bash
# Option 1: HuggingFace (FREE, recommended for development)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2  # Optional

# Option 2: OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview  # Optional

# Option 3: Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optional
```

### Frontend (.env.development)
```bash
VITE_API_URL=http://localhost:3000
VITE_CABLE_URL=ws://localhost:3000/cable
```

## Testing

### 1. Start Rails Server
```bash
cd server
rails s
```

### 2. Start React Dev Server
```bash
cd client
npm run dev
```

### 3. Test Chat Widget
1. Login to your application
2. Click the chat FAB (floating action button) in bottom-right
3. Type a message like:
   - "How many applications have I submitted this month?"
   - "Show me my top 5 companies"
   - "What's my response rate?"
   - "Tell me about Google"

## Features

### Real-time Communication
- ✅ WebSocket connection with JWT authentication
- ✅ Bidirectional streaming
- ✅ Typing indicators
- ✅ Connection status display
- ✅ Auto-reconnect on disconnect

### AI Capabilities
- ✅ Natural language understanding
- ✅ Context-aware responses
- ✅ Tool calling (database queries)
- ✅ Conversation history tracking
- ✅ User-specific data access

### UI/UX
- ✅ Floating chat widget
- ✅ Collapsible interface
- ✅ Message timestamps
- ✅ User/bot avatars
- ✅ Auto-scroll to latest message
- ✅ Loading states
- ✅ Error handling

## Security

- JWT token authentication for WebSocket connection
- User-scoped data access (all queries filtered by current_user)
- Input validation and sanitization
- Error handling and logging
- Rate limiting (add via middleware if needed)

## Performance Considerations

1. **Action Cable Adapter**
   - Development: async (in-memory)
   - Production: Redis (recommended for scaling)

2. **Database Queries**
   - All tools use eager loading (`.includes()`)
   - Pagination available in tool parameters
   - Indexed foreign keys for performance

3. **LLM Calls**
   - Consider caching common queries
   - Implement rate limiting per user
   - Add timeout handling
   - Use streaming responses for longer answers

## Customization

### Add New Tools
1. Create new tool in `app/services/mcp/tools/`
2. Implement `description`, `parameters`, and `execute` methods
3. Register in `Mcp::Client#load_tools`

### Modify System Prompt
Edit `build_prompt` method in `app/services/mcp/client.rb`

### Change Chat UI
Customize `ChatWidget.jsx` - fully Material-UI components

## Troubleshooting

### WebSocket Won't Connect
- Check Rails server is running
- Verify cable is mounted in routes.rb
- Check JWT token in localStorage
- Inspect browser console for errors

### No AI Responses
- Verify LLM API key is set
- Check `call_llm_api` is implemented
- Review Rails logs for errors
- Test tools individually

### Slow Responses
- Check database query performance
- Add Redis for Action Cable in production
- Consider response streaming
- Optimize tool queries

## Future Enhancements

- [ ] Message persistence (chat history database)
- [ ] Multi-turn conversations with memory
- [ ] Voice input/output
- [ ] File/document analysis
- [ ] Suggested questions/prompts
- [ ] Analytics dashboard for chat usage
- [ ] Multi-language support
- [ ] Export chat transcripts

## Resources

- **Setup Guides:**
  - [GET_STARTED.md](./GET_STARTED.md) - Quick 5-minute setup
  - [LANGCHAIN_HUGGINGFACE_SETUP.md](./LANGCHAIN_HUGGINGFACE_SETUP.md) - Complete LangChain guide
  - [LANGCHAIN_COMPLETE.md](./LANGCHAIN_COMPLETE.md) - Integration summary

- **External Documentation:**
  - [Rails Action Cable Guide](https://guides.rubyonrails.org/action_cable_overview.html)
  - [LangChain Ruby](https://github.com/patterns-ai-core/langchainrb)
  - [HuggingFace Inference API](https://huggingface.co/docs/api-inference/index)
  - [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
  - [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
