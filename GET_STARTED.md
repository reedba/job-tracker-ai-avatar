# 🚀 Quick Start: Get Your API Key

## Setup: OpenAI API Key (Required)

### 1. Create OpenAI Account (2 minutes)
👉 https://platform.openai.com/signup

### 2. Generate API Key (1 minute)
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name: `job-tracker-chat`
4. Copy key (starts with `sk-`)

### 3. Add to Your Project
Create or edit `server/.env`:
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
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
- ✅ OpenAI GPT-4o-mini (fast and affordable)
- ✅ Native function calling for tool use
- ✅ Direct API integration
- ✅ Simple, maintainable code

### Cost Estimate

OpenAI GPT-4o-mini pricing:
- **$0.15** per 1M input tokens
- **$0.60** per 1M output tokens
- Typical chat: **$0.001-0.01** per conversation

Very affordable for personal use!

---

## Troubleshooting

**"No LLM API key configured"**
- Make sure `.env` file is in `server/` directory
- Verify key starts with `sk-`
- Restart Rails server

**Need more free credits?**
- OpenAI gives $5 free credits on new accounts
- Add payment method for pay-as-you-go

---

## Need Help?

See full documentation:
- [AI_CHAT_README.md](./AI_CHAT_README.md) - Architecture details

Enjoy your AI-powered job tracker! 🎯
