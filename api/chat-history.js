// api/chat-history.js - SUPABASE SDK VERSION
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
                    const chatHistory = await getChatHistoryFromSupabase(supabase, userIP);
                    return res.status(200).json({ conversation: chatHistory });
                } else if (action === 'save') {
                    await saveChatHistoryToSupabase(supabase, userIP, conversation);
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

// Supabase SDK functions for chat history
async function getChatHistoryFromSupabase(supabase, userIP) {
    try {
        console.log('Getting chat history from Supabase for:', userIP);
        
        const { data, error } = await supabase
            .from('chat_history')
            .select('conversation_data')
            .eq('user_ip', userIP)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // No data found
                console.log('No chat history found');
                return [];
            }
            console.error('Supabase get chat history error:', error);
            return [];
        }
        
        console.log('Supabase chat history found');
        return data?.conversation_data || [];
        
    } catch (error) {
        console.error('Get chat history error:', error);
        return [];
    }
}

async function saveChatHistoryToSupabase(supabase, userIP, conversation) {
    try {
        console.log('Saving chat history to Supabase for:', userIP, 'Messages:', conversation?.length);
        
        // Upsert (insert or update)
        const { data, error } = await supabase
            .from('chat_history')
            .upsert([
                {
                    user_ip: userIP,
                    conversation_data: conversation,
                    updated_at: new Date().toISOString()
                }
            ], {
                onConflict: 'user_ip'
            });
        
        if (error) {
            console.error('Supabase save chat history error:', error);
            throw error;
        }
        
        console.log('Chat history saved successfully to Supabase');
        return true;
        
    } catch (error) {
        console.error('Save chat history error:', error);
        throw error;
    }
}