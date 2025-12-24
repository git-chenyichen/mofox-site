export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('只接受 POST 請求');
  }

  const { nickname, discord_id, category, title, content } = req.body;
  const webhookUrl = process.env.WEBHOOK;

  if (!webhookUrl) {
    return res.status(500).json({ message: 'Webhook URL not configured' });
  }

  const discordPayload = {
    embeds: [{
      title: `新回饋：${title}`,
      color: 16753730, // 橙色
      fields: [
        { name: "暱稱", value: nickname, inline: true },
        { name: "Discord ID", value: discord_id, inline: true },
        { name: "類別", value: category, inline: true },
        { name: "內容", value: content }
      ],
      footer: { text: "來自墨狐酒館官網" },
      timestamp: new Date()
    }]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });
    return res.status(200).json({ message: 'Success' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send to Discord' });
  }
}
