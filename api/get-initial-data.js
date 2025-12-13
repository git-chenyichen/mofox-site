// 統合 GET 請求：獲取統計、身分組、頻道列表
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BASE_URL = 'https://discord.com/api/v10';
const ALLOWED_CHANNEL_TYPES = [0, 2, 5, 13]; 

export default async function handler(request) {
    if (!BOT_TOKEN || !GUILD_ID) {
        return new Response(JSON.stringify({ error: "配置錯誤：BOT_TOKEN 或 GUILD_ID 缺失。" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const headers = { "Authorization": `Bot ${BOT_TOKEN}` };

    try {
        const [guildResponse, channelsResponse, rolesResponse] = await Promise.all([
            fetch(`${BASE_URL}/guilds/${GUILD_ID}?with_counts=true`, { headers }), 
            fetch(`${BASE_URL}/guilds/${GUILD_ID}/channels`, { headers }), 
            fetch(`${BASE_URL}/guilds/${GUILD_ID}/roles`, { headers }), 
        ]);

        if (!guildResponse.ok || !channelsResponse.ok || !rolesResponse.ok) {
            let errorDetails = '';
            if (!guildResponse.ok) errorDetails += `Guild Status: ${guildResponse.status}`;
            // 這裡可以選擇性讀取 response.text() 來獲取更詳細的錯誤信息
            throw new Error(`Discord API 請求失敗，請檢查 Bot 權限。狀態碼: [${errorDetails}]`);
        }

        const guildData = await guildResponse.json();
        const channelsData = await channelsResponse.json();
        const rolesData = await rolesResponse.json();

        // 處理數據
        const stats = { totalMembers: guildData.approximate_member_count || 'N/A', totalRoles: rolesData.length };
        const channels = channelsData
            .filter(c => ALLOWED_CHANNEL_TYPES.includes(c.type))
            .map(c => {
                let namePrefix = ''; // 添加 emoji 前綴
                if (c.type === 0) namePrefix = '#'; else if (c.type === 2) namePrefix = '🔊'; else if (c.type === 5) namePrefix = '📢'; else if (c.type === 13) namePrefix = '🎤';
                return { id: c.id, name: `${namePrefix}${c.name}`, type: c.type };
            });
        const roles = rolesData
            .filter(r => r.name !== '@everyone')
            .map(r => ({ id: r.id, name: r.name }));

        return new Response(JSON.stringify({ message: "數據載入成功", ...stats, channels: channels, roles: roles }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: `獲取數據失敗: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
