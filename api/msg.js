const axios = require('axios');
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

module.exports = async (req, res) => {
    const { channelId, content } = req.body;
    try {
        await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, 
            { content }, 
            { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
        );
        res.json({ message: '訊息已送出' });
    } catch (e) { res.status(400).json({ error: '發送失敗' }); }
};
