const USERS_DATABASE = {
    OWNER: [
        { u: "mohuhu", p: "mohuhu328" }
    ],
    STAFF: [
        { u: "staff_lan", p: "lan123" },
        { u: "staff_2023", p: "code2023" },
        { u: "staff_akane", p: "cat555" }
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
