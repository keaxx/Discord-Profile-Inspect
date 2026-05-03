// api/user/[id].js
// Vercel Serverless Function — proxies Discord API to keep the bot token server-side

export default async function handler(req, res) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  if (!id || !/^\d{17,20}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'DISCORD_TOKEN environment variable is not set.' });
  }

  try {
    const discordRes = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await discordRes.json();

    if (!discordRes.ok) {
      return res.status(discordRes.status).json(data);
    }

    // Return a clean subset of the user object
    return res.status(200).json({
      id:           data.id,
      username:     data.username,
      global_name:  data.global_name ?? null,
      discriminator:data.discriminator,
      avatar:       data.avatar ?? null,
      banner:       data.banner ?? null,
      banner_color: data.banner_color ?? null,
      accent_color: data.accent_color ?? null,
      bio:          data.bio ?? null,
      bot:          data.bot ?? false,
      public_flags: data.public_flags ?? 0,
      premium_type: data.premium_type ?? 0,
    });
  } catch (err) {
    console.error('Discord fetch error:', err);
    return res.status(500).json({ error: 'Failed to reach Discord API.' });
  }
}
