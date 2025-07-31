// api/memory.js - SUPABASE SDK VERSION
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method } = req;
    const { userIP, memory, action } = req.body || {};

    console.log('Memory API called:', { method, action, userIP: userIP?.substring(0, 10) + '...' });

    // Supabase config
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('Supabase config not found');
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        // Import Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        switch (method) {
            case 'POST':
                if (action === 'get') {
                    const userMemories = await getMemoriesFromSupabase(supabase, userIP);
                    return res.status(200).json({ memories: userMemories });
                } else if (action === 'add') {
                    await addMemoryToSupabase(supabase, userIP, memory);
                    return res.status(200).json({ success: true });
                } else if (action === 'clear') {
                    await clearMemoriesFromSupabase(supabase, userIP);
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

// Supabase SDK functions
async function getMemoriesFromSupabase(supabase, userIP) {
    try {
        console.log('Getting memories from Supabase for:', userIP);
        
        const { data, error } = await supabase
            .from('user_memories')
            .select('memory_text, created_at')
            .eq('user_ip', userIP)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase get memories error:', error);
            return [];
        }
        
        console.log('Supabase memories found:', data?.length || 0);
        
        return (data || []).map(row => ({
            id: Date.now() + Math.random(),
            text: row.memory_text,
            date: new Date(row.created_at).toLocaleString('vi-VN'),
            timestamp: new Date(row.created_at).getTime()
        }));
        
    } catch (error) {
        console.error('Get memories error:', error);
        return [];
    }
}

async function addMemoryToSupabase(supabase, userIP, memory) {
    try {
        console.log('Adding memory to Supabase:', memory);
        
        const { data, error } = await supabase
            .from('user_memories')
            .insert([
                {
                    user_ip: userIP,
                    memory_text: memory.text || memory
                }
            ]);
        
        if (error) {
            console.error('Supabase add memory error:', error);
            throw error;
        }
        
        console.log('Memory added successfully to Supabase');
        return true;
        
    } catch (error) {
        console.error('Add memory error:', error);
        throw error;
    }
}

async function clearMemoriesFromSupabase(supabase, userIP) {
    try {
        console.log('Clearing memories from Supabase for:', userIP);
        
        const { data, error } = await supabase
            .from('user_memories')
            .delete()
            .eq('user_ip', userIP);
        
        if (error) {
            console.error('Supabase clear memories error:', error);
            throw error;
        }
        
        console.log('Memories cleared successfully from Supabase');
        return true;
        
    } catch (error) {
        console.error('Clear memories error:', error);
        throw error;
    }
}