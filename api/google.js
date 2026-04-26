const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());

const CONFIG = {
    CLIENT_ID: '636049819828-387qf348td3il1ou6e1eg49s4imcj9p7.apps.googleusercontent.com',
    CLIENT_SECRET: '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',
    REDIRECT_URI: 'https://mofox.xyz/api/auth/callback',
    ADMIN_WHITELIST: [
        'yic0979s@gmail.com', 
        'staff1@gmail.com',
        'staff2@gmail.com'
    ],
    JWT_SECRET: 'mofox-secret-888' 
};

app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('❌ 缺少驗證碼');
    }

    try {
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: CONFIG.CLIENT_ID,
            client_secret: CONFIG.CLIENT_SECRET,
            redirect_uri: CONFIG.REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenRes.data;

        const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userEmail = userRes.data.email;

        if (CONFIG.ADMIN_WHITELIST.includes(userEmail)) {
            res.cookie('auth_token', 'mofox_verified_admin', { 
                httpOnly: true, 
                secure: true, 
                maxAge: 24 * 60 * 60 * 1000 
            });
            
            res.redirect('/admin.html'); 
        } else {
            res.status(403).send(`存取拒絕：${userEmail} 不在館員白名單內。`);
        }

    } catch (error) {
        console.error('Auth Error:', error.response ? error.response.data : error.message);
        res.status(500).send('驗證過程出錯，請稍後再試。');
    }
});

app.get('/api/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/staff.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`墨狐後端運行在 http://localhost:${PORT}`));
