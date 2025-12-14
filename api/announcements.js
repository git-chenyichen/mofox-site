// api/announcements.js
const fs = require('fs');
const path = require('path');
const sessionStore = require('../session_store'); 

const DATA_FILE_PATH = path.join(path.dirname(__dirname), 'announcements.json');

// 輔助函數：讀取 Cookie
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

// 讀取 JSON 數據
function readAnnouncements() {
    try {
        const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        console.error("Error reading or parsing announcements.json:", error);
        return [];
    }
}

// 寫入 JSON 數據
function writeAnnouncements(data) {
    try {
        if (!Array.isArray(data)) data = []; 
        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync(DATA_FILE_PATH, jsonString, 'utf8');
        return true;
    } catch (error) {
        console.error("Error writing to announcements.json:", error);
        return false;
    }
}

// 檢查管理員 Cookie 權限 (檢查 Session Token)
function isAdminAuthorized(req) {
    const authToken = getCookie(req.headers.cookie, 'auth_token');
    if (!authToken) return false;
    
    // 檢查 Session Token 是否在有效儲存中
    return sessionStore.isSessionValid(authToken); 
}


module.exports = async (req, res) => {
    // 讀取請求 (GET) 對所有公開
    if (req.method === 'GET') {
        const announcements = readAnnouncements();
        return res.status(200).json(announcements);
    }
    
    // 寫入/修改/刪除請求需要身份驗證
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        if (!isAdminAuthorized(req)) {
            // 返回 401 讓前端知道需要重新登入
            return res.status(401).json({ error: 'Unauthorized: Admin privileges required. Please login again.' });
        }
    }

    let announcements = readAnnouncements();
    const { id } = req.query; 
    let body;

    try {
        if (req.method === 'POST' || req.method === 'PUT') {
            body = JSON.parse(req.body);
        }
    } catch (e) {
        if (req.method !== 'DELETE') {
             return res.status(400).json({ error: 'Invalid JSON body.' });
        }
    }

    switch (req.method) {
        case 'POST': // 新增
            const nextId = announcements.reduce((max, item) => Math.max(max, item.id), 0) + 1;
            
            const newAnnouncement = {
                id: nextId,
                title: (body && body.title) || `新公告 (ID: ${nextId})`,
                content: (body && body.content) || "請在此編輯內容。"
            };
            announcements.push(newAnnouncement);
            
            if (writeAnnouncements(announcements)) {
                return res.status(201).json(newAnnouncement);
            }
            return res.status(500).json({ error: 'Failed to save data.' });

        case 'PUT': // 修改
            if (!id) return res.status(400).json({ error: 'Missing ID for update.' });
            const index = announcements.findIndex(item => item.id == id);

            if (index !== -1) {
                announcements[index].title = (body && body.title) || announcements[index].title;
                announcements[index].content = (body && body.content) || announcements[index].content;
                
                if (writeAnnouncements(announcements)) {
                    return res.status(200).json(announcements[index]);
                }
            }
            return res.status(404).json({ error: 'Announcement not found.' });

        case 'DELETE': // 刪除
            if (!id) return res.status(400).json({ error: 'Missing ID for delete.' });
            
            const initialLength = announcements.length;
            announcements = announcements.filter(item => item.id != id);

            if (announcements.length < initialLength) {
                if (writeAnnouncements(announcements)) {
                    return res.status(200).json({ success: true, message: 'Deleted successfully.' });
                }
            }
            return res.status(404).json({ error: 'Announcement not found.' });

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};
