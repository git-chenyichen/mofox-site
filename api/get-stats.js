// api/get-stats.js

const axios = require('axios');

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

module.exports = async (req, res) => {
    try {
        // 🚨 這是 Bot 權限檢查的簡化版，實際應檢查用戶是否已登入且有權限 (參考 auth.js 的 Cookie 檢查)
        // if (!req.headers.cookie || !isValidAdminSession(req.headers.cookie)) {
        //     return res.status(401).send('未授權訪問');
        // }

        // 呼叫 Discord API 獲取群組資訊
        const response = await axios.get(`https://discord.com/api/v10/guilds/${GUILD_ID}`, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`
            },
            params: {
                // 請求額外資訊，例如在線成員數
                with_counts: true 
            }
        });

        const data = response.data;

        // 返回需要的統計數據
        res.status(200).json({
            totalMembers: data.member_count,
            onlineMembers: data.presence_count, // 在線人數
            totalRoles: data.roles.length,
        });

    } catch (error) {
        console.error('獲取統計數據失敗:', error.message);
        res.status(500).json({ error: '無法連接到 Discord API，請檢查 Bot Token 和群組 ID。' });
    }
};