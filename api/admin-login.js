export default function handler(req, res) {
    const htmlContent = process.env.ADMIN_PAGE_HTML;

    if (!htmlContent) {
        return res.status(500).send('ADMIN_PAGE_HTML 環境變數未設定');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlContent);
}
