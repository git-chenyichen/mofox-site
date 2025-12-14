// api/login.js (Node.js/JavaScript)

const crypto = require('crypto');
const sessionStore = require('../session_store'); 

// ⚠️ 應從環境變數 (process.env) 中讀取密碼
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default-secure-password'; 
// 🚨 建議在生產環境中不要使用 default-secure-password，且使用 HTTPS

module.exports = async (req, res) => {
    
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).send('Method Not Allowed');
    }
    
    let body;
    try {
        body = JSON.parse(req.body);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body.' });
    }

    const inputPassword = body.password;

    if (inputPassword === ADMIN_PASSWORD) {
        
        // 驗證成功，生成 Session Token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        sessionStore.addSession(sessionToken); 

        // 設定 HTTP-only Cookie，用於後續 API 請求
        const cookieOptions = `HttpOnly; Max-Age=3600; Path=/; SameSite=Lax`; 
        // 部署到 HTTPS 時請加上 Secure: 
        // const cookieOptions = `HttpOnly; Secure; Max-Age=3600; Path=/; SameSite=Lax`; 

        res.setHeader('Set-Cookie', `auth_token=${sessionToken}; ${cookieOptions}`); 
        
        return res.status(200).json({ success: true, message: 'Login successful' });
        
    } else {
        // 驗證失敗
        return res.status(401).json({ error: 'Invalid password' });
    }
};
