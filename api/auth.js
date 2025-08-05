// api/auth.js
export default async function handler(req, res) {
  const { method, query } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // HARD-CODE Production URL
  const PRODUCTION_URL = 'https://tuanhaideptraivcl.vercel.app';

  if (method === 'GET') {
    // Xử lý login request
    if (query.action === 'login') {
      const discordClientId = process.env.DISCORD_CLIENT_ID;
      
      if (!discordClientId) {
        console.error('Missing DISCORD_CLIENT_ID environment variable');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const redirectUri = encodeURIComponent(`${PRODUCTION_URL}/api/auth?action=callback`);
      
      console.log('=== LOGIN REQUEST ===');
      console.log('Production URL:', PRODUCTION_URL);
      console.log('Redirect URI:', redirectUri);
      console.log('Discord Client ID:', discordClientId);
      
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds`;
      
      console.log('Discord Auth URL:', discordAuthUrl);
      
      return res.redirect(discordAuthUrl);
    }

    // Xử lý callback từ Discord
    if (query.action === 'callback') {
      const { code, error: discordError } = query;
      
      console.log('=== CALLBACK RECEIVED ===');
      console.log('Code:', code ? 'Present' : 'Missing');
      console.log('Discord Error:', discordError);
      
      // Kiểm tra Discord error
      if (discordError) {
        console.error('Discord OAuth Error:', discordError);
        return res.redirect(`/login?error=discord_${discordError}`); // ✅ ĐỔI THÀNH /login
      }
      
      if (!code) {
        console.error('No authorization code received');
        return res.redirect('/login?error=no_code'); // ✅ ĐỔI THÀNH /login
      }

      try {
        // Step 1: Exchange authorization code for access token
        console.log('=== EXCHANGING CODE FOR TOKEN ===');
        
        const tokenPayload = {
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${PRODUCTION_URL}/api/auth?action=callback`,
        };

        console.log('Token payload:', { ...tokenPayload, client_secret: '[HIDDEN]' });

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(tokenPayload),
        });

        const tokenData = await tokenResponse.json();
        
        console.log('Token response status:', tokenResponse.status);
        console.log('Token data:', { ...tokenData, access_token: tokenData.access_token ? '[PRESENT]' : '[MISSING]' });

        if (!tokenResponse.ok || !tokenData.access_token) {
          console.error('Token exchange failed:', tokenData);
          return res.redirect('/login?error=token_error'); // ✅ ĐỔI THÀNH /login
        }

        // Step 2: Lấy thông tin user từ Discord
        console.log('=== FETCHING USER DATA ===');
        
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          console.error('Failed to fetch user data:', userResponse.status);
          return res.redirect('/login?error=user_fetch_failed'); // ✅ ĐỔI THÀNH /login
        }

        const userData = await userResponse.json();
        console.log('User data:', { id: userData.id, username: userData.username });

        // Step 3: Lấy danh sách guilds để kiểm tra membership
        console.log('=== CHECKING GUILD MEMBERSHIP ===');
        
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        let isInServer = true;
        let guilds = [];
        
        if (guildsResponse.ok) {
          guilds = await guildsResponse.json();
          console.log('User guilds count:', guilds.length);
          
          if (process.env.SERVER_ID) {
            isInServer = guilds.some(guild => guild.id === process.env.SERVER_ID);
            console.log('Is in required server:', isInServer);
            
            if (!isInServer) {
              console.log('User not in required server:', process.env.SERVER_ID);
              return res.redirect('/login?error=not_in_server'); // ✅ ĐỔI THÀNH /login
            }
          }
        } else {
          console.warn('Failed to fetch guilds:', guildsResponse.status);
        }

        // Step 4: Lấy thông tin chi tiết member từ server
        let memberData = null;
        let daysInServer = 0;
        
        if (process.env.SERVER_ID && process.env.DISCORD_TOKEN && isInServer) {
          console.log('=== FETCHING MEMBER DATA ===');
          
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
              console.log('Member data received:', { joined_at: memberData.joined_at });
              
              if (memberData.joined_at) {
                const joinDate = new Date(memberData.joined_at);
                const now = new Date();
                daysInServer = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
                console.log('Days in server calculated:', daysInServer);
              }
            } else {
              console.warn('Failed to fetch member data:', memberResponse.status, await memberResponse.text());
            }
          } catch (memberError) {
            console.error('Error fetching member data:', memberError);
          }
        }

        // Step 5: Tạo session token
        console.log('=== CREATING SESSION TOKEN ===');
        
        const sessionData = {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator || '0',
          avatar: userData.avatar,
          globalName: userData.global_name || userData.username,
          joinedAt: memberData?.joined_at || null,
          daysInServer: daysInServer,
          timestamp: Date.now(),
          guilds: guilds.length
        };

        console.log('Session data:', { ...sessionData, id: '[PRESENT]' });

        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

        // Step 6: Redirect về trang login với success
        const redirectUrl = `/login?success=true&token=${encodeURIComponent(sessionToken)}`; // ✅ ĐỔI THÀNH /login
        console.log('=== REDIRECTING TO SUCCESS ===');
        console.log('Redirect URL:', redirectUrl);
        
        return res.redirect(redirectUrl);

      } catch (error) {
        console.error('=== OAUTH ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        return res.redirect('/login?error=auth_failed'); // ✅ ĐỔI THÀNH /login
      }
    }

    console.log('Invalid action:', query.action);
    return res.status(400).json({ error: 'Invalid action parameter' });
  }

  console.log('Invalid method:', method);
  return res.status(405).json({ error: 'Method not allowed' });
}