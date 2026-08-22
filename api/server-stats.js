const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

app.get('/api/server-stats', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (!BOT_TOKEN || !GUILD_ID) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    const headers = {
      Authorization: `Bot ${BOT_TOKEN}`
    };

    const [guildRes, channelsRes, membersRes] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`, { headers }),
      fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, { headers }),
      fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`, { headers })
    ]);

    if (!guildRes.ok || !channelsRes.ok || !membersRes.ok) {
      throw new Error('Discord API Request Failed');
    }

    const guildData = await guildRes.json();
    const channelsData = await channelsRes.json();
    const membersData = await membersRes.json();

    const totalMembers = guildData.approximate_member_count || guildData.member_count || membersData.length;
    const botCount = membersData.filter(m => m.user && m.user.bot).length;
    const humanCount = totalMembers - botCount;
    const channelCount = channelsData.length;
    const boostCount = guildData.premium_subscription_count || 0;

    res.json({
      totalMembers,
      humanCount,
      botCount,
      channelCount,
      boostCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch server stats' });
  }
});

module.exports = app;
