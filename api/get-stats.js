const axios = require('axios');
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

function getCookie(cookieString, name) {
    if (!cookieString) return null;
    const cookies = cookieString.split(';').map(c => c.trim());
    for (const cookie of cookies) {
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}

async function getGuildBaseData() {
    const response = await axios.get(`https://discord.com/api/v10/guilds/${GUILD_ID}`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` }
    });
    return response.data;
}

async function getMemberCounts() {
    let totalMembers = 0;
    let onlineMembers = 0; 
    
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`;
    
    const response = await axios.get(url, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` }
    });

    const members = response.data;
    totalMembers = members.length;
    
    return { totalMembers, onlineMembers };
}

module.exports = async (req, res) => {
    const authToken = getCookie(req.headers.cookie, 'auth_token');

    if (!authToken) {
        return res.status(405).send('只接受 POST 請求');
    }

    if (!BOT_TOKEN || !GUILD_ID) {
        return res.status(500).json({ error: '伺服器配置錯誤：缺少 BOT_TOKEN 或 GUILD_ID 環境變數。' });
    }

    try {
        const [baseData, memberCounts] = await Promise.all([
            getGuildBaseData(),
            getMemberCounts()
        ]);
        
        const { totalMembers, onlineMembers } = memberCounts;

        res.status(200).json({
            totalMembers: totalMembers, 
            onlineMembers: onlineMembers,
            totalRoles: baseData.roles.length,
        });

    } catch (error) {
        const statusCode = error.response ? error.response.status : 'N/A';
        const errorData = error.response ? error.response.data : error.message;

        let errorMessage = '無法連接到 Discord API 或權限不足。';
        if (statusCode === 403) {
            errorMessage = 'API 權限不足 (403)。Bot 必須要有 VIEW_GUILD 和 READ_MEMBERS 權限。';
        }

        res.status(500).json({ error: errorMessage });
    }
};
