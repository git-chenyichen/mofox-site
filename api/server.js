const axios = require('axios');
const { parse } = require('cookie');

module.exports = async (req, res) => {
    const path = req.url.split('?')[0];

    if (path === '/api/auth/callback' || path === '/api/auth/google') {
        const { code } = req.query;
        if (!code) return res.status(400).send('缺少驗證碼');

        try {
            const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: 'https://mofox.xyz/api/auth/google', 
                grant_type: 'authorization_code'
            });

            const { access_token } = tokenRes.data;
            const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const email = userRes.data.email;
            const whitelist = ['yic0979s@gmail.com']; 

            if (whitelist.includes(email)) {
                res.setHeader('Set-Cookie', 'auth_token=mofox_verified_admin; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400');
                res.writeHead(302, { Location: '/admin.html' });
                res.end();
            } else {
                res.status(403).send(`存取拒絕：${email} 不在白名單內。`);
            }
        } catch (e) {
            res.status(500).send('驗證出錯');
        }
    } 
    
    else if (path === '/api/logout') {
        res.setHeader('Set-Cookie', 'auth_token=; Path=/; Max-Age=0');
        res.writeHead(302, { Location: '/google.html' });
        res.end();
    }
    
    else {
        res.status(404).send('API 路徑不存在');
    }
};
