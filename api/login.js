import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

const USERS_DATABASE = {
    OWNER: [
        { u: "mohuhu", p: "Mofox0609", email: "mohuhu328@gmail.com" }
    ],
    STAFF: [
        { u: "kusanagi_akane", p: "kusanagi_kane", email: "akane@kusanagi.dev" }
    ],
    ADMIN: [
        { u: "2023", p: "chenyichen1106", email: "yic0979s@gmail.com" }
    ]
};

let tempCodes = {}; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const generateEmailTemplate = (username, vCode) => `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; padding: 50px 20px; color: #333;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background-color: #2d3436; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">墨狐酒館 MOFOX</h1>
        </div>
        <div style="padding: 40px 30px;">
            <h2 style="font-size: 20px; margin-top: 0; color: #2d3436;">安全驗證通知</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #636e72;">
                您好 ${username}，系統收到了一個登入請求。請使用下方的驗證碼完成雙重驗證（2FA）：
            </p>
            <div style="background-color: #f9f9f9; border: 1px dashed #dfe6e9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d63031;">${vCode}</span>
            </div>
            <p style="font-size: 14px; color: #b2bec3; line-height: 1.6;">
                ❌ 此驗證碼僅用於登入身分確認。<br>
                ❌ 請勿將此代碼洩漏給他人，工作人員不會主動向您索取。<br>
                ❌ 如果這不是您本人的操作，請立即檢查帳號安全。
            </p>
        </div>
        <div style="background-color: #f4f4f7; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #b2bec3; margin: 0;">&copy; 2026 墨狐酒館 Onion Team. All rights reserved.</p>
        </div>
    </div>
</div>
`;

export default async function handler(req, res) {
    const auth = req.headers.cookie;

    if (req.method === 'GET') {
        if (auth && auth.includes('mofox_auth=true')) {
            try {
                const filePath = join(process.cwd(), 'admin-content.html');
                const fileContent = readFileSync(filePath, 'utf8');
                res.setHeader('Content-Type', 'text/html');
                return res.status(200).send(fileContent);
            } catch (err) {
                return res.status(500).send('讀取後台檔案失敗');
            }
        }
        return res.redirect(302, '/login.html');
    }

    if (req.method === 'POST') {
        const { step, role, username, password, code } = req.body;

        if (step === 'auth') {
            const user = USERS_DATABASE[role]?.find(u => u.u === username && u.p === password);
            
            if (user) {
                const vCode = Math.floor(100000 + Math.random() * 900000).toString();
                tempCodes[username] = vCode;

                try {
                    await transporter.sendMail({
                        from: `"墨狐酒館 系統通知" <${process.env.EMAIL_USER}>`,
                        to: user.email,
                        subject: `【驗證碼】${vCode} - 墨狐酒館後台管理`,
                        text: `您的登入驗證碼為：${vCode}。請勿將此代碼分享給任何人。`,
                        html: generateEmailTemplate(username, vCode)
                    });
                    return res.status(200).json({ success: true, nextStep: '2fa' });
                } catch (e) {
                    return res.status(500).json({ success: false, message: '郵件發送失敗' });
                }
            }
            return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
        }

        if (step === 'verify') {
            if (tempCodes[username] && tempCodes[username] === code) {
                delete tempCodes[username];
                res.setHeader('Set-Cookie', 'mofox_auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600');
                return res.status(200).json({ success: true });
            }
            return res.status(401).json({ success: false, message: '驗證碼錯誤' });
        }
    }
}
