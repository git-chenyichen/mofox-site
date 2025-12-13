// 獲取伺服器統計數據
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BASE_URL = 'https://discord.com/api/v10';

export default async function handler(request) {
    if (!BOT_TOKEN || !GUILD_ID) {
        return new Response(JSON.stringify({ error: "配置錯誤：BOT_TOKEN 或 GUILD_ID 缺失。" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const headers = { "Authorization": `Bot ${BOT_TOKEN}` };
    const DISCORD_API_URL = `${BASE_URL}/guilds/${GUILD_ID}?with_counts=true`; 

    try {
        const response = await fetch(DISCORD_API_URL, { headers });
        const guildData = await response.json();

        if (!response.ok) {
            // 嘗試獲取身分組數量
            const rolesResponse = await fetch(`${BASE_URL}/guilds/${GUILD_ID}/roles`, { headers });
            const rolesData = rolesResponse.ok ? await rolesResponse.json() : [];
            const totalRoles = rolesData.length;
            
            // 即使無法獲取詳細 Guild 數據，嘗試返回部分信息
            return new Response(JSON.stringify({
                totalMembers: guildData.approximate_member_count || 'N/A',
                totalRoles: totalRoles || 'N/A',
            }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 為了獲取精確的身分組數量，我們需要發送第二次請求（或者您在前端顯示 'N/A'）
        // 為了簡潔和確保 totalRoles 準確，我們假設發送一個額外的請求來獲取角色數量：
        const rolesResponse = await fetch(`${BASE_URL}/guilds/${GUILD_ID}/roles`, { headers });
        const rolesData = await rolesResponse.json();
        const totalRoles = rolesData.length;

        // 整理返回的統計數據
        const stats = {
            totalMembers: guildData.approximate_member_count || guildData.member_count || '0',
            totalRoles: totalRoles || '0',
            message: "統計數據載入成功",
        };

        return new Response(JSON.stringify(stats), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: `獲取統計數據失敗: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
