const fs = require('fs');
const path = require('path');

function getCookie(cookieString, name) {
    if (!cookieString) return null;
    const cookies = cookieString.split(';').map(c => c.trim());
    for (const cookie of cookies) {
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}

module.exports = async (req, res) => {
    const authToken = getCookie(req.headers.cookie, 'auth_token');

    if (!authToken) {
        res.setHeader('Set-Cookie', 'auth_error=請先登入以訪問後台; Max-Age=5; Path=/');
        return res.redirect('/staff.html');
    }

    try {
        const rootDir = path.join(__dirname, '..');
        const filePath = path.join(rootDir, 'admin-content.html');
        const adminHtmlContent = fs.readFileSync(filePath, 'utf8');

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(adminHtmlContent);
    } catch (error) {
        console.error(error);
        res.status(500).send('後台系統錯誤：無法載入管理介面。');
    }
};
