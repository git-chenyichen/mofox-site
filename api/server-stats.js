const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');

const app = express();
app.use(cors());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

client.login(BOT_TOKEN);

app.get('/api/server-stats', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch();
    
    const totalMembers = guild.memberCount;
    const botCount = members.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;
    const channelCount = guild.channels.cache.size;
    const boostCount = guild.premiumSubscriptionCount || 0;

    res.json({
      totalMembers,
      humanCount,
      botCount,
      channelCount,
      boostCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch server stats' });
  }
});

module.exports = app;
