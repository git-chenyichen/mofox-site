const axios = require('axios');
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

module.exports = async (req, res) => {
    const { userId, roleId, action } = req.body;
    try {
        await axios({
            method: action === 'add' ? 'PUT' : 'DELETE',
            url: `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`,
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });
        res.json({ message: '身分組已更新' });
    } catch (e) { res.status(400).json({ error: '權限操作失敗' }); }
};

module.exports.checkUserHasRole = async (userId, allowedRoleIds) => {
    try {
        const response = await axios({
            method: 'GET',
            url: `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`,
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });
        const userRoles = response.data.roles;
        return userRoles.some(roleId => allowedRoleIds.includes(roleId));
    } catch (e) {
        return false;
    }
};
