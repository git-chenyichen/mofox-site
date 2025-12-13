// api/admin-check.js

const fs = require('fs');
const path = require('path');

// [ ... getCookie 函數和 身份驗證檢查代碼不變 ... ]

// 實際的 Serverless Function 處理邏輯
module.exports = async (req, res) => {
    
    // [ ... 階段 1: 身份驗證檢查代碼不變 ... ]
    
    // -----------------------------------------------------------------
    // 階段 2: 驗證通過，發送頁面內容
    // -----------------------------------------------------------------
    
    try {
        // 2.1. 定位並讀取受保護的 HTML 模板
        
        // 🚨 修正後的檔案路徑讀取方式 🚨
        // Serverless 函數在 /api 資料夾內。
        // 我們需要退回到上一層（根目錄），才能找到 admin-content.html。
        
        const rootDir = path.join(__dirname, '..'); // 移到上一層 (專案根目錄)
        const filePath = path.join(rootDir, 'admin-content.html');
        
        const adminHtmlContent = fs.readFileSync(filePath, 'utf8'); // 嘗試讀取檔案
        // -----------------------------------------------------------

        // 2.2. 發送成功響應
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(adminHtmlContent);

    } catch (error) {
        // 現在我們能更好地捕捉到檔案未找到的錯誤
        console.error("讀取後台內容檔案失敗或檔案未找到:", error);
        res.status(500).send('後台系統錯誤：無法載入管理介面。請檢查 admin-content.html 檔案路徑。');
    }
};
