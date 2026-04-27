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
                        from: `"墨狐酒館 SSO" <${process.env.EMAIL_USER}>`,
                        to: user.email,
                        subject: '您的登入驗證碼',
                        text: `驗證碼：${vCode}`
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
