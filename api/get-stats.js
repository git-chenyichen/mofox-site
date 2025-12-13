// Serverless 函數的入口點 (適用於 Vercel, Netlify, Cloudflare Workers 等)

// 從環境變數中讀取配置
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// 允許顯示在下拉選單中的頻道類型
const ALLOWED_CHANNEL_TYPES = [
    0, // 文字頻道 (text)
    2, // 語音頻道 (voice)
    5, // 公告頻道 (news)
    13, // 舞台頻道 (stage)
];

// Discord API 基礎 URL
const BASE_URL = 'https://discord.com/api/v10';

/**
 * 處理獲取所有初始數據的請求 (統計、身分組、頻道)。
 */
export default async function handler(request) {
    // 檢查環境變數是否已設置
    if (!BOT_TOKEN || !GUILD_ID) {
        return new Response(JSON.stringify({ error: "後端配置錯誤：DISCORD_BOT_TOKEN 或 DISCORD_GUILD_ID 環境變數缺失。" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const headers = {
        "Authorization": `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json"
    };

    // ----------------------------------------------------
    // 1. 異步獲取所有數據
    // ----------------------------------------------------
    try {
        const [
            guildResponse, 
            channelsResponse, 
            rolesResponse
        ] = await Promise.all([
            // 獲取伺服器數據 (帶上 with_counts=true 獲取成員數)
            fetch(`${BASE_URL}/guilds/${GUILD_ID}?with_counts=true`, { headers }), 
            // 獲取頻道列表
            fetch(`${BASE_URL}/guilds/${GUILD_ID}/channels`, { headers }), 
            // 獲取身分組列表
            fetch(`${BASE_URL}/guilds/${GUILD_ID}/roles`, { headers }), 
        ]);

        // 檢查所有請求是否成功
        if (!guildResponse.ok || !channelsResponse.ok || !rolesResponse.ok) {
            // 記錄失敗的請求狀態碼
            let errorDetails = '';
            if (!guildResponse.ok) errorDetails += `Guild Status: ${guildResponse.status}`;
            if (!channelsResponse.ok) errorDetails += ` Channels Status: ${channelsResponse.status}`;
            if (!rolesResponse.ok) errorDetails += ` Roles Status: ${rolesResponse.status}`;

            // 如果任何一個請求失敗，拋出錯誤
            throw new Error(`Discord API 請求失敗，請檢查 Bot 權限。狀態碼: [${errorDetails}]`);
        }

        const guildData = await guildResponse.json();
        const channelsData = await channelsResponse.json();
        const rolesData = await rolesResponse.json();

        // ----------------------------------------------------
        // 2. 處理統計數據 (Stats)
        // ----------------------------------------------------
        const stats = {
            // 使用 approximate_member_count (適合大伺服器) 或 member_count
            totalMembers: guildData.approximate_member_count || guildData.member_count || 'N/A', 
            totalRoles: rolesData.length,
        };
        
        // ----------------------------------------------------
        // 3. 處理頻道列表 (Channels)
        // ----------------------------------------------------
        const channels = channelsData
            .filter(c => ALLOWED_CHANNEL_TYPES.includes(c.type))
            .map(c => {
                let namePrefix = '';
                if (c.type === 0) namePrefix = '#'; 
                else if (c.type === 2) namePrefix = '🔊'; 
                else if (c.type === 5) namePrefix = '📢'; 
                else if (c.type === 13) namePrefix = '🎤'; 

                return {
                    id: c.id,
                    name: `${namePrefix}${c.name}`, 
                    type: c.type
                };
            });
            
        // ----------------------------------------------------
        // 4. 處理身分組列表 (Roles)
        // ----------------------------------------------------
        const roles = rolesData
            .filter(r => r.name !== '@everyone')
            .map(r => ({ 
                id: r.id, 
                name: r.name 
            }));

        // ----------------------------------------------------
        // 5. 返回最終整合的 JSON 數據
        // ----------------------------------------------------
        return new Response(JSON.stringify({
            message: "數據載入成功",
            ...stats, 
            channels: channels,
            roles: roles,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("獲取初始數據失敗:", error.message);
        return new Response(JSON.stringify({ error: `獲取數據失敗: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
