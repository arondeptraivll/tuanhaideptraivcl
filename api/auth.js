import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authAttempts = new Map();
const RATE_LIMIT_WINDOW = 300000; // 5 phút
const MAX_ATTEMPTS = 2;

function checkRateLimit(ip) {
    const now = Date.now();
    const attempts = authAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
        return false;
    }
    
    recentAttempts.push(now);
    authAttempts.set(ip, recentAttempts);
    return true;
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        await handleLogin(req, res);
    } else if (req.method === 'DELETE') {
        await handleDeleteAccount(req, res);
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}

async function handleLogin(req, res) {
    try {
        const { code, ip } = req.body;
        
        if (!code) {
            return res.status(400).json({ success: false, message: 'Missing authorization code' });
        }

        if (!checkRateLimit(ip)) {
            return res.status(429).json({ success: false, message: 'Rate limited' });
        }

        // Check existing user first
        const { data: existingUser } = await supabase
            .from('discord_users')
            .select('*')
            .eq('ip_address', ip)
            .single();

        if (existingUser) {
            const memberInfo = await checkServerMembership(existingUser.discord_id);
            if (memberInfo) {
                await supabase
                    .from('discord_users')
                    .update({ 
                        last_login: new Date().toISOString(),
                        days_in_server: memberInfo.daysInServer 
                    })
                    .eq('id', existingUser.id);

                return res.status(200).json({
                    success: true,
                    user: {
                        id: existingUser.discord_id,
                        username: existingUser.username,
                        avatar: existingUser.avatar_url,
                        daysInServer: memberInfo.daysInServer
                    }
                });
            } else {
                await supabase.from('discord_users').delete().eq('id', existingUser.id);
                return res.status(403).json({ success: false, message: 'User not in server' });
            }
        }

        // Get Discord token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: getRedirectUri(req),
            }),
        });

        if (!tokenResponse.ok) {
            return res.status(400).json({ success: false, message: 'Invalid code' });
        }

        const tokenData = await tokenResponse.json();

        // Get user info
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            return res.status(500).json({ success: false, message: 'Discord API error' });
        }

        const userData = await userResponse.json();

        // Check server membership
        const memberInfo = await checkServerMembership(userData.id);
        if (!memberInfo) {
            return res.status(403).json({ success: false, message: 'User not in server' });
        }

        // Save to database
        const avatarUrl = userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${(userData.discriminator || 0) % 5}.png`;

        await supabase
            .from('discord_users')
            .upsert({
                discord_id: userData.id,
                username: userData.username,
                discriminator: userData.discriminator || '0000',
                avatar_url: avatarUrl,
                ip_address: ip,
                days_in_server: memberInfo.daysInServer,
                last_login: new Date().toISOString(),
                created_at: new Date().toISOString()
            }, {
                onConflict: 'discord_id'
            });

        return res.status(200).json({
            success: true,
            user: {
                id: userData.id,
                username: userData.username,
                avatar: avatarUrl,
                daysInServer: memberInfo.daysInServer
            }
        });

    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function handleDeleteAccount(req, res) {
    try {
        const { userId, ip } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Missing user ID' });
        }

        await supabase
            .from('discord_users')
            .delete()
            .eq('discord_id', userId)
            .eq('ip_address', ip);

        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
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

        if (!response.ok) return null;

        const memberData = await response.json();
        const joinedAt = new Date(memberData.joined_at);
        const now = new Date();
        const daysInServer = Math.floor((now - joinedAt) / (1000 * 60 * 60 * 24));

        return { daysInServer };
    } catch (error) {
        console.error('Server membership check error:', error);
        return null;
    }
}

function getRedirectUri(req) {
    const protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http');
    const host = req.headers.host;
    return `${protocol}://${host}`;
}