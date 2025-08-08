// api/auth.js
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Khởi tạo Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { method, query } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lấy thông tin client
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                  req.headers['x-real-ip'] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress ||
                  '127.0.0.1';
  
  const userAgent = req.headers['user-agent'] || '';
  const PRODUCTION_URL = 'https://tuanhaideptraivcl.vercel.app';

  // Migration từ memory sang database nếu cần
  await migrateMemoryToDatabase();

  if (method === 'GET') {
    // ✅ Xác thực token
    if (query.action === 'verify') {
      console.log('=== YÊU CẦU XÁC THỰC TOKEN ===');
      console.log('IP Client:', clientIP);
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          valid: false, 
          error: 'Thiếu hoặc header authorization không hợp lệ' 
        });
      }

      const token = authHeader.substring(7);

      try {
        const session = await getSession(token);
        
        if (!session || !session.is_active) {
          console.log('Session không hợp lệ hoặc không hoạt động');
          return res.status(401).json({ 
            valid: false, 
            error: 'Session không hợp lệ' 
          });
        }

        // Kiểm tra session đã hết hạn chưa
        if (new Date(session.expires_at) < new Date()) {
          console.log('Session đã hết hạn');
          await clearSession(token);
          return res.status(401).json({ 
            valid: false, 
            error: 'Session đã hết hạn' 
          });
        }

        // Cập nhật thời gian truy cập cuối
        await updateSessionAccess(token);

        // Lấy dữ liệu user
        const userData = await getUserByDiscordId(session.discord_id);
        
        console.log('✅ Xác thực token thành công');
        return res.status(200).json({
          valid: true,
          user: userData,
          session_data: session.user_data,
          ip: clientIP,
          last_access: new Date().toISOString()
        });

      } catch (error) {
        console.error('Xác thực token thất bại:', error);
        return res.status(401).json({ 
          valid: false, 
          error: 'Xác thực token thất bại' 
        });
      }
    }

    // ✅ Kiểm tra session
    if (query.action === 'check_session') {
      console.log('=== KIỂM TRA SESSION ===');
      console.log('IP Client:', clientIP);
      
      try {
        const session = await getActiveSessionByIP(clientIP);
        
        if (session) {
          const userData = await getUserByDiscordId(session.discord_id);
          console.log('✅ Tìm thấy session hợp lệ cho:', userData.username);
          
          return res.status(200).json({
            has_session: true,
            user: userData,
            session_data: session.user_data,
            token: session.session_token,
            ip: clientIP
          });
        } else {
          console.log('❌ Không tìm thấy session hợp lệ');
          return res.status(200).json({
            has_session: false,
            ip: clientIP
          });
        }
      } catch (error) {
        console.error('Lỗi kiểm tra session:', error);
        return res.status(200).json({
          has_session: false,
          ip: clientIP
        });
      }
    }

    // ✅ Xử lý yêu cầu đăng nhập
    if (query.action === 'login') {
      const discordClientId = process.env.DISCORD_CLIENT_ID;
      
      if (!discordClientId) {
        console.error('Thiếu DISCORD_CLIENT_ID trong environment');
        return res.status(500).json({ error: 'Lỗi cấu hình server' });
      }

      const redirectUri = encodeURIComponent(`${PRODUCTION_URL}/api/auth?action=callback`);
      
      console.log('=== YÊU CẦU ĐĂNG NHẬP ===');
      console.log('IP Client:', clientIP);
      
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds`;
      
      return res.redirect(discordAuthUrl);
    }

    // ✅ Xử lý callback từ Discord
    if (query.action === 'callback') {
      const { code, error: discordError } = query;
      
      console.log('=== NHẬN CALLBACK ===');
      console.log('IP Client:', clientIP);
      
      if (discordError) {
        console.error('Lỗi Discord OAuth:', discordError);
        return res.redirect(`${PRODUCTION_URL}/login?error=discord_${discordError}`);
      }
      
      if (!code) {
        console.error('Không nhận được authorization code');
        return res.redirect(`${PRODUCTION_URL}/login?error=no_code`);
      }

      try {
        // Đổi code lấy token
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
          console.error('Đổi token thất bại:', tokenData);
          return res.redirect(`${PRODUCTION_URL}/login?error=token_error`);
        }

        // Lấy dữ liệu user
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          console.error('Lấy dữ liệu user thất bại:', userResponse.status);
          return res.redirect(`${PRODUCTION_URL}/login?error=user_fetch_failed`);
        }

        const userData = await userResponse.json();
        console.log('User đăng nhập:', { id: userData.id, username: userData.username });

        // Lấy dữ liệu guilds
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        let guilds = [];
        if (guildsResponse.ok) {
          guilds = await guildsResponse.json();
          
          // Kiểm tra user có trong server yêu cầu không (tùy chọn)
          if (process.env.SERVER_ID) {
            const isInServer = guilds.some(guild => guild.id === process.env.SERVER_ID);
            if (!isInServer) {
              console.log('User không ở trong server yêu cầu');
              return res.redirect(`${PRODUCTION_URL}/login?error=not_in_server`);
            }
          }
        }

        // Tạo dữ liệu session
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

        // Lưu hoặc cập nhật user trong database
        await saveOrUpdateUser(userData, guilds.length);

        // Xóa sessions cũ cho IP này (bao gồm cả memory nếu có)
        await clearSessionsByIP(clientIP);
        clearIPSessionFromMemory(clientIP); // Xóa từ memory nếu còn

        // Tạo session mới trong database
        const sessionToken = await createSession(userData.id, clientIP, userAgent, sessionData);

        console.log('=== ĐĂNG NHẬP THÀNH CÔNG ===');
        console.log('Session được tạo cho IP:', clientIP);
        console.log('Dữ liệu user:', {
          id: userData.id,
          username: userData.username,
          globalName: userData.global_name
        });

        // Chuyển hướng về trang chủ với thông tin session
        const redirectUrl = `${PRODUCTION_URL}/?login_success=true&user_id=${userData.id}&username=${encodeURIComponent(userData.global_name || userData.username)}&avatar=${userData.avatar || ''}`;
        console.log('Chuyển hướng tới:', redirectUrl);
        
        return res.redirect(redirectUrl);

      } catch (error) {
        console.error('=== LỖI OAUTH ===');
        console.error('Chi tiết lỗi:', error);
        return res.redirect(`${PRODUCTION_URL}/login?error=auth_failed`);
      }
    }

    return res.status(400).json({ error: 'Tham số action không hợp lệ' });
  }

  // ✅ POST method - Xóa session
  if (method === 'POST') {
    if (query.action === 'clear_session') {
      console.log('=== YÊU CẦU XÓA SESSION ===');
      console.log('IP Client:', clientIP);
      
      try {
        // Xóa từ database
        const clearedDB = await clearSessionsByIP(clientIP);
        // Xóa từ memory nếu còn
        const clearedMemory = clearIPSessionFromMemory(clientIP);
        
        return res.status(200).json({
          success: true,
          message: (clearedDB || clearedMemory) ? 'Session đã được xóa' : 'Không tìm thấy session',
          ip: clientIP
        });
      } catch (error) {
        console.error('Lỗi xóa session:', error);
        return res.status(500).json({
          success: false,
          error: 'Không thể xóa session'
        });
      }
    }

    return res.status(400).json({ error: 'Action không hợp lệ' });
  }

  return res.status(405).json({ error: 'Method không được phép' });
}

// ✅ Các hàm database

// Tạo session token bảo mật
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Migration dữ liệu từ memory sang database
async function migrateMemoryToDatabase() {
  try {
    if (ipSessions && ipSessions.size > 0) {
      console.log('🔄 Bắt đầu migration từ memory sang database...');
      
      for (const [ip, sessionInfo] of ipSessions.entries()) {
        try {
          // Kiểm tra session còn hợp lệ không
          if (sessionInfo.valid && sessionInfo.user) {
            // Lưu user vào database nếu chưa có
            const userData = sessionInfo.user;
            await saveOrUpdateUser({
              id: userData.id,
              username: userData.username,
              discriminator: userData.discriminator,
              global_name: userData.globalName,
              avatar: userData.avatar
            }, userData.guilds || 0);

            // Tạo session trong database
            await createSession(
              userData.id, 
              ip, 
              '', // user agent không có trong memory
              userData
            );

            console.log(`✅ Migrated session cho user: ${userData.username} (IP: ${ip})`);
          }
        } catch (error) {
          console.error(`❌ Lỗi migrate session cho IP ${ip}:`, error);
        }
      }

      // Xóa tất cả data từ memory sau khi migrate
      ipSessions.clear();
      console.log('🧹 Đã xóa tất cả data từ memory');
    }
  } catch (error) {
    console.error('Lỗi trong quá trình migration:', error);
  }
}

// Lưu hoặc cập nhật user trong database
async function saveOrUpdateUser(userData, guildsCount) {
  try {
    const { data, error } = await supabase
      .from('discord_users')
      .upsert({
        discord_id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator || '0',
        global_name: userData.global_name,
        avatar: userData.avatar,
        guilds_count: guildsCount,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'discord_id'
      });

    if (error) {
      console.error('Lỗi lưu user:', error);
      throw error;
    }

    console.log('✅ User đã được lưu/cập nhật:', userData.username);
    return data;
  } catch (error) {
    console.error('Lỗi database khi lưu user:', error);
    throw error;
  }
}

// Tạo session mới
async function createSession(discordId, clientIP, userAgent, sessionData) {
  try {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày từ bây giờ

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        session_token: sessionToken,
        discord_id: discordId,
        client_ip: clientIP,
        user_agent: userAgent,
        user_data: sessionData,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Lỗi tạo session:', error);
      throw error;
    }

    console.log('✅ Session được tạo:', sessionToken.substring(0, 8) + '...');
    return sessionToken;
  } catch (error) {
    console.error('Lỗi database khi tạo session:', error);
    throw error;
  }
}

// Lấy session theo token
async function getSession(sessionToken) {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = không tìm thấy dòng nào
      console.error('Lỗi lấy session:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Lỗi database khi lấy session:', error);
    return null;
  }
}

// Lấy session hoạt động theo IP
async function getActiveSessionByIP(clientIP) {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('client_ip', clientIP)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Lỗi lấy session theo IP:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Lỗi database khi lấy session theo IP:', error);
    return null;
  }
}

// Cập nhật thời gian truy cập cuối của session
async function updateSessionAccess(sessionToken) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ last_accessed: new Date().toISOString() })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('Lỗi cập nhật thời gian truy cập session:', error);
      throw error;
    }

    console.log('🔄 Thời gian truy cập session đã được cập nhật');
  } catch (error) {
    console.error('Lỗi database khi cập nhật thời gian truy cập session:', error);
  }
}

// Xóa session theo token
async function clearSession(sessionToken) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('Lỗi xóa session:', error);
      throw error;
    }

    console.log('🗑️ Session đã được xóa');
    return true;
  } catch (error) {
    console.error('Lỗi database khi xóa session:', error);
    return false;
  }
}

// Xóa sessions theo IP
async function clearSessionsByIP(clientIP) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('client_ip', clientIP);

    if (error) {
      console.error('Lỗi xóa sessions theo IP:', error);
      throw error;
    }

    console.log('🗑️ Sessions đã được xóa cho IP:', clientIP);
    return true;
  } catch (error) {
    console.error('Lỗi database khi xóa sessions theo IP:', error);
    return false;
  }
}

// Lấy user theo Discord ID
async function getUserByDiscordId(discordId) {
  try {
    const { data, error } = await supabase
      .from('discord_users')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (error) {
      console.error('Lỗi lấy user:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Lỗi database khi lấy user:', error);
    throw error;
  }
}

// ✅ Hàm hỗ trợ migration - Quản lý memory sessions cũ
const ipSessions = new Map();

function clearIPSessionFromMemory(ip) {
  const deleted = ipSessions.delete(ip);
  if (deleted) {
    console.log(`🗑️ Đã xóa session từ memory cho IP ${ip}`);
  }
  return deleted;
}
