# Discord Profile Viewer

A clean, minimal web app to look up Discord user profiles by ID. Built for Vercel deployment.

## Features

- 🔍 Look up any Discord user by their Snowflake ID
- 🖼️ View & download profile pictures at 16, 64, 128, 256, and 1024px
- 📋 Copy username or user ID with one click
- 🎨 Shows banner, accent color, bio, and badges
- 📅 Displays account creation date (derived from Snowflake)

---

## Setup

### 1. Get a Discord Bot Token

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create a **New Application**
3. Go to **Bot** → **Reset Token** → copy your token
4. You do **not** need to invite the bot to any server

### 2. Deploy to Vercel

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
vercel
```

Or drag-and-drop the project folder at [vercel.com/new](https://vercel.com/new).

### 3. Set the Environment Variable

In your Vercel project → **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `DISCORD_TOKEN` | `your_bot_token_here` |

Redeploy after saving.

---

## Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Start local dev server (runs serverless functions locally)
vercel dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Finding a Discord User ID

1. Open Discord → **Settings → Advanced** → enable **Developer Mode**
2. Right-click any user → **Copy User ID**

---

## Project Structure

```
discord-profile-viewer/
├── index.html          # Main page
├── style.css           # Styles
├── app.js              # Frontend logic
├── vercel.json         # Vercel routing config
└── api/
    └── user/
        └── [id].js     # Serverless proxy (keeps bot token safe)
```

---

## Notes

- The bot token is kept server-side in the serverless function — it is never exposed to the browser.
- Discord's `v10` API is used.
- `bio` is returned for users who have set one via the profile API.
