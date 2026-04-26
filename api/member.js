const axios = require('axios');
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

module.exports = async (req, res) => {
    const { userId, action, reason } = req.body;
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/${action === 'ban' ? 'bans/' + userId : 'members/' + userId}`;
    
    try {
        await axios({
            method: action === 'ban' ? 'PUT' : 'DELETE',
            url,
            headers: { Authorization: `Bot ${BOT_TOKEN}` },
            data: { reason: reason || 'Backend Action' }
        });
        res.json({ message: '執行完畢' });
    } catch (e) { res.status(400).json({ error: '執行失敗' }); }
};
