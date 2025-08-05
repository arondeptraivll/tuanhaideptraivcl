import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting cache
const authAttempts = new Map();
const RATE_LIMIT_WINDOW = 300000; // 5 phút
const MAX_ATTEMPTS = 2; // Chỉ 2 lần trong 5 phút

function checkRateLimit(ip) {
    const now = Date.now();
    const attempts = authAttempts.get(ip) || [];
    
    // Xóa attempts cũ
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
        const { code, ip, state } = req.body;
        
        console.log('Auth request received:', { code: code?.substring(0, 10) + '...', ip, state });
        
        if (!code) {
            console.log('Missing authorization code');
            if (state) {
                await saveAuthResult(state, 'error', null, 'Missing authorization code');
            }
            return res.status(400).json({ success: false, message: 'Missing authorization code' });
        }

        // Rate limiting
        if (!checkRateLimit(ip)) {
            console.log('Rate limited for IP:', ip);
            if (state) {
                await saveAuthResult(state, 'error', null, 'Rate limited');
            }
            return res.status(429).json({ success: false, message: 'Rate limited' });
        }

        // Check if user already exists for this IP
        const { data: existingUser } = await supabase
            .from('discord_users')
            .select('*')
            .eq('ip_address', ip)
            .single();

        if (existingUser) {
            console.log('Found existing user for IP:', ip);
            // Verify user still in server
            const memberInfo = await checkServerMembership(existingUser.discord_id);
            if (memberInfo) {
                // Update last login
                await supabase
                    .from('discord_users')
                    .update({ 
                        last_login: new Date().toISOString(),
                        days_in_server: memberInfo.daysInServer 
                    })
                    .eq('id', existingUser.id);

                const userData = {
                    id: existingUser.discord_id,
                    username: existingUser.username,
                    avatar: existingUser.avatar_url,
                    daysInServer: memberInfo.daysInServer
                };

                if (state) {
                    await saveAuthResult(state, 'success', userData, null);
                }

                return res.status(200).json({
                    success: true,
                    user: userData
                });
            } else {
                console.log('User no longer in server, deleting from DB');
                // User no longer in server, delete from DB
                await supabase
                    .from('discord_users')
                    .delete()
                    .eq('id', existingUser.id);
                
                if (state) {
                    await saveAuthResult(state, 'error', null, 'User not in server');
                }
                
                return res.status(403).json({ success: false, message: 'User not in server' });
            }
        }

        console.log('Getting Discord access token...');
        // Get Discord access token
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
            const errorData = await tokenResponse.text();
            console.error('Discord token error:', errorData);
            if (state) {
                await saveAuthResult(state, 'error', null, 'Invalid code');
            }
            return res.status(400).json({ success: false, message: 'Invalid code' });
        }

        const tokenData = await tokenResponse.json();
        console.log('Got Discord token, fetching user info...');

        // Get user info from Discord
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            console.error('Discord user API error:', userResponse.status);
            if (state) {
                await saveAuthResult(state, 'error', null, 'Discord API error');
            }
            return res.status(500).json({ success: false, message: 'Discord API error' });
        }

        const userData = await userResponse.json();
        console.log('Got user data:', userData.username);

        // Check if user is in server
        console.log('Checking server membership...');
        const memberInfo = await checkServerMembership(userData.id);
        if (!memberInfo) {
            console.log('User not in server:', userData.username);
            if (state) {
                await saveAuthResult(state, 'error', null, 'User not in server');
            }
            return res.status(403).json({ success: false, message: 'User not in server' });
        }

        console.log('User is in server, saving to database...');
        // Save to database
        const avatarUrl = userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${(userData.discriminator || 0) % 5}.png`;

        const { data: dbUser, error } = await supabase
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
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            if (state) {
                await saveAuthResult(state, 'error', null, 'Database error');
            }
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        const finalUserData = {
            id: userData.id,
            username: userData.username,
            avatar: avatarUrl,
            daysInServer: memberInfo.daysInServer
        };

        console.log('Auth successful for:', userData.username);

        // Save successful auth result if we have state (for polling)
        if (state) {
            await saveAuthResult(state, 'success', finalUserData, null);
        }

        return res.status(200).json({
            success: true,
            user: finalUserData
        });

    } catch (error) {
        console.error('Auth error:', error);
        
        // Save error to state if we have state
        if (req.body.state) {
            await saveAuthResult(req.body.state, 'error', null, 'Internal server error');
        }
        
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function handleDeleteAccount(req, res) {
    try {
        const { userId, ip } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Missing user ID' });
        }

        console.log('Deleting account:', userId);

        // Delete user from database
        const { error } = await supabase
            .from('discord_users')
            .delete()
            .eq('discord_id', userId)
            .eq('ip_address', ip);

        if (error) {
            console.error('Delete error:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        console.log('Account deleted successfully:', userId);
        return res.status(200).json({ success: true, message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Delete account error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function saveAuthResult(state, status, userData, errorMessage) {
    try {
        const data = {
            state: state,
            status: status,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        };

        if (userData) {
            data.user_data = JSON.stringify(userData);
        }

        if (errorMessage) {
            data.error_message = errorMessage;
        }

        await supabase
            .from('auth_states')
            .upsert(data, { onConflict: 'state' });

        console.log('Auth result saved:', { state, status });
    } catch (error) {
        console.error('Error saving auth result:', error);
    }
}

async function checkServerMembership(userId) {
    try {
        console.log('Checking membership for user:', userId);
        const response = await fetch(`https://discord.com/api/guilds/${process.env.SERVER_ID}/members/${userId}`, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            },
        });

        if (!response.ok) {
            console.log('User not found in server or API error:', response.status);
            return null;
        }

        const memberData = await response.json();
        
        // Tính số ngày trong server
        const joinedAt = new Date(memberData.joined_at);
        const now = new Date();
        const daysInServer = Math.floor((now - joinedAt) / (1000 * 60 * 60 * 24));

        console.log('User has been in server for', daysInServer, 'days');
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

// Cleanup expired auth states (call này có thể được scheduled)
async function cleanupExpiredAuthStates() {
    try {
        const { error } = await supabase
            .from('auth_states')
            .delete()
            .lt('expires_at', new Date().toISOString());

        if (error) {
            console.error('Cleanup error:', error);
        } else {
            console.log('Expired auth states cleaned up');
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// Cleanup khi server start
cleanupExpiredAuthStates();