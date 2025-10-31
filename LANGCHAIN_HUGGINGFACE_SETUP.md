# LangChain + HuggingFace Setup Guide

## 🎉 What Changed

Your AI chat now uses **LangChain** with **HuggingFace** models, giving you:
- ✅ **Free tier available** with HuggingFace Inference API
- ✅ **Multiple model options** (HuggingFace, OpenAI, Claude)
- ✅ **Automatic tool orchestration** via LangChain agents
- ✅ **Better conversation handling**
- ✅ **Flexibility to switch LLM providers**

## Quick Setup (Choose One)

### Option 1: HuggingFace (Recommended - Free!)

**Why HuggingFace?**
- Free tier available (rate-limited but good for development)
- Access to thousands of open-source models
- No credit card required to start
- Great for testing and development

**Setup Steps:**

1. **Create HuggingFace Account**
   - Go to https://huggingface.co/
   - Sign up for free

2. **Generate API Token**
   - Visit https://huggingface.co/settings/tokens
   - Click "New token"
   - Name it "job-tracker-chat"
   - Select "Read" access
   - Copy your token (starts with `hf_`)

3. **Add to Environment**
   ```bash
   # In server/.env
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
   
   # Optional: Choose a different model (default is Mistral-7B)
   HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
   ```

4. **Install Gems**
   ```bash
   cd server
   bundle install
   ```

**Available Models:**
- `mistralai/Mistral-7B-Instruct-v0.2` (Default - Fast, good quality)
- `meta-llama/Llama-2-7b-chat-hf` (Meta's Llama 2)
- `tiiuae/falcon-7b-instruct` (Falcon by TII)
- `google/flan-t5-xxl` (Google's T5)
- More at: https://huggingface.co/models?pipeline_tag=text-generation

### Option 2: OpenAI GPT

1. **Get API Key**
   - Visit https://platform.openai.com/api-keys
   - Create new secret key
   - Copy key (starts with `sk-`)

2. **Add to Environment**
   ```bash
   # In server/.env
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   
   # Optional: Choose model (default is gpt-4-turbo-preview)
   OPENAI_MODEL=gpt-4-turbo-preview
   ```

**Cost:** ~$10 per 1M input tokens, ~$30 per 1M output tokens

### Option 3: Anthropic Claude

1. **Get API Key**
   - Visit https://console.anthropic.com/
   - Create API key
   - Copy key (starts with `sk-ant-`)

2. **Add to Environment**
   ```bash
   # In server/.env
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
   
   # Optional: Choose model (default is claude-3-5-sonnet)
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

**Cost:** ~$3 per 1M input tokens, ~$15 per 1M output tokens

## Installation

### 1. Install Ruby Gems

```bash
cd server
bundle install
```

**Gems Added:**
- `langchainrb` - LangChain framework for Ruby
- `ruby-openai` - Required dependency for LangChain
- `hugging-face` - HuggingFace API client

### 2. Restart Rails Server

```bash
# Stop current server (Ctrl+C)
rails s
```

## How It Works Now

### Architecture with LangChain

```
User Question
    ↓
ChatWidget (WebSocket)
    ↓
ChatChannel
    ↓
ChatService
    ↓
MCP Client
    ↓
LangChain Adapter ←→ ReAct Agent
    ↓                      ↓
LLM Provider         Tool Executor
(HuggingFace/GPT)    (DB Queries)
    ↓
Response back through chain
```

### What's Different?

**Before:**
- Manual tool calling logic
- Separate adapters for each LLM
- Complex prompt engineering
- Manual conversation management

**After:**
- LangChain handles tool orchestration automatically
- Single adapter for all LLM providers
- ReAct agent decides when to use tools
- Built-in conversation memory

### ReAct Agent

LangChain uses a **ReAct (Reasoning + Acting) agent** that:
1. Receives your question
2. Reasons about what tools it needs
3. Calls appropriate tools
4. Synthesizes results into an answer

Example:
```
User: "How many applications this month?"
    ↓
Agent Reasoning: "I need application statistics for current month"
    ↓
Agent Action: Call get_applications tool with time_period="month"
    ↓
Tool Returns: { total: 15, by_status: {...}, ... }
    ↓
Agent Response: "You've submitted 15 applications this month..."
```

## Testing

### 1. Start Servers
```bash
# Terminal 1
cd server
rails s

# Terminal 2
cd client
npm run dev
```

### 2. Test Questions

**Basic Stats:**
- "How many applications have I submitted?"
- "What's my monthly progress?"
- "Show my application statistics"

**Company Queries:**
- "Tell me about Google"
- "Which companies have I applied to most?"
- "Show my top 5 companies"

**Advanced Analysis:**
- "What's my response rate?"
- "Compare Microsoft and Amazon"
- "Show me applications from last week"

### 3. Check Logs

```bash
# In server terminal, watch for:
[LangChain] Calling tool: get_applications
[LangChain] Tool result: { total: 15, ... }
```

## Configuration Options

### Model Selection

**HuggingFace Models by Size:**
```bash
# Smaller/Faster (Good for testing)
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Larger/Better Quality
HUGGINGFACE_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1

# Specialized for chat
HUGGINGFACE_MODEL=meta-llama/Llama-2-13b-chat-hf
```

**OpenAI Models:**
```bash
OPENAI_MODEL=gpt-4-turbo-preview      # Best quality, slower
OPENAI_MODEL=gpt-4                     # High quality
OPENAI_MODEL=gpt-3.5-turbo            # Faster, cheaper
```

**Anthropic Models:**
```bash
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Latest, best
ANTHROPIC_MODEL=claude-3-opus-20240229      # Most capable
ANTHROPIC_MODEL=claude-3-sonnet-20240229    # Balanced
```

### LangChain Settings

Edit `app/services/mcp/llm/langchain_adapter.rb`:

```ruby
# Adjust temperature (creativity)
temperature: 0.7  # Range 0-1 (lower = more focused)

# Adjust max tokens (response length)
max_tokens: 2048  # Increase for longer responses

# Adjust top_p (diversity)
top_p: 0.95  # Range 0-1 (lower = more deterministic)
```

## Troubleshooting

### "No LLM API key configured"
- Check `.env` file exists in `server/` directory
- Verify at least one API key is set
- Restart Rails server after adding key

### HuggingFace Rate Limit
```
Error: Rate limit exceeded
```
**Solution:**
- Free tier has rate limits
- Wait a few seconds between requests
- Upgrade to Pro ($9/month) for higher limits
- Use OpenAI or Claude as fallback

### "Model not found"
```
Error: Model mistralai/... not found
```
**Solution:**
- Check model name spelling
- Verify model exists: https://huggingface.co/models
- Try default: `mistralai/Mistral-7B-Instruct-v0.2`

### Slow Responses with HuggingFace
- Free tier uses shared infrastructure
- First request "warms up" the model (slower)
- Subsequent requests are faster
- Consider using cached models or paid tier

### LangChain Agent Not Using Tools
```ruby
# In langchain_adapter.rb, ensure tools are properly formatted
# Check logs for tool registration errors
```

## Advanced: Adding New Models

### Custom HuggingFace Model

1. Find model on https://huggingface.co/models
2. Verify it has "text-generation" capability
3. Add to `.env`:
   ```bash
   HUGGINGFACE_MODEL=organization/model-name
   ```

### Local Model (Advanced)

For running models locally with Ollama:

```ruby
# In langchain_adapter.rb
def setup_llm
  if ENV['USE_OLLAMA'] == 'true'
    Langchain::LLM::Ollama.new(
      url: 'http://localhost:11434',
      default_options: {
        model: 'mistral',
        temperature: 0.7
      }
    )
  else
    # ... existing code
  end
end
```

## Cost Comparison

| Provider | Input (per 1M tokens) | Output (per 1M tokens) | Free Tier? |
|----------|----------------------|------------------------|------------|
| HuggingFace | **FREE** (rate-limited) | **FREE** (rate-limited) | ✅ Yes |
| OpenAI GPT-4 | $10 | $30 | ❌ No |
| OpenAI GPT-3.5 | $0.50 | $1.50 | ❌ No |
| Claude 3.5 Sonnet | $3 | $15 | ❌ No |

**Typical Chat Session:**
- 5-10 messages
- 2,000-5,000 tokens
- **HuggingFace:** FREE
- **GPT-4:** $0.05-0.15
- **Claude:** $0.015-0.075

## Production Recommendations

### For Development/Testing
✅ **HuggingFace** (Free, good enough for testing)

### For Production (Low Traffic)
✅ **Claude 3.5 Sonnet** (Best cost/quality ratio)

### For Production (High Traffic)
✅ **OpenAI GPT-3.5** (Fastest, cheapest paid option)

### For Maximum Quality
✅ **GPT-4** or **Claude Opus** (Most capable, highest cost)

## Resources

- [LangChain Ruby Docs](https://github.com/patterns-ai-core/langchainrb)
- [HuggingFace Models](https://huggingface.co/models)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference/index)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Anthropic Claude Docs](https://docs.anthropic.com/)

## Next Steps

1. ✅ Install gems: `bundle install`
2. ✅ Choose LLM provider (HuggingFace recommended)
3. ✅ Add API key to `.env`
4. ✅ Restart Rails server
5. ✅ Test chat widget
6. 🔄 Monitor usage and costs
7. 🔄 Tune model parameters as needed

Your AI chat is now powered by LangChain with flexible LLM options! 🚀
