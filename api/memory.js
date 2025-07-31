// api/memory.js
export default async function handler(req, res) {
    // Cho phép CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method } = req;
    const { userIP, memory, action } = req.body || {};

    // Database connection info
    const DB_URL = process.env.DATABASE_URL;
    
    if (!DB_URL) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        // Đây là mock implementation - bạn thay bằng database thật
        // Ví dụ với Supabase hoặc MongoDB
        
        switch (method) {
            case 'GET':
                // Lấy tất cả memories của user
                const memories = await getMemoriesFromDB(userIP);
                return res.status(200).json({ memories });

            case 'POST':
                if (action === 'add') {
                    // Thêm memory mới
                    await addMemoryToDB(userIP, memory);
                    return res.status(200).json({ success: true });
                } else if (action === 'clear') {
                    // Xóa tất cả memories
                    await clearMemoriesFromDB(userIP);
                    return res.status(200).json({ success: true });
                }
                break;

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Memory API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Mock database functions - THAY BẰNG DATABASE THẬT
async function getMemoriesFromDB(userIP) {
    // TODO: Implement real database query
    // return await db.memories.findMany({ where: { userIP } });
    return [];
}

async function addMemoryToDB(userIP, memory) {
    // TODO: Implement real database insert
    // return await db.memories.create({ data: { userIP, memory, createdAt: new Date() } });
    return true;
}

async function clearMemoriesFromDB(userIP) {
    // TODO: Implement real database delete
    // return await db.memories.deleteMany({ where: { userIP } });
    return true;
}