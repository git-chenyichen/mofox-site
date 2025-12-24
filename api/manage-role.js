// /api/manage-role.js

const axios = require('axios');

// 必須在 Vercel 環境變數中設置
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID; 

const BASE_URL = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members`;

module.exports = async (req, res) => {
    
    if (req.method !== 'POST') {
        return res.status(405).send('只接受 POST 請求');
    }

    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
        return res.status(500).json({ error: '伺服器配置錯誤：缺少 BOT_TOKEN 或 GUILD_ID' });
    }

    const { userId, roleId, action } = req.body;

    if (!userId || !roleId || !action || (action !== 'add' && action !== 'remove')) {
        return res.status(400).json({ error: '缺少必要的參數或操作類型無效 (userId, roleId, action: add/remove)' });
    }

    // Discord API 端點： /guilds/{guild.id}/members/{user.id}/roles/{role.id}
    const API_ENDPOINT = `${BASE_URL}/${userId}/roles/${roleId}`;
    
    const httpMethod = (action === 'add') ? 'PUT' : 'DELETE';
    const actionText = (action === 'add') ? '賦予' : '移除';

    try {
        const response = await axios({
            method: httpMethod,
            url: API_ENDPOINT,
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        // 成功賦予或移除身分組後，Discord 返回 204 No Content
        if (response.status === 204) {
            return res.status(200).json({ 
                message: `已成功對用戶 ${userId} ${actionText} 身分組 ${roleId}。`,
                status: response.status 
            });
        }
        
        return res.status(500).json({ error: 'Discord API 返回非預期狀態碼。' });

    } catch (error) {
        console.error(`執行 ${actionText} 身分組操作失敗:`, error.response ? error.response.data : error.message);
        
        let errorMessage = 'Discord API 呼叫失敗。';
        if (error.response) {
            if (error.response.status === 403) {
                 errorMessage = 'Bot 的身分組排位低於要操作的身分組或成員。';
            } else {
                errorMessage = `Discord API 錯誤 (${error.response.status}): ${JSON.stringify(error.response.data)}`;
            }
        }
        
        return res.status(400).json({ error: errorMessage });
    }
};
