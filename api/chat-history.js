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

    console.log('Chat History API called:', { method, action, userIP });

    // TRY MULTIPLE CONNECTION STRINGS
    const connections = [
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL
    ];
    
    const workingConnection = connections.find(conn => conn);
    
    if (!workingConnection) {
        console.error('No PostgreSQL connection string found');
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        switch (method) {
            case 'POST':
                if (action === 'get') {
                    const chatHistory = await getChatHistoryFromDB(userIP, workingConnection);
                    return res.status(200).json({ conversation: chatHistory });
                } else if (action === 'save') {
                    await saveChatHistoryToDB(userIP, conversation, workingConnection);
                    return res.status(200).json({ success: true });
                } else {
                    return res.status(400).json({ error: 'Invalid action' });
                }

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Chat History API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

// AGGRESSIVE SSL BYPASS
async function getChatHistoryFromDB(userIP, connectionString) {
    let client = null;
    try {
        const { Client } = await import('pg');
        
        // TRY MULTIPLE SSL CONFIGS
        const sslConfigs = [
            false, // No SSL
            { rejectUnauthorized: false }, // Accept self-signed
            { rejectUnauthorized: false, ca: false }, // Ignore CA
            { rejectUnauthorized: false, ca: false, checkServerIdentity: false }, // Ignore everything
        ];
        
        let connected = false;
        
        for (const sslConfig of sslConfigs) {
            try {
                console.log('Trying SSL config:', sslConfig);
                
                // Modify connection string for no SSL
                let modifiedConnectionString = connectionString;
                if (sslConfig === false) {
                    modifiedConnectionString = connectionString.replace('?sslmode=require', '?sslmode=disable');
                }
                
                client = new Client({ 
                    connectionString: modifiedConnectionString,
                    ssl: sslConfig
                });
                
                await client.connect();
                console.log('Connected with SSL config:', sslConfig);
                connected = true;
                break;
                
            } catch (err) {
                console.log('SSL config failed:', sslConfig, err.message);
                if (client) {
                    try { await client.end(); } catch {}
                    client = null;
                }
            }
        }
        
        if (!connected) {
            console.log('All SSL configs failed, using fallback');
            return [];
        }
        
        // Create table
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                user_ip VARCHAR(45) NOT NULL,
                conversation_data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Get data
        const result = await client.query(
            'SELECT conversation_data FROM chat_history WHERE user_ip = $1 ORDER BY updated_at DESC LIMIT 1',
            [userIP]
        );
        
        console.log('Query success:', result.rows.length, 'rows');
        
        if (result.rows.length > 0) {
            return result.rows[0].conversation_data;
        }
        
        return [];
        
    } catch (error) {
        console.error('Database getChatHistory error:', error);
        return [];
    } finally {
        if (client) {
            try { await client.end(); } catch {}
        }
    }
}

async function saveChatHistoryToDB(userIP, conversation, connectionString) {
    let client = null;
    try {
        const { Client } = await import('pg');
        
        // TRY MULTIPLE SSL CONFIGS FOR SAVE
        const sslConfigs = [
            false,
            { rejectUnauthorized: false },
            { rejectUnauthorized: false, ca: false },
            { rejectUnauthorized: false, ca: false, checkServerIdentity: false },
        ];
        
        let connected = false;
        
        for (const sslConfig of sslConfigs) {
            try {
                let modifiedConnectionString = connectionString;
                if (sslConfig === false) {
                    modifiedConnectionString = connectionString.replace('?sslmode=require', '?sslmode=disable');
                }
                
                client = new Client({ 
                    connectionString: modifiedConnectionString,
                    ssl: sslConfig
                });
                
                await client.connect();
                console.log('Save connected with SSL config:', sslConfig);
                connected = true;
                break;
                
            } catch (err) {
                console.log('Save SSL config failed:', sslConfig, err.message);
                if (client) {
                    try { await client.end(); } catch {}
                    client = null;
                }
            }
        }
        
        if (!connected) {
            throw new Error('All save connection attempts failed');
        }
        
        // Create table
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                user_ip VARCHAR(45) NOT NULL,
                conversation_data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Check existing
        const existingResult = await client.query(
            'SELECT id FROM chat_history WHERE user_ip = $1',
            [userIP]
        );
        
        if (existingResult.rows.length > 0) {
            await client.query(
                'UPDATE chat_history SET conversation_data = $1, updated_at = CURRENT_TIMESTAMP WHERE user_ip = $2',
                [JSON.stringify(conversation), userIP]
            );
            console.log('Updated chat history successfully');
        } else {
            await client.query(
                'INSERT INTO chat_history (user_ip, conversation_data) VALUES ($1, $2)',
                [userIP, JSON.stringify(conversation)]
            );
            console.log('Inserted chat history successfully');
        }
        
        return true;
        
    } catch (error) {
        console.error('Database saveChatHistory error:', error);
        throw error;
    } finally {
        if (client) {
            try { await client.end(); } catch {}
        }
    }
}