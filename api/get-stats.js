// /api/get-stats.js

const axios = require('axios');
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

/**
 * 輔助函數：從請求標頭中解析特定名稱的 Cookie 值
 */
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

module.exports = async (req, res) => {
    
    // ----------------------------------------------------
    // 階段 1: 安全檢查 (驗證用戶是否已登入)
    // ----------------------------------------------------
    const authToken = getCookie(req.headers.cookie, 'auth_token');

    if (!authToken) {
        console.warn('未經授權嘗試讀取統計數據。');
        // 返回 401 Unauthorized，讓前端知道需要重新登入
        return res.status(401).json({ error: '未經授權訪問，請重新登入。' });
    }

    // ----------------------------------------------------
    // 階段 2: 呼叫 Discord API 獲取數據
    // ----------------------------------------------------
    
    if (!BOT_TOKEN || !GUILD_ID) {
        return res.status(500).json({ error: '伺服器配置錯誤：缺少 BOT_TOKEN 或 GUILD_ID 環境變數。' });
    }

    try {
        const response = await axios.get(`https://discord.com/api/v10/guilds/${GUILD_ID}`, {
            headers: {
                // 確保 Token 格式正確 (必須有 "Bot " 和空格)
                Authorization: `Bot ${BOT_TOKEN}`
            },
            params: {
                // 請求成員和在線狀態的計數
                with_counts: true 
            }
        });

        const data = response.data;
        
        // 診斷日誌：輸出 Discord API 返回的數據，幫助檢查 member_count 是否為 0
        console.log("Discord API Response Data:", {
            memberCount: data.member_count,
            presenceCount: data.presence_count,
            rolesCount: data.roles.length,
        });

        // ----------------------------------------------------
        // 階段 3: 返回數據
        // ----------------------------------------------------
        res.status(200).json({
            // 使用 || 0 確保如果 API 返回 null/undefined 時，前端不會崩潰
            totalMembers: data.member_count || 0, 
            onlineMembers: data.presence_count || 0,
            totalRoles: data.roles.length,
        });

    } catch (error) {
        // ----------------------------------------------------
        // 階段 4: 錯誤診斷與處理
        // ----------------------------------------------------
        const statusCode = error.response ? error.response.status : 'N/A';
        const errorData = error.response ? error.response.data : error.message;

        // 🚨 關鍵日誌：在 Vercel 日誌中查找這個輸出，以確認 Discord API 狀態碼
        console.error(`獲取統計數據失敗 (Status: ${statusCode}):`, errorData);
        
        let errorMessage = '無法連接到 Discord API，請檢查 Bot Token 和群組 ID。';

        // 根據狀態碼給予明確提示
        if (statusCode === 401) {
             errorMessage = 'API 驗證失敗 (401)。BOT_TOKEN 可能無效或被撤銷。';
        } else if (statusCode === 403) {
             errorMessage = 'API 權限不足 (403)。Bot 可能缺乏 VIEW_GUILD 權限或未在群組中。';
        } else if (statusCode === 429) {
             errorMessage = 'API 請求過快 (429)。請稍後再試。';
        }

        res.status(500).json({ error: errorMessage });
    }
};
