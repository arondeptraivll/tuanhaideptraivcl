// --- TOÀN BỘ MÃ NGUỒN BACK-END (bypass_funlink.js) - PHIÊN BẢN HOÀN CHỈNH ---

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// --- Rate Limiting (Giữ nguyên) ---
const ipRequestMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 phút
const MAX_REQUESTS_PER_WINDOW = 10;
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) ipRequestMap.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS * 2);

// Khởi tạo bảng nếu chưa có
const initTable = async () => {
  try {
    // Tạo bảng tokens nếu chưa có
    const { error: tokenError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bypass_tokens (
          id SERIAL PRIMARY KEY,
          ip_address TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_bypass_tokens_ip ON bypass_tokens(ip_address);
        CREATE INDEX IF NOT EXISTS idx_bypass_tokens_token ON bypass_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_bypass_tokens_expires ON bypass_tokens(expires_at);
      `
    });
    
    if (tokenError && !tokenError.message.includes('already exists')) {
      console.error('Error creating tokens table:', tokenError);
    }
    
    // Tạo bảng download_sessions nếu chưa có
    const { error: sessionError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS download_sessions (
          id SERIAL PRIMARY KEY,
          session_id TEXT NOT NULL UNIQUE,
          ip_address TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          used_at TIMESTAMP WITH TIME ZONE
        );
        
        CREATE INDEX IF NOT EXISTS idx_download_sessions_ip ON download_sessions(ip_address);
        CREATE INDEX IF NOT EXISTS idx_download_sessions_session_id ON download_sessions(session_id);
        CREATE INDEX IF NOT EXISTS idx_download_sessions_expires ON download_sessions(expires_at);
      `
    });
    
    if (sessionError && !sessionError.message.includes('already exists')) {
      console.error('Error creating download_sessions table:', sessionError);
    }
    
  } catch (error) {
    console.error('Error in initTable:', error);
  }
}

// Cleanup expired records periodically
const cleanupExpiredRecords = async () => {
  try {
    const now = new Date().toISOString();
    
    // Cleanup expired tokens
    await supabase
      .from('bypass_tokens')
      .delete()
      .lt('expires_at', now);
    
    // Cleanup expired sessions
    await supabase
      .from('download_sessions')
      .delete()
      .lt('expires_at', now);
      
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupExpiredRecords, 30 * 60 * 1000);

export default async function handler(req, res) {
  // Chỉ init table một lần khi server start (nếu có thể)
  // await initTable();
  
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   '127.0.0.1';
  const userIP = clientIP.split(',')[0].trim();

  // === CORS Headers ===
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // === XỬ LÝ GET REQUEST: Tải lại token có sẵn ===
  if (req.method === 'GET') {
    try {
        const { data: existingToken, error } = await supabase
            .from('bypass_tokens')
            .select('token, expires_at')
            .eq('ip_address', userIP)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (existingToken) {
            const expiresAt = new Date(existingToken.expires_at)
            const timeLeft = Math.max(0, expiresAt - new Date())
            return res.status(200).json({ 
              ip: userIP, 
              has_existing_token: true, 
              token: existingToken.token, 
              expires_at: existingToken.expires_at, 
              time_left_ms: timeLeft 
            });
        } else {
            return res.status(200).json({ ip: userIP, has_existing_token: false });
        }
    } catch(error) {
        console.error('Error checking existing token:', error);
        return res.status(500).json({ ip: userIP, error: 'Lỗi máy chủ khi kiểm tra token' });
    }
  }

  // === XỬ LÝ POST REQUEST ===
  if (req.method === 'POST') {
    const { action, token } = req.body;

    // --- ACTION 1: KIỂM TRA TÍNH HỢP LỆ CỦA TOKEN ---
    if (action === 'validate_token') {
      if (!token) {
        return res.status(400).json({ valid: false, error: 'Token is required' });
      }
      try {
        const { data: tokenData, error } = await supabase
          .from('bypass_tokens')
          .select('expires_at')
          .eq('token', token)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return res.status(200).json({ valid: !!tokenData });
      } catch (error) {
        console.error('Error validating token:', error);
        return res.status(500).json({ valid: false, error: 'Lỗi máy chủ khi kiểm tra token' });
      }
    }
    
    // --- ACTION 2: TẠO TOKEN MỚI ---
    if (action === 'create_token') {
      // 1. Kiểm tra Rate Limiting
      const now = Date.now();
      const ipData = ipRequestMap.get(userIP) || { count: 0, timestamp: now };
      if (now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
        ipData.count = 0; ipData.timestamp = now;
      }
      ipData.count += 1;
      ipRequestMap.set(userIP, ipData);

      if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ success: false, error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' });
      }
      
      try {
        // 2. ***TỰ ĐỘNG XÓA TOKEN HẾT HẠN CỦA IP NÀY***
        await supabase
          .from('bypass_tokens')
          .delete()
          .eq('ip_address', userIP)
          .lt('expires_at', new Date().toISOString());

        // 3. Kiểm tra xem có token nào CÒN HIỆU LỰC không
        const { data: existingValidToken, error: fetchError } = await supabase
          .from('bypass_tokens')
          .select('token, expires_at')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        
        if (existingValidToken) {
          return res.status(409).json({ success: false, error: 'Token đã tồn tại và vẫn còn hiệu lực.' });
        }

        // 4. Tạo token mới
        const newToken = crypto.randomBytes(32).toString('hex');
        const newExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 giờ

        const { error: insertError } = await supabase
          .from('bypass_tokens')
          .insert([{ 
            ip_address: userIP, 
            token: newToken, 
            created_at: new Date().toISOString(), 
            expires_at: newExpiresAt.toISOString() 
          }]);
        
        if (insertError) throw insertError;

        return res.status(201).json({
          success: true,
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          time_left_ms: 3 * 60 * 60 * 1000
        });
      } catch (error) {
        console.error('Error during token creation process:', error);
        return res.status(500).json({ success: false, error: 'Đã xảy ra lỗi phía máy chủ.' });
      }
    }

    // --- ACTION 3: TẠO DOWNLOAD SESSION ---
    if (action === 'create_download_session') {
      try {
        // Xóa session cũ hết hạn của IP này
        await supabase
          .from('download_sessions')
          .delete()
          .eq('ip_address', userIP)
          .lt('expires_at', new Date().toISOString());

        // Kiểm tra xem có session chưa hết hạn không
        const { data: existingSession, error: checkError } = await supabase
          .from('download_sessions')
          .select('*')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existingSession) {
          return res.status(409).json({
            success: false,
            error: 'Bạn đã có session tải xuống chưa hết hạn.',
            has_existing_session: true,
            session_id: existingSession.session_id,
            expires_at: existingSession.expires_at
          });
        }

        // Tạo session mới
        const sessionId = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        
        const { error } = await supabase
          .from('download_sessions')
          .insert([{
            session_id: sessionId,
            ip_address: userIP,
            created_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            used: false
          }]);
        
        if (error) throw error;
        
        return res.status(201).json({
          success: true,
          message: 'Download session created successfully',
          session_id: sessionId,
          expires_at: expiresAt.toISOString(),
          expires_in_minutes: 10
        });
        
      } catch (error) {
        console.error('Error creating download session:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Không thể tạo phiên tải xuống' 
        });
      }
    }

    // --- ACTION 4: VERIFY DOWNLOAD ---
    if (action === 'verify_download') {
      try {
        // Tìm session active của IP này
        const { data: session, error } = await supabase
          .from('download_sessions')
          .select('*')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
          .eq('used', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (!session) {
          return res.status(404).json({ 
            valid: false, 
            error: 'Không tìm thấy phiên tải xuống hợp lệ cho IP này',
            redirect_url: 'https://tuanhaideptraivcl.vercel.app/'
          });
        }
        
        // Mark session as used
        await supabase
          .from('download_sessions')
          .update({ 
            used: true, 
            used_at: new Date().toISOString() 
          })
          .eq('session_id', session.session_id);
        
        return res.status(200).json({ 
          valid: true, 
          message: 'IP verified successfully',
          download_url: 'https://archive.org/download/bypass-funlink-by-gemlogin-tool_202508/Bypass%20Funlink%20by%20Gemlogin%20Tool.exe'
        });
        
      } catch (error) {
        console.error('Error verifying download:', error);
        return res.status(500).json({ 
          valid: false, 
          error: 'Lỗi máy chủ khi xác thực tải xuống',
          redirect_url: 'https://tuanhaideptraivcl.vercel.app/'
        });
      }
    }

    // --- ACTION 5: XÓA SESSION (MỚI) ---
    if (action === 'delete_session') {
      try {
        // Kiểm tra Rate Limiting cho action này
        const now = Date.now();
        const ipData = ipRequestMap.get(userIP) || { count: 0, timestamp: now };
        if (now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
          ipData.count = 0; ipData.timestamp = now;
        }
        ipData.count += 1;
        ipRequestMap.set(userIP, ipData);

        if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
          return res.status(429).json({ success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });
        }

        // Xóa tất cả session của IP này
        const { error } = await supabase
          .from('download_sessions')
          .delete()
          .eq('ip_address', userIP);
        
        if (error) throw error;
        
        return res.status(200).json({ 
          success: true, 
          message: 'Session đã được xóa thành công' 
        });
        
      } catch (error) {
        console.error('Error deleting session:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Không thể xóa session' 
        });
      }
    }

    // --- ACTION 6: KIỂM TRA TRẠNG THÁI SESSION ---
    if (action === 'check_session_status') {
      try {
        const { data: sessions, error } = await supabase
          .from('download_sessions')
          .select('*')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return res.status(200).json({
          success: true,
          has_active_session: sessions.length > 0,
          sessions: sessions || [],
          total_active: sessions.length
        });
        
      } catch (error) {
        console.error('Error checking session status:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Không thể kiểm tra trạng thái session' 
        });
      }
    }

    // --- ACTION 7: XÓA TOKEN (MỚI) ---
    if (action === 'delete_token') {
      try {
        // Kiểm tra Rate Limiting
        const now = Date.now();
        const ipData = ipRequestMap.get(userIP) || { count: 0, timestamp: now };
        if (now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
          ipData.count = 0; ipData.timestamp = now;
        }
        ipData.count += 1;
        ipRequestMap.set(userIP, ipData);

        if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
          return res.status(429).json({ success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });
        }

        // Xóa token của IP này
        const { error } = await supabase
          .from('bypass_tokens')
          .delete()
          .eq('ip_address', userIP);
        
        if (error) throw error;
        
        return res.status(200).json({ 
          success: true, 
          message: 'Token đã được xóa thành công' 
        });
        
      } catch (error) {
        console.error('Error deleting token:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Không thể xóa token' 
        });
      }
    }

    // --- ACTION 8: THỐNG KÊ ADMIN (OPTIONAL) ---
    if (action === 'admin_stats') {
      // Chỉ cho phép từ IP admin hoặc có auth key
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      try {
        // Đếm token active
        const { data: activeTokens, error: tokenError } = await supabase
          .from('bypass_tokens')
          .select('*', { count: 'exact' })
          .gt('expires_at', new Date().toISOString());

        // Đếm session active
        const { data: activeSessions, error: sessionError } = await supabase
          .from('download_sessions')
          .select('*', { count: 'exact' })
          .gt('expires_at', new Date().toISOString());

        if (tokenError || sessionError) {
          throw tokenError || sessionError;
        }

        return res.status(200).json({
          success: true,
          stats: {
            active_tokens: activeTokens?.length || 0,
            active_sessions: activeSessions?.length || 0,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('Error getting admin stats:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Không thể lấy thống kê' 
        });
      }
    }
    
    // Nếu action không hợp lệ
    return res.status(400).json({ error: 'Invalid action specified' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Export cleanup function for manual use
export { cleanupExpiredRecords, initTable };