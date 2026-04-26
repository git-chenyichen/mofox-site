const axios = require('axios');
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

module.exports = async (req, res) => {
    const { type } = req.query;
    const discord = axios.create({ 
        baseURL: 'https://discord.com/api/v10', 
        headers: { Authorization: `Bot ${BOT_TOKEN}` } 
    });

    try {
        if (type === 'users') {
            const r = await discord.get(`/guilds/${GUILD_ID}/members?limit=1000`);
            const data = r.data.map(m => ({
                id: m.user.id,
                name: m.nick || m.user.username,
                avatar: m.user.avatar
            }));
            return res.json(data);
        }
        
        if (type === 'roles') {
            const r = await discord.get(`/guilds/${GUILD_ID}/roles`);
            return res.json(r.data.map(r => ({ id: r.id, name: r.name })));
        }

        if (type === 'channels') {
            const r = await discord.get(`/guilds/${GUILD_ID}/channels`);
            return res.json(r.data.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name })));
        }
    } catch (e) {
        res.status(500).json({ error: '數據加載失敗' });
    }
};
