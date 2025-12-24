export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('只接受 POST 請求');
  }


// api/admin-check.js

const fs = require('fs');
const path = require('path');

/**
 * 從請求標頭中解析特定名稱的 Cookie 值
 * @param {string} cookieString - 請求標頭中的 Cookie 字串
 * @param {string} name - 要查找的 Cookie 名稱
 * @returns {string | null} Cookie 的值或 null
 */

function getCookie(cookieString, name) {
if (!cookieString) return null;
const cookies = cookieString.split(';').map(c => c.trim());
for (const cookie of cookies) {
if (cookie.startsWith(name + '=')) {
    // 返回 Cookie 的值 (排除名稱和等號)
    // 修正：刪除了這裡多餘的右括號 ')'
    return cookie.substring(name.length + 1);
}
}
return null;
}

// 實際的 Serverless Function 處理邏輯

module.exports = async (req, res) => {

    // -----------------------------------------------------------------
    // 階段 1: 身份驗證檢查
    // -----------------------------------------------------------------


    // 1.1. 讀取瀏覽器傳來的 'auth_token' Cookie

    const authToken = getCookie(req.headers.cookie, 'auth_token');

    // 1.2. 執行驗證

    if (!authToken) {
        // ❌ 驗證失敗：沒有找到登入憑證 (authToken)

        console.log("未經授權訪問 /admin.html，重定向至登入頁面。");

        // 設置一個短暫的提示訊息 Cookie（可選）

        res.setHeader('Set-Cookie', 'auth_error=請先登入以訪問後台; Max-Age=5; Path=/');

        // 導向回登入頁面

        return res.redirect('/staff.html');
    }

    // -----------------------------------------------------------------
    // 階段 2: 驗證通過，發送頁面內容
    // -----------------------------------------------------------------

    try {
        // 2.1. 定位並讀取受保護的 HTML 模板
    

        // 🚨 修正：移除下方重複的 const rootDir = ... 宣告
        // Serverless Function 在 /api 資料夾內，需要退回到上一層 (..) 才能找到根目錄的檔案。
        const rootDir = path.join(__dirname, '..'); // 移到上一層 (專案根目錄)
    
        // ❌ 錯誤程式碼：重複宣告導致問題
        // const rootDir = path.join(__dirname, '..'); 
        
        const filePath = path.join(rootDir, 'admin-content.html');

        // 同步讀取檔案內容

        const adminHtmlContent = fs.readFileSync(filePath, 'utf8');

        // 2.2. 發送成功響應

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(adminHtmlContent);

    } catch (error) {
        // 捕捉檔案讀取錯誤，例如檔案不存在 (ENOENT)

        console.error("讀取後台內容檔案失敗或檔案未找到:", error);
        res.status(500).send('後台系統錯誤：無法載入管理介面。請檢查 admin-content.html 檔案是否存在於專案根目錄。');
    }
};

