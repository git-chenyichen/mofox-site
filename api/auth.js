// api/auth.js (Node.js/JavaScript)

const axios = require('axios');
const crypto = require('crypto');


const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; 


const AUTHORIZED_USERS = [
    '1191200148357910538', 
    '1342872004667117620', 
    '1367782120403238923'  
]; 

module.exports = async (req, res) => {
    const { code } = req.query;


    if (!code) {
        const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
        return res.redirect(DISCORD_AUTH_URL);
    }

    try {

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                scope: 'identify'
            }), 
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const accessToken = tokenResponse.data.access_token;


        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userId = userResponse.data.id;
        const username = userResponse.data.username;


        if (AUTHORIZED_USERS.includes(userId)) {



            const sessionToken = crypto.randomBytes(32).toString('hex');
            res.setHeader('Set-Cookie', `auth_token=${sessionToken}; HttpOnly; Secure; Max-Age=3600; Path=/`); 


            return res.redirect('/admin.html'); 
        } else {

            return res.status(403).send(`
                <body style="background-color: #2c2f33; color: white; text-align: center; padding-top: 50px;">
                    <h1>🚫 權限不足 🚫</h1>
                    <p>您好，${username}。您不是授權的館員，無法進入後台。</p>
                    <a href="/staff.html" style="color: #7289DA;">返回</a>
                </body>
            `);
        }

    } catch (error) {
        console.error("Discord 登入錯誤:", error.message);
        return res.status(500).send('登入驗證失敗，請檢查密鑰或重試。');
    }
};
