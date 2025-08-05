// api/auth.js
export default async function handler(req, res) {
  const { method, query } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

  const PRODUCTION_URL = 'https://tuanhaideptraivcl.vercel.app';
  const BLACKLIST_URL = 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/blacklist.txt';

  // ✅ Helper function to check blacklist
  async function isUserBlacklisted(userId) {
    try {
      const response = await fetch(BLACKLIST_URL);
      if (!response.ok) {
        console.error('Failed to fetch blacklist:', response.status);
        return false; // Fail open - don't block if can't check
      }
      
      const blacklistText = await response.text();
      const blacklistedIds = blacklistText
        .split('\n')
        .map(id => id.trim())
        .filter(id => id.length > 0);
      
      const isBlocked = blacklistedIds.includes(userId);
      
      if (isBlocked) {
        console.log(`🚫 User ${userId} is blacklisted`);
      }
      
      return isBlocked;
    } catch (error) {
      console.error('Error checking blacklist:', error);
      return false; // Fail open
    }
  }

  if (method === 'GET') {
    // ✅ Token verification endpoint
    if (query.action === 'verify') {
      console.log('=== TOKEN VERIFICATION REQUEST ===');
      console.log('Client IP:', clientIP);
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          valid: false, 
          error: 'Missing or invalid authorization header' 
        });
      }

      const token = authHeader.substring(7);

      try {
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        console.log('Token decoded:', { id: tokenData.id, username: tokenData.username });

        // Check if user is blacklisted
        if (await isUserBlacklisted(tokenData.id)) {
          console.log('Token belongs to blacklisted user');
          clearIPSession(clientIP);
          return res.status(403).json({ 
            valid: false, 
            error: 'User is blacklisted',
            blacklisted: true 
          });
        }

        // Check token age (7 days max)
        if (tokenData.timestamp) {
          const tokenAge = Date.now() - tokenData.timestamp;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          
          if (tokenAge > maxAge) {
            console.log('Token expired');
            clearIPSession(clientIP);
            return res.status(401).json({ 
              valid: false, 
              error: 'Token expired' 
            });
          }
        }

        if (!tokenData.id || !tokenData.username) {
          console.log('Invalid token data');
          return res.status(401).json({ 
            valid: false, 
            error: 'Invalid token data' 
          });
        }

        // Update session for this IP
        updateIPSession(clientIP, tokenData);

        console.log('✅ Token verification successful');
        return res.status(200).json({
          valid: true,
          user: tokenData,
          ip: clientIP,
          last_access: new Date().toISOString()
        });

      } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ 
          valid: false, 
          error: 'Invalid token format' 
        });
      }
    }

    // ✅ Check IP session endpoint
    if (query.action === 'check_session') {
      console.log('=== IP SESSION CHECK ===');
      console.log('Client IP:', clientIP);
      
      const session = getIPSession(clientIP);
      
      if (session && session.valid) {
        // Check if user is blacklisted
        if (await isUserBlacklisted(session.user.id)) {
          console.log('Session belongs to blacklisted user');
          clearIPSession(clientIP);
          return res.status(200).json({
            has_session: false,
            blacklisted: true,
            ip: clientIP
          });
        }
        
        console.log('✅ Found valid IP session for:', session.user.username);
        return res.status(200).json({
          has_session: true,
          user: session.user,
          token: session.token,
          ip: clientIP
        });
      } else {
        console.log('❌ No valid IP session found');
        return res.status(200).json({
          has_session: false,
          ip: clientIP
        });
      }
    }

    // ✅ Handle login request
    if (query.action === 'login') {
      const discordClientId = process.env.DISCORD_CLIENT_ID;
      
      if (!discordClientId) {
        console.error('Missing DISCORD_CLIENT_ID environment variable');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const redirectUri = encodeURIComponent(`${PRODUCTION_URL}/api/auth?action=callback`);
      
      console.log('=== LOGIN REQUEST ===');
      console.log('Client IP:', clientIP);
      
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds`;
      
      return res.redirect(discordAuthUrl);
    }

    // ✅ Handle callback từ Discord
    if (query.action === 'callback') {
      const { code, error: discordError } = query;
      
      console.log('=== CALLBACK RECEIVED ===');
      console.log('Client IP:', clientIP);
      
      if (discordError) {
        console.error('Discord OAuth Error:', discordError);
        return res.redirect(`/login?error=discord_${discordError}`);
      }
      
      if (!code) {
        console.error('No authorization code received');
        return res.redirect('/login?error=no_code');
      }

      try {
        // Exchange code for token
        const tokenPayload = {
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${PRODUCTION_URL}/api/auth?action=callback`,
        };

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(tokenPayload),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok || !tokenData.access_token) {
          console.error('Token exchange failed:', tokenData);
          return res.redirect('/login?error=token_error');
        }

        // Get user data
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          console.error('Failed to fetch user data:', userResponse.status);
          return res.redirect('/login?error=user_fetch_failed');
        }

        const userData = await userResponse.json();
        console.log('User logged in:', { id: userData.id, username: userData.username });

        // ✅ CHECK BLACKLIST
        if (await isUserBlacklisted(userData.id)) {
          console.log('🚫 BLOCKED USER ATTEMPTED LOGIN:', userData.id, userData.username);
          // Redirect to home with blacklisted flag
          return res.redirect(`${PRODUCTION_URL}/?blacklisted=true&user=${encodeURIComponent(userData.username)}`);
        }

        // Check guild membership (optional)
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        let guilds = [];
        if (guildsResponse.ok) {
          guilds = await guildsResponse.json();
          
          // Optional: Check if user is in required server
          if (process.env.SERVER_ID) {
            const isInServer = guilds.some(guild => guild.id === process.env.SERVER_ID);
            if (!isInServer) {
              console.log('User not in required server');
              return res.redirect('/login?error=not_in_server');
            }
          }
        }

        // Create session data
        const sessionData = {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator || '0',
          avatar: userData.avatar,
          globalName: userData.global_name || userData.username,
          timestamp: Date.now(),
          guilds: guilds.length,
          loginIP: clientIP
        };

        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

        // Save IP session
        saveIPSession(clientIP, sessionToken, sessionData);

        // Redirect về trang chủ với welcome message
        const redirectUrl = `${PRODUCTION_URL}/?login_success=true&welcome=${encodeURIComponent(sessionData.globalName || sessionData.username)}`;
        console.log('=== LOGIN SUCCESS - REDIRECTING ===');
        
        return res.redirect(redirectUrl);

      } catch (error) {
        console.error('=== OAUTH ERROR ===');
        console.error('Error details:', error);
        return res.redirect('/login?error=auth_failed');
      }
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  }

  // ✅ POST method - Clear session
  if (method === 'POST') {
    if (query.action === 'clear_session') {
      console.log('=== CLEAR SESSION REQUEST ===');
      console.log('Client IP:', clientIP);
      
      const cleared = clearIPSession(clientIP);
      
      return res.status(200).json({
        success: true,
        message: cleared ? 'Session cleared' : 'No session found',
        ip: clientIP
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ✅ Simple in-memory IP session storage
const ipSessions = new Map();

function saveIPSession(ip, token, userData) {
  const sessionInfo = {
    token: token,
    user: userData,
    loginTime: Date.now(),
    lastAccess: Date.now(),
    valid: true
  };
  
  ipSessions.set(ip, sessionInfo);
  
  console.log('✅ IP session saved for:', ip);
  console.log('👤 User:', userData.globalName || userData.username);
  console.log('📊 Total sessions:', ipSessions.size);
}

function getIPSession(ip) {
  const session = ipSessions.get(ip);
  
  if (!session) {
    return null;
  }
  
  // Check if session expired (7 days)
  const sessionAge = Date.now() - session.loginTime;
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  if (sessionAge > maxAge) {
    ipSessions.delete(ip);
    console.log('🕐 Session expired for IP:', ip);
    return null;
  }
  
  return session;
}

function updateIPSession(ip, userData) {
  const session = ipSessions.get(ip);
  
  if (session) {
    session.lastAccess = Date.now();
    session.user = userData;
    ipSessions.set(ip, session);
    console.log('🔄 Updated session for IP:', ip);
  } else {
    // Create new session if not exists
    const token = Buffer.from(JSON.stringify(userData)).toString('base64');
    saveIPSession(ip, token, userData);
  }
}

function clearIPSession(ip) {
  const deleted = ipSessions.delete(ip);
  console.log(`🗑️ Session cleared for IP ${ip}:`, deleted ? 'Success' : 'Not found');
  return deleted;
}