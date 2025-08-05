// api/auth.js
export default async function handler(req, res) {
  const { method, query } = req;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (method === 'GET') {
    if (query.action === 'login') {
      const discordClientId = process.env.DISCORD_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth?action=callback`);
      
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds`;
      
      return res.redirect(discordAuthUrl);
    }

    if (query.action === 'callback') {
      const { code } = query;
      
      if (!code) {
        return res.redirect('/Auth?error=no_code');
      }

      try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth?action=callback`,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
          return res.redirect('/Auth?error=token_error');
        }

        // Lấy user info từ Discord
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();

        // Lấy thông tin server member (join date)
        let memberData = null;
        let daysInServer = 0;
        
        if (process.env.SERVER_ID && process.env.DISCORD_TOKEN) {
          try {
            const memberResponse = await fetch(`https://discord.com/api/guilds/${process.env.SERVER_ID}/members/${userData.id}`, {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
              },
            });

            if (memberResponse.ok) {
              memberData = await memberResponse.json();
              const joinDate = new Date(memberData.joined_at);
              const now = new Date();
              daysInServer = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
            }
          } catch (error) {
            console.error('Error fetching member data:', error);
          }
        }

        // Kiểm tra user có trong server không
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        
        const guilds = await guildsResponse.json();
        const isInServer = guilds.some(guild => guild.id === process.env.SERVER_ID);
        
        if (process.env.SERVER_ID && !isInServer) {
          return res.redirect('/Auth?error=not_in_server');
        }

        // Tạo session token với thông tin đầy đủ
        const sessionToken = Buffer.from(JSON.stringify({
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: userData.avatar,
          joinedAt: memberData?.joined_at || null,
          daysInServer: daysInServer,
          timestamp: Date.now()
        })).toString('base64');

        // Redirect về trang Auth với token
        return res.redirect(`/Auth?success=true&token=${sessionToken}`);

      } catch (error) {
        console.error('Auth error:', error);
        return res.redirect('/Auth?error=auth_failed');
      }
    }
  }

  return res.status(404).json({ error: 'Not found' });
}