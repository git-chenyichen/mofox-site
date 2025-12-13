// api/send-message.js

const axios = require('axios');
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('只接受 POST 請求');
    }
    
    // 從請求體中獲取數據
    const { channelId, content } = req.body; 

    if (!channelId || !content) {
        return res.status(400).json({ error: '缺少頻道 ID 或訊息內容。' });
    }

    try {
        // 呼叫 Discord API 執行發送訊息
        await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            content: content
        }, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({ success: true, message: `訊息已成功發送到頻道 ${channelId}。` });

    } catch (error) {
        const status = error.response ? error.response.status : 500;
        console.error('發送訊息失敗:', error.response ? error.response.data : error.message);
        res.status(status).json({ error: '訊息發送失敗。請檢查 Bot 權限、頻道 ID 是否正確。' });
    }
};