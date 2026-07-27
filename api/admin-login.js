import { checkUserHasRole } from './role.js'; 

export default async function handler(req, res) {
    const authCookie = req.headers.cookie || '';
    const isAuth = authCookie.includes('mofox_auth=true'); 
    
    const idMatch = authCookie.match(/mofox_discord_id=([^;]+)/);
    const userDiscordId = idMatch ? idMatch[1] : null;

    if (!isAuth || !userDiscordId) {
        return res.redirect(302, '/login.html'); 
    }

    const ALLOWED_ROLE_IDS = ["1519393328679096401", "1519394123260498183"];
    const hasPermission = await checkUserHasRole(userDiscordId, ALLOWED_ROLE_IDS);

    if (!hasPermission) {
        return res.status(403).send('權限不足，無法造訪此頁面');
    }

    const htmlContent = process.env.ADMIN_PAGE_HTML;
    
    if (!htmlContent) {
        return res.status(500).send('ADMIN_PAGE_HTML 環境變數未設定');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlContent);
}
