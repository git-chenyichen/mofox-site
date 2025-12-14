// api/verify.js - Vercel Serverless Function

// 🚨 這是 Node.js 程式碼，不是瀏覽器 JavaScript！

/**
 * 處理密碼驗證的 Function
 * * 1. 從 Vercel 環境變數中安全地讀取 ADMIN_SECRET。
 * 2. 比對前端傳入的密碼。
 * 3. 返回成功或失敗。
 */
export default async (req, res) => {
  // 設置 Content-Type 標頭
  res.setHeader('Content-Type', 'application/json');

  // 確保是 POST 請求
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: '只允許 POST 請求' });
    return;
  }

  // 從 Vercel 環境變數讀取密碼
  // 🚨 請在 Vercel 儀表板設置一個名為 ADMIN_SECRET 的環境變數！
  const SECRET_PASSWORD = process.env.ADMIN_SECRET;

  if (!SECRET_PASSWORD) {
    // 這是開發環境常見的錯誤，如果沒有設定環境變數
    res.status(500).json({ success: false, message: '伺服器密碼未配置。' });
    return;
  }

  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ success: false, message: '請提供密碼。' });
      return;
    }

    // 進行密碼比對 (使用 === 以確保型別和值都相同)
    if (password === SECRET_PASSWORD) {
      // 成功：不返回任何敏感信息
      res.status(200).json({ success: true, message: '驗證成功' });
    } else {
      // 失敗：返回錯誤訊息
      res.status(401).json({ success: false, message: '密碼錯誤' });
    }
  } catch (error) {
    console.error('Function 處理錯誤:', error);
    res.status(500).json({ success: false, message: '內部伺服器錯誤' });
  }
};
