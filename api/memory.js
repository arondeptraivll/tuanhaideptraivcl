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
    const POSTGRES_URL = process.env.POSTGRES_URL;
    
    if (!POSTGRES_URL) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        switch (method) {
            case 'GET':
                // Lấy tất cả memories của user
                const memories = await getMemoriesFromDB(userIP, POSTGRES_URL);
                return res.status(200).json({ memories });

            case 'POST':
                if (action === 'get') {
                    // Lấy memories
                    const userMemories = await getMemoriesFromDB(userIP, POSTGRES_URL);
                    return res.status(200).json({ memories: userMemories });
                } else if (action === 'add') {
                    // Thêm memory mới
                    await addMemoryToDB(userIP, memory, POSTGRES_URL);
                    return res.status(200).json({ success: true });
                } else if (action === 'clear') {
                    // Xóa tất cả memories
                    await clearMemoriesFromDB(userIP, POSTGRES_URL);
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

// PostgreSQL Database functions
async function getMemoriesFromDB(userIP, connectionString) {
    try {
        // Import pg dynamically
        const { Client } = await import('pg');
        const client = new Client({ connectionString });
        
        await client.connect();
        
        // Tạo table nếu chưa tồn tại
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_memories (
                id SERIAL PRIMARY KEY,
                user_ip VARCHAR(45) NOT NULL,
                memory_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Lấy memories của user
        const result = await client.query(
            'SELECT memory_text, created_at FROM user_memories WHERE user_ip = $1 ORDER BY created_at DESC',
            [userIP]
        );
        
        await client.end();
        
        // Format memories
        return result.rows.map(row => ({
            id: Date.now() + Math.random(),
            text: row.memory_text,
            date: new Date(row.created_at).toLocaleString('vi-VN'),
            timestamp: new Date(row.created_at).getTime()
        }));
        
    } catch (error) {
        console.error('Database error:', error);
        return [];
    }
}

async function addMemoryToDB(userIP, memory, connectionString) {
    try {
        const { Client } = await import('pg');
        const client = new Client({ connectionString });
        
        await client.connect();
        
        // Tạo table nếu chưa tồn tại
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_memories (
                id SERIAL PRIMARY KEY,
                user_ip VARCHAR(45) NOT NULL,
                memory_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Thêm memory mới
        await client.query(
            'INSERT INTO user_memories (user_ip, memory_text) VALUES ($1, $2)',
            [userIP, memory.text || memory]
        );
        
        await client.end();
        return true;
        
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

async function clearMemoriesFromDB(userIP, connectionString) {
    try {
        const { Client } = await import('pg');
        const client = new Client({ connectionString });
        
        await client.connect();
        
        // Xóa tất cả memories của user
        await client.query(
            'DELETE FROM user_memories WHERE user_ip = $1',
            [userIP]
        );
        
        await client.end();
        return true;
        
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}