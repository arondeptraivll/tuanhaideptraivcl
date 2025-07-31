// api/memory.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method } = req;
    const { userIP, memory, action } = req.body || {};

    // TRY MULTIPLE CONNECTION STRINGS
    const connections = [
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL
    ];
    
    const workingConnection = connections.find(conn => conn);
    
    if (!workingConnection) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        switch (method) {
            case 'POST':
                if (action === 'get') {
                    const userMemories = await getMemoriesFromDB(userIP, workingConnection);
                    return res.status(200).json({ memories: userMemories });
                } else if (action === 'add') {
                    await addMemoryToDB(userIP, memory, workingConnection);
                    return res.status(200).json({ success: true });
                } else if (action === 'clear') {
                    await clearMemoriesFromDB(userIP, workingConnection);
                    return res.status(200).json({ success: true });
                } else {
                    return res.status(400).json({ error: 'Invalid action' });
                }

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Memory API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

// AGGRESSIVE SSL BYPASS FOR MEMORY
async function getMemoriesFromDB(userIP, connectionString) {
    let client = null;
    try {
        const { Client } = await import('pg');
        
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
                console.log('Memory connected with SSL config:', sslConfig);
                connected = true;
                break;
                
            } catch (err) {
                if (client) {
                    try { await client.end(); } catch {}
                    client = null;
                }
            }
        }
        
        if (!connected) {
            return [];
        }
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_memories (
                id SERIAL PRIMARY KEY,
                user_ip VARCHAR(45) NOT NULL,
                memory_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        const result = await client.query(
            'SELECT memory_text, created_at FROM user_memories WHERE user_ip = $1 ORDER BY created_at DESC',
            [userIP]
        );
        
        return result.rows.map(row => ({
            id: Date.now() + Math.random(),
            text: row.memory_text,
            date: new Date(row.created_at).toLocaleString('vi-VN'),
            timestamp: new Date(row.created_at).getTime()
        }));
        
    } catch (error) {
        console.error('Database getMemories error:', error);
        return [];
    } finally {
        if (client) {
            try { await client.end(); } catch {}
        }
    }
}

async function addMemoryToDB(userIP, memory, connectionString) {
    let client = null;
    try {
        const { Client } = await import('pg');
        
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
                connected = true;
                break;
                
            } catch (err) {
                if (client) {
                    try { await client.end(); } catch {}
                    client = null;
                }
            }
        }
        
        if (!connected) {
            throw new Error('All connection attempts failed');
        }
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_memories (
                id SERIAL PRIMARY KEY,
                user_ip VARCHAR(45) NOT NULL,
                memory_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(
            'INSERT INTO user_memories (user_ip, memory_text) VALUES ($1, $2)',
            [userIP, memory.text || memory]
        );
        
        return true;
        
    } catch (error) {
        console.error('Database addMemory error:', error);
        throw error;
    } finally {
        if (client) {
            try { await client.end(); } catch {}
        }
    }
}

async function clearMemoriesFromDB(userIP, connectionString) {
    let client = null;
    try {
        const { Client } = await import('pg');
        
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
                connected = true;
                break;
                
            } catch (err) {
                if (client) {
                    try { await client.end(); } catch {}
                    client = null;
                }
            }
        }
        
        if (!connected) {
            throw new Error('All connection attempts failed');
        }
        
        await client.query(
            'DELETE FROM user_memories WHERE user_ip = $1',
            [userIP]
        );
        
        return true;
        
    } catch (error) {
        console.error('Database clearMemories error:', error);
        throw error;
    } finally {
        if (client) {
            try { await client.end(); } catch {}
        }
    }
}