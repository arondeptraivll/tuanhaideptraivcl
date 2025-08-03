// --- START OF FILE bypass_funlink.js (IMPROVED) ---

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// --- START: Rate Limiting ---
// Một Map đơn giản trong bộ nhớ để theo dõi các yêu cầu
const ipRequestMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 phút
const MAX_REQUESTS_PER_WINDOW = 10; // Tối đa 10 yêu cầu tạo token mỗi phút cho mỗi IP

// Xóa các IP cũ khỏi bộ nhớ để tránh memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) {
      ipRequestMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 2);
// --- END: Rate Limiting ---


// Khởi tạo bảng không thay đổi
const initTable = async () => {
  const { error } = await supabase.rpc('create_tokens_table', {})
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating table:', error)
  }
}

export default async function handler(req, res) {
  await initTable()
  
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   '127.0.0.1'

  const userIP = clientIP.split(',')[0].trim()

  if (req.method === 'GET') {
    return res.status(200).json({ ip: userIP })
  }

  if (req.method === 'POST') {
    const { action } = req.body

    if (action === 'create_token') {
      // --- START: Áp dụng Rate Limiting ---
      const now = Date.now();
      const ipData = ipRequestMap.get(userIP) || { count: 0, timestamp: now };

      if (now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
        // Đặt lại cửa sổ thời gian
        ipData.count = 0;
        ipData.timestamp = now;
      }

      ipData.count += 1;
      ipRequestMap.set(userIP, ipData);

      if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
        console.warn(`Rate limit exceeded for IP: ${userIP}`);
        return res.status(429).json({ 
          success: false, 
          error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' 
        });
      }
      // --- END: Áp dụng Rate Limiting ---

      try {
        // Kiểm tra token hiện tại của IP này (logic không đổi)
        const { data: existingTokens, error: fetchError } = await supabase
          .from('bypass_tokens')
          .select('token, expires_at')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
        
        if (fetchError) throw fetchError;

        // *** LOGIC THAY ĐỔI QUAN TRỌNG NHẤT ***
        if (existingTokens && existingTokens.length > 0) {
          const token = existingTokens[0]
          const expiresAt = new Date(token.expires_at)
          const timeLeft = Math.max(0, expiresAt - new Date())

          // Trả về lỗi 409 Conflict thay vì thành công
          // Điều này ngăn chặn việc tạo token mới và thông báo cho client biết rằng đã có một token đang hoạt động.
          return res.status(409).json({
            success: false,
            error: 'Token đã tồn tại và vẫn còn hiệu lực.',
            message: 'Vui lòng đợi token hiện tại hết hạn trước khi tạo token mới.',
            expires_at: token.expires_at,
            time_left_ms: timeLeft
          })
        }

        // Tạo token mới nếu không có token nào hợp lệ
        const newToken = crypto.randomBytes(32).toString('hex')
        const newExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 giờ

        const { error: insertError } = await supabase
          .from('bypass_tokens')
          .insert([
            {
              ip_address: userIP,
              token: newToken,
              created_at: new Date().toISOString(),
              expires_at: newExpiresAt.toISOString()
            }
          ]);

        if (insertError) {
          throw insertError
        }

        // Trả về thành công chỉ khi token mới được tạo
        return res.status(201).json({ // Sử dụng 201 Created cho việc tạo tài nguyên mới
          success: true,
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          time_left_ms: 3 * 60 * 60 * 1000,
          is_existing: false // Luôn là false ở đây vì logic cũ đã được loại bỏ
        })

      } catch (error) {
        console.error('Error creating token:', error)
        return res.status(500).json({ 
          success: false, 
          error: 'Đã xảy ra lỗi phía máy chủ khi tạo token' 
        })
      }
    }
    
    // Logic validate_token không cần thay đổi
    if (action === 'validate_token') {
        // ... (giữ nguyên logic cũ)
    }

  }

  return res.status(405).json({ error: 'Method not allowed' })
}