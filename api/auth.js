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

        // Check token age (7 days max)
        if (tokenData.timestamp) {
          const tokenAge = Date.now() - tokenData.timestamp;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          
          if (tokenAge > maxAge) {
            console.log('Token expired');
            clearIPSession(clientIP); // Clear expired session
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

        // ✅ Update session for this IP
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
        console.log('✅ Found valid IP session for:', session.user.username);
        return res.status(200).json({
          has_session: true,
          user: session.user,
          token: session.token,
          ip: clientIP,
          login_time: session.loginTime,
          last_access: session.lastAccess
        });
      } else {
        console.log('❌ No valid IP session found');
        return res.status(200).json({
          has_session: false,
          ip: clientIP
        });
      }
    }

    // Handle login request
    if (query.action === 'login') {
      const discordClientId = process.env.DISCORD_CLIENT_ID;
      
      if (!discordClientId) {
        console.error('Missing DISCORD_CLIENT_ID environment variable');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const redirectUri = encodeURIComponent(`${PRODUCTION_URL}/api/auth?action=callback`);
      
      console.log('=== LOGIN REQUEST ===');
      console.log('Client IP:', clientIP);
      console.log('Redirect URI:', redirectUri);
      
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds`;
      
      return res.redirect(discordAuthUrl);
    }

    // Handle callback từ Discord
    if (query.action === 'callback') {
      const { code, error: discordError } = query;
      
      console.log('=== CALLBACK RECEIVED ===');
      console.log('Client IP:', clientIP);
      console.log('Code:', code ? 'Present' : 'Missing');
      
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
        console.log('User data:', { id: userData.id, username: userData.username });

        // Check guild membership
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        let isInServer = true;
        let guilds = [];
        
        if (guildsResponse.ok) {
          guilds = await guildsResponse.json();
          
          if (process.env.SERVER_ID) {
            isInServer = guilds.some(guild => guild.id === process.env.SERVER_ID);
            
            if (!isInServer) {
              console.log('User not in required server');
              return res.redirect('/login?error=not_in_server');
            }
          }
        }

        // Get member data
        let memberData = null;
        let daysInServer = 0;
        
        if (process.env.SERVER_ID && process.env.DISCORD_TOKEN && isInServer) {
          try {
            const memberResponse = await fetch(
              `https://discord.com/api/guilds/${process.env.SERVER_ID}/members/${userData.id}`,
              {
                headers: {
                  Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
                },
              }
            );

            if (memberResponse.ok) {
              memberData = await memberResponse.json();
              
              if (memberData.joined_at) {
                const joinDate = new Date(memberData.joined_at);
                const now = new Date();
                daysInServer = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
              }
            }
          } catch (memberError) {
            console.error('Error fetching member data:', memberError);
          }
        }

        // Create session data
        const sessionData = {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator || '0',
          avatar: userData.avatar,
          globalName: userData.global_name || userData.username,
          joinedAt: memberData?.joined_at || null,
          daysInServer: daysInServer,
          timestamp: Date.now(),
          guilds: guilds.length,
          loginIP: clientIP,
          userAgent: req.headers['user-agent'] || 'Unknown'
        };

        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

        // ✅ Save IP session cho lần truy cập sau
        saveIPSession(clientIP, sessionToken, sessionData);

        // ✅ Redirect về trang chủ với thông báo success
        const redirectUrl = `${PRODUCTION_URL}/?login_success=true&welcome=${encodeURIComponent(sessionData.globalName || sessionData.username)}`;
        console.log('=== REDIRECTING TO HOME ===');
        console.log('Redirect URL:', redirectUrl);
        
        return res.redirect(redirectUrl);

      } catch (error) {
        console.error('=== OAUTH ERROR ===');
        console.error('Error details:', error);
        return res.redirect('/login?error=auth_failed');
      }
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ✅ In-memory IP session storage
const ipSessions = new Map();

function saveIPSession(ip, token, userData) {
  const sessionInfo = {
    token: token,
    user: userData,
    loginTime: Date.now(),
    lastAccess: Date.now(),
    loginCount: (ipSessions.get(ip)?.loginCount || 0) + 1,
    userAgent: userData.userAgent,
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

// Export for debugging
export function getActiveSessions() {
  return Array.from(ipSessions.entries()).map(([ip, data]) => ({
    ip,
    user: data.user.globalName || data.user.username,
    loginTime: new Date(data.loginTime).toISOString(),
    lastAccess: new Date(data.lastAccess).toISOString(),
    loginCount: data.loginCount
  }));
}