import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({ success: false, message: 'Missing IP address' });
        }

        // Tìm user với IP này
        const { data: user, error } = await supabase
            .from('discord_users')
            .select('*')
            .eq('ip_address', ip)
            .single();

        if (error || !user) {
            return res.status(200).json({ success: false, message: 'No user found for this IP' });
        }

        // Verify user vẫn còn trong server
        const memberInfo = await checkServerMembership(user.discord_id);
        
        if (!memberInfo) {
            // User không còn trong server, xóa khỏi DB
            await supabase
                .from('discord_users')
                .delete()
                .eq('id', user.id);
            
            return res.status(200).json({ success: false, message: 'User no longer in server' });
        }

        // Update last login và days in server
        await supabase
            .from('discord_users')
            .update({ 
                last_login: new Date().toISOString(),
                days_in_server: memberInfo.daysInServer 
            })
            .eq('id', user.id);

        return res.status(200).json({
            success: true,
            user: {
                id: user.discord_id,
                username: user.username,
                avatar: user.avatar_url,
                daysInServer: memberInfo.daysInServer
            }
        });

    } catch (error) {
        console.error('Check IP error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function checkServerMembership(userId) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${process.env.SERVER_ID}/members/${userId}`, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            },
        });

        if (!response.ok) {
            return null;
        }

        const memberData = await response.json();
        
        // Tính số ngày trong server
        const joinedAt = new Date(memberData.joined_at);
        const now = new Date();
        const daysInServer = Math.floor((now - joinedAt) / (1000 * 60 * 60 * 24));

        return { daysInServer };
    } catch (error) {
        console.error('Server membership check error:', error);
        return null;
    }
}