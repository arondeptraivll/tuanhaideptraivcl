// --- TOÀN BỘ MÃ NGUỒN BACK-END (bypass_funlink.js) ---

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
  const { error } = await supabase.rpc('create_tokens_table', {})
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating table:', error)
  }
}

export default async function handler(req, res) {
  await initTable();
  
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   '127.0.0.1';
  const userIP = clientIP.split(',')[0].trim();

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
            return res.status(200).json({ ip: userIP, has_existing_token: true, token: existingToken.token, expires_at: existingToken.expires_at, time_left_ms: timeLeft });
        } else {
            return res.status(200).json({ ip: userIP, has_existing_token: false });
        }
    } catch(error) {
        console.error('Error checking existing token:', error);
        return res.status(500).json({ ip: userIP, error: 'Lỗi máy chủ khi kiểm tra token' });
    }
  }

  // === XỬ LÝ POST REQUEST: Tạo mới hoặc Kiểm tra Token ===
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
        // 2. ***TỰ ĐỘNG XÓA TOKEN HẾT HẠN CỦA IP NÀY (CẢI TIẾN MỚI)***
        // Thao tác này dọn dẹp DB mà không cần Cron Job.
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
          // Nếu có, từ chối tạo mới
          return res.status(409).json({ success: false, error: 'Token đã tồn tại và vẫn còn hiệu lực.' });
        }

        // 4. Nếu không có token hợp lệ, tạo token mới
        const newToken = crypto.randomBytes(32).toString('hex');
        const newExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 giờ

        const { error: insertError } = await supabase
          .from('bypass_tokens')
          .insert([{ ip_address: userIP, token: newToken, created_at: new Date().toISOString(), expires_at: newExpiresAt.toISOString() }]);
        
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
    
    // Nếu action không hợp lệ
    return res.status(400).json({ error: 'Invalid action specified' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}