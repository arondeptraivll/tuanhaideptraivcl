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

    // Database connection info
    const POSTGRES_URL = process.env.POSTGRES_URL;
    
    if (!POSTGRES_URL) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        switch (method) {
            case 'GET':
                // Lấy lịch sử chat
                const history = await getChatHistoryFromDB(userIP, POSTGRES_URL);
                return res.status(200).json({ conversation: history });

            case 'POST':
                if (action === 'get') {
                    // Lấy lịch sử chat
                    const chatHistory = await getChatHistoryFromDB(userIP, POSTGRES_URL);
                    return res.status(200).json({ conversation: chatHistory });
                } else if (action === 'save') {
                    // Lưu lịch sử chat
                    await saveChatHistoryToDB(userIP, conversation, POSTGRES_URL);
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

// PostgreSQL Database functions
async function getChatHistoryFromDB(userIP, connectionString) {
    try {
        const { Client } = await import('pg');
        const client = new Client({ connectionString });
        
        await client.connect();
        
        // Tạo table nếu chưa tồn tại
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                user_ip VARCHAR(45) NOT NULL,
                conversation_data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Lấy chat history của user
        const result = await client.query(
            'SELECT conversation_data FROM chat_history WHERE user_ip = $1 ORDER BY updated_at DESC LIMIT 1',
            [userIP]
        );
        
        await client.end();
        
        if (result.rows.length > 0) {
            return result.rows[0].conversation_data;
        }
        
        return [];
        
    } catch (error) {
        console.error('Database error:', error);
        return [];
    }
}

async function saveChatHistoryToDB(userIP, conversation, connectionString) {
    try {
        const { Client } = await import('pg');
        const client = new Client({ connectionString });
        
        await client.connect();
        
        // Tạo table nếu chưa tồn tại
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                user_ip VARCHAR(45) NOT NULL,
                conversation_data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Kiểm tra xem user đã có chat history chưa
        const existingResult = await client.query(
            'SELECT id FROM chat_history WHERE user_ip = $1',
            [userIP]
        );
        
        if (existingResult.rows.length > 0) {
            // Update existing
            await client.query(
                'UPDATE chat_history SET conversation_data = $1, updated_at = CURRENT_TIMESTAMP WHERE user_ip = $2',
                [JSON.stringify(conversation), userIP]
            );
        } else {
            // Insert new
            await client.query(
                'INSERT INTO chat_history (user_ip, conversation_data) VALUES ($1, $2)',
                [userIP, JSON.stringify(conversation)]
            );
        }
        
        await client.end();
        return true;
        
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}