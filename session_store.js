// session_store.js (Node.js/JavaScript)

const validSessions = new Set(); 

// 增加一個新的有效 Session Token
function addSession(token) {
    validSessions.add(token);
}

// 檢查 Session Token 是否有效
function isSessionValid(token) {
    if (!token) return false;
    return validSessions.has(token);
}

// 移除 Session Token (可選的登出用)
function removeSession(token) {
    validSessions.delete(token);
}

module.exports = {
    addSession,
    isSessionValid,
    removeSession
};
