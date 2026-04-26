export default function handler(req, res) {
    res.setHeader('Set-Cookie', 'mofox_auth= ; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    
    return res.redirect(302, '/login.html');
}
