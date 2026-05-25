export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { nickname, discord_id, category, title, content } = req.body;

    if (!nickname || !content || !title) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    const discordPayload = {
        embeds: [{
            title: `新回饋通知：${title}`,
            description: "來自墨狐酒館官網的旅客投遞。",
            color: 0xff8c42,
            fields: [
                { name: "旅客暱稱", value: `\`${nickname}\``, inline: true },
                { name: "Discord 使用者名稱", value: `\`${discord_id || '未提供'}\``, inline: true },
                { name: "分類", value: `**${category || '一般'}**`, inline: true },
                { name: "回饋內容", value: `> ${content}` }
            ],
            footer: { text: `系統發送時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}` },
            thumbnail: { url: "https://www.mofox.xyz/images/mofox-logo.jpg" }
        }]
    };

    try {
        const response = await fetch(process.env.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        });

        if (!response.ok) throw new Error();
        return res.status(200).json({ message: 'OK' });
    } catch (error) {
        return res.status(500).json({ message: 'Error' });
    }
}
