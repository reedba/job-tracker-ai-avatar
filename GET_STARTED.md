# 🚀 Quick Start: Get Your API Key

## Fastest Path: HuggingFace (FREE!)

### 1. Create Account (2 minutes)
👉 https://huggingface.co/join

### 2. Generate Token (1 minute)
1. Go to: https://huggingface.co/settings/tokens
2. Click "New token"
3. Name: `job-tracker-chat`
4. Type: **Read**
5. Click "Generate"
6. Copy token (starts with `hf_`)

### 3. Add to Your Project
Create or edit `server/.env`:
```bash
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Restart Server
```bash
cd server
rails s
```

### 5. Test It! 🎉
- Login to your app
- Click chat button (bottom-right)
- Ask: "How many applications this month?"

---

## That's It!

Your AI chat is now powered by:
- ✅ LangChain for orchestration
- ✅ HuggingFace Mistral-7B model
- ✅ Automatic tool calling
- ✅ FREE tier (rate-limited)

### Want More?

**Better Models:**
```bash
# In server/.env
HUGGINGFACE_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1  # Bigger model
```

**No Rate Limits:**
- HuggingFace Pro: $9/month
- OR use OpenAI/Claude (see main docs)

---

## External Setup Requirements: ZERO! ✨

Everything runs through HuggingFace API:
- ❌ No local model installation
- ❌ No GPU required
- ❌ No Docker containers
- ❌ No complex setup
- ✅ Just an API key!

---

## Troubleshooting

**"No LLM API key configured"**
- Make sure `.env` file is in `server/` directory
- Verify token starts with `hf_`
- Restart Rails server

**Slow first response?**
- HuggingFace free tier "warms up" model on first use
- Second request will be faster
- Normal behavior!

**Rate limit hit?**
- Free tier has limits
- Wait 10-30 seconds
- Upgrade to Pro if needed

---

## Need Help?

See full documentation:
- [LANGCHAIN_HUGGINGFACE_SETUP.md](./LANGCHAIN_HUGGINGFACE_SETUP.md) - Complete guide
- [AI_CHAT_README.md](./AI_CHAT_README.md) - Architecture details

Enjoy your AI-powered job tracker! 🎯
