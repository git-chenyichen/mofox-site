export default function handler(req, res) {
    const clearSettings = [
        'mofox_auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'auth_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ];

    res.setHeader('Set-Cookie', clearSettings);
    
    return res.status(200).send(`
        <script>
            localStorage.clear();
            window.location.href = 'https://mofox.xyz/staff.html';
        </script>
    `);
}
