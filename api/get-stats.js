// api/get-stats.js (新版本：手動計算成員)

const axios = require('axios');
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// 輔助函數：從請求標頭中解析 Cookie
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

// 獲取並計算成員數據 (繞過 Gateway 限制)
async function getMemberCounts() {
    let totalMembers = 0;
    let onlineMembers = 0;
    let after = '0'; // 用於分頁的用戶 ID
    const limit = 1000; // 一次獲取 1000 個成員 (最多)
    
    // 由於您的群組約 300 人，單次請求即可完成
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=${limit}&after=${after}`;
    
    const response = await axios.get(url, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` }
    });

    const members = response.data;
    totalMembers = members.length;

    // 計算在線人數 (檢查 presence 狀態，需要 PRESENCE INTENT)
    onlineMembers = members.filter(member => 
        // Discord API V10 (成員對象) 不直接包含 status 字段，
        // 需依賴 Gateway 狀態，但我們可以檢查 presence 緩存
        // 由於我們無法訪問 Gateway 緩存，此處的在線人數可能仍然不準確。
        // 我們將暫時使用一個更保守的檢查（如果 API 有回傳 presence 信息）
        member.presence && member.presence.status && member.presence.status !== 'offline'
    ).length;

    return { totalMembers, onlineMembers };
}

module.exports = async (req, res) => {
    
    // 階段 1: 安全檢查
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
            onlineMembers: onlineMembers,
            rolesCount: baseData.roles.length,
        });

        res.status(200).json({
            totalMembers: totalMembers, 
            onlineMembers: onlineMembers,
            totalRoles: baseData.roles.length,
        });

    } catch (error) {
        // 錯誤診斷與處理（保持與之前一樣的詳細日誌）
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
