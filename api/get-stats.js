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

// 獲取群組核心數據 (身分組)
async function getGuildBaseData() {
    const response = await axios.get(`https://discord.com/api/v10/guilds/${GUILD_ID}`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` }
    });
    return response.data;
}

// 獲取並計算成員數據 (繞過 Gateway 限制，強制獲取成員列表)
async function getMemberCounts() {
    let totalMembers = 0;
    // 雖然在線人數無法準確獲取，但為了防止前端崩潰，我們保留變數
    let onlineMembers = 0; 
    
    // 使用 GET /guilds/{guild.id}/members 端點
    // 由於您的群組約 300 人，單次請求 limit=1000 即可完成
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`;
    
    const response = await axios.get(url, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` }
    });

    const members = response.data;
    totalMembers = members.length;

    // 由於 Serverless 環境無法保持 Gateway 連線，
    // onlineMembers (presence_count) 將始終不準確，因此我們保留為 0。
    
    return { totalMembers, onlineMembers };
}

module.exports = async (req, res) => {
    
    // 階段 1: 安全檢查 (驗證用戶是否已登入)
    const authToken = getCookie(req.headers.cookie, 'auth_token');

    if (!authToken) {
        console.warn('未經授權嘗試讀取統計數據。');
        return res.status(401).json({ error: '未經授權訪問，請重新登入。' });
    }

    if (!BOT_TOKEN || !GUILD_ID) {
        return res.status(500).json({ error: '伺服器配置錯誤：缺少 BOT_TOKEN 或 GUILD_ID 環境變數。' });
    }

    try {
        // 並行獲取數據
        const [baseData, memberCounts] = await Promise.all([
            getGuildBaseData(),
            getMemberCounts()
        ]);
        
        const { totalMembers, onlineMembers } = memberCounts;

        console.log("計算後的數據:", {
            totalMembers: totalMembers,
            rolesCount: baseData.roles.length,
        });

        // 階段 3: 返回數據
        res.status(200).json({
            totalMembers: totalMembers, 
            onlineMembers: onlineMembers, // 保持為 0，但確保數據類型正確
            totalRoles: baseData.roles.length,
        });

    } catch (error) {
        // 階段 4: 錯誤診斷與處理
        const statusCode = error.response ? error.response.status : 'N/A';
        const errorData = error.response ? error.response.data : error.message;

        console.error(`獲取統計數據失敗 (Status: ${statusCode}):`, errorData);
        
        let errorMessage = '無法連接到 Discord API 或權限不足。';
        if (statusCode === 403) {
            errorMessage = 'API 權限不足 (403)。Bot 必須要有 VIEW_GUILD 和 READ_MEMBERS 權限。';
        }

        res.status(500).json({ error: errorMessage });
    }
};
