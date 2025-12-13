// Serverless 函數的入口點

// 從環境變數中讀取配置
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

/**
 * 處理獲取身分組列表的請求。
 * @param {Request} request - 傳入的 HTTP 請求對象。
 * @returns {Response} - HTTP 響應對象。
 */
export default async function handler(request) {
    // 檢查環境變數是否已設置
    if (!BOT_TOKEN || !GUILD_ID) {
        return new Response(JSON.stringify({ error: "後端配置錯誤：DISCORD_BOT_TOKEN 或 DISCORD_GUILD_ID 環境變數缺失。" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const DISCORD_API_URL = `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`;
    const headers = {
        "Authorization": `Bot ${BOT_TOKEN}`
    };

    try {
        const response = await fetch(DISCORD_API_URL, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Discord API 錯誤 (狀態碼 ${response.status})：`, errorText);
            throw new Error(`Discord API 錯誤：請檢查 Bot 權限 (Get Roles)。`);
        }

        const rolesData = await response.json();

        // 過濾並格式化身分組數據 (排除 @everyone 角色)
        const roles = rolesData
            .filter(r => r.name !== '@everyone')
            .map(r => ({ 
                id: r.id, 
                name: r.name 
            }));

        return new Response(JSON.stringify({ roles }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: `獲取身分組列表失敗: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
