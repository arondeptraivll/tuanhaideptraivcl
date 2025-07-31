// api/chat-history.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method } = req;
    const { userIP, conversation, action } = req.body || {};

    const DB_URL = process.env.DATABASE_URL;
    
    if (!DB_URL) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        switch (method) {
            case 'GET':
                // Lấy lịch sử chat
                const history = await getChatHistoryFromDB(userIP);
                return res.status(200).json({ conversation: history });

            case 'POST':
                if (action === 'save') {
                    // Lưu lịch sử chat
                    await saveChatHistoryToDB(userIP, conversation);
                    return res.status(200).json({ success: true });
                }
                break;

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Chat History API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Mock database functions
async function getChatHistoryFromDB(userIP) {
    // TODO: Implement real database query
    return [];
}

async function saveChatHistoryToDB(userIP, conversation) {
    // TODO: Implement real database upsert
    return true;
}