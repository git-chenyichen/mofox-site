export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { nickname, discord_id, category, title, content } = req.body;
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1453362268887711778/F6Jeyc1Ne4WYdA6KcNbK62tKVqFU_HN3RqZEQuLhgnX4BKHMOY7Yu_LDFQ_ZEq8PkLaw";

    const time = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    const discordPayload = {
        embeds: [{
            title: `新回饋通知：${title}`,
            description: "來自墨狐酒館官網的旅客投遞。",
            color: 0xff8c42,
            fields: [
                { name: "旅客暱稱", value: `\`${nickname}\``, inline: true },
                { name: "Discord 使用者名稱", value: `\`${discord_id}\``, inline: true },
                { name: "分類", value: `**${category}**`, inline: true },
                { name: "回饋內容", value: `> ${content}` }
            ],
            footer: { 
                text: `系統發送時間：${time}`
            },
            thumbnail: {
                url: "https://www.mofox.xyz/images/mofox-logo.jpg" 
            }
        }]
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        });
        return res.status(200).json({ message: 'OK' });
    } catch (error) {
        return res.status(500).json({ message: 'Error' });
    }
}
