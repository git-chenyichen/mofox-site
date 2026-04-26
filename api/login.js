const USERS_DATABASE = {
    OWNER: [
        { u: "mohuhu", p: "mohuhu328" }
    ],
    STAFF: [
        { u: "lan", p: "l.c.y.x" },
        { u: "kusanagi", p: "kusanagi_akane" },
    ],
    ADMIN: [
        { u: "2023", p: "chenyichen1106" }
    ]
};

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { role, username, password } = req.body;
    const userList = USERS_DATABASE[role];

    if (!userList) {
        return res.status(400).json({ success: false, message: 'Invalid Role' });
    }

    const user = userList.find(user => user.u === username && user.p === password);

    if (user) {
        return res.status(200).json({ success: true, message: 'Success' });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
}
