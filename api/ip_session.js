// api/ip_session.js
export default async function handler(req, res) {
    const { method } = req;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Get client IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    '127.0.0.1';
    
    console.log('=== IP Session Request ===');
    console.log('Client IP:', clientIP);
    console.log('Method:', method);
    console.log('User-Agent:', req.headers['user-agent']);
    
    if (method === 'GET') {
        // Check if IP has existing session
        try {
            const existingSession = await checkIPSession(clientIP);
            
            if (existingSession && existingSession.valid) {
                console.log('✅ Found valid IP session for user:', existingSession.user.username);
                return res.status(200).json({
                    success: true,
                    has_session: true,
                    session_token: existingSession.token,
                    user: existingSession.user,
                    ip: clientIP,
                    created_at: existingSession.created_at,
                    last_access: new Date().toISOString()
                });
            } else {
                console.log('❌ No valid IP session found');
                return res.status(200).json({
                    success: true,
                    has_session: false,
                    ip: clientIP
                });
            }
        } catch (error) {
            console.error('Error checking IP session:', error);
            return res.status(500).json({
                error: 'Internal server error'
            });
        }
    }
    
    if (method === 'POST') {
        // Save IP session when user logs in
        try {
            const { session_token, user_data } = req.body;
            
            if (!session_token || !user_data) {
                return res.status(400).json({
                    error: 'Missing session_token or user_data'
                });
            }
            
            console.log('💾 Saving IP session');
            console.log('User:', user_data.username || user_data.globalName);
            console.log('IP:', clientIP);
            
            await saveIPSession(clientIP, session_token, user_data, req.headers['user-agent']);
            
            return res.status(201).json({
                success: true,
                message: 'IP session saved successfully',
                ip: clientIP,
                user: user_data.username || user_data.globalName
            });
            
        } catch (error) {
            console.error('Error saving IP session:', error);
            return res.status(500).json({
                error: 'Failed to save IP session'
            });
        }
    }
    
    if (method === 'DELETE') {
        // Clear IP session when user logs out
        try {
            await clearIPSession(clientIP);
            console.log('🗑️ IP session cleared for:', clientIP);
            
            return res.status(200).json({
                success: true,
                message: 'IP session cleared',
                ip: clientIP
            });
        } catch (error) {
            console.error('Error clearing IP session:', error);
            return res.status(500).json({
                error: 'Failed to clear IP session'
            });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}

// In-memory store - Replace with Redis/Database in production
const ipSessions = new Map();

async function checkIPSession(ip) {
    const session = ipSessions.get(ip);
    
    if (!session) {
        return null;
    }
    
    // Check if session is still valid (7 days like Discord)
    const sessionAge = Date.now() - session.created_at;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (sessionAge > maxAge) {
        ipSessions.delete(ip);
        console.log('🕐 Session expired for IP:', ip);
        return null;
    }
    
    // Update last access
    session.last_access = Date.now();
    
    return {
        valid: true,
        token: session.token,
        user: session.user,
        created_at: session.created_at,
        last_access: session.last_access
    };
}

async function saveIPSession(ip, token, userData, userAgent) {
    const sessionData = {
        token: token,
        user: userData,
        created_at: Date.now(),
        last_access: Date.now(),
        user_agent: userAgent || 'Unknown',
        login_count: (ipSessions.get(ip)?.login_count || 0) + 1
    };
    
    ipSessions.set(ip, sessionData);
    
    console.log(`✅ Saved session for IP: ${ip}`);
    console.log(`👤 User: ${userData.username || userData.globalName}`);
    console.log(`📊 Total IP sessions: ${ipSessions.size}`);
    console.log(`🔄 Login count for this IP: ${sessionData.login_count}`);
}

async function clearIPSession(ip) {
    const deleted = ipSessions.delete(ip);
    console.log(`🗑️ Session deletion for IP ${ip}:`, deleted ? 'Success' : 'Not found');
    return deleted;
}