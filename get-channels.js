// Serverless 函數的入口點

// 從環境變數中讀取配置
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// 我們希望在下拉選單中看到的頻道類型 (參考 Discord API)
const ALLOWED_CHANNEL_TYPES = [
    0, // 文字頻道 (text)
    2, // 語音頻道 (voice)
    5, // 公告頻道 (news)
    13, // 舞台頻道 (stage)
];

/**
 * 處理獲取頻道列表的請求。
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

    const DISCORD_API_URL = `https://discord.com/api/v10/guilds/${GUILD_ID}/channels`;
    const headers = {
        "Authorization": `Bot ${BOT_TOKEN}`
    };

    try {
        const response = await fetch(DISCORD_API_URL, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Discord API 錯誤 (狀態碼 ${response.status})：`, errorText);
            throw new Error(`Discord API 錯誤：請檢查 Bot 權限 (Get Channels)。`);
        }

        const channelsData = await response.json();

        // 過濾並格式化頻道數據
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
                    name: `${namePrefix}${c.name}`, // 加上前綴符號以提高可讀性
                    type: c.type
                };
            });

        return new Response(JSON.stringify({ channels }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: `獲取頻道列表失敗: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
