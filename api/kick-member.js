// api/kick-member.js

const axios = require('axios');

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

module.exports = async (req, res) => {
    // 假設您傳入的請求方法是 POST，且包含 user_id 和 reason
    if (req.method !== 'POST') {
        return res.status(405).send('只接受 POST 請求');
    }

    // 從請求體中獲取數據
    const { userId, reason } = req.body; 

    if (!userId) {
        return res.status(400).json({ error: '缺少用戶 ID。' });
    }

    try {
        // 呼叫 Discord API 執行踢出 (Kick)
        await axios.delete(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`
            },
            data: {
                // 傳遞原因，會在 Discord 的審核日誌中顯示
                reason: reason || '由後台管理員踢出' 
            }
        });

        res.status(200).json({ success: true, message: `用戶 ${userId} 已被踢出。` });

    } catch (error) {
        const status = error.response ? error.response.status : 500;
        console.error('踢人操作失敗:', error.response ? error.response.data : error.message);
        res.status(status).json({ error: '執行踢出失敗。請檢查 Bot 權限、用戶 ID 是否正確。' });
    }
};