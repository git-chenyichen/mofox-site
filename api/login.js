import nodemailer from 'nodemailer';

const USERS_DATABASE = {
    OWNER: [
        { u: "mohuhu", p: "Mofox0609", email: "mohuhu328@gmail.com" }
    ],
    STAFF: [
        { u: "kusanagi_akane", p: "kusanagi_kane", email: "akane@example.com" }
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
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { step, role, username, password, code } = req.body;

    if (step === 'auth') {
        const userList = USERS_DATABASE[role];
        const user = userList?.find(u => u.u === username && u.p === password);

        if (user) {
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            tempCodes[username] = verificationCode;

            try {
                await transporter.sendMail({
                    from: `"墨狐酒館 SSO" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: '您的登入驗證碼',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                            <h2>墨狐酒館 SSO 驗證</h2>
                            <p>您好 ${username}，您的身分驗證碼為：</p>
                            <h1 style="color: #ff8c42;">${verificationCode}</h1>
                            <p>請在網頁輸入此代碼完成登入。</p>
                        </div>
                    `
                });
                return res.status(200).json({ success: true, nextStep: '2fa' });
            } catch (error) {
                return res.status(500).json({ success: false, message: '郵件發送失敗' });
            }
        }
        return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }

    if (step === 'verify') {
        if (tempCodes[username] && tempCodes[username] === code) {
            delete tempCodes[username];
            return res.status(200).json({ success: true });
        }
        return res.status(401).json({ success: false, message: '驗證碼錯誤' });
    }
}
